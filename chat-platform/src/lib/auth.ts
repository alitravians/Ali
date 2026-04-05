import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import { checkLoginRateLimit } from './rate-limit';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
        }

        // Rate limit: 5 login attempts per 15 minutes per IP
        const ip = (req?.headers as any)?.['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
        const rateCheck = checkLoginRateLimit(ip);
        if (!rateCheck.allowed) {
          const retryMin = Math.ceil(rateCheck.retryAfterMs / 60000);
          throw new Error(`محاولات دخول كثيرة. حاول بعد ${retryMin} دقيقة`);
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: { permission: true },
                    },
                  },
                },
              },
            },
            bans: {
              where: { isActive: true, isGlobal: true },
            },
          },
        });

        if (!user) {
          throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }

        // Check active bans
        const activeBan = user.bans.find(
          (ban) => ban.isActive && (!ban.expiresAt || ban.expiresAt > new Date())
        );
        if (activeBan) {
          throw new Error(`BANNED:${JSON.stringify({ reason: activeBan.reason, expiresAt: activeBan.expiresAt })}`);
        }

        // Get highest role
        const highestRole = user.userRoles.reduce(
          (highest, ur) => (ur.role.level > highest.level ? ur.role : highest),
          { level: 0, name: 'member', displayName: 'عضو', color: '#808080' } as { level: number; name: string; displayName: string; color: string }
        );

        // Get all permissions
        const permissions = [...new Set(
          user.userRoles.flatMap((ur) =>
            ur.role.rolePermissions.map((rp) => rp.permission.name)
          )
        )];

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          image: user.avatar,
          role: highestRole.name,
          roleLevel: highestRole.level,
          roleDisplayName: highestRole.displayName,
          roleColor: highestRole.color,
          permissions,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.roleLevel = (user as any).roleLevel;
        token.roleDisplayName = (user as any).roleDisplayName;
        token.roleColor = (user as any).roleColor;
        token.permissions = (user as any).permissions;
        token.roleRefreshedAt = Date.now();
      }

      // Refresh role data from DB every 5 minutes to catch demotions/promotions
      const ROLE_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
      if (token.id && (!token.roleRefreshedAt || Date.now() - (token.roleRefreshedAt as number) > ROLE_REFRESH_INTERVAL)) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: {
              userRoles: {
                include: {
                  role: {
                    include: {
                      rolePermissions: {
                        include: { permission: true },
                      },
                    },
                  },
                },
              },
              bans: {
                where: { isActive: true, isGlobal: true },
              },
            },
          });

          if (dbUser) {
            // Check if user is now banned
            const activeBan = dbUser.bans.find(
              (ban) => ban.isActive && (!ban.expiresAt || ban.expiresAt > new Date())
            );
            if (activeBan) {
              // Force session invalidation by clearing role
              token.roleLevel = 0;
              token.role = 'banned';
              token.roleDisplayName = 'محظور';
              token.permissions = [];
            } else {
              // Update role data
              const highestRole = dbUser.userRoles.reduce(
                (highest, ur) => (ur.role.level > highest.level ? ur.role : highest),
                { level: 0, name: 'member', displayName: 'عضو', color: '#808080' } as { level: number; name: string; displayName: string; color: string }
              );
              const permissions = [...new Set(
                dbUser.userRoles.flatMap((ur) =>
                  ur.role.rolePermissions.map((rp) => rp.permission.name)
                )
              )];

              token.role = highestRole.name;
              token.roleLevel = highestRole.level;
              token.roleDisplayName = highestRole.displayName;
              token.roleColor = highestRole.color;
              token.permissions = permissions;
            }
          }
          token.roleRefreshedAt = Date.now();
        } catch {
          // If DB query fails, keep existing token data
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).roleLevel = token.roleLevel;
        (session.user as any).roleDisplayName = token.roleDisplayName;
        (session.user as any).roleColor = token.roleColor;
        (session.user as any).permissions = token.permissions;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getUserPermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });

  if (!user) return [];

  return [...new Set(
    user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => rp.permission.name)
    )
  )];
}

export async function getUserHighestRole(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: { include: { role: true } },
    },
  });

  if (!user || user.userRoles.length === 0) {
    return { level: 10, name: 'member', displayName: 'عضو', color: '#808080' };
  }

  return user.userRoles.reduce(
    (highest, ur) => (ur.role.level > highest.level ? { level: ur.role.level, name: ur.role.name, displayName: ur.role.displayName, color: ur.role.color } : highest),
    { level: 0, name: 'member', displayName: 'عضو', color: '#808080' }
  );
}

export async function checkPermission(userId: string, permission: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permission);
}

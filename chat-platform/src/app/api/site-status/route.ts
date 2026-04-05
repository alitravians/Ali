import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Public endpoint — no auth required
export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: [
            'registration_enabled',
            'maintenance_mode',
            'maintenance_message',
            'chat_enabled',
            'site_name',
          ],
        },
      },
    });

    const map: Record<string, string> = {};
    settings.forEach((s) => {
      map[s.key] = s.value;
    });

    return NextResponse.json({
      registrationEnabled: map.registration_enabled !== 'false',
      maintenanceMode: map.maintenance_mode === 'true',
      maintenanceMessage: map.maintenance_message || '',
      chatEnabled: map.chat_enabled !== 'false',
      siteName: map.site_name || 'ChatZone',
    });
  } catch (_error) {
    return NextResponse.json({
      registrationEnabled: true,
      maintenanceMode: false,
      maintenanceMessage: '',
      chatEnabled: true,
      siteName: 'ChatZone',
    });
  }
}

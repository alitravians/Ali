import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ isAdmin: false });
  }

  const role = (session.user as { role?: string }).role;
  return NextResponse.json({ isAdmin: role === "admin" });
}

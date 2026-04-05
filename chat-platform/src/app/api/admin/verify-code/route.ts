import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    const adminCode = process.env.ADMIN_ACCESS_CODE || '3131';
    const moderatorCode = process.env.MODERATOR_ACCESS_CODE || '2121';

    if (code === adminCode) {
      return NextResponse.json({ redirect: '/admin' });
    } else if (code === moderatorCode) {
      return NextResponse.json({ redirect: '/moderator' });
    } else {
      return NextResponse.json({ error: 'رمز الدخول غير صحيح' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

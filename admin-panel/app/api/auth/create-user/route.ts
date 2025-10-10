import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password, full_name, role = 'admin' } = await request.json();

    // Validation
    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Email, şifre ve isim gereklidir.' },
        { status: 400 }
      );
    }

    // Email kontrolü
    const existingUser = await query(
      'SELECT id FROM admin_users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Bu email adresi zaten kullanılıyor.' },
        { status: 409 }
      );
    }

    // Şifreyi hashle
    const password_hash = await hashPassword(password);

    // Yeni kullanıcı oluştur
    const result = await query(
      `INSERT INTO admin_users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, role, created_at`,
      [email, password_hash, full_name, role]
    );

    const user = result.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu.',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        created_at: user.created_at,
      },
    });

  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Kullanıcı oluşturulurken hata oluştu.', details: error.message },
      { status: 500 }
    );
  }
}




import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST() {
  try {
    // admin_users tablosunu oluştur
    await query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Index'ler
    await query(`
      CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active)
    `);

    // Varsayılan admin kullanıcısı
    const hashedPassword = await hashPassword('admin123');
    
    await query(`
      INSERT INTO admin_users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, [
      'admin@morfikirler.com',
      hashedPassword,
      'Admin',
      'super_admin'
    ]);

    // Trigger oluştur
    await query(`
      CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await query(`
      DROP TRIGGER IF EXISTS admin_users_updated_at ON admin_users
    `);

    await query(`
      CREATE TRIGGER admin_users_updated_at
      BEFORE UPDATE ON admin_users
      FOR EACH ROW
      EXECUTE FUNCTION update_admin_users_updated_at()
    `);

    return NextResponse.json({
      success: true,
      message: 'Admin kullanıcı tablosu oluşturuldu ve varsayılan kullanıcı eklendi.',
    });

  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { 
        error: 'Tablo oluşturulurken hata oluştu.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}




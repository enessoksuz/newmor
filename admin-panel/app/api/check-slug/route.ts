import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const type = searchParams.get('type'); // 'article' or 'category'
    const id = searchParams.get('id'); // mevcut kaydın id'si (edit durumunda)

    if (!slug || !type) {
      return NextResponse.json({ error: 'Slug ve type gerekli' }, { status: 400 });
    }

    let exists = false;

    // Kategorilerde kontrol et
    const categoryCheck = await sql`
      SELECT id FROM categories 
      WHERE slug = ${slug} 
      ${id && type === 'category' ? sql`AND id != ${id}` : sql``}
      LIMIT 1
    `;
    
    if (categoryCheck.rowCount > 0) {
      exists = true;
    }

    // Makalelerde kontrol et (sadece kategori değilse)
    if (!exists) {
      const articleCheck = await sql`
        SELECT id FROM articles 
        WHERE slug = ${slug}
        ${id && type === 'article' ? sql`AND id != ${id}` : sql``}
        LIMIT 1
      `;
      
      if (articleCheck.rowCount > 0) {
        exists = true;
      }
    }

    return NextResponse.json({ 
      available: !exists,
      message: exists ? 'Bu slug kullanımda' : 'Slug kullanılabilir'
    });

  } catch (error) {
    console.error('Slug check error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}



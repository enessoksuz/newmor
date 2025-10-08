import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { baseSlug, type, currentId } = body; // type: 'article' or 'category'

    if (!baseSlug || !type) {
      return NextResponse.json({ error: 'baseSlug ve type gerekli' }, { status: 400 });
    }

    let slug = baseSlug;
    let counter = 0;
    let isUnique = false;

    while (!isUnique) {
      // url_mappings tablosunda kontrol et
      const check = await sql`
        SELECT slug FROM url_mappings 
        WHERE slug = ${slug}
        ${currentId ? sql`AND NOT (type = ${type} AND reference_id = ${currentId})` : sql``}
      `;

      if (check.rowCount === 0) {
        isUnique = true;
      } else {
        counter++;
        slug = `${baseSlug}-${counter}`;
      }

      // Sonsuz döngüyü önlemek için
      if (counter > 100) {
        return NextResponse.json({ error: 'Benzersiz slug oluşturulamadı' }, { status: 500 });
      }
    }

    return NextResponse.json({ slug });

  } catch (error: any) {
    console.error('Generate slug error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


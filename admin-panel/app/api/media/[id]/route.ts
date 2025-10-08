import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { unlink } from 'fs/promises';
import path from 'path';

// GET - Tek medya dosyası getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sql = 'SELECT * FROM media WHERE id = $1';
    const result = await query(sql, [id]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Media not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Medya bilgilerini güncelle (sadece alt_text)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { alt_text } = body;

    const sql = `
      UPDATE media 
      SET alt_text = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await query(sql, [alt_text, id]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Media not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Medya dosyasını sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Önce medya bilgilerini al
    const getMediaSql = 'SELECT * FROM media WHERE id = $1';
    const mediaResult = await query(getMediaSql, [id]);

    if (mediaResult.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Media not found' },
        { status: 404 }
      );
    }

    const media = mediaResult.rows[0];

    // Dosyayı sil
    try {
      const filePath = path.join(process.cwd(), 'public', media.file_path);
      await unlink(filePath);
    } catch (fileError) {
      console.error('File deletion error:', fileError);
      // Dosya silinemese bile devam et
    }

    // Veritabanından sil
    const deleteSql = 'DELETE FROM media WHERE id = $1 RETURNING *';
    await query(deleteSql, [id]);

    return NextResponse.json({
      success: true,
      message: 'Media deleted successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


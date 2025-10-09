import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Dosya adını oluştur (timestamp + orijinal ad)
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/\s+/g, '-')}`;
    
    // Upload klasörünü oluştur
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Klasör zaten varsa hata verme
    }

    // Dosyayı kaydet
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);
    
    console.log('📤 File uploaded:', fileName);

    // URL'i döndür
    const fileUrl = `/uploads/${fileName}`;
    return NextResponse.json({ url: fileUrl }, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Yükleme başarısız' }, { status: 500 });
  }
}


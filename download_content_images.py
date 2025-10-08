#!/usr/bin/env python3
"""
İçeriklerdeki tüm resimleri indirir ve yeni URL yapısına göre organize eder
"""

import requests
import json
import os
import time
import re
from urllib.parse import urlparse, urljoin
from pathlib import Path

def normalize_url(url):
    """URL'yi normalize eder"""
    if url.startswith('//'):
        url = 'https:' + url
    elif url.startswith('/'):
        url = 'https://morfikirler.com' + url
    elif not url.startswith('http'):
        url = 'https://morfikirler.com/' + url
    
    return url

def get_filename_from_url(url):
    """URL'den dosya adını çıkarır"""
    parsed = urlparse(url)
    path = parsed.path
    
    # Dosya adını al
    filename = os.path.basename(path)
    
    # Eğer dosya adı yoksa, path'ten oluştur
    if not filename or '.' not in filename:
        # Path'i temizle ve dosya adı yap
        clean_path = re.sub(r'[^a-zA-Z0-9\-_]', '_', path)
        filename = clean_path + '.jpg'  # Varsayılan uzantı
    
    return filename

def create_directory_structure(year, month):
    """Dizin yapısını oluşturur"""
    base_dir = Path('public/images')
    target_dir = base_dir / year / month
    target_dir.mkdir(parents=True, exist_ok=True)
    return target_dir

def download_image(url, target_path, max_retries=3):
    """Resmi indirir"""
    for attempt in range(max_retries):
        try:
            # User-Agent ekle
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=30, stream=True)
            
            if response.status_code == 200:
                with open(target_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                return True
            else:
                print(f"   ❌ HTTP {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Hata (deneme {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
    
    return False

def process_image_url(url, article_id):
    """Resim URL'sini işler"""
    # URL'yi normalize et
    normalized_url = normalize_url(url)
    
    # Dosya adını al
    filename = get_filename_from_url(normalized_url)
    
    # Dizin yapısını belirle
    if 'morfikirler.com' in normalized_url:
        # WordPress yapısından tarih çıkar
        match = re.search(r'/(\d{4})/(\d{2})/', normalized_url)
        if match:
            year, month = match.groups()
        else:
            # Varsayılan tarih
            year, month = '2023', '01'
    else:
        year, month = '2023', '01'
    
    # Dizin oluştur
    target_dir = create_directory_structure(year, month)
    target_path = target_dir / filename
    
    # Yeni URL'yi oluştur
    new_url = f'/images/{year}/{month}/{filename}'
    
    return {
        'original_url': url,
        'normalized_url': normalized_url,
        'filename': filename,
        'target_path': str(target_path),
        'new_url': new_url,
        'year': year,
        'month': month,
        'article_id': article_id
    }

def main():
    print("📥 İçerik Resimleri İndirme İşlemi Başlatılıyor...")
    
    # Analiz dosyasını oku
    try:
        with open('content_images_analysis.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("❌ content_images_analysis.json dosyası bulunamadı!")
        print("Önce python3 analyze_content_images.py çalıştırın.")
        return
    
    all_images = data['all_images']
    print(f"📊 Toplam {len(all_images)} resim işlenecek")
    
    # Sadece WordPress resimlerini al
    wordpress_images = [img for img in all_images if 'morfikirler.com' in img['url']]
    print(f"📊 WordPress resimleri: {len(wordpress_images)}")
    
    # İstatistikler
    stats = {
        'total': len(wordpress_images),
        'downloaded': 0,
        'failed': 0,
        'skipped': 0
    }
    
    # Resim işleme
    processed_images = []
    
    for i, img_data in enumerate(wordpress_images, 1):
        url = img_data['url']
        article_id = img_data['article_id']
        article_title = img_data['article_title']
        
        print(f"\n⏳ İşleniyor ({i}/{len(wordpress_images)}): {article_title[:50]}...")
        print(f"   URL: {url}")
        
        try:
            # Resim bilgilerini işle
            img_info = process_image_url(url, article_id)
            processed_images.append(img_info)
            
            # Dosya zaten varsa atla
            if os.path.exists(img_info['target_path']):
                print(f"   ⏭️  Zaten mevcut: {img_info['new_url']}")
                stats['skipped'] += 1
                continue
            
            # Resmi indir
            print(f"   📥 İndiriliyor: {img_info['normalized_url']}")
            success = download_image(img_info['normalized_url'], img_info['target_path'])
            
            if success:
                print(f"   ✅ İndirildi: {img_info['new_url']}")
                stats['downloaded'] += 1
            else:
                print(f"   ❌ İndirilemedi")
                stats['failed'] += 1
            
        except Exception as e:
            print(f"   ❌ Hata: {e}")
            stats['failed'] += 1
        
        # Rate limiting
        time.sleep(0.5)
        
        # Her 50 resimde bir ilerleme göster
        if i % 50 == 0:
            print(f"\n📈 İlerleme: {i}/{len(wordpress_images)}")
            print(f"   ✅ İndirilen: {stats['downloaded']}")
            print(f"   ⏭️  Atlanan: {stats['skipped']}")
            print(f"   ❌ Başarısız: {stats['failed']}")
    
    # Sonuçları kaydet
    with open('downloaded_images.json', 'w', encoding='utf-8') as f:
        json.dump(processed_images, f, ensure_ascii=False, indent=2)
    
    print(f"\n🎉 İşlem Tamamlandı!")
    print(f"📊 SONUÇLAR:")
    print(f"   Toplam: {stats['total']}")
    print(f"   ✅ İndirilen: {stats['downloaded']}")
    print(f"   ⏭️  Atlanan: {stats['skipped']}")
    print(f"   ❌ Başarısız: {stats['failed']}")
    
    print(f"\n💾 Detaylar 'downloaded_images.json' dosyasına kaydedildi")
    
    if stats['downloaded'] > 0:
        print(f"\n🚀 Sonraki Adım:")
        print("   python3 update_content_urls.py")

if __name__ == "__main__":
    main()

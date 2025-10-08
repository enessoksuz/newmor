#!/usr/bin/env python3
"""
Sadece çalışan WordPress resimlerini indirir
"""

import json
import requests
import os
import time
import re
from pathlib import Path
from urllib.parse import urlparse

def download_working_images():
    """Çalışan resimleri indirir"""
    
    # Analiz dosyasını oku
    with open('content_images_analysis.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Sadece çalışan resimleri filtrele
    working_images = [img for img in data['all_images'] if img['category'] == 'wordpress_upload']
    
    print(f"📊 {len(working_images)} çalışan resim bulundu")
    
    # İstatistikler
    stats = {
        'total': len(working_images),
        'downloaded': 0,
        'failed': 0,
        'skipped': 0
    }
    
    downloaded_info = []
    
    for i, img_data in enumerate(working_images, 1):
        url = img_data['url']
        article_id = img_data['article_id']
        article_title = img_data['article_title']
        
        if i % 50 == 0:
            print(f"⏳ İlerleme: {i}/{len(working_images)}")
        
        # Dosya adını oluştur
        parsed_url = urlparse(url)
        filename = os.path.basename(parsed_url.path)
        
        if not filename:
            filename = f"image_{article_id}.jpg"
        
        # Dizin yapısını belirle
        path_parts = parsed_url.path.split('/')
        if len(path_parts) >= 4 and path_parts[-3].isdigit() and path_parts[-2].isdigit():
            year, month = path_parts[-3], path_parts[-2]
        else:
            year, month = '2023', '01'
        
        # Dizin oluştur
        target_dir = Path(f'public/images/{year}/{month}')
        target_dir.mkdir(parents=True, exist_ok=True)
        
        target_path = target_dir / filename
        new_url = f'/images/{year}/{month}/{filename}'
        
        # Dosya zaten varsa atla
        if target_path.exists():
            stats['skipped'] += 1
            downloaded_info.append({
                'original_url': url,
                'new_url': new_url,
                'article_id': article_id,
                'status': 'already_exists'
            })
            continue
        
        try:
            # User-Agent ekle
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
            
            # İndir
            response = requests.get(url, headers=headers, timeout=30, stream=True)
            
            if response.status_code == 200:
                with open(target_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                
                stats['downloaded'] += 1
                downloaded_info.append({
                    'original_url': url,
                    'new_url': new_url,
                    'article_id': article_id,
                    'status': 'downloaded'
                })
                
                if i <= 10:  # İlk 10 için detay göster
                    print(f"✅ {filename}")
            else:
                stats['failed'] += 1
                downloaded_info.append({
                    'original_url': url,
                    'new_url': new_url,
                    'article_id': article_id,
                    'status': f'failed_{response.status_code}'
                })
                
                if i <= 10:
                    print(f"❌ {filename} (HTTP {response.status_code})")
                
        except Exception as e:
            stats['failed'] += 1
            downloaded_info.append({
                'original_url': url,
                'new_url': new_url,
                'article_id': article_id,
                'status': f'error_{str(e)[:50]}'
            })
            
            if i <= 10:
                print(f"❌ {filename} ({e})")
        
        # Rate limiting
        time.sleep(0.3)
    
    # Sonuçları kaydet
    with open('working_images_downloaded.json', 'w', encoding='utf-8') as f:
        json.dump(downloaded_info, f, ensure_ascii=False, indent=2)
    
    print(f"\n🎉 İndirme İşlemi Tamamlandı!")
    print(f"📊 SONUÇLAR:")
    print(f"   Toplam: {stats['total']}")
    print(f"   ✅ İndirilen: {stats['downloaded']}")
    print(f"   ⏭️  Atlanan: {stats['skipped']}")
    print(f"   ❌ Başarısız: {stats['failed']}")
    
    print(f"\n💾 Detaylar 'working_images_downloaded.json' dosyasına kaydedildi")
    
    return downloaded_info

if __name__ == "__main__":
    download_working_images()

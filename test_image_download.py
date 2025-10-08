#!/usr/bin/env python3
"""
Test için birkaç resmi indirir
"""

import requests
import os
import time
from pathlib import Path

def test_download():
    """Test resimlerini indirir"""
    
    # Test URL'leri
    test_urls = [
        "https://morfikirler.com/wp-content/uploads/2023/09/kosgeb-faizsiz-kredi-3-768x419.png",
        "https://morfikirler.com/wp-content/uploads/2023/09/kosgeb-faizsiz-kredi-2-768x419.png",
        "/uploads/2023/09/kosgeb-faizsiz-kredi-2.png",
        "/uploads/2023/09/kosgeb-faizsiz-kredi-3.png"
    ]
    
    print("🧪 Test Resim İndirme Başlatılıyor...")
    
    # Test dizini oluştur
    test_dir = Path('public/test-images')
    test_dir.mkdir(parents=True, exist_ok=True)
    
    for i, url in enumerate(test_urls, 1):
        print(f"\n{i}. Test URL: {url}")
        
        # URL'yi normalize et
        if url.startswith('/'):
            full_url = 'https://morfikirler.com' + url
        else:
            full_url = url
        
        print(f"   Full URL: {full_url}")
        
        try:
            # User-Agent ekle
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
            
            # İndirmeyi dene
            response = requests.get(full_url, headers=headers, timeout=10, stream=True)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                # Dosya adını oluştur
                filename = f"test_{i}.jpg"
                filepath = test_dir / filename
                
                # İndir
                with open(filepath, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                
                print(f"   ✅ İndirildi: {filepath}")
            else:
                print(f"   ❌ Başarısız: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Hata: {e}")
        
        time.sleep(1)
    
    print(f"\n🎉 Test tamamlandı!")
    print(f"📁 Test resimleri: {test_dir}")

if __name__ == "__main__":
    test_download()

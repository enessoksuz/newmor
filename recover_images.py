#!/usr/bin/env python3
"""
Eksik resimleri Wayback Machine ve Google Cache'den kurtarmaya çalışır
"""

import requests
import json
import time
import os
from urllib.parse import urlparse
import re

def try_wayback_machine(url):
    """Wayback Machine'den resmi almaya çalışır"""
    try:
        # Wayback Machine API
        wayback_url = f"http://web.archive.org/web/{url}"
        
        response = requests.get(wayback_url, timeout=10, allow_redirects=True)
        if response.status_code == 200:
            return wayback_url
        
        # Alternatif Wayback URL formatları
        wayback_urls = [
            f"http://web.archive.org/web/20231001/{url}",
            f"http://web.archive.org/web/20230901/{url}", 
            f"http://web.archive.org/web/20230801/{url}",
            f"https://web.archive.org/web/{url}",
        ]
        
        for wayback_url in wayback_urls:
            try:
                response = requests.head(wayback_url, timeout=5)
                if response.status_code == 200:
                    return wayback_url
            except:
                continue
                
    except:
        pass
    
    return None

def try_google_cache(url):
    """Google Cache'den resmi almaya çalışır"""
    try:
        cache_url = f"https://webcache.googleusercontent.com/search?q=cache:{url}"
        response = requests.head(cache_url, timeout=10)
        if response.status_code == 200:
            return cache_url
    except:
        pass
    
    return None

def download_image(image_url, filename):
    """Resmi indirir"""
    try:
        response = requests.get(image_url, timeout=30)
        if response.status_code == 200:
            # public/images klasörünü oluştur
            os.makedirs('public/images', exist_ok=True)
            
            # Dosyayı kaydet
            filepath = f'public/images/{filename}'
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            return f'/images/{filename}'
    except Exception as e:
        print(f"❌ İndirme hatası: {e}")
    
    return None

def main():
    print("🔄 Resim Kurtarma İşlemi Başlatılıyor...")
    
    # Eksik resimleri oku
    try:
        with open('missing_images.json', 'r', encoding='utf-8') as f:
            missing_images = json.load(f)
    except FileNotFoundError:
        print("❌ missing_images.json dosyası bulunamadı!")
        print("Önce check_missing_images.py'yi çalıştırın.")
        return
    
    print(f"📊 {len(missing_images)} eksik resim bulundu")
    
    recovered_images = []
    
    for i, item in enumerate(missing_images, 1):
        article_id = item['id']
        title = item['title']
        original_url = item['image_url']
        
        print(f"\n⏳ Kurtarma ({i}/{len(missing_images)}): {title[:50]}...")
        print(f"   Orijinal URL: {original_url}")
        
        # Dosya adını oluştur
        filename = f"{article_id}.jpg"
        
        # Wayback Machine'i dene
        print("   🔍 Wayback Machine deneniyor...")
        wayback_url = try_wayback_machine(original_url)
        if wayback_url:
            print(f"   ✅ Wayback Machine bulundu: {wayback_url}")
            local_path = download_image(wayback_url, filename)
            if local_path:
                recovered_images.append({
                    'article_id': article_id,
                    'original_url': original_url,
                    'new_url': local_path,
                    'source': 'wayback'
                })
                print(f"   ✅ Kurtarıldı: {local_path}")
                continue
        
        # Google Cache'i dene
        print("   🔍 Google Cache deneniyor...")
        cache_url = try_google_cache(original_url)
        if cache_url:
            print(f"   ✅ Google Cache bulundu: {cache_url}")
            local_path = download_image(cache_url, filename)
            if local_path:
                recovered_images.append({
                    'article_id': article_id,
                    'original_url': original_url,
                    'new_url': local_path,
                    'source': 'google_cache'
                })
                print(f"   ✅ Kurtarıldı: {local_path}")
                continue
        
        print("   ❌ Kurtarılamadı")
        
        # Rate limiting
        time.sleep(1)
    
    # Sonuçları kaydet
    if recovered_images:
        with open('recovered_images.json', 'w', encoding='utf-8') as f:
            json.dump(recovered_images, f, ensure_ascii=False, indent=2)
        
        print(f"\n🎉 {len(recovered_images)} resim başarıyla kurtarıldı!")
        print("📄 Detaylar 'recovered_images.json' dosyasında")
        
        # Veritabanını güncelle
        update_database = input("\n❓ Veritabanını güncellemek istiyor musunuz? (y/n): ")
        if update_database.lower() == 'y':
            update_database_with_recovered_images(recovered_images)
    else:
        print("\n😞 Hiçbir resim kurtarılamadı.")

def update_database_with_recovered_images(recovered_images):
    """Kurtarılan resimlerin URL'lerini veritabanında günceller"""
    import psycopg2
    
    try:
        conn = psycopg2.connect(
            host="localhost",
            port="5432",
            database="yenimorfikir_db", 
            user="enesoksuz",
            password=""
        )
        
        cursor = conn.cursor()
        
        for item in recovered_images:
            cursor.execute(
                "UPDATE articles SET featured_image = %s WHERE id = %s",
                (item['new_url'], item['article_id'])
            )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ {len(recovered_images)} makale veritabanında güncellendi!")
        
    except Exception as e:
        print(f"❌ Veritabanı güncelleme hatası: {e}")

if __name__ == "__main__":
    main()

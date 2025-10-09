#!/usr/bin/env python3
"""
WordPress Resim İndirme ve Veritabanı Güncelleme Script'i

Bu script:
1. PostgreSQL veritabanından tüm resim URL'lerini çeker
2. Resimleri WordPress'ten indirir
3. Frontend/public/uploads klasörüne yerleştirir
4. Veritabanındaki URL'leri günceller
"""

import os
import re
import psycopg2
import requests
from urllib.parse import urlparse
from pathlib import Path
import time

# Veritabanı bağlantı bilgileri
DB_CONFIG = {
    'dbname': 'yenimorfikir_db',
    'user': 'enesoksuz',
    'password': '',  # Şifre boş
    'host': 'localhost',
    'port': '5432'
}

# WordPress site URL'i
WORDPRESS_URL = 'https://morfikirler.com'

# Uploads klasörü
UPLOADS_DIR = Path(__file__).parent.parent / 'frontend' / 'public' / 'uploads'

def connect_db():
    """PostgreSQL veritabanına bağlan"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"❌ Veritabanı bağlantı hatası: {e}")
        return None

def extract_image_urls(conn):
    """Veritabanından tüm resim URL'lerini çıkar"""
    cursor = conn.cursor()
    
    # Featured images
    cursor.execute("""
        SELECT id, featured_image 
        FROM articles 
        WHERE featured_image IS NOT NULL 
        AND featured_image LIKE '%morfikirler.com%'
    """)
    featured_images = cursor.fetchall()
    
    # Content içindeki resimler
    cursor.execute("""
        SELECT id, content 
        FROM articles 
        WHERE content LIKE '%morfikirler.com/wp-content/uploads%'
    """)
    content_images = cursor.fetchall()
    
    # Author avatars
    cursor.execute("""
        SELECT id, avatar_url 
        FROM authors 
        WHERE avatar_url IS NOT NULL 
        AND avatar_url LIKE '%morfikirler.com%'
    """)
    author_avatars = cursor.fetchall()
    
    return {
        'featured_images': featured_images,
        'content_images': content_images,
        'author_avatars': author_avatars
    }

def download_image(url, output_path):
    """Resmi indir ve belirtilen yere kaydet"""
    try:
        # Klasörü oluştur
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Resmi indir
        response = requests.get(url, timeout=30, stream=True)
        response.raise_for_status()
        
        # Dosyaya yaz
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return True
    except Exception as e:
        print(f"❌ İndirme hatası ({url}): {e}")
        return False

def process_images(image_data):
    """Resimleri indir ve URL mapping'i oluştur"""
    url_mapping = {}
    
    # Featured images
    print("\n📸 Featured image'lar indiriliyor...")
    for article_id, image_url in image_data['featured_images']:
        if not image_url:
            continue
            
        # URL'den path çıkar
        parsed = urlparse(image_url)
        path = parsed.path.replace('/wp-content/uploads/', '')
        
        # Hedef dosya yolu
        output_path = UPLOADS_DIR / path
        
        print(f"  📥 {path[:50]}...")
        if download_image(image_url, output_path):
            # Yeni URL
            new_url = f"{WORDPRESS_URL}/wp-content/uploads/{path}"
            url_mapping[image_url] = new_url
            print(f"  ✅ İndirildi")
        
        time.sleep(0.1)  # Rate limiting
    
    # Content içindeki resimler
    print("\n📝 Content içindeki resimler indiriliyor...")
    for article_id, content in image_data['content_images']:
        if not content:
            continue
        
        # Content içindeki tüm resim URL'lerini bul
        img_urls = re.findall(r'https?://morfikirler\.com/wp-content/uploads/[^"\s<>]+', content)
        
        for img_url in img_urls:
            if img_url in url_mapping:
                continue
                
            # URL'den path çıkar
            parsed = urlparse(img_url)
            path = parsed.path.replace('/wp-content/uploads/', '')
            
            # Hedef dosya yolu
            output_path = UPLOADS_DIR / path
            
            print(f"  📥 {path[:50]}...")
            if download_image(img_url, output_path):
                new_url = f"{WORDPRESS_URL}/wp-content/uploads/{path}"
                url_mapping[img_url] = new_url
                print(f"  ✅ İndirildi")
            
            time.sleep(0.1)
    
    # Author avatars
    print("\n👤 Yazar avatar'ları indiriliyor...")
    for author_id, avatar_url in image_data['author_avatars']:
        if not avatar_url or 'gravatar' in avatar_url:
            continue
            
        parsed = urlparse(avatar_url)
        path = parsed.path.replace('/wp-content/uploads/', '')
        
        output_path = UPLOADS_DIR / path
        
        print(f"  📥 {path[:50]}...")
        if download_image(avatar_url, output_path):
            new_url = f"{WORDPRESS_URL}/wp-content/uploads/{path}"
            url_mapping[avatar_url] = new_url
            print(f"  ✅ İndirildi")
        
        time.sleep(0.1)
    
    return url_mapping

def update_database(conn, image_data, url_mapping):
    """Veritabanındaki URL'leri güncelle"""
    cursor = conn.cursor()
    
    print("\n🔄 Veritabanı güncelleniyor...")
    
    # Featured images güncelle
    print("  📸 Featured images güncelleniyor...")
    for article_id, old_url in image_data['featured_images']:
        if old_url in url_mapping:
            new_url = url_mapping[old_url]
            cursor.execute(
                "UPDATE articles SET featured_image = %s WHERE id = %s",
                (new_url, article_id)
            )
    
    # Content içindeki resimleri güncelle
    print("  📝 Content içindeki resimler güncelleniyor...")
    for article_id, content in image_data['content_images']:
        if not content:
            continue
        
        updated_content = content
        for old_url, new_url in url_mapping.items():
            updated_content = updated_content.replace(old_url, new_url)
        
        if updated_content != content:
            cursor.execute(
                "UPDATE articles SET content = %s WHERE id = %s",
                (updated_content, article_id)
            )
    
    # Author avatars güncelle
    print("  👤 Author avatars güncelleniyor...")
    for author_id, old_url in image_data['author_avatars']:
        if old_url in url_mapping:
            new_url = url_mapping[old_url]
            cursor.execute(
                "UPDATE authors SET avatar_url = %s WHERE id = %s",
                (new_url, author_id)
            )
    
    conn.commit()
    print("  ✅ Veritabanı güncellendi")

def main():
    """Ana fonksiyon"""
    print("🚀 WordPress Resim İndirme ve Veritabanı Güncelleme Script'i")
    print("=" * 60)
    
    # Veritabanına bağlan
    print("\n🔌 Veritabanına bağlanılıyor...")
    conn = connect_db()
    if not conn:
        return
    print("✅ Bağlantı başarılı")
    
    # Uploads klasörünü oluştur
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    print(f"✅ Uploads klasörü: {UPLOADS_DIR}")
    
    # Resim URL'lerini çıkar
    print("\n🔍 Resim URL'leri çıkarılıyor...")
    image_data = extract_image_urls(conn)
    
    total_featured = len(image_data['featured_images'])
    total_content = len(image_data['content_images'])
    total_avatars = len(image_data['author_avatars'])
    
    print(f"  📸 Featured images: {total_featured}")
    print(f"  📝 Content içeren makaleler: {total_content}")
    print(f"  👤 Author avatars: {total_avatars}")
    
    # Resimleri indir
    url_mapping = process_images(image_data)
    
    print(f"\n✅ Toplam {len(url_mapping)} resim indirildi")
    
    # Veritabanını güncelle
    update_database(conn, image_data, url_mapping)
    
    # Bağlantıyı kapat
    conn.close()
    
    print("\n" + "=" * 60)
    print("🎉 İşlem tamamlandı!")
    print(f"📁 Resimler: {UPLOADS_DIR}")
    print(f"🔄 Güncellenen URL sayısı: {len(url_mapping)}")

if __name__ == "__main__":
    main()


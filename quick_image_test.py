#!/usr/bin/env python3
"""
Hızlı resim testi - sadece ilk 10 makaleyi analiz eder
"""

import re
import json
import psycopg2
from collections import defaultdict

def extract_images_from_content(content):
    """İçerikten resim URL'lerini çıkarır"""
    if not content:
        return []
    
    # HTML img tag'lerini bul
    img_pattern = r'<img[^>]+src=["\']([^"\']+)["\'][^>]*>'
    img_matches = re.findall(img_pattern, content, re.IGNORECASE)
    
    # WordPress attachment URL'lerini bul
    attachment_pattern = r'https://morfikirler\.com/wp-content/uploads/[^"\'>\s]+'
    attachment_matches = re.findall(attachment_pattern, content, re.IGNORECASE)
    
    all_images = img_matches + attachment_matches
    return list(set(all_images))

def main():
    print("🔍 Hızlı Resim Testi (İlk 10 makale)...")
    
    # Veritabanına bağlan
    conn = psycopg2.connect(
        host="localhost",
        port="5432",
        database="yenimorfikir_db",
        user="enesoksuz",
        password=""
    )
    
    cursor = conn.cursor()
    
    # İlk 10 makaleyi al
    cursor.execute("""
        SELECT id, title, content, featured_image
        FROM articles 
        WHERE status = 'published'
        ORDER BY created_at DESC
        LIMIT 10
    """)
    
    articles = cursor.fetchall()
    print(f"📊 {len(articles)} makale analiz ediliyor...")
    
    total_images = 0
    articles_with_images = []
    
    for i, (article_id, title, content, featured_image) in enumerate(articles, 1):
        print(f"\n{i}. {title[:60]}...")
        
        # İçerikten resimleri çıkar
        content_images = extract_images_from_content(content)
        
        if content_images:
            print(f"   📸 {len(content_images)} resim bulundu:")
            total_images += len(content_images)
            
            articles_with_images.append({
                'id': article_id,
                'title': title,
                'content_images': content_images,
                'featured_image': featured_image
            })
            
            # İlk 3 resmi göster
            for j, img_url in enumerate(content_images[:3], 1):
                print(f"      {j}. {img_url}")
            
            if len(content_images) > 3:
                print(f"      ... ve {len(content_images) - 3} resim daha")
        else:
            print("   ❌ İçerikte resim yok")
    
    cursor.close()
    conn.close()
    
    print(f"\n📈 SONUÇLAR:")
    print(f"İçerikte resim olan makale: {len(articles_with_images)}")
    print(f"Toplam içerik resmi: {total_images}")
    
    if articles_with_images:
        print(f"\n💾 Detaylar:")
        with open('quick_test_results.json', 'w', encoding='utf-8') as f:
            json.dump(articles_with_images, f, ensure_ascii=False, indent=2)
        
        print("   'quick_test_results.json' dosyasına kaydedildi")
        
        # URL pattern analizi
        wp_content_count = 0
        old_uploads_count = 0
        
        for article in articles_with_images:
            for img_url in article['content_images']:
                if '/wp-content/uploads/' in img_url:
                    wp_content_count += 1
                elif '/uploads/' in img_url:
                    old_uploads_count += 1
        
        print(f"\n📊 URL Pattern Analizi:")
        print(f"   /wp-content/uploads/: {wp_content_count}")
        print(f"   /uploads/: {old_uploads_count}")
        
        if wp_content_count > 0 or old_uploads_count > 0:
            print(f"\n🚀 Sonraki Adım:")
            print("   python3 analyze_content_images.py")

if __name__ == "__main__":
    main()

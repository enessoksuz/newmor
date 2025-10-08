#!/usr/bin/env python3
"""
İçeriklerdeki tüm resimleri analiz eder ve URL yapısını tespit eder
"""

import re
import json
import psycopg2
from urllib.parse import urlparse
from collections import defaultdict

def extract_images_from_content(content):
    """İçerikten resim URL'lerini çıkarır"""
    if not content:
        return []
    
    # HTML img tag'lerini bul
    img_pattern = r'<img[^>]+src=["\']([^"\']+)["\'][^>]*>'
    img_matches = re.findall(img_pattern, content, re.IGNORECASE)
    
    # WordPress shortcode'larını bul
    shortcode_pattern = r'\[gallery[^\]]*ids=["\']([^"\']+)["\'][^\]]*\]'
    shortcode_matches = re.findall(shortcode_pattern, content, re.IGNORECASE)
    
    # WordPress attachment URL'lerini bul
    attachment_pattern = r'https://morfikirler\.com/wp-content/uploads/[^"\'>\s]+'
    attachment_matches = re.findall(attachment_pattern, content, re.IGNORECASE)
    
    all_images = img_matches + attachment_matches
    
    return list(set(all_images))  # Duplicate'leri kaldır

def categorize_image_url(url):
    """Resim URL'sini kategorize eder"""
    if not url:
        return 'empty'
    
    if 'morfikirler.com' in url:
        if '/wp-content/uploads/' in url:
            return 'wordpress_upload'
        elif '/uploads/' in url:
            return 'old_upload_structure'
        else:
            return 'wordpress_other'
    elif url.startswith('http'):
        return 'external'
    elif url.startswith('/'):
        return 'relative'
    else:
        return 'other'

def main():
    print("🔍 İçerik Resim Analizi Başlatılıyor...")
    
    # Veritabanına bağlan
    conn = psycopg2.connect(
        host="localhost",
        port="5432",
        database="yenimorfikir_db",
        user="enesoksuz",
        password=""
    )
    
    cursor = conn.cursor()
    
    # Tüm makaleleri al
    cursor.execute("""
        SELECT id, title, content, featured_image
        FROM articles 
        WHERE status = 'published'
        ORDER BY created_at DESC
    """)
    
    articles = cursor.fetchall()
    print(f"📊 Toplam {len(articles)} makale analiz ediliyor...")
    
    # İstatistikler
    stats = {
        'total_articles': len(articles),
        'articles_with_content_images': 0,
        'total_content_images': 0,
        'image_categories': defaultdict(int),
        'url_patterns': defaultdict(int)
    }
    
    all_images = []
    articles_with_images = []
    
    for i, (article_id, title, content, featured_image) in enumerate(articles, 1):
        if i % 100 == 0:
            print(f"⏳ İşleniyor: {i}/{len(articles)}")
        
        # İçerikten resimleri çıkar
        content_images = extract_images_from_content(content)
        
        if content_images:
            stats['articles_with_content_images'] += 1
            stats['total_content_images'] += len(content_images)
            
            articles_with_images.append({
                'id': article_id,
                'title': title,
                'content_images': content_images,
                'featured_image': featured_image
            })
            
            # Her resmi analiz et
            for img_url in content_images:
                category = categorize_image_url(img_url)
                stats['image_categories'][category] += 1
                
                # URL pattern'ini analiz et
                if 'morfikirler.com' in img_url:
                    if '/wp-content/uploads/' in img_url:
                        stats['url_patterns']['wp-content/uploads'] += 1
                    elif '/uploads/' in img_url:
                        stats['url_patterns']['uploads'] += 1
                
                all_images.append({
                    'article_id': article_id,
                    'article_title': title,
                    'url': img_url,
                    'category': category
                })
    
    cursor.close()
    conn.close()
    
    print(f"\n📈 ANALİZ SONUÇLARI:")
    print(f"Toplam makale: {stats['total_articles']}")
    print(f"İçerikte resim olan makale: {stats['articles_with_content_images']}")
    print(f"Toplam içerik resmi: {stats['total_content_images']}")
    
    print(f"\n📊 Resim Kategorileri:")
    for category, count in stats['image_categories'].items():
        print(f"  {category}: {count}")
    
    print(f"\n📊 URL Pattern'leri:")
    for pattern, count in stats['url_patterns'].items():
        print(f"  {pattern}: {count}")
    
    # Örnek resimleri göster
    print(f"\n🔍 Örnek Resimler:")
    wordpress_images = [img for img in all_images if img['category'] == 'wordpress_upload'][:5]
    for img in wordpress_images:
        print(f"  {img['article_title'][:50]}...")
        print(f"    {img['url']}")
    
    # Sonuçları dosyaya kaydet
    with open('content_images_analysis.json', 'w', encoding='utf-8') as f:
        json.dump({
            'stats': dict(stats),
            'articles_with_images': articles_with_images,
            'all_images': all_images
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 Detaylı analiz 'content_images_analysis.json' dosyasına kaydedildi")
    
    # Çözüm önerileri
    print(f"\n💡 ÇÖZÜM ÖNERİLERİ:")
    print("1. Tüm WordPress resimlerini yeni siteye indir")
    print("2. URL yapısını güncelle (/wp-content/uploads/ → /images/)")
    print("3. 301 redirect'ler oluştur")
    print("4. İçeriklerdeki resim URL'lerini güncelle")
    
    # Eylem planı
    if stats['image_categories']['wordpress_upload'] > 0:
        print(f"\n🚀 EYLEM PLANI:")
        print("1. python3 download_content_images.py")
        print("2. python3 create_redirects.py") 
        print("3. python3 update_content_urls.py")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Eski resim URL'lerinden yeni URL'lere 301 redirect'ler oluşturur
"""

import json
import psycopg2

def create_redirect_rules(downloaded_images):
    """Redirect kuralları oluşturur"""
    redirects = []
    
    for img_info in downloaded_images:
        original_url = img_info['original_url']
        new_url = img_info['new_url']
        
        # URL'yi normalize et
        if original_url.startswith('/'):
            from_url = original_url
        elif 'morfikirler.com' in original_url:
            # Domain'i kaldır
            from_url = original_url.split('morfikirler.com', 1)[1]
        else:
            continue
        
        # Redirect kuralı oluştur
        redirects.append({
            'from_url': from_url,
            'to_url': new_url,
            'status_code': 301,
            'article_id': img_info['article_id']
        })
    
    return redirects

def insert_redirects_to_db(redirects):
    """Redirect'leri veritabanına ekler"""
    conn = psycopg2.connect(
        host="localhost",
        port="5432",
        database="yenimorfikir_db",
        user="enesoksuz",
        password=""
    )
    
    cursor = conn.cursor()
    
    # Redirect tablosu oluştur (yoksa)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS redirects (
            id SERIAL PRIMARY KEY,
            from_url VARCHAR(2048) NOT NULL,
            to_url VARCHAR(2048) NOT NULL,
            status_code INTEGER DEFAULT 301,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(from_url)
        )
    """)
    
    # Redirect'leri ekle
    inserted_count = 0
    duplicate_count = 0
    
    for redirect in redirects:
        try:
            cursor.execute("""
                INSERT INTO redirects (from_url, to_url, status_code)
                VALUES (%s, %s, %s)
                ON CONFLICT (from_url) DO NOTHING
            """, (redirect['from_url'], redirect['to_url'], redirect['status_code']))
            
            if cursor.rowcount > 0:
                inserted_count += 1
            else:
                duplicate_count += 1
                
        except Exception as e:
            print(f"❌ Redirect ekleme hatası: {e}")
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return inserted_count, duplicate_count

def create_nginx_config(redirects):
    """Nginx redirect konfigürasyonu oluşturur"""
    nginx_config = "# WordPress Resim Redirect'leri\n"
    nginx_config += "# Otomatik oluşturuldu\n\n"
    
    for redirect in redirects[:100]:  # İlk 100 redirect
        nginx_config += f"location = {redirect['from_url']} {{\n"
        nginx_config += f"    return {redirect['status_code']} {redirect['to_url']};\n"
        nginx_config += "}\n\n"
    
    with open('nginx_redirects.conf', 'w') as f:
        f.write(nginx_config)
    
    return len(redirects)

def create_htaccess_config(redirects):
    """Apache .htaccess redirect konfigürasyonu oluşturur"""
    htaccess_config = "# WordPress Resim Redirect'leri\n"
    htaccess_config += "# Otomatik oluşturuldu\n\n"
    
    for redirect in redirects:
        htaccess_config += f"Redirect {redirect['status_code']} {redirect['from_url']} {redirect['to_url']}\n"
    
    with open('.htaccess_redirects', 'w') as f:
        f.write(htaccess_config)
    
    return len(redirects)

def main():
    print("🔄 Redirect Oluşturma İşlemi Başlatılıyor...")
    
    # İndirilen resimleri oku
    try:
        with open('downloaded_images.json', 'r', encoding='utf-8') as f:
            downloaded_images = json.load(f)
    except FileNotFoundError:
        print("❌ downloaded_images.json dosyası bulunamadı!")
        print("Önce python3 download_content_images.py çalıştırın.")
        return
    
    print(f"📊 {len(downloaded_images)} indirilen resim bulundu")
    
    # Redirect kuralları oluştur
    redirects = create_redirect_rules(downloaded_images)
    print(f"📊 {len(redirects)} redirect kuralı oluşturuldu")
    
    # Veritabanına ekle
    print("💾 Veritabanına redirect'ler ekleniyor...")
    inserted_count, duplicate_count = insert_redirects_to_db(redirects)
    
    print(f"✅ {inserted_count} yeni redirect eklendi")
    print(f"⏭️  {duplicate_count} duplicate redirect atlandı")
    
    # Nginx konfigürasyonu oluştur
    nginx_count = create_nginx_config(redirects)
    print(f"📄 Nginx konfigürasyonu oluşturuldu: nginx_redirects.conf ({nginx_count} kural)")
    
    # Apache konfigürasyonu oluştur
    htaccess_count = create_htaccess_config(redirects)
    print(f"📄 Apache konfigürasyonu oluşturuldu: .htaccess_redirects ({htaccess_count} kural)")
    
    # Sonuçları kaydet
    with open('redirect_rules.json', 'w', encoding='utf-8') as f:
        json.dump(redirects, f, ensure_ascii=False, indent=2)
    
    print(f"\n🎉 Redirect Oluşturma Tamamlandı!")
    print(f"📊 SONUÇLAR:")
    print(f"   Toplam redirect: {len(redirects)}")
    print(f"   Veritabanına eklenen: {inserted_count}")
    print(f"   Duplicate: {duplicate_count}")
    
    print(f"\n💾 Redirect kuralları 'redirect_rules.json' dosyasına kaydedildi")
    
    print(f"\n📋 KULLANIM TALİMATLARI:")
    print("1. Nginx için: nginx_redirects.conf dosyasını nginx konfigürasyonunuza ekleyin")
    print("2. Apache için: .htaccess_redirects dosyasını .htaccess dosyanıza ekleyin")
    print("3. Next.js middleware için: redirects tablosunu kullanın")
    
    # Next.js middleware önerisi
    print(f"\n🚀 Next.js Middleware Entegrasyonu:")
    print("   Redirect'leri middleware'de kontrol etmek için:")
    print("   SELECT to_url FROM redirects WHERE from_url = $1")

if __name__ == "__main__":
    main()

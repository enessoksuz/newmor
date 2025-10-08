#!/usr/bin/env python3
import psycopg2
import os

db_config = {
    'dbname': 'yenimorfikir_db',
    'user': os.environ.get('POSTGRES_USER', 'enesoksuz'),
    'password': os.environ.get('POSTGRES_PASSWORD', ''),
    'host': 'localhost'
}

try:
    conn = psycopg2.connect(**db_config)
    cur = conn.cursor()
    
    print("🔧 Sabit sayfalar tablosu oluşturuluyor...")
    
    # Tablo oluştur
    cur.execute("""
        CREATE TABLE IF NOT EXISTS static_pages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            content TEXT,
            meta_title VARCHAR(255),
            meta_description TEXT,
            footer_column INTEGER CHECK (footer_column IN (2, 3, 4)),
            display_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Index'ler
    cur.execute("CREATE INDEX IF NOT EXISTS idx_static_pages_slug ON static_pages(slug);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_static_pages_footer_column ON static_pages(footer_column);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_static_pages_is_active ON static_pages(is_active);")
    
    conn.commit()
    print("✅ Tablo oluşturuldu!")
    
    # Örnek sayfalar ekle
    print("\n📄 Örnek sayfalar ekleniyor...")
    
    pages = [
        ('Hakkımızda', 'hakkimizda', '<h2>Mor Fikirler Hakkında</h2><p>Mor Fikirler, girişimcilik ve iş fikirleri konusunda içerik üreten bir platformdur.</p>', 'Hakkımızda - Mor Fikirler', 'Mor Fikirler hakkında bilgi edinin.', 3, 1),
        ('Gizlilik Politikası', 'gizlilik-politikasi', '<h2>Gizlilik Politikası</h2><p>Kullanıcı verilerinin korunması bizim için önemlidir.</p>', 'Gizlilik Politikası', 'Gizlilik politikamız hakkında detaylı bilgi.', 3, 2),
        ('Editörlük Yönergeleri', 'editorluk-yonergeleri', '<h2>Editörlük Yönergeleri</h2><p>İçerik üretim standartlarımız.</p>', 'Editörlük Yönergeleri', 'İçerik üretim standartlarımız ve editörlük yönergelerimiz.', 3, 3),
        ('Hizmet Şartları', 'hizmet-sartlari', '<h2>Hizmet Şartları</h2><p>Platformumuzu kullanırken uyulması gereken kurallar.</p>', 'Hizmet Şartları', 'Hizmet şartları ve kullanım koşulları.', 4, 1),
        ('Reklam Verin', 'reklam-verin', '<h2>Reklam Verin</h2><p>Platformumuzda reklam vermek için bizimle iletişime geçin.</p>', 'Reklam Verin', 'Mor Fikirler\'de reklam verme seçenekleri.', 4, 2),
        ('Kariyer', 'kariyer', '<h2>Kariyer</h2><p>Ekibimize katılmak ister misiniz?</p>', 'Kariyer - Mor Fikirler', 'Mor Fikirler\'de kariyer fırsatları.', 4, 3),
        ('İletişim', 'iletisim', '<h2>İletişim</h2><p>Bizimle iletişime geçin.</p>', 'İletişim', 'Mor Fikirler iletişim bilgileri.', 4, 4)
    ]
    
    for title, slug, content, meta_title, meta_description, footer_column, display_order in pages:
        try:
            cur.execute("""
                INSERT INTO static_pages (title, slug, content, meta_title, meta_description, footer_column, display_order)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (slug) DO NOTHING;
            """, (title, slug, content, meta_title, meta_description, footer_column, display_order))
            print(f"   ✅ {title}")
        except Exception as e:
            print(f"   ⚠️  {title}: {e}")
    
    conn.commit()
    
    # Sonuçları göster
    cur.execute("SELECT COUNT(*) FROM static_pages;")
    count = cur.fetchone()[0]
    print(f"\n📊 Toplam {count} sabit sayfa mevcut")
    
    print("\n✅ Kurulum tamamlandı!")
    
except Exception as e:
    print(f"❌ Hata: {e}")
    if conn:
        conn.rollback()
finally:
    if conn:
        cur.close()
        conn.close()



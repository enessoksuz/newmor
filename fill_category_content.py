#!/usr/bin/env python3
import psycopg2
import os
import random

# Veritabanı bağlantısı
db_config = {
    'dbname': 'yenimorfikir_db',
    'user': os.environ.get('POSTGRES_USER', 'enesoksuz'),
    'password': os.environ.get('POSTGRES_PASSWORD', ''),
    'host': 'localhost'
}

def fill_category_content():
    try:
        conn = psycopg2.connect(**db_config)
        cur = conn.cursor()
        
        print("🔄 Alt kategorilere kardeş kategorilerden içerik ekleniyor...")
        
        # 14'ten az içeriği olan alt kategorileri bul
        cur.execute('''
            SELECT c.id, c.name, c.slug, c.parent_id, parent.name as parent_name,
                   COUNT(ac.article_id) as article_count
            FROM categories c
            LEFT JOIN categories parent ON c.parent_id = parent.id
            LEFT JOIN article_categories ac ON c.id = ac.category_id
            LEFT JOIN articles a ON ac.article_id = a.id AND a.status = 'published'
            WHERE c.is_active = true AND c.parent_id IS NOT NULL
            GROUP BY c.id, c.name, c.slug, c.parent_id, parent.name
            HAVING COUNT(ac.article_id) < 14
            ORDER BY article_count ASC;
        ''')
        
        under_14_categories = cur.fetchall()
        
        for cat_id, cat_name, cat_slug, parent_id, parent_name, current_count in under_14_categories:
            needed = 14 - current_count
            print(f"\n📁 {parent_name} > {cat_name}: {current_count}/14 makale (Eksik: {needed})")
            
            # Aynı parent'a sahip kardeş kategorileri bul
            cur.execute('''
                SELECT c2.id, c2.name, COUNT(ac.article_id) as article_count
                FROM categories c2
                LEFT JOIN article_categories ac ON c2.id = ac.category_id
                LEFT JOIN articles a ON ac.article_id = a.id AND a.status = 'published'
                WHERE c2.parent_id = %s AND c2.id != %s AND c2.is_active = true
                GROUP BY c2.id, c2.name
                HAVING COUNT(ac.article_id) > 0
                ORDER BY article_count DESC;
            ''', (parent_id, cat_id))
            
            sibling_categories = cur.fetchall()
            
            if not sibling_categories:
                print(f"   ⚠️  Kardeş kategori bulunamadı")
                continue
                
            print(f"   🔍 {len(sibling_categories)} kardeş kategori bulundu")
            
            # Kardeş kategorilerden makale al
            added_count = 0
            for sibling_id, sibling_name, sibling_count in sibling_categories:
                if added_count >= needed:
                    break
                    
                # Bu kardeş kategorideki makaleleri al (hedef kategoride olmayanlar)
                cur.execute('''
                    SELECT DISTINCT ac.article_id
                    FROM article_categories ac
                    WHERE ac.category_id = %s
                      AND ac.article_id NOT IN (
                          SELECT article_id FROM article_categories WHERE category_id = %s
                      )
                      AND ac.article_id IN (
                          SELECT id FROM articles WHERE status = 'published'
                      )
                    LIMIT %s;
                ''', (sibling_id, cat_id, needed - added_count))
                
                articles_to_add = cur.fetchall()
                
                if articles_to_add:
                    # Bu makaleleri hedef kategoriye ekle
                    for (article_id,) in articles_to_add:
                        try:
                            cur.execute('''
                                INSERT INTO article_categories (article_id, category_id, is_primary)
                                VALUES (%s, %s, false);
                            ''', (article_id, cat_id))
                            added_count += 1
                            print(f"   ✅ {sibling_name}'den 1 makale eklendi")
                        except psycopg2.IntegrityError:
                            # Zaten var, devam et
                            pass
                            
            print(f"   📊 Toplam {added_count} makale eklendi")
            
        conn.commit()
        
        # Sonuçları göster
        print(f"\n📋 Güncellenmiş kategori içerik sayıları:")
        cur.execute('''
            SELECT c.name, c.slug, parent.name as parent_name,
                   COUNT(ac.article_id) as article_count
            FROM categories c
            LEFT JOIN categories parent ON c.parent_id = parent.id
            LEFT JOIN article_categories ac ON c.id = ac.category_id
            LEFT JOIN articles a ON ac.article_id = a.id AND a.status = 'published'
            WHERE c.is_active = true AND c.parent_id IS NOT NULL
            GROUP BY c.id, c.name, c.slug, parent.name
            ORDER BY article_count ASC;
        ''')
        
        results = cur.fetchall()
        under_14_count = 0
        
        for name, slug, parent_name, count in results:
            status = "✅" if count >= 14 else "❌"
            if count < 14:
                under_14_count += 1
            print(f"  {status} {parent_name} > {name}: {count} makale")
            
        print(f"\n🎯 Sonuç: {under_14_count} alt kategori hala 14'ten az içeriğe sahip")
        
    except Exception as e:
        print(f"❌ Hata: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            cur.close()
            conn.close()

if __name__ == "__main__":
    fill_category_content()

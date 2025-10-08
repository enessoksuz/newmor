#!/usr/bin/env python3
"""
Kategorileri ve içlerindeki içerik sayısını listeler
"""

import psycopg2

def main():
    # Veritabanı bağlantısı
    conn = psycopg2.connect(
        host="localhost",
        database="yenimorfikir_db",
        user="enesoksuz",
        password=""
    )
    cur = conn.cursor()
    
    try:
        # Kategorileri ve makale sayılarını al
        cur.execute("""
            WITH RECURSIVE cat_tree AS (
                SELECT 
                    c.id, 
                    c.name, 
                    c.slug, 
                    c.parent_id,
                    0 as level,
                    CAST(c.name AS TEXT) as path
                FROM categories c 
                WHERE c.parent_id IS NULL
                
                UNION ALL
                
                SELECT 
                    c.id, 
                    c.name, 
                    c.slug, 
                    c.parent_id,
                    ct.level + 1,
                    CAST(ct.path || ' > ' || c.name AS TEXT)
                FROM categories c
                JOIN cat_tree ct ON c.parent_id = ct.id
            )
            SELECT 
                ct.level,
                ct.path,
                ct.name,
                ct.slug,
                COUNT(DISTINCT ac.article_id) as article_count
            FROM cat_tree ct
            LEFT JOIN article_categories ac ON ct.id = ac.category_id
            GROUP BY ct.id, ct.level, ct.path, ct.name, ct.slug
            ORDER BY ct.path
        """)
        
        results = cur.fetchall()
        
        print("\n" + "="*80)
        print("KATEGORİLER VE İÇERİK SAYILARI")
        print("="*80 + "\n")
        
        total_articles = 0
        
        for level, path, name, slug, count in results:
            indent = "  " * level
            print(f"{indent}📁 {name}")
            print(f"{indent}   └─ İçerik Sayısı: {count}")
            print(f"{indent}   └─ Slug: {slug}")
            print()
            total_articles += count
        
        print("="*80)
        print(f"TOPLAM: {len(results)} kategori")
        print(f"TOPLAM İÇERİK ATAMALARI: {total_articles}")
        print("="*80 + "\n")
        
        # En çok içerikli kategoriler
        print("\n" + "="*80)
        print("EN ÇOK İÇERİKLİ 10 KATEGORİ")
        print("="*80 + "\n")
        
        sorted_results = sorted(results, key=lambda x: x[4], reverse=True)[:10]
        
        for i, (level, path, name, slug, count) in enumerate(sorted_results, 1):
            print(f"{i}. {name}")
            print(f"   └─ İçerik Sayısı: {count}")
            print(f"   └─ Yol: {path}")
            print()
        
    except Exception as e:
        print(f"Hata: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()


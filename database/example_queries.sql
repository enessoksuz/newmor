-- ============================================
-- ÖRNEK SQL SORGU KÜTÜPHANESİ
-- Haber Sitesi İçin Optimize Edilmiş Sorgular
-- ============================================

-- ============================================
-- 1. MAKALE LİSTELEME SORGULARI
-- ============================================

-- Tüm yayınlanmış makaleleri getir (Sayfalama ile)
SELECT 
    a.id,
    a.title,
    a.slug,
    a.summary,
    a.featured_image,
    a.view_count,
    a.published_at,
    a.is_featured,
    -- Yazarları array olarak getir
    array_agg(DISTINCT jsonb_build_object(
        'id', au.id,
        'name', au.full_name,
        'username', au.username,
        'avatar', au.avatar_url
    )) as authors,
    -- Kategorileri array olarak getir
    array_agg(DISTINCT jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'slug', c.slug
    )) FILTER (WHERE c.id IS NOT NULL) as categories
FROM articles a
LEFT JOIN article_authors aa ON a.id = aa.article_id
LEFT JOIN authors au ON aa.author_id = au.id
LEFT JOIN article_categories ac ON a.id = ac.article_id
LEFT JOIN categories c ON ac.category_id = c.id
WHERE a.status = 'published'
GROUP BY a.id
ORDER BY a.published_at DESC
LIMIT 20 OFFSET 0;

-- ============================================
-- 2. KATEGORİYE GÖRE MAKALE LİSTESİ
-- ============================================

-- Belirli bir kategorideki makaleleri getir (alt kategoriler dahil)
WITH RECURSIVE category_tree AS (
    -- Ana kategori
    SELECT id FROM categories WHERE slug = 'teknoloji'
    
    UNION ALL
    
    -- Alt kategoriler
    SELECT c.id 
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT DISTINCT
    a.id,
    a.title,
    a.slug,
    a.featured_image,
    a.published_at,
    a.view_count,
    array_agg(DISTINCT au.full_name) as authors
FROM articles a
INNER JOIN article_categories ac ON a.id = ac.article_id
INNER JOIN category_tree ct ON ac.category_id = ct.id
LEFT JOIN article_authors aa ON a.id = aa.article_id
LEFT JOIN authors au ON aa.author_id = au.id
WHERE a.status = 'published'
GROUP BY a.id
ORDER BY a.published_at DESC
LIMIT 20;

-- ============================================
-- 3. YAZARA GÖRE MAKALE LİSTESİ
-- ============================================

SELECT 
    a.id,
    a.title,
    a.slug,
    a.summary,
    a.featured_image,
    a.published_at,
    a.view_count,
    ac.is_primary,
    c.name as primary_category
FROM articles a
INNER JOIN article_authors aa ON a.id = aa.article_id
INNER JOIN authors au ON aa.author_id = au.id
LEFT JOIN article_categories ac ON a.id = ac.article_id AND ac.is_primary = true
LEFT JOIN categories c ON ac.category_id = c.id
WHERE au.username = 'ahmet.yilmaz'
  AND a.status = 'published'
ORDER BY a.published_at DESC
LIMIT 20;

-- ============================================
-- 4. MANŞET (FEATURED) MAKALELER
-- ============================================

SELECT 
    a.id,
    a.title,
    a.slug,
    a.featured_image,
    a.summary,
    a.published_at,
    array_agg(DISTINCT c.name) FILTER (WHERE c.id IS NOT NULL) as categories
FROM articles a
LEFT JOIN article_categories ac ON a.id = ac.article_id
LEFT JOIN categories c ON ac.category_id = c.id
WHERE a.status = 'published' 
  AND a.is_featured = true
GROUP BY a.id
ORDER BY a.published_at DESC
LIMIT 5;

-- ============================================
-- 5. POPÜLER MAKALELER (En Çok Okunan)
-- ============================================

-- Son 7 gün içinde en çok okunanlar
SELECT 
    a.id,
    a.title,
    a.slug,
    a.featured_image,
    a.view_count,
    a.published_at,
    c.name as category_name
FROM articles a
LEFT JOIN article_categories ac ON a.id = ac.article_id AND ac.is_primary = true
LEFT JOIN categories c ON ac.category_id = c.id
WHERE a.status = 'published'
  AND a.published_at >= NOW() - INTERVAL '7 days'
ORDER BY a.view_count DESC
LIMIT 10;

-- ============================================
-- 6. İLGİLİ MAKALELER (Related Articles)
-- ============================================

-- Aynı kategorilerdeki benzer makaleler
WITH current_article_categories AS (
    SELECT category_id 
    FROM article_categories 
    WHERE article_id = 'MAKALE_ID_BURAYA'
)
SELECT DISTINCT
    a.id,
    a.title,
    a.slug,
    a.featured_image,
    a.published_at,
    COUNT(ac.category_id) as matching_categories
FROM articles a
INNER JOIN article_categories ac ON a.id = ac.article_id
INNER JOIN current_article_categories cac ON ac.category_id = cac.category_id
WHERE a.id != 'MAKALE_ID_BURAYA'
  AND a.status = 'published'
GROUP BY a.id
ORDER BY matching_categories DESC, a.published_at DESC
LIMIT 5;

-- ============================================
-- 7. FULL-TEXT SEARCH (Türkçe Arama)
-- ============================================

-- Başlık, özet ve içerikte arama
SELECT 
    a.id,
    a.title,
    a.slug,
    a.featured_image,
    a.published_at,
    ts_rank(a.search_vector, query) AS rank,
    ts_headline('turkish', a.summary, query, 
        'MaxWords=50, MinWords=25, ShortWord=3') AS highlighted_summary
FROM articles a,
     to_tsquery('turkish', 'postgresql & optimizasyon') query
WHERE a.search_vector @@ query
  AND a.status = 'published'
ORDER BY rank DESC
LIMIT 20;

-- Daha esnek arama (OR operatörü)
SELECT 
    a.id,
    a.title,
    a.slug,
    ts_rank(a.search_vector, query) AS rank
FROM articles a,
     to_tsquery('turkish', 'postgresql | mysql | mongodb') query
WHERE a.search_vector @@ query
  AND a.status = 'published'
ORDER BY rank DESC;

-- ============================================
-- 8. KATEGORİ HİYERARŞİSİ
-- ============================================

-- Tüm kategorileri hiyerarşik olarak getir
WITH RECURSIVE category_tree AS (
    -- Üst kategoriler
    SELECT 
        id, 
        name, 
        slug, 
        parent_id,
        display_order,
        0 as level,
        ARRAY[display_order] as path
    FROM categories 
    WHERE parent_id IS NULL AND is_active = true
    
    UNION ALL
    
    -- Alt kategoriler
    SELECT 
        c.id, 
        c.name, 
        c.slug, 
        c.parent_id,
        c.display_order,
        ct.level + 1,
        ct.path || c.display_order
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
    WHERE c.is_active = true
)
SELECT 
    id,
    name,
    slug,
    parent_id,
    level,
    REPEAT('  ', level) || name as indented_name
FROM category_tree
ORDER BY path;

-- Kategori breadcrumb (Ekmek kırıntısı)
SELECT * FROM get_category_path('KATEGORİ_ID_BURAYA');

-- Bir kategorinin tüm alt kategorilerini getir
SELECT * FROM get_subcategories('KATEGORİ_ID_BURAYA');

-- ============================================
-- 9. KATEGORİ İSTATİSTİKLERİ
-- ============================================

-- Her kategorideki makale sayısı
SELECT 
    c.id,
    c.name,
    c.slug,
    COUNT(DISTINCT a.id) as article_count,
    MAX(a.published_at) as latest_article_date
FROM categories c
LEFT JOIN article_categories ac ON c.id = ac.category_id
LEFT JOIN articles a ON ac.article_id = a.id AND a.status = 'published'
WHERE c.is_active = true
GROUP BY c.id
ORDER BY article_count DESC;

-- ============================================
-- 10. YAZAR İSTATİSTİKLERİ
-- ============================================

-- Yazarların makale sayısı ve toplam görüntülenme
SELECT 
    au.id,
    au.full_name,
    au.username,
    au.avatar_url,
    COUNT(DISTINCT a.id) as article_count,
    SUM(a.view_count) as total_views,
    AVG(a.view_count)::INTEGER as avg_views_per_article,
    MAX(a.published_at) as latest_article_date
FROM authors au
LEFT JOIN article_authors aa ON au.id = aa.author_id
LEFT JOIN articles a ON aa.article_id = a.id AND a.status = 'published'
WHERE au.is_active = true
GROUP BY au.id
ORDER BY article_count DESC;

-- ============================================
-- 11. MAKALE DETAY SAYFASI (Tek Makale)
-- ============================================

SELECT 
    a.id,
    a.title,
    a.slug,
    a.summary,
    a.content,
    a.featured_image,
    a.view_count,
    a.published_at,
    a.meta_title,
    a.meta_description,
    a.meta_keywords,
    -- Yazarlar
    (SELECT json_agg(json_build_object(
        'id', au.id,
        'name', au.full_name,
        'username', au.username,
        'bio', au.bio,
        'avatar', au.avatar_url,
        'order', aa.author_order
    ) ORDER BY aa.author_order)
    FROM article_authors aa
    JOIN authors au ON aa.author_id = au.id
    WHERE aa.article_id = a.id
    ) as authors,
    -- Kategoriler
    (SELECT json_agg(json_build_object(
        'id', c.id,
        'name', c.name,
        'slug', c.slug,
        'is_primary', ac.is_primary
    ))
    FROM article_categories ac
    JOIN categories c ON ac.category_id = c.id
    WHERE ac.article_id = a.id
    ) as categories
FROM articles a
WHERE a.slug = 'makale-slug-buraya'
  AND a.status = 'published';

-- Görüntülenme sayısını artır
UPDATE articles 
SET view_count = view_count + 1 
WHERE slug = 'makale-slug-buraya';

-- ============================================
-- 12. SİTEMAP İÇİN SORGULAR
-- ============================================

-- Tüm yayınlanmış makalelerin URL'leri
SELECT 
    slug,
    updated_at,
    'weekly' as changefreq,
    0.8 as priority
FROM articles
WHERE status = 'published'
ORDER BY updated_at DESC;

-- Tüm aktif kategoriler
SELECT 
    slug,
    updated_at,
    'daily' as changefreq,
    0.7 as priority
FROM categories
WHERE is_active = true
ORDER BY display_order;

-- ============================================
-- 13. ADMİN PANELİ SORGULARI
-- ============================================

-- Son eklenen makaleler (tüm durumlar)
SELECT 
    a.id,
    a.title,
    a.slug,
    a.status,
    a.is_featured,
    a.view_count,
    a.created_at,
    a.published_at,
    array_agg(DISTINCT au.full_name) as authors,
    COUNT(DISTINCT ac.category_id) as category_count
FROM articles a
LEFT JOIN article_authors aa ON a.id = aa.article_id
LEFT JOIN authors au ON aa.author_id = au.id
LEFT JOIN article_categories ac ON a.id = ac.article_id
GROUP BY a.id
ORDER BY a.created_at DESC
LIMIT 50;

-- Dashboard istatistikleri
SELECT 
    (SELECT COUNT(*) FROM articles WHERE status = 'published') as published_count,
    (SELECT COUNT(*) FROM articles WHERE status = 'draft') as draft_count,
    (SELECT COUNT(*) FROM authors WHERE is_active = true) as active_authors,
    (SELECT COUNT(*) FROM categories WHERE is_active = true) as active_categories,
    (SELECT SUM(view_count) FROM articles WHERE status = 'published') as total_views,
    (SELECT COUNT(*) FROM articles WHERE published_at >= NOW() - INTERVAL '24 hours') as today_articles;

-- ============================================
-- 14. PERFORMANS OPTİMİZASYONU
-- ============================================

-- Materialized View'ı yenile (Cron job ile çalıştır)
SELECT refresh_popular_articles();

-- Cache temizleme
VACUUM ANALYZE articles;
VACUUM ANALYZE categories;
VACUUM ANALYZE authors;

-- İndeks kullanımını kontrol et
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Kullanılmayan indeksleri bul
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexname NOT LIKE '%pkey%';

-- ============================================
-- 15. TOPLU İŞLEMLER
-- ============================================

-- Eski makaleleri arşivle
UPDATE articles 
SET status = 'archived'
WHERE status = 'published'
  AND published_at < NOW() - INTERVAL '2 years'
  AND view_count < 100;

-- Görüntülenme sayısını sıfırla (Aylık reset)
UPDATE articles 
SET view_count = 0 
WHERE published_at < NOW() - INTERVAL '30 days';

-- Aktif olmayan yazarların makalelerini gizle
UPDATE articles 
SET status = 'archived'
WHERE id IN (
    SELECT DISTINCT aa.article_id
    FROM article_authors aa
    JOIN authors au ON aa.author_id = au.id
    WHERE au.is_active = false
);

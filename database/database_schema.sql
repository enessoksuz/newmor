-- ============================================
-- Haber/Blog/Magazin Sitesi - PostgreSQL Şeması
-- Yüksek Performans ve Optimizasyon İçin
-- ============================================

-- UUID Extension (Benzersiz ID'ler için)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Full-Text Search için Turkish dil desteği
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================
-- 1. YAZARLAR (AUTHORS) TABLOSU
-- ============================================
CREATE TABLE authors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(500),
    role VARCHAR(50) DEFAULT 'writer', -- 'admin', 'editor', 'writer'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indeksler
CREATE INDEX idx_authors_username ON authors(username);
CREATE INDEX idx_authors_email ON authors(email);
CREATE INDEX idx_authors_is_active ON authors(is_active);

-- ============================================
-- 2. KATEGORİLER (CATEGORIES) - HİYERARŞİK YAPI
-- ============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    image_url VARCHAR(500),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indeksler
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_is_active ON categories(is_active);
CREATE INDEX idx_categories_display_order ON categories(display_order);

-- Hiyerarşik sorgulamalar için (parent-child)
CREATE INDEX idx_categories_parent_active ON categories(parent_id, is_active);

-- ============================================
-- 3. İÇERİKLER (ARTICLES/CONTENT) TABLOSU
-- ============================================
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    featured_image VARCHAR(500),
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'archived'
    is_featured BOOLEAN DEFAULT false, -- Manşet haberleri için
    view_count INTEGER DEFAULT 0,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- SEO Alanları
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    
    -- Full-text search için
    search_vector tsvector
);

-- Indeksler
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_is_featured ON articles(is_featured) WHERE is_featured = true;
CREATE INDEX idx_articles_view_count ON articles(view_count DESC);

-- Full-text search indeksi (Türkçe içerik için)
CREATE INDEX idx_articles_search ON articles USING GIN(search_vector);

-- Composite indeks (Yayınlanmış ve popüler içerikler için)
CREATE INDEX idx_articles_status_published ON articles(status, published_at DESC) 
    WHERE status = 'published';

-- ============================================
-- 4. MAKALE-YAZAR İLİŞKİSİ (ÇOK YAZARLI)
-- ============================================
CREATE TABLE article_authors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    author_order INTEGER DEFAULT 0, -- Birinci yazar, ikinci yazar vs.
    contribution_type VARCHAR(50) DEFAULT 'writer', -- 'writer', 'editor', 'photographer'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(article_id, author_id)
);

-- Indeksler
CREATE INDEX idx_article_authors_article ON article_authors(article_id);
CREATE INDEX idx_article_authors_author ON article_authors(author_id);
CREATE INDEX idx_article_authors_order ON article_authors(article_id, author_order);

-- ============================================
-- 5. MAKALE-KATEGORİ İLİŞKİSİ (ÇOK KATEGORİLİ)
-- ============================================
CREATE TABLE article_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false, -- Ana kategori
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(article_id, category_id)
);

-- Indeksler
CREATE INDEX idx_article_categories_article ON article_categories(article_id);
CREATE INDEX idx_article_categories_category ON article_categories(category_id);
CREATE INDEX idx_article_categories_primary ON article_categories(is_primary) WHERE is_primary = true;

-- Composite indeks (Kategoriye göre makale listesi için)
CREATE INDEX idx_article_categories_cat_article ON article_categories(category_id, article_id);

-- ============================================
-- 6. MEDYA/DOSYALAR TABLOSU (Opsiyonel)
-- ============================================
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    uploaded_by UUID REFERENCES authors(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX idx_media_mime_type ON media(mime_type);

-- ============================================
-- TRİGGERLAR (Otomatik İşlemler)
-- ============================================

-- 1. Updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_authors_updated_at BEFORE UPDATE ON authors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Full-text search vektörü otomatik güncelleme
CREATE OR REPLACE FUNCTION articles_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('turkish', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('turkish', coalesce(NEW.summary, '')), 'B') ||
        setweight(to_tsvector('turkish', coalesce(NEW.content, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_search_vector_trigger 
    BEFORE INSERT OR UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION articles_search_vector_update();

-- ============================================
-- YARDIMCI FONKSIYONLAR
-- ============================================

-- 1. Alt kategorileri getir (Recursive)
CREATE OR REPLACE FUNCTION get_subcategories(parent_uuid UUID)
RETURNS TABLE(id UUID, name VARCHAR, slug VARCHAR, parent_id UUID, level INTEGER) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE subcats AS (
        SELECT c.id, c.name, c.slug, c.parent_id, 1 as level
        FROM categories c
        WHERE c.parent_id = parent_uuid AND c.is_active = true
        
        UNION ALL
        
        SELECT c.id, c.name, c.slug, c.parent_id, sc.level + 1
        FROM categories c
        INNER JOIN subcats sc ON c.parent_id = sc.id
        WHERE c.is_active = true
    )
    SELECT * FROM subcats ORDER BY level, name;
END;
$$ LANGUAGE plpgsql;

-- 2. Kategori hiyerarşisini getir (Breadcrumb için)
CREATE OR REPLACE FUNCTION get_category_path(category_uuid UUID)
RETURNS TABLE(id UUID, name VARCHAR, slug VARCHAR, level INTEGER) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE cat_path AS (
        SELECT c.id, c.name, c.slug, c.parent_id, 1 as level
        FROM categories c
        WHERE c.id = category_uuid
        
        UNION ALL
        
        SELECT c.id, c.name, c.slug, c.parent_id, cp.level + 1
        FROM categories c
        INNER JOIN cat_path cp ON c.id = cp.parent_id
    )
    SELECT cp.id, cp.name, cp.slug, cp.level 
    FROM cat_path cp 
    ORDER BY level DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ÖRNEK VERİLER (Test için)
-- ============================================

-- Yazarlar
INSERT INTO authors (username, email, full_name, role) VALUES
('ahmet.yilmaz', 'ahmet@example.com', 'Ahmet Yılmaz', 'editor'),
('ayse.kaya', 'ayse@example.com', 'Ayşe Kaya', 'writer'),
('mehmet.demir', 'mehmet@example.com', 'Mehmet Demir', 'writer');

-- Üst Kategoriler
INSERT INTO categories (name, slug, description, display_order) VALUES
('Haberler', 'haberler', 'Güncel haberler', 1),
('Spor', 'spor', 'Spor haberleri', 2),
('Teknoloji', 'teknoloji', 'Teknoloji haberleri', 3),
('Magazin', 'magazin', 'Magazin haberleri', 4),
('Ekonomi', 'ekonomi', 'Ekonomi haberleri', 5);

-- Alt Kategoriler (Haberler altında)
INSERT INTO categories (name, slug, description, parent_id, display_order)
SELECT 'Gündem', 'gundem', 'Gündem haberleri', id, 1
FROM categories WHERE slug = 'haberler';

INSERT INTO categories (name, slug, description, parent_id, display_order)
SELECT 'Politika', 'politika', 'Politika haberleri', id, 2
FROM categories WHERE slug = 'haberler';

INSERT INTO categories (name, slug, description, parent_id, display_order)
SELECT 'Dünya', 'dunya', 'Dünya haberleri', id, 3
FROM categories WHERE slug = 'haberler';

-- Alt Kategoriler (Spor altında)
INSERT INTO categories (name, slug, description, parent_id, display_order)
SELECT 'Futbol', 'futbol', 'Futbol haberleri', id, 1
FROM categories WHERE slug = 'spor';

INSERT INTO categories (name, slug, description, parent_id, display_order)
SELECT 'Basketbol', 'basketbol', 'Basketbol haberleri', id, 2
FROM categories WHERE slug = 'spor';

-- Alt Kategoriler (Teknoloji altında)
INSERT INTO categories (name, slug, description, parent_id, display_order)
SELECT 'Yazılım', 'yazilim', 'Yazılım haberleri', id, 1
FROM categories WHERE slug = 'teknoloji';

INSERT INTO categories (name, slug, description, parent_id, display_order)
SELECT 'Donanım', 'donanim', 'Donanım haberleri', id, 2
FROM categories WHERE slug = 'teknoloji';

INSERT INTO categories (name, slug, description, parent_id, display_order)
SELECT 'Mobil', 'mobil', 'Mobil teknoloji', id, 3
FROM categories WHERE slug = 'teknoloji';

-- Örnek Makale
INSERT INTO articles (title, slug, summary, content, status, is_featured, published_at)
VALUES (
    'PostgreSQL ile Yüksek Performanslı Veritabanı Tasarımı',
    'postgresql-yuksek-performans',
    'PostgreSQL veritabanı ile haber sitesi için optimize edilmiş şema tasarımı.',
    'Bu makalede PostgreSQL veritabanı kullanarak yüksek performanslı bir haber sitesi nasıl oluşturulur öğreneceksiniz...',
    'published',
    true,
    CURRENT_TIMESTAMP
);

-- Makale-Yazar İlişkisi
INSERT INTO article_authors (article_id, author_id, author_order)
SELECT a.id, au.id, 0
FROM articles a, authors au
WHERE a.slug = 'postgresql-yuksek-performans' AND au.username = 'ahmet.yilmaz';

-- Makale-Kategori İlişkisi
INSERT INTO article_categories (article_id, category_id, is_primary)
SELECT a.id, c.id, true
FROM articles a, categories c
WHERE a.slug = 'postgresql-yuksek-performans' AND c.slug = 'teknoloji';

INSERT INTO article_categories (article_id, category_id, is_primary)
SELECT a.id, c.id, false
FROM articles a, categories c
WHERE a.slug = 'postgresql-yuksek-performans' AND c.slug = 'yazilim';

-- ============================================
-- PERFORMANS OPTİMİZASYONU İÇİN GÖRÜNÜMLER
-- ============================================

-- Materialized View: Popüler Makaleler
CREATE MATERIALIZED VIEW popular_articles AS
SELECT 
    a.id,
    a.title,
    a.slug,
    a.featured_image,
    a.view_count,
    a.published_at,
    array_agg(DISTINCT au.full_name) as authors,
    array_agg(DISTINCT c.name) as categories
FROM articles a
LEFT JOIN article_authors aa ON a.id = aa.article_id
LEFT JOIN authors au ON aa.author_id = au.id
LEFT JOIN article_categories ac ON a.id = ac.article_id
LEFT JOIN categories c ON ac.category_id = c.id
WHERE a.status = 'published'
GROUP BY a.id
ORDER BY a.view_count DESC
LIMIT 100;

CREATE INDEX idx_popular_articles_id ON popular_articles(id);

-- Materialized View'ı yenileme fonksiyonu
CREATE OR REPLACE FUNCTION refresh_popular_articles()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY popular_articles;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERİTABANI SONLANDIRMA
-- ============================================

-- Veritabanı istatistikleri
ANALYZE;

COMMENT ON TABLE authors IS 'Yazarlar ve içerik üreticileri';
COMMENT ON TABLE categories IS 'Hiyerarşik kategori yapısı (üst-alt kategoriler)';
COMMENT ON TABLE articles IS 'Makaleler, haberler ve içerikler';
COMMENT ON TABLE article_authors IS 'Çok yazarlı makale desteği';
COMMENT ON TABLE article_categories IS 'Çok kategorili makale desteği';

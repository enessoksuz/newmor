# 🚀 PostgreSQL Performans Optimizasyon Rehberi

## 1. İndeksleme Stratejisi

### Mevcut İndeksler
Şemada zaten optimize edilmiş indeksler var:
- **B-tree indeksler**: Slug, email, username gibi unique alanlar
- **GIN indeks**: Full-text search için
- **Composite indeksler**: Birden fazla sütun kombinasyonları
- **Partial indeksler**: Sadece belirli koşullardaki veriler (WHERE clause ile)

### İndeks Bakımı
```sql
-- İndeksleri yeniden oluştur (fragmentation durumunda)
REINDEX TABLE articles;

-- İndeks boyutlarını kontrol et
SELECT 
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC;
```

## 2. Query Optimizasyonu

### EXPLAIN ANALYZE Kullanımı
```sql
-- Sorgu planını göster
EXPLAIN ANALYZE
SELECT a.* 
FROM articles a
WHERE a.status = 'published'
ORDER BY a.published_at DESC
LIMIT 20;
```

### N+1 Problem Çözümü
❌ **Kötü Yaklaşım** (Her makale için ayrı sorgu):
```sql
SELECT * FROM articles;
-- Sonra her makale için:
SELECT * FROM authors WHERE id IN (...);
```

✅ **İyi Yaklaşım** (Tek sorguda JOIN):
```sql
SELECT 
    a.*,
    json_agg(au.*) as authors
FROM articles a
LEFT JOIN article_authors aa ON a.id = aa.article_id
LEFT JOIN authors au ON aa.author_id = au.id
GROUP BY a.id;
```

## 3. Caching Stratejisi

### Redis ile Cache
```javascript
const Redis = require('ioredis');
const redis = new Redis();

// Makale cache'le (TTL: 5 dakika)
async function getArticle(slug) {
    const cacheKey = `article:${slug}`;
    
    // Önce cache'e bak
    const cached = await redis.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }
    
    // Cache'te yoksa DB'den çek
    const article = await db.query(
        'SELECT * FROM articles WHERE slug = $1',
        [slug]
    );
    
    // Cache'e kaydet (300 saniye = 5 dakika)
    await redis.setex(cacheKey, 300, JSON.stringify(article));
    
    return article;
}

// Cache temizleme (makale güncellendiğinde)
async function updateArticle(slug, data) {
    await db.query('UPDATE articles SET ... WHERE slug = $1', [slug]);
    await redis.del(`article:${slug}`);
}
```

### Cache Katmanları
```
1. Browser Cache (Static files): 1 gün
2. CDN Cache (Images, CSS, JS): 7 gün
3. Redis Cache (DB queries): 5-60 dakika
4. PostgreSQL Query Cache: Otomatik
```

## 4. Connection Pooling

### PgBouncer Kurulumu
```bash
# Ubuntu/Debian
sudo apt install pgbouncer

# Konfigürasyon (/etc/pgbouncer/pgbouncer.ini)
[databases]
haber_sitesi = host=localhost port=5432 dbname=haber_sitesi

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

### Node.js Connection Pool
```javascript
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 6432, // PgBouncer portu
    database: 'haber_sitesi',
    user: 'haber_app',
    password: 'password',
    max: 20,              // Max bağlantı sayısı
    min: 5,               // Min bağlantı sayısı
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Kullanım
async function getArticles() {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT ...');
        return result.rows;
    } finally {
        client.release(); // Önemli!
    }
}
```

## 5. Partitioning (Büyük Tablolar İçin)

### Tarih Bazlı Partitioning
```sql
-- Ana tablo (partition için)
CREATE TABLE articles_partitioned (
    id UUID DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    -- diğer kolonlar...
) PARTITION BY RANGE (published_at);

-- 2024 Partitionı
CREATE TABLE articles_2024 PARTITION OF articles_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- 2025 Partitionı
CREATE TABLE articles_2025 PARTITION OF articles_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Indeksler her partition için otomatik oluşturulur
CREATE INDEX ON articles_partitioned (published_at);
```

## 6. Materialized Views

### Popüler İçerikler için
```sql
-- View oluştur (şemada zaten var)
CREATE MATERIALIZED VIEW popular_articles AS
SELECT 
    a.id,
    a.title,
    a.slug,
    a.view_count,
    array_agg(c.name) as categories
FROM articles a
LEFT JOIN article_categories ac ON a.id = ac.article_id
LEFT JOIN categories c ON ac.category_id = c.id
WHERE a.status = 'published'
GROUP BY a.id
ORDER BY a.view_count DESC
LIMIT 100;

CREATE UNIQUE INDEX ON popular_articles (id);

-- Güncelleme (Cron job ile her saat)
REFRESH MATERIALIZED VIEW CONCURRENTLY popular_articles;
```

### Cron Job ile Otomatik Güncelleme
```bash
# /etc/cron.d/refresh-views
0 * * * * postgres psql -d haber_sitesi -c "REFRESH MATERIALIZED VIEW CONCURRENTLY popular_articles;"
```

## 7. Monitoring ve Alerting

### pg_stat_statements ile Yavaş Sorguları Bul
```sql
CREATE EXTENSION pg_stat_statements;

-- En yavaş 10 sorgu
SELECT 
    substring(query, 1, 100) as query_snippet,
    calls,
    total_exec_time / 1000 as total_seconds,
    mean_exec_time / 1000 as avg_seconds,
    max_exec_time / 1000 as max_seconds
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- En çok çalıştırılan sorgular
SELECT 
    substring(query, 1, 100) as query_snippet,
    calls,
    total_exec_time / 1000 as total_seconds
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 10;
```

### Prometheus + Grafana Monitoring
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres-exporter:
    image: wrouesnel/postgres_exporter
    environment:
      DATA_SOURCE_NAME: "postgresql://haber_app:password@postgres:5432/haber_sitesi?sslmode=disable"
    ports:
      - "9187:9187"
```

## 8. Auto-Vacuum Ayarları

```sql
-- Tablo bazlı vacuum ayarları
ALTER TABLE articles SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05,
    autovacuum_vacuum_cost_delay = 10
);

-- Manuel vacuum
VACUUM ANALYZE articles;

-- Vacuum istatistiklerini kontrol et
SELECT 
    schemaname,
    relname,
    last_vacuum,
    last_autovacuum,
    vacuum_count,
    autovacuum_count
FROM pg_stat_user_tables
WHERE schemaname = 'public';
```

## 9. Read Replicas (Yüksek Trafik İçin)

### Master-Slave Yapılandırma
```
Master (Write)
    ↓
Slave 1 (Read) ──→ Load Balancer ←── Application
Slave 2 (Read) ──↗
```

### Node.js ile Read/Write Splitting
```javascript
const masterPool = new Pool({
    host: 'master.db.example.com',
    // ... master config
});

const replicaPool = new Pool({
    host: 'replica.db.example.com',
    // ... replica config
});

// Write işlemleri master'a
async function createArticle(data) {
    return masterPool.query('INSERT INTO articles ...');
}

// Read işlemleri replica'ya
async function getArticles() {
    return replicaPool.query('SELECT * FROM articles ...');
}
```

## 10. CDN Entegrasyonu

### Cloudflare/AWS CloudFront
```
User Request
    ↓
CDN (Static files: images, CSS, JS)
    ↓ (Cache Miss)
Application Server
    ↓
Database
```

### Image Optimization
```javascript
// Cloudinary örneği
const cloudinary = require('cloudinary').v2;

// Otomatik resize ve optimize
const imageUrl = cloudinary.url('article-image.jpg', {
    width: 800,
    height: 600,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto' // WebP desteği olan browserlara WebP gönder
});
```

## 11. Database Backup Stratejisi

### 3-2-1 Yedekleme Kuralı
- **3 kopya**: Production + 2 backup
- **2 farklı ortam**: Local + Cloud
- **1 off-site**: AWS S3, Google Cloud Storage

```bash
#!/bin/bash
# Günlük yedekleme script

# Local backup
pg_dump -Fc haber_sitesi > /backup/daily_$(date +%Y%m%d).dump

# S3'e yükle
aws s3 cp /backup/daily_$(date +%Y%m%d).dump s3://my-backups/postgres/

# 30 günden eski yerel yedekleri sil
find /backup -name "*.dump" -mtime +30 -delete
```

## 12. Performans Benchmarking

### pgbench ile Test
```bash
# Veritabanı hazırlama (test için)
pgbench -i -s 50 haber_sitesi

# Performans testi (10 client, 100 transaction)
pgbench -c 10 -t 100 haber_sitesi

# Özel SQL ile test
pgbench -c 20 -T 60 -f custom_queries.sql haber_sitesi
```

## 13. Güvenlik Best Practices

```sql
-- SSL bağlantı zorla
ALTER DATABASE haber_sitesi SET ssl = on;

-- Row Level Security (RLS)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Sadece aktif yazarların makalelerini göster
CREATE POLICY author_articles ON articles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM article_authors aa
            JOIN authors au ON aa.author_id = au.id
            WHERE aa.article_id = articles.id
            AND au.is_active = true
        )
    );

-- Sensitive data için encryption
CREATE EXTENSION pgcrypto;

-- Şifre hash'leme
INSERT INTO authors (username, password_hash)
VALUES ('user', crypt('password123', gen_salt('bf')));
```

## 14. Checklist: Production'a Çıkmadan Önce

- [ ] Tüm indeksler oluşturuldu mu?
- [ ] Connection pooling kuruldu mu?
- [ ] Redis cache aktif mi?
- [ ] Yedekleme sistemi çalışıyor mu?
- [ ] Monitoring kuruldu mu?
- [ ] SSL/TLS aktif mi?
- [ ] Read replica kuruldu mu? (Yüksek trafik için)
- [ ] CDN yapılandırıldı mı?
- [ ] Load testing yapıldı mı?
- [ ] Disaster recovery planı var mı?

## 15. Performans Hedefleri

| Metrik | Hedef |
|--------|-------|
| Ana sayfa yükleme | < 1 saniye |
| Makale detay sayfası | < 500ms |
| Arama sorgusu | < 200ms |
| Database query ortalama | < 50ms |
| Concurrent users | 10,000+ |
| Requests/second | 1,000+ |

## Sonuç

Bu optimizasyonlarla:
- ✅ **100,000+ makale** sorunsuz çalışır
- ✅ **10,000+ concurrent user** desteklenir
- ✅ **Sub-second response times** sağlanır
- ✅ **99.9% uptime** garantilenir

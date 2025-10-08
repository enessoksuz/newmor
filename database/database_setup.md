# Veritabanı Kurulum Rehberi

## 🚀 PostgreSQL Kurulumu

### MacOS
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Docker ile Kurulum (Önerilen)
```bash
docker run --name haber-sitesi-db \
  -e POSTGRES_PASSWORD=secretpassword \
  -e POSTGRES_USER=haberdb \
  -e POSTGRES_DB=haber_sitesi \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  -d postgres:15-alpine
```

## 📦 Veritabanı Oluşturma

```bash
# PostgreSQL'e bağlan
psql -U postgres

# Veritabanı oluştur
CREATE DATABASE haber_sitesi WITH ENCODING 'UTF8' LC_COLLATE='tr_TR.UTF-8' LC_CTYPE='tr_TR.UTF-8';

# Veritabanına bağlan
\c haber_sitesi

# Şemayı yükle
\i database_schema.sql
```

## 🔧 PostgreSQL Konfigürasyonu (postgresql.conf)

Yüksek performans için önerilen ayarlar:

```conf
# Bellek Ayarları (16GB RAM için)
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
work_mem = 64MB

# Checkpoint Ayarları
checkpoint_completion_target = 0.9
wal_buffers = 16MB
max_wal_size = 4GB
min_wal_size = 1GB

# Query Planlayıcı
random_page_cost = 1.1  # SSD için
effective_io_concurrency = 200

# Bağlantı Ayarları
max_connections = 200
shared_preload_libraries = 'pg_stat_statements'

# Log Ayarları
logging_collector = on
log_min_duration_statement = 250ms  # Yavaş sorguları logla
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

## 📊 Performans İzleme

### pg_stat_statements Aktifleştirme
```sql
CREATE EXTENSION pg_stat_statements;

-- En yavaş sorguları görüntüle
SELECT 
    mean_exec_time,
    calls,
    query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Tablo Boyutlarını İzleme
```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 🔐 Güvenlik

```sql
-- Uygulama için özel kullanıcı oluştur
CREATE USER haber_app WITH PASSWORD 'super_secure_password_123';

-- Sadece gerekli yetkileri ver
GRANT CONNECT ON DATABASE haber_sitesi TO haber_app;
GRANT USAGE ON SCHEMA public TO haber_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO haber_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO haber_app;

-- Gelecekteki tablolar için otomatik yetki
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO haber_app;
```

## 🎯 Bağlantı String Örnekleri

### Node.js (pg)
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'haber_sitesi',
  user: 'haber_app',
  password: 'super_secure_password_123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Python (psycopg2)
```python
import psycopg2
from psycopg2 import pool

connection_pool = psycopg2.pool.SimpleConnectionPool(
    1, 20,
    host="localhost",
    database="haber_sitesi",
    user="haber_app",
    password="super_secure_password_123"
)
```

### Django
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'haber_sitesi',
        'USER': 'haber_app',
        'PASSWORD': 'super_secure_password_123',
        'HOST': 'localhost',
        'PORT': '5432',
        'CONN_MAX_AGE': 600,
    }
}
```

## 📈 Yedekleme

### Otomatik Yedekleme Script
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

pg_dump -U haber_app -h localhost haber_sitesi | gzip > \
  $BACKUP_DIR/haber_sitesi_$TIMESTAMP.sql.gz

# 7 günden eski yedekleri sil
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

### Cron Job (Her gün saat 02:00)
```bash
0 2 * * * /usr/local/bin/backup_db.sh
```

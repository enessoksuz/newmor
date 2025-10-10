#!/bin/bash

# ==============================================
# PostgreSQL Veritabanı Yedekleme Script
# ==============================================

set -e

# Renkler
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Değişkenler
DB_NAME="yenimorfikir_db"
BACKUP_DIR="/root/backups/database"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}-${DATE}.sql"
BACKUP_COMPRESSED="$BACKUP_DIR/${DB_NAME}-${DATE}.sql.gz"

echo "📦 Veritabanı Yedekleme Başlıyor..."

# Backup dizini oluştur
mkdir -p $BACKUP_DIR

# PostgreSQL yedek al
echo "Yedek alınıyor: $DB_NAME"
pg_dump -U enesoksuz $DB_NAME > $BACKUP_FILE

# Sıkıştır
gzip $BACKUP_FILE

echo -e "${GREEN}✓${NC} Yedek alındı: $BACKUP_COMPRESSED"

# Boyutu göster
SIZE=$(du -h $BACKUP_COMPRESSED | cut -f1)
echo "Dosya boyutu: $SIZE"

# Eski yedekleri sil (30 günden eski)
echo ""
echo "🗑️  Eski yedekler temizleniyor (30+ gün)..."
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
echo -e "${GREEN}✓${NC} Temizlik tamamlandı"

echo ""
echo "📊 Mevcut yedekler:"
ls -lh $BACKUP_DIR/*.sql.gz 2>/dev/null || echo "Henüz yedek yok"


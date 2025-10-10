#!/bin/bash

# ==============================================
# PostgreSQL Veritabanı Geri Yükleme Script
# ==============================================

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}Kullanım:${NC} ./restore-database.sh <backup-dosyasi.sql.gz>"
    echo ""
    echo "Mevcut yedekler:"
    ls -lh /root/backups/database/*.sql.gz 2>/dev/null || echo "Yedek bulunamadı"
    exit 1
fi

BACKUP_FILE=$1
DB_NAME="yenimorfikir_production"
DB_USER="yenimorfikir_user"

echo -e "${YELLOW}⚠️  DİKKAT:${NC} Bu işlem mevcut veritabanını silecek!"
echo "Veritabanı: $DB_NAME"
echo "Yedek Dosya: $BACKUP_FILE"
echo ""
read -p "Devam etmek istiyor musunuz? (evet/hayir): " CONFIRM

if [ "$CONFIRM" != "evet" ]; then
    echo "İşlem iptal edildi."
    exit 0
fi

echo ""
echo "📦 Veritabanı Geri Yükleme Başlıyor..."

# Önce mevcut DB'den yedek al
echo "Önce mevcut veritabanından yedek alınıyor..."
SAFETY_BACKUP="/root/backups/database/before-restore-$(date +%Y%m%d-%H%M%S).sql.gz"
pg_dump -U $DB_USER $DB_NAME | gzip > $SAFETY_BACKUP
echo -e "${GREEN}✓${NC} Güvenlik yedeği alındı: $SAFETY_BACKUP"

# Veritabanını sil ve yeniden oluştur
echo ""
echo "Veritabanı yeniden oluşturuluyor..."
dropdb -U postgres $DB_NAME 2>/dev/null || true
createdb -U postgres $DB_NAME -O $DB_USER

# Yedekten geri yükle
echo ""
echo "Yedek geri yükleniyor..."
gunzip -c $BACKUP_FILE | psql -U $DB_USER $DB_NAME

echo ""
echo -e "${GREEN}✅ Veritabanı başarıyla geri yüklendi!${NC}"


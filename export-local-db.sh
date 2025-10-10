#!/bin/bash

# ==============================================
# Yerel PostgreSQL Veritabanını Export Et
# Mac'inizde çalıştırın
# ==============================================

set -e

# Değişkenler
DB_NAME="yenimorfikir_db"
DB_USER="enesoksuz"
EXPORT_DIR="$HOME/Desktop"
DATE=$(date +%Y%m%d-%H%M%S)
EXPORT_FILE="$EXPORT_DIR/yenimorfikir-export-${DATE}.sql"
EXPORT_COMPRESSED="$EXPORT_DIR/yenimorfikir-export-${DATE}.sql.gz"

echo "📦 Yerel Veritabanı Export Ediliyor..."
echo "Veritabanı: $DB_NAME"
echo "Hedef: $EXPORT_COMPRESSED"
echo ""

# PostgreSQL export
pg_dump -U $DB_USER $DB_NAME > $EXPORT_FILE

# Sıkıştır
gzip $EXPORT_FILE

echo "✅ Export tamamlandı!"
echo ""
echo "📁 Dosya: $EXPORT_COMPRESSED"
SIZE=$(du -h $EXPORT_COMPRESSED | cut -f1)
echo "📊 Boyut: $SIZE"
echo ""
echo "📤 Sunucuya Yüklemek İçin:"
echo "scp $EXPORT_COMPRESSED root@185.85.189.244:/root/backups/database/"


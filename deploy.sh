#!/bin/bash

# ==============================================
# YeniMorFikir Deployment Script
# Sunucu: 185.85.189.244
# ==============================================

set -e  # Hata durumunda dur

echo "🚀 YeniMorFikir Deployment Başlıyor..."

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Değişkenler
PROJECT_DIR="/root/YeniMorFikir"
ADMIN_DIR="$PROJECT_DIR/admin-panel"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKUP_DIR="/root/backups/yenimorfikir"

echo -e "${GREEN}✓${NC} Proje dizini: $PROJECT_DIR"

# 1. Yedek Al
echo ""
echo "📦 Mevcut kurulum yedekleniyor..."
mkdir -p $BACKUP_DIR
BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz"

if [ -d "$PROJECT_DIR" ]; then
    tar -czf $BACKUP_FILE $PROJECT_DIR 2>/dev/null || echo "İlk kurulum, yedek alınamadı"
    echo -e "${GREEN}✓${NC} Yedek alındı: $BACKUP_FILE"
fi

# 2. Git Pull (veya Clone)
echo ""
echo "📥 Kod güncelleniyor..."
cd /root

if [ -d "$PROJECT_DIR/.git" ]; then
    echo "Git pull yapılıyor..."
    cd $PROJECT_DIR
    git pull origin main
else
    echo "Git clone yapılıyor..."
    if [ -d "$PROJECT_DIR" ]; then
        mv $PROJECT_DIR "$PROJECT_DIR.old-$(date +%Y%m%d-%H%M%S)"
    fi
    git clone https://github.com/KULLANICI_ADI/YeniMorFikir.git
    cd $PROJECT_DIR
fi

echo -e "${GREEN}✓${NC} Kod güncellendi"

# 3. Node Modules Kurulumu - Admin Panel
echo ""
echo "📦 Admin Panel dependencies kuruluyor..."
cd $ADMIN_DIR

if [ -f "package.json" ]; then
    npm install --production
    echo -e "${GREEN}✓${NC} Admin panel dependencies kuruldu"
else
    echo -e "${RED}✗${NC} Admin panel package.json bulunamadı!"
    exit 1
fi

# 4. Node Modules Kurulumu - Frontend
echo ""
echo "📦 Frontend dependencies kuruluyor..."
cd $FRONTEND_DIR

if [ -f "package.json" ]; then
    npm install --production
    echo -e "${GREEN}✓${NC} Frontend dependencies kuruldu"
else
    echo -e "${RED}✗${NC} Frontend package.json bulunamadı!"
    exit 1
fi

# 5. Environment Dosyalarını Kopyala
echo ""
echo "⚙️  Environment dosyaları kontrol ediliyor..."

if [ ! -f "$ADMIN_DIR/.env.local" ]; then
    echo -e "${YELLOW}⚠${NC}  Admin .env.local bulunamadı, şablondan kopyalanıyor..."
    cp $PROJECT_DIR/.env.production $ADMIN_DIR/.env.local
fi

if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
    echo -e "${YELLOW}⚠${NC}  Frontend .env.local bulunamadı, şablondan kopyalanıyor..."
    cp $PROJECT_DIR/.env.production $FRONTEND_DIR/.env.local
fi

echo -e "${GREEN}✓${NC} Environment dosyaları hazır"

# 6. Build - Admin Panel
echo ""
echo "🔨 Admin Panel build ediliyor..."
cd $ADMIN_DIR
npm run build
echo -e "${GREEN}✓${NC} Admin panel build tamamlandı"

# 7. Build - Frontend
echo ""
echo "🔨 Frontend build ediliyor..."
cd $FRONTEND_DIR
npm run build
echo -e "${GREEN}✓${NC} Frontend build tamamlandı"

# 8. PM2 ile Başlat/Yeniden Başlat
echo ""
echo "🔄 PM2 ile uygulamalar başlatılıyor..."

cd $PROJECT_DIR

# PM2 kurulu mu kontrol et
if ! command -v pm2 &> /dev/null; then
    echo "PM2 kuruluyor..."
    npm install -g pm2
fi

# Logs klasörü oluştur
mkdir -p $PROJECT_DIR/logs

# Eski PM2 proseslerini durdur
pm2 stop ecosystem.config.js 2>/dev/null || true
pm2 delete ecosystem.config.js 2>/dev/null || true

# Yeni prosesleri başlat
pm2 start ecosystem.config.js

# PM2'yi başlangıçta otomatik başlat
pm2 startup
pm2 save

echo -e "${GREEN}✓${NC} PM2 prosesleri başlatıldı"

# 9. Status Göster
echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo -e "${GREEN}✅ DEPLOYMENT TAMAMLANDI!${NC}"
echo ""
echo "📝 Notlar:"
echo "  - Admin Panel: http://185.85.189.244:3000"
echo "  - Frontend: http://185.85.189.244:3001"
echo "  - PM2 Status: pm2 status"
echo "  - PM2 Logs: pm2 logs"
echo "  - PM2 Restart: pm2 restart all"
echo ""
echo "⚠️  NGINX/Apache yapılandırması için nginx-config.conf dosyasına bakın"
echo ""


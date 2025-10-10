#!/bin/bash

# ==============================================
# SUNUCUDA ÇALIŞTIR - Otomatik Kurulum
# Bu dosyayı sunucuda root olarak çalıştırın
# ==============================================

echo "🚀 YeniMorFikir - Otomatik Sunucu Kurulumu"
echo "=========================================="
echo ""
echo "Sunucu: 185.85.189.244"
echo "Kullanıcı: root"
echo ""
read -p "Devam etmek için ENTER'a basın..."

set -e  # Hata durumunda dur

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==============================================
# ADIM 1: SİSTEM GÜNCELLEMESİ
# ==============================================
echo ""
echo -e "${BLUE}ADIM 1/7: Sistem güncelleniyor...${NC}"
apt update && apt upgrade -y
echo -e "${GREEN}✓${NC} Sistem güncellendi"

# ==============================================
# ADIM 2: GEREKLI YAZILIMLARI KUR
# ==============================================
echo ""
echo -e "${BLUE}ADIM 2/7: Gerekli yazılımlar kuruluyor...${NC}"

# Node.js 20.x
echo "📦 Node.js kuruluyor..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
echo -e "${GREEN}✓${NC} Node.js $(node --version) kuruldu"

# PostgreSQL
echo "📦 PostgreSQL kuruluyor..."
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
echo -e "${GREEN}✓${NC} PostgreSQL kuruldu"

# NGINX
echo "📦 NGINX kuruluyor..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx
echo -e "${GREEN}✓${NC} NGINX kuruldu"

# Git
echo "📦 Git kuruluyor..."
apt install -y git
echo -e "${GREEN}✓${NC} Git kuruldu"

# PM2
echo "📦 PM2 kuruluyor..."
npm install -g pm2
pm2 startup systemd -u root --hp /root
echo -e "${GREEN}✓${NC} PM2 kuruldu"

# Firewall
echo "🔥 Firewall ayarlanıyor..."
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw --force enable
echo -e "${GREEN}✓${NC} Firewall ayarlandı"

# ==============================================
# ADIM 3: POSTGRESQL KURULUMU
# ==============================================
echo ""
echo -e "${BLUE}ADIM 3/7: PostgreSQL veritabanı oluşturuluyor...${NC}"

# Güvenli şifre oluştur
DB_PASSWORD=$(openssl rand -base64 16)

# PostgreSQL kullanıcısı ve veritabanı oluştur
sudo -u postgres psql << EOF
CREATE USER yenimorfikir_user WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE yenimorfikir_production OWNER yenimorfikir_user;
GRANT ALL PRIVILEGES ON DATABASE yenimorfikir_production TO yenimorfikir_user;
\q
EOF

echo -e "${GREEN}✓${NC} Veritabanı oluşturuldu"
echo ""
echo -e "${YELLOW}ÖNEMLİ: Veritabanı şifreniz:${NC}"
echo "DB_PASSWORD=$DB_PASSWORD"
echo ""
echo "Bu şifreyi kaydedin! .env dosyasında kullanacaksınız."
echo "$DB_PASSWORD" > /root/db_password.txt
echo "Şifre ayrıca /root/db_password.txt dosyasına kaydedildi."
echo ""
read -p "Devam etmek için ENTER'a basın..."

# ==============================================
# ADIM 4: PROJE KLONLAMA
# ==============================================
echo ""
echo -e "${BLUE}ADIM 4/7: Proje GitHub'dan çekiliyor...${NC}"

cd /root

# Eğer proje varsa yedekle
if [ -d "YeniMorFikir" ]; then
    echo "Mevcut proje yedekleniyor..."
    mv YeniMorFikir "YeniMorFikir.backup.$(date +%Y%m%d-%H%M%S)"
fi

# GitHub'dan klonla
git clone https://github.com/enessoksuz/newmor.git YeniMorFikir
cd YeniMorFikir

echo -e "${GREEN}✓${NC} Proje klonlandı"

# ==============================================
# ADIM 5: ENVIRONMENT DOSYALARI
# ==============================================
echo ""
echo -e "${BLUE}ADIM 5/7: Environment dosyaları ayarlanıyor...${NC}"

# JWT Secret oluştur
JWT_SECRET=$(openssl rand -base64 32)

# Admin Panel .env.local
cat > /root/YeniMorFikir/admin-panel/.env.local << EOF
# Database Configuration
DATABASE_URL=postgresql://yenimorfikir_user:${DB_PASSWORD}@localhost:5432/yenimorfikir_production

# PostgreSQL Config
PGHOST=localhost
PGPORT=5432
PGDATABASE=yenimorfikir_production
PGUSER=yenimorfikir_user
PGPASSWORD=${DB_PASSWORD}

# App Config
NEXT_PUBLIC_APP_NAME=YeniMorFikir Admin
NEXT_PUBLIC_APP_URL=http://185.85.189.244:3000

# Authentication
JWT_SECRET=${JWT_SECRET}

# Node Environment
NODE_ENV=production
PORT=3000
EOF

# Frontend .env.local
cat > /root/YeniMorFikir/frontend/.env.local << EOF
# Database Configuration
DATABASE_URL=postgresql://yenimorfikir_user:${DB_PASSWORD}@localhost:5432/yenimorfikir_production

# PostgreSQL Config
PGHOST=localhost
PGPORT=5432
PGDATABASE=yenimorfikir_production
PGUSER=yenimorfikir_user
PGPASSWORD=${DB_PASSWORD}

# App Config
NEXT_PUBLIC_APP_NAME=YeniMorFikir
NEXT_PUBLIC_APP_URL=http://185.85.189.244:3001

# Node Environment
NODE_ENV=production
PORT=3001
EOF

echo -e "${GREEN}✓${NC} Environment dosyaları oluşturuldu"
echo ""
echo -e "${YELLOW}JWT Secret:${NC} $JWT_SECRET"
echo "JWT Secret /root/jwt_secret.txt dosyasına kaydedildi."
echo "$JWT_SECRET" > /root/jwt_secret.txt
echo ""

# ==============================================
# ADIM 6: DEPLOYMENT
# ==============================================
echo ""
echo -e "${BLUE}ADIM 6/7: Uygulama deploy ediliyor...${NC}"
echo "Bu işlem 5-10 dakika sürebilir..."
echo ""

cd /root/YeniMorFikir
chmod +x deploy.sh
./deploy.sh

echo -e "${GREEN}✓${NC} Deployment tamamlandı"

# ==============================================
# ADIM 7: NGINX KONFİGÜRASYONU
# ==============================================
echo ""
echo -e "${BLUE}ADIM 7/7: NGINX yapılandırılıyor...${NC}"

# Default config'i yedekle
if [ -f "/etc/nginx/sites-available/default" ]; then
    mv /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
fi

# Basit reverse proxy config oluştur (IP bazlı)
cat > /etc/nginx/sites-available/yenimorfikir << 'NGINX_EOF'
# Admin Panel (Port 80)
server {
    listen 80;
    server_name 185.85.189.244;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend (Port 8080)
server {
    listen 8080;
    server_name 185.85.189.244;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

# Symlink oluştur
ln -sf /etc/nginx/sites-available/yenimorfikir /etc/nginx/sites-enabled/yenimorfikir

# Default symlink'i kaldır
rm -f /etc/nginx/sites-enabled/default

# NGINX test et
nginx -t

# NGINX restart
systemctl restart nginx

echo -e "${GREEN}✓${NC} NGINX yapılandırıldı"

# Firewall'da 8080 portunu aç
ufw allow 8080

# ==============================================
# TAMAMLANDI!
# ==============================================
echo ""
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                               ║${NC}"
echo -e "${GREEN}║   ✅  KURULUM BAŞARIYLA TAMAMLANDI!          ║${NC}"
echo -e "${GREEN}║                                               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📝 ÖNEMLİ BİLGİLER:${NC}"
echo ""
echo "🌐 Admin Panel:"
echo "   http://185.85.189.244"
echo ""
echo "🌐 Frontend (Public Site):"
echo "   http://185.85.189.244:8080"
echo ""
echo "🔑 Veritabanı Bilgileri:"
echo "   Host: localhost"
echo "   Database: yenimorfikir_production"
echo "   User: yenimorfikir_user"
echo "   Password: (kayıtlı /root/db_password.txt)"
echo "   → cat /root/db_password.txt"
echo ""
echo "🔐 JWT Secret:"
echo "   → cat /root/jwt_secret.txt"
echo ""
echo "📊 PM2 Yönetimi:"
echo "   pm2 status          # Uygulama durumu"
echo "   pm2 logs            # Logları görüntüle"
echo "   pm2 restart all     # Uygulamaları yeniden başlat"
echo "   pm2 monit           # Monitoring"
echo ""
echo "🔧 Faydalı Komutlar:"
echo "   systemctl status nginx       # NGINX durumu"
echo "   systemctl status postgresql  # PostgreSQL durumu"
echo "   nginx -t                     # NGINX config test"
echo ""
echo -e "${YELLOW}⚠️  YAPILACAKLAR:${NC}"
echo ""
echo "1. Admin panele gidin ve ilk kullanıcıyı oluşturun"
echo "2. Yerel veritabanınızı import edin (opsiyonel)"
echo "3. Domain varsa NGINX config'i güncelleyin"
echo "4. SSL sertifikası kurun (Let's Encrypt)"
echo ""
echo -e "${YELLOW}📖 Detaylı bilgi için:${NC}"
echo "   cat /root/YeniMorFikir/DEPLOYMENT_REHBERI.md"
echo ""
echo -e "${GREEN}İyi çalışmalar! 🚀${NC}"
echo ""


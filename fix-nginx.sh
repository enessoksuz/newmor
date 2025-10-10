#!/bin/bash

# ==============================================
# NGINX Port Çakışması Düzeltme Script
# Sunucuda root olarak çalıştırın
# ==============================================

echo "🔧 NGINX Port Çakışması Düzeltiliyor..."
echo ""

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Port 80'i kim kullanıyor kontrol et
echo -e "${BLUE}1. Port 80 kontrolü...${NC}"
echo "Port 80'i kullanan servisler:"
netstat -tulpn | grep :80 || echo "Port 80 boş"
echo ""

# 2. cPanel/WHM Apache'yi durdur
echo -e "${BLUE}2. cPanel Apache durduruluyor...${NC}"
if [ -f "/scripts/restartsrv_httpd" ]; then
    /scripts/restartsrv_httpd --stop
    echo -e "${GREEN}✓${NC} Apache durduruldu"
else
    echo -e "${YELLOW}⚠${NC} cPanel Apache script bulunamadı, standart yöntemle durdur uluyor..."
    systemctl stop httpd 2>/dev/null || systemctl stop apache2 2>/dev/null || echo "Apache bulunamadı"
fi
echo ""

# 3. Basit NGINX Config Oluştur (Port 8080 ve 8081)
echo -e "${BLUE}3. NGINX konfigürasyonu oluşturuluyor...${NC}"

# Mevcut config'i yedekle
if [ -f "/etc/nginx/sites-available/yenimorfikir" ]; then
    cp /etc/nginx/sites-available/yenimorfikir /etc/nginx/sites-available/yenimorfikir.backup-$(date +%Y%m%d-%H%M%S)
fi

# Yeni config oluştur
cat > /etc/nginx/sites-available/yenimorfikir << 'EOF'
# YeniMorFikir - Admin Panel (Port 8080)
server {
    listen 8080;
    server_name 185.85.189.244;

    access_log /var/log/nginx/yenimorfikir-admin-access.log;
    error_log /var/log/nginx/yenimorfikir-admin-error.log;

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
        
        # Timeout
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# YeniMorFikir - Frontend (Port 8081)
server {
    listen 8081;
    server_name 185.85.189.244;

    access_log /var/log/nginx/yenimorfikir-frontend-access.log;
    error_log /var/log/nginx/yenimorfikir-frontend-error.log;

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
        
        # Timeout
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Statik dosyalar için cache
    location /_next/static {
        proxy_pass http://localhost:3001;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
EOF

echo -e "${GREEN}✓${NC} NGINX config oluşturuldu"
echo ""

# 4. Symlink oluştur
echo -e "${BLUE}4. NGINX config aktifleştiriliyor...${NC}"
ln -sf /etc/nginx/sites-available/yenimorfikir /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
echo -e "${GREEN}✓${NC} Config aktifleştirildi"
echo ""

# 5. NGINX config test et
echo -e "${BLUE}5. NGINX config test ediliyor...${NC}"
nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} NGINX config geçerli"
else
    echo -e "${RED}✗${NC} NGINX config hatası! Script durduruluyor."
    exit 1
fi
echo ""

# 6. NGINX'i başlat
echo -e "${BLUE}6. NGINX başlatılıyor...${NC}"
systemctl start nginx

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} NGINX başlatıldı"
else
    echo -e "${RED}✗${NC} NGINX başlatılamadı!"
    echo "Detaylı hata için: journalctl -xeu nginx.service"
    exit 1
fi
echo ""

# 7. Firewall portları aç
echo -e "${BLUE}7. Firewall portları açılıyor...${NC}"
ufw allow 8080/tcp
ufw allow 8081/tcp
echo -e "${GREEN}✓${NC} Portlar açıldı (8080, 8081)"
echo ""

# 8. Status göster
echo -e "${BLUE}8. NGINX durumu:${NC}"
systemctl status nginx --no-pager | head -20
echo ""

# 9. Port dinleme kontrolü
echo -e "${BLUE}9. Port kontrolü:${NC}"
netstat -tulpn | grep -E ':(8080|8081|3000|3001)'
echo ""

# SONUÇ
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                               ║${NC}"
echo -e "${GREEN}║     ✅  NGINX BAŞARIYLA YAPILANDI!           ║${NC}"
echo -e "${GREEN}║                                               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📝 ÖNEMLİ:${NC}"
echo ""
echo "🌐 Siteleriniz şimdi şu adreslerden erişilebilir:"
echo ""
echo "   Admin Panel:  http://185.85.189.244:8080"
echo "   Frontend:     http://185.85.189.244:8081"
echo ""
echo -e "${YELLOW}⚠️  DİKKAT:${NC}"
echo "   Next.js uygulamaları henüz başlatılmadı!"
echo "   PM2 ile başlatmak için:"
echo ""
echo "   cd /root/YeniMorFikir"
echo "   ./deploy.sh"
echo ""
echo -e "${BLUE}📊 Faydalı Komutlar:${NC}"
echo "   systemctl status nginx     # NGINX durumu"
echo "   nginx -t                   # Config test"
echo "   systemctl restart nginx    # NGINX restart"
echo "   netstat -tulpn | grep 80   # Port kontrolü"
echo ""


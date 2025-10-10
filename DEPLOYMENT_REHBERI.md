# 🚀 YeniMorFikir - Sunucuya Deployment Rehberi

**Sunucu IP:** 185.85.189.244  
**Kullanıcı:** root  
**Port:** 22

---

## 📋 İÇİNDEKİLER

1. [Ön Hazırlık (Mac'inizde)](#1-ön-hazırlık-macinizde)
2. [Sunucuya İlk Bağlantı](#2-sunucuya-i̇lk-bağlantı)
3. [Sunucu Kurulumu](#3-sunucu-kurulumu)
4. [Veritabanı Kurulumu](#4-veritabanı-kurulumu)
5. [Proje Deployment](#5-proje-deployment)
6. [NGINX Konfigürasyonu](#6-nginx-konfigürasyonu)
7. [SSL Kurulumu (HTTPS)](#7-ssl-kurulumu-https)
8. [Test ve Kontrol](#8-test-ve-kontrol)
9. [Bakım ve Güncelleme](#9-bakım-ve-güncelleme)

---

## 1. ÖN HAZIRLIK (Mac'inizde)

### Adım 1.1: Veritabanını Export Edin

```bash
cd /Users/enesoksuz/YeniMorFikir
./export-local-db.sh
```

Bu komut veritabanınızı Desktop'a export edecek.

### Adım 1.2: Projeyi GitHub'a Push Edin

```bash
cd /Users/enesoksuz/YeniMorFikir

# Tüm dosyaları commit edin
git add .
git commit -m "Production deployment hazırlığı"
git push origin main
```

**ÖNEMLİ:** GitHub reponuz private ise, sunucuya SSH key eklemeniz gerekecek.

---

## 2. SUNUCUYA İLK BAĞLANTI

### Adım 2.1: SSH ile Bağlanın

Mac'inizde Terminal açın:

```bash
ssh root@185.85.189.244
```

İlk bağlantıda "yes" yazın, şifrenizi girin.

### Adım 2.2: Sunucu Bilgilerini Kontrol Edin

```bash
# OS versiyonu
cat /etc/os-release

# Mevcut yazılımlar
node --version
npm --version
psql --version
nginx -v
```

---

## 3. SUNUCU KURULUMU

### Adım 3.1: Sistemi Güncelleyin

```bash
# Ubuntu/Debian için
apt update && apt upgrade -y

# CentOS/AlmaLinux için
yum update -y
```

### Adım 3.2: Node.js Kurun (v20 LTS)

```bash
# NodeSource reposunu ekle
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Node.js kur
apt install -y nodejs

# Kontrol et
node --version  # v20.x.x olmalı
npm --version
```

### Adım 3.3: PostgreSQL Kurun

```bash
# PostgreSQL 16 kur (Ubuntu/Debian)
apt install -y postgresql postgresql-contrib

# Servisi başlat
systemctl start postgresql
systemctl enable postgresql

# Kontrol et
systemctl status postgresql
```

### Adım 3.4: NGINX Kurun

```bash
# NGINX kur
apt install -y nginx

# Başlat
systemctl start nginx
systemctl enable nginx

# Firewall'da port aç
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw enable
```

### Adım 3.5: PM2 Kurun (Process Manager)

```bash
npm install -g pm2

# PM2'yi başlangıçta otomatik başlat
pm2 startup systemd -u root --hp /root
```

### Adım 3.6: Git Kurun

```bash
apt install -y git

# Git config (opsiyonel)
git config --global user.name "Enes Oksuz"
git config --global user.email "your@email.com"
```

---

## 4. VERİTABANI KURULUMU

### Adım 4.1: PostgreSQL Kullanıcısı ve Veritabanı Oluşturun

```bash
# PostgreSQL'e root olarak giriş
sudo -u postgres psql

# PostgreSQL içinde şu komutları çalıştırın:
```

```sql
-- Kullanıcı oluştur
CREATE USER yenimorfikir_user WITH PASSWORD 'GUVENLI_SIFRE_BURAYA';

-- Veritabanı oluştur
CREATE DATABASE yenimorfikir_production OWNER yenimorfikir_user;

-- Yetkileri ver
GRANT ALL PRIVILEGES ON DATABASE yenimorfikir_production TO yenimorfikir_user;

-- Çık
\q
```

### Adım 4.2: PostgreSQL Uzaktan Erişim (Opsiyonel)

Sadece dışardan bağlanmak isterseniz:

```bash
# pg_hba.conf düzenle
nano /etc/postgresql/16/main/pg_hba.conf

# En alta ekle:
# host    all             all             0.0.0.0/0               md5

# postgresql.conf düzenle
nano /etc/postgresql/16/main/postgresql.conf

# Şu satırı bulun ve değiştirin:
# listen_addresses = 'localhost'  →  listen_addresses = '*'

# PostgreSQL'i restart edin
systemctl restart postgresql
```

### Adım 4.3: Yerel Veritabanınızı Sunucuya Yükleyin

**Mac'inizde:**

```bash
# Desktop'taki export dosyasını sunucuya yükleyin
scp ~/Desktop/yenimorfikir-export-*.sql.gz root@185.85.189.244:/root/
```

**Sunucuda:**

```bash
# Root dizinine gidin
cd /root

# Backup klasörü oluşturun
mkdir -p /root/backups/database

# Export dosyasını buraya taşıyın
mv yenimorfikir-export-*.sql.gz /root/backups/database/

# Veritabanına import edin
gunzip -c /root/backups/database/yenimorfikir-export-*.sql.gz | psql -U yenimorfikir_user yenimorfikir_production

# Kontrol edin
psql -U yenimorfikir_user yenimorfikir_production -c "\dt"
```

---

## 5. PROJE DEPLOYMENT

### Adım 5.1: GitHub'dan Projeyi Çekin

```bash
cd /root

# Private repo için SSH key (gerekirse)
ssh-keygen -t rsa -b 4096 -C "your@email.com"
cat ~/.ssh/id_rsa.pub
# Bu public key'i GitHub Settings > SSH Keys'e ekleyin

# Projeyi clone edin
git clone https://github.com/KULLANICI_ADI/YeniMorFikir.git

cd YeniMorFikir
```

### Adım 5.2: Environment Dosyalarını Düzenleyin

```bash
# Admin Panel için
cd /root/YeniMorFikir/admin-panel
cp ../.env.production .env.local

# .env.local'i düzenleyin
nano .env.local
```

**Düzenlenecek yerler:**

```env
# Veritabanı şifresini girin
DATABASE_URL=postgresql://yenimorfikir_user:GERCEK_SIFRE@localhost:5432/yenimorfikir_production
PGPASSWORD=GERCEK_SIFRE

# Domain adınızı girin
NEXT_PUBLIC_APP_URL=https://admin.yenimorfikir.com

# JWT Secret oluşturun (random 32+ karakter)
JWT_SECRET=BURAYA_COK_UZUN_RANDOM_STRING
```

**JWT Secret oluşturmak için:**

```bash
openssl rand -base64 32
```

**Frontend için de aynı işlemi yapın:**

```bash
cd /root/YeniMorFikir/frontend
cp ../.env.production .env.local
nano .env.local
```

### Adım 5.3: Otomatik Deployment Script'i Çalıştırın

```bash
cd /root/YeniMorFikir

# Script'i çalıştırılabilir yapın
chmod +x deploy.sh

# Deploy edin!
./deploy.sh
```

Bu script:
- ✅ Dependencies'leri kurar
- ✅ Build alır
- ✅ PM2 ile başlatır
- ✅ Otomatik restart ayarlar

### Adım 5.4: PM2 Status Kontrol

```bash
pm2 status

# Şöyle görünmeli:
# ┌────┬────────────────────────┬─────────┬─────────┐
# │ id │ name                   │ status  │ cpu     │
# ├────┼────────────────────────┼─────────┼─────────┤
# │ 0  │ yenimorfikir-admin     │ online  │ 0%      │
# │ 1  │ yenimorfikir-frontend  │ online  │ 0%      │
# └────┴────────────────────────┴─────────┴─────────┘

# Logları görmek için
pm2 logs

# Belirli bir uygulamanın logları
pm2 logs yenimorfikir-admin
```

---

## 6. NGINX KONFIGÜRASYONU

### Adım 6.1: NGINX Config Dosyasını Oluşturun

```bash
# Mevcut default config'i yedekleyin
mv /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Yeni config'i kopyalayın
cp /root/YeniMorFikir/nginx-config.conf /etc/nginx/sites-available/yenimorfikir

# Symlink oluşturun
ln -s /etc/nginx/sites-available/yenimorfikir /etc/nginx/sites-enabled/

# Test edin
nginx -t

# Başarılıysa restart edin
systemctl restart nginx
```

### Adım 6.2: Domain Ayarları

Domain'inizin DNS ayarlarından A kaydı ekleyin:

```
Tip: A
Host: @ (veya www)
Value: 185.85.189.244
TTL: 3600

Tip: A
Host: admin
Value: 185.85.189.244
TTL: 3600
```

DNS yayılması 5-30 dakika sürebilir.

---

## 7. SSL KURULUMU (HTTPS)

### Adım 7.1: Certbot Kurun (Let's Encrypt)

```bash
# Certbot kur
apt install -y certbot python3-certbot-nginx

# SSL sertifikası al
certbot --nginx -d yenimorfikir.com -d www.yenimorfikir.com -d admin.yenimorfikir.com

# E-posta girin, şartları kabul edin
# Certbot otomatik NGINX'i yapılandıracak
```

### Adım 7.2: Otomatik Yenileme

```bash
# Test edin
certbot renew --dry-run

# Otomatik yenileme zaten aktif (cron/systemd timer ile)
systemctl status certbot.timer
```

---

## 8. TEST VE KONTROL

### Adım 8.1: Siteleri Kontrol Edin

Tarayıcınızda açın:

- **Admin Panel:** https://admin.yenimorfikir.com
- **Frontend:** https://yenimorfikir.com

### Adım 8.2: Sunucu Durumu

```bash
# PM2 status
pm2 status

# NGINX status
systemctl status nginx

# PostgreSQL status
systemctl status postgresql

# Disk kullanımı
df -h

# RAM kullanımı
free -h

# CPU kullanımı
top
```

### Adım 8.3: Logları İzleyin

```bash
# PM2 logs (canlı)
pm2 logs

# NGINX access log
tail -f /var/log/nginx/yenimorfikir-frontend-access.log

# NGINX error log
tail -f /var/log/nginx/yenimorfikir-frontend-error.log

# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-16-main.log
```

---

## 9. BAKIM VE GÜNCELLEME

### Günlük Komutlar

```bash
# PM2 yeniden başlat
pm2 restart all

# NGINX yeniden başlat
systemctl restart nginx

# PostgreSQL yeniden başlat
systemctl restart postgresql

# Tüm servisleri restart
pm2 restart all && systemctl restart nginx
```

### Kod Güncellemeleri

```bash
cd /root/YeniMorFikir

# Git pull
git pull origin main

# Deploy script'i çalıştır
./deploy.sh
```

### Veritabanı Yedeği

```bash
cd /root/YeniMorFikir

# Manuel yedek
./backup-database.sh

# Otomatik yedek (cron ile - günlük 3:00'te)
crontab -e

# Şu satırı ekleyin:
0 3 * * * /root/YeniMorFikir/backup-database.sh >> /root/backups/cron.log 2>&1
```

### Monitoring

```bash
# PM2 monitoring (web interface)
pm2 web

# Browser'da: http://185.85.189.244:9615

# PM2 Monit (terminal)
pm2 monit
```

---

## 🆘 SORUN GİDERME

### Uygulama Çalışmıyor

```bash
# PM2 loglarına bakın
pm2 logs

# Environment dosyasını kontrol edin
cat /root/YeniMorFikir/admin-panel/.env.local

# Port çakışması kontrolü
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

# PM2'yi sıfırdan başlatın
pm2 stop all
pm2 delete all
cd /root/YeniMorFikir
pm2 start ecosystem.config.js
```

### NGINX Hatası

```bash
# Config testi
nginx -t

# Error loguna bakın
tail -50 /var/log/nginx/error.log

# NGINX restart
systemctl restart nginx
```

### Veritabanı Bağlantı Hatası

```bash
# PostgreSQL çalışıyor mu?
systemctl status postgresql

# Şifreyi kontrol edin
psql -U yenimorfikir_user -d yenimorfikir_production

# Connection limiti artırın
sudo nano /etc/postgresql/16/main/postgresql.conf
# max_connections = 100  →  max_connections = 200

sudo systemctl restart postgresql
```

### Site Yavaş Çalışıyor

```bash
# RAM kontrolü
free -h

# CPU kontrolü
top

# Node.js memory artır (ecosystem.config.js)
max_memory_restart: '1G'  # 500M'den artır

# PM2 restart
pm2 restart all
```

---

## 📞 HIZLI BAŞVURU

### Sunucu Bilgileri

```
IP: 185.85.189.244
SSH: ssh root@185.85.189.244
Port: 22
```

### Servis Portları

```
Admin Panel: 3000 (internal)
Frontend: 3001 (internal)
NGINX: 80, 443
PostgreSQL: 5432
```

### Önemli Klasörler

```
Proje: /root/YeniMorFikir
Loglar: /root/YeniMorFikir/logs
Yedekler: /root/backups
NGINX Config: /etc/nginx/sites-available/yenimorfikir
SSL Sertifikalar: /etc/letsencrypt/live/
```

### Faydalı Komutlar

```bash
# Hızlı restart
pm2 restart all

# Deployment
cd /root/YeniMorFikir && ./deploy.sh

# Yedek al
./backup-database.sh

# Logları izle
pm2 logs

# Server durumu
pm2 status && systemctl status nginx
```

---

## ✅ DEPLOYMENT CHECKLIST

Deployment öncesi kontrol listesi:

- [ ] Yerel veritabanı export edildi
- [ ] Kod GitHub'a push edildi
- [ ] Sunucuya SSH bağlantısı yapıldı
- [ ] Node.js kuruldu
- [ ] PostgreSQL kuruldu
- [ ] NGINX kuruldu
- [ ] PM2 kuruldu
- [ ] Veritabanı oluşturuldu
- [ ] Veritabanı import edildi
- [ ] Proje clone edildi
- [ ] .env.local dosyaları düzenlendi
- [ ] deploy.sh çalıştırıldı
- [ ] PM2 status kontrol edildi
- [ ] NGINX config yapıldı
- [ ] Domain DNS ayarlandı
- [ ] SSL kuruldu
- [ ] Siteler test edildi
- [ ] Yedek alındı

---

**🎉 Başarılar dilerim! Sorun yaşarsanız benimle iletişime geçebilirsiniz.**


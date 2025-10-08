# YeniMorFikir

Modern, hızlı ve SEO-odaklı çok yazarlı haber/blog platformu.

## 🚀 Özellikler

### Admin Panel
- ✅ Makale Yönetimi (CRUD, çoklu yazar, çoklu kategori)
- ✅ Kategori Yönetimi (hiyerarşik yapı)
- ✅ Yazar Yönetimi (avatar, biyografi)
- ✅ Medya Yönetimi (görsel yükleme, kütüphane)
- ✅ Gelişmiş Filtreleme (durum, kategori, yazar, tarih)
- ✅ Toplu İşlemler (seçim, yayınlama, silme, öne çıkarma)
- ✅ Rich Text Editor (HTML desteği)
- ✅ SEO Metadata yönetimi

### Veritabanı
- PostgreSQL
- Hiyerarşik kategori yapısı
- Çoklu yazar desteği
- Medya yönetimi
- SEO metadata
- Görüntülenme sayacı

## 📦 Teknolojiler

- **Backend:** Next.js 15 API Routes
- **Frontend (Admin):** React 19, TypeScript, Tailwind CSS
- **Database:** PostgreSQL
- **ORM:** pg (node-postgres)
- **Migration:** WordPress REST API

## 🛠️ Kurulum

### 1. Veritabanı Kurulumu

```bash
# PostgreSQL'i başlat
brew services start postgresql@14

# Veritabanını oluştur
createdb yenimorfikir_db

# Şemayı yükle
psql yenimorfikir_db < database_schema.sql
```

### 2. Admin Panel Kurulumu

```bash
cd admin-panel
npm install
```

### 3. Çevre Değişkenleri

`.env.local` dosyası oluşturun:

```env
DATABASE_URL=postgresql://enesoksuz@localhost:5432/yenimorfikir_db
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 4. Çalıştırma

```bash
npm run dev
```

Admin panel: http://localhost:3000

## 📁 Proje Yapısı

```
YeniMorFikir/
├── admin-panel/           # Next.js admin panel
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── articles/     # Makale yönetimi
│   │   ├── categories/   # Kategori yönetimi
│   │   ├── authors/      # Yazar yönetimi
│   │   └── media/        # Medya yönetimi
│   ├── components/       # React bileşenleri
│   └── lib/             # Utility fonksiyonlar
├── database_schema.sql   # PostgreSQL şema
└── migrate_wordpress.py  # WordPress migration script
```

## 🔄 WordPress'ten Migration

```bash
# İlk migration (içerik + yazarlar + kategoriler)
python3 migrate_wordpress.py

# Resim migration
python3 migrate_images.py
```

## 📊 Veritabanı İstatistikleri

- **Makaleler:** 2,453 adet
- **Kategoriler:** 43 adet (hiyerarşik)
- **Yazarlar:** 34 adet
- **Medya:** 1,119 resim

## 🎨 Özellikler

### Makale Yönetimi
- Çoklu yazar desteği
- Çoklu kategori ataması
- HTML rich text editor
- Öne çıkan makale
- Yayın/Taslak durumu
- SEO metadata (title, description, keywords)

### Kategori Yönetimi
- Üst-alt kategori yapısı (sınırsız seviye)
- SEO metadata
- Sıralama (display_order)
- HTML açıklama desteği

### Medya Yönetimi
- Görsel yükleme (max 5MB)
- Desteklenen formatlar: JPEG, PNG, GIF, WebP
- Alt text desteği
- Filtreleme ve arama
- Editör entegrasyonu

### Gelişmiş Özellikler
- Durum bazlı filtreleme
- Kategori bazlı filtreleme
- Yazar bazlı filtreleme
- Tarih aralığı filtreleme
- Toplu yayınlama/taslak yapma
- Toplu öne çıkarma/kaldırma
- Toplu silme

## 🔐 Güvenlik

- SQL Injection koruması (parametreli sorgular)
- Transaction desteği (veri bütünlüğü)
- Dosya tipi doğrulaması
- Dosya boyutu sınırlaması (5MB)

## 📝 Lisans

Özel proje - Tüm hakları saklıdır.

## 👨‍💻 Geliştirici

Enes Öksüz

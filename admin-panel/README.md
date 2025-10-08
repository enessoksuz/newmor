# YeniMorFikir Admin Panel

Modern ve hızlı içerik yönetim sistemi. Next.js 14, React, TypeScript ve Tailwind CSS ile geliştirildi.

## 🚀 Özellikler

- ✅ **Kategoriler Yönetimi** - Hiyerarşik kategori yapısı (üst-alt kategoriler)
- ✅ **Yazarlar Yönetimi** - Yazar profilleri ve makale istatistikleri  
- ✅ **Makaleler Yönetimi** - Tam özellikli makale editörü
- ✅ **SEO Optimizasyonu** - Her içerik için meta title, description
- ✅ **Real-time Updates** - Anında veritabanı güncellemeleri
- ✅ **Responsive Design** - Mobil ve desktop uyumlu
- ✅ **PostgreSQL Backend** - Yüksek performanslı veritabanı

## 📋 Gereksinimler

- Node.js 18+ 
- PostgreSQL 15+
- npm veya yarn

## 🛠️ Kurulum

### 1. Bağımlılıkları Yükle

\`\`\`bash
cd ~/YeniMorFikir/admin-panel
npm install
\`\`\`

### 2. Environment Dosyasını Ayarla

`.env.local` dosyası zaten hazır. Gerekirse veritabanı bilgilerinizi güncelleyin:

\`\`\`env
PGHOST=localhost
PGPORT=5432
PGDATABASE=yenimorfikir_db
PGUSER=enesoksuz
PGPASSWORD=
\`\`\`

### 3. PostgreSQL'in Çalıştığından Emin Olun

\`\`\`bash
brew services start postgresql@15
\`\`\`

### 4. Development Server'ı Başlat

\`\`\`bash
npm run dev
\`\`\`

Admin panel şu adreste açılacak: **http://localhost:3000**

## 📁 Proje Yapısı

\`\`\`
admin-panel/
├── app/
│   ├── api/              # API Routes
│   │   ├── categories/   # Kategori CRUD
│   │   ├── authors/      # Yazar CRUD  
│   │   └── articles/     # Makale CRUD
│   ├── categories/       # Kategori sayfaları
│   ├── authors/          # Yazar sayfaları
│   ├── articles/         # Makale sayfaları
│   └── page.tsx          # Dashboard
├── components/
│   └── AdminLayout.tsx   # Ana layout
├── lib/
│   └── db.ts             # PostgreSQL bağlantısı
└── public/
    └── logo.svg          # Morfikirler logosu
\`\`\`

## 🎯 Kullanım

### Dashboard
- Toplam içerik istatistikleri
- Hızlı durum özeti

### Kategoriler
- Yeni kategori ekleme
- Hiyerarşik yapı düzenleme
- SEO meta verileri yönetimi

### Yazarlar  
- Yazar profili oluşturma
- Makale istatistikleri görüntüleme
- Rol ve yetki yönetimi

### Makaleler
- Yeni makale oluşturma
- Çoklu yazar atama
- Kategori ilişkilendirme
- Yayın durumu yönetimi

## 🔧 API Endpoints

### Kategoriler
- `GET /api/categories` - Tüm kategorileri listele
- `POST /api/categories` - Yeni kategori ekle
- `GET /api/categories/:id` - Tek kategori getir
- `PUT /api/categories/:id` - Kategori güncelle
- `DELETE /api/categories/:id` - Kategori sil

### Yazarlar
- `GET /api/authors` - Tüm yazarları listele
- `POST /api/authors` - Yeni yazar ekle
- `GET /api/authors/:id` - Tek yazar getir
- `PUT /api/authors/:id` - Yazar güncelle
- `DELETE /api/authors/:id` - Yazar sil

### Makaleler
- `GET /api/articles` - Makaleleri listele (sayfalama ile)
- `POST /api/articles` - Yeni makale ekle
- `GET /api/articles/:id` - Tek makale getir
- `PUT /api/articles/:id` - Makale güncelle
- `DELETE /api/articles/:id` - Makale sil

## 🚀 Production Build

\`\`\`bash
npm run build
npm start
\`\`\`

## 📝 Notlar

- Tüm CRUD işlemleri transaction ile korunur
- SEO meta verileri otomatik oluşturulur (fallback)
- Slug'lar otomatik olarak Türkçe karakterlerden temizlenir
- Kategori silme işlemi alt kategorileri kontrol eder

## 🎨 Teknolojiler

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Database**: PostgreSQL 15
- **ORM**: pg (node-postgres)
- **Notifications**: react-hot-toast
- **Date**: date-fns

## 📞 Destek

Sorun yaşarsanız:
1. PostgreSQL'in çalıştığından emin olun
2. `.env.local` dosyasındaki bağlantı bilgilerini kontrol edin  
3. `npm install` ile bağımlılıkları yeniden yükleyin

---

**YeniMorFikir Admin Panel v1.0** - Morfikirler.com içerikleri için geliştirildi

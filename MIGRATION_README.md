# WordPress Migration Rehberi

Morfikirler.com WordPress sitesinden YeniMorFikir PostgreSQL veritabanına içerik aktarımı.

## 🚀 Hızlı Başlangıç

### 1. Gereksinimleri Yükle

```bash
cd ~/YeniMorFikir

# Python3 kurulu olduğundan emin olun
python3 --version

# Gerekli kütüphaneleri yükle
pip3 install requests psycopg2-binary
```

### 2. PostgreSQL Veritabanını Hazırla

Önce veritabanınızı oluşturun (henüz yapmadıysanız):

```bash
# PostgreSQL'e bağlan
psql -U postgres

# Veritabanı oluştur
CREATE DATABASE yenimorfikir_db WITH ENCODING 'UTF8';
\c yenimorfikir_db

# Şemayı yükle
\i database/database_schema.sql

# Çıkış
\q
```

### 3. Migration Script'ini Düzenle

`migrate_wordpress.py` dosyasını açın ve PostgreSQL bağlantı bilgilerinizi güncelleyin:

```python
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'yenimorfikir_db',
    'user': 'postgres',        # Kendi kullanıcınız
    'password': 'yourpassword'  # Kendi şifreniz
}
```

### 4. Migration'ı Çalıştır

```bash
cd ~/YeniMorFikir
python3 migrate_wordpress.py
```

Script şunları yapacak:
1. ✅ WordPress'ten kategorileri çeker
2. ✅ WordPress'ten yazarları çeker
3. ✅ WordPress'ten tüm içerikleri çeker
4. ✅ PostgreSQL veritabanına aktarır

## 📊 Ne Aktarılır?

### Kategoriler
- ✅ Kategori adı ve slug
- ✅ Kategori açıklaması
- ✅ Üst-alt kategori ilişkileri
- ✅ Kategori sıralaması

### Yazarlar
- ✅ Kullanıcı adı (WordPress slug)
- ✅ Tam ad
- ✅ Biyografi
- ✅ Avatar resmi
- ✅ Yazar rolü

### İçerikler
- ✅ Başlık ve slug
- ✅ Özet (excerpt)
- ✅ Tam içerik (HTML formatında)
- ✅ Öne çıkan görsel
- ✅ Yayın durumu (published/draft)
- ✅ Yayın tarihi
- ✅ Yazar ilişkileri
- ✅ Kategori ilişkileri

## ⚙️ Gelişmiş Ayarlar

### WordPress API Endpoint'leri

Script şu endpoint'leri kullanır:

```
https://morfikirler.com/wp-json/wp/v2/categories
https://morfikirler.com/wp-json/wp/v2/users
https://morfikirler.com/wp-json/wp/v2/posts
```

### Özelleştirme

Script içindeki bu değişkenleri değiştirebilirsiniz:

```python
# Sayfa başına çekilecek öğe sayısı
per_page = 100

# Rate limiting (saniye)
time.sleep(0.5)
```

## 🔍 Kontrol ve Test

Migration sonrası kontrol edin:

```sql
-- Kategori sayısı
SELECT COUNT(*) FROM categories;

-- Yazar sayısı
SELECT COUNT(*) FROM authors;

-- İçerik sayısı
SELECT COUNT(*) FROM articles;

-- Hiyerarşik kategori görünümü
WITH RECURSIVE cat_tree AS (
    SELECT id, name, parent_id, 0 as level
    FROM categories WHERE parent_id IS NULL
    UNION ALL
    SELECT c.id, c.name, c.parent_id, ct.level + 1
    FROM categories c
    JOIN cat_tree ct ON c.parent_id = ct.id
)
SELECT REPEAT('  ', level) || name as category_tree
FROM cat_tree
ORDER BY level, name;

-- Yazarların makale sayısı
SELECT 
    a.full_name,
    COUNT(aa.article_id) as makale_sayisi
FROM authors a
LEFT JOIN article_authors aa ON a.id = aa.author_id
GROUP BY a.id, a.full_name
ORDER BY makale_sayisi DESC;

-- Kategorilerdeki makale sayısı
SELECT 
    c.name,
    COUNT(ac.article_id) as makale_sayisi
FROM categories c
LEFT JOIN article_categories ac ON c.id = ac.category_id
GROUP BY c.id, c.name
ORDER BY makale_sayisi DESC;
```

## 🔧 Sorun Giderme

### Hata: "ModuleNotFoundError: No module named 'psycopg2'"

```bash
pip3 install psycopg2-binary
```

### Hata: "connection refused"

PostgreSQL'in çalıştığından emin olun:

```bash
# MacOS
brew services start postgresql@15

# Ubuntu
sudo systemctl start postgresql
```

### Hata: "FATAL: database does not exist"

Veritabanını oluşturun:

```bash
psql -U postgres -c "CREATE DATABASE yenimorfikir_db"
```

### Hata: "relation does not exist"

Şemayı yükleyin:

```bash
psql -U postgres -d yenimorfikir_db -f database/database_schema.sql
```

## 📝 Notlar

- Script duplicate kontrol yapmaz. Aynı migration'ı iki kez çalıştırırsanız veriler iki kez eklenebilir.
- HTML içerikler olduğu gibi aktarılır. Frontend'de HTML render edilmelidir.
- Featured image URL'leri WordPress'ten gelir. Resimleri kendi sunucunuza almak isterseniz ayrı bir script gerekir.
- Email adresleri dummy olarak oluşturulur: `username@morfikirler.com`

## 🎯 Migration Sonrası

Migration tamamlandıktan sonra:

1. ✅ Verileri kontrol edin (yukarıdaki SQL sorgularıyla)
2. ✅ Materialized view'ları güncelleyin:
   ```sql
   SELECT refresh_popular_articles();
   ```
3. ✅ Frontend geliştirmeye başlayın!

## 🤝 Destek

Sorun yaşarsanız:
1. Script çıktısındaki hata mesajlarını kontrol edin
2. PostgreSQL loglarını inceleyin
3. WordPress API'nin erişilebilir olduğundan emin olun

## 📊 Örnek Çıktı

```
============================================================
🚀 WordPress → YeniMorFikir Migration
============================================================
Kaynak: https://morfikirler.com
Hedef: PostgreSQL (yenimorfikir_db)
============================================================

⚠️  DİKKAT: Bu işlem veritabanınıza veri ekleyecek!
Devam etmek istiyor musunuz? (evet/hayır): evet

🔌 Veritabanına bağlanılıyor...
✅ Bağlantı başarılı!

📁 KATEGORİLER ÇEKİLİYOR...
  📄 Sayfa 1 çekiliyor...
  ✅ 15 öğe çekildi (Toplam: 15)

✅ Toplam 15 kategori bulundu
  ✅ Haberler (Üst kategori)
  ✅ Spor (Üst kategori)
  ✅ Gündem (Alt kategori)
  ...

👥 YAZARLAR ÇEKİLİYOR...
  ✅ Ahmet Yılmaz
  ✅ Ayşe Kaya
  ...

📝 İÇERİKLER ÇEKİLİYOR...
  ✅ [1/250] PostgreSQL ile Yüksek Performans
  ✅ [2/250] Modern Web Geliştirme Teknikleri
  ...

✅ 250 içerik başarıyla aktarıldı!

============================================================
🎉 MİGRATİON TAMAMLANDI!
============================================================

📊 İstatistikler:
  • Kategoriler: 15
  • Yazarlar: 5

✅ Verileriniz başarıyla aktarıldı!
```


# SSH Bağlantı Rehberi (Mac)

## ✅ YÖNTEM 1: Mac Terminal (Kurulu, Kolay)

### Adım 1: Terminal'i Açın
- **Spotlight** ile: `Cmd + Space` → "Terminal" yazın
- veya: **Applications** → **Utilities** → **Terminal**

### Adım 2: SSH Komutunu Çalıştırın

```bash
ssh kullaniciadi@sunucuip
```

**Örnek:**
```bash
ssh enesoksuz@123.456.789.0
# veya domain ile:
ssh enesoksuz@yenimorfikir.com
```

### İlk Bağlantıda:
```
The authenticity of host 'sunucuip' can't be established.
Are you sure you want to continue connecting (yes/no)?
```
→ **yes** yazın ve Enter

### Şifre Soracak:
- cPanel şifrenizi yazın (yazarken görünmez, normal)
- Enter'a basın

✅ Bağlandınız! Artık sunucuda komut çalıştırabilirsiniz.

---

## 🎨 YÖNTEM 2: Termius (Kullanıcı Dostu GUI - Önerilen)

### Neden Termius?
- ✅ Görsel arayüz (tıkla-bağlan)
- ✅ Şifreleri kaydeder
- ✅ SFTP (dosya transferi) dahili
- ✅ Birden fazla sunucu yönetimi
- ✅ Ücretsiz versiyon yeterli

### Kurulum:
1. [termius.com](https://termius.com) adresinden indirin
2. Mac'e kurun
3. "New Host" → Sunucu bilgilerini girin
4. Kaydet ve bağlan

### Termius Ayarları:
```
Label: YeniMorFikir Sunucu
Address: sunucuip veya domain
Port: 22
Username: cpanel_kullaniciadi
Password: cpanel_sifresi
```

---

## 🚀 YÖNTEM 3: iTerm2 (Gelişmiş Terminal)

Terminal'in güçlendirilmiş hali:
- Split screen (bölünmüş ekran)
- Arama özelliği
- Daha iyi tema desteği

[iterm2.com](https://iterm2.com) → İndir → Kur → Aynı SSH komutlarını kullan

---

## 📋 Sunucu Bilgilerini Nereden Bulacaksınız?

### WHM'den:
1. WHM'e giriş yapın
2. **Account Information** → Hesabı seçin
3. SSH Access bilgilerini görün

### cPanel'den:
1. cPanel'e giriş yapın
2. **Advanced** → **SSH Access**
3. Manage SSH Keys

### Hosting Sağlayıcıdan:
- Hosting aldığınız firmadan "SSH bilgilerim" diye sorun
- Size şunları verecekler:
  - Sunucu IP adresi
  - SSH kullanıcı adı (genelde cPanel kullanıcı adı)
  - SSH portu (genelde 22)
  - Şifre (cPanel şifresi)

---

## 🔐 SSH Key ile Bağlantı (Daha Güvenli - İlerisi İçin)

Şifre girmeden bağlanmak için:

```bash
# 1. SSH key oluştur (Mac'te)
ssh-keygen -t rsa -b 4096 -C "enesoksuz@yenimorfikir.com"

# 2. Public key'i sunucuya kopyala
ssh-copy-id kullaniciadi@sunucuip

# 3. Artık şifresiz bağlanın
ssh kullaniciadi@sunucuip
```

---

## ⚠️ Sık Karşılaşılan Sorunlar

### "Permission denied"
- ✅ Kullanıcı adını kontrol edin
- ✅ Şifreyi doğru yazdığınızdan emin olun
- ✅ SSH erişimi hosting'de aktif mi kontrol edin

### "Connection refused"
- ✅ Sunucu IP/domain doğru mu?
- ✅ Port 22 mi? Bazı hostlar farklı port kullanır
- ✅ Firewall SSH'ı engelliyor olabilir

### "Host key verification failed"
- ✅ Sunucu yenilendiyse, eski keyi silin:
  ```bash
  ssh-keygen -R sunucuip
  ```

---

## 🎯 İlk Bağlantıdan Sonra Yapılacaklar

```bash
# Nerede olduğunuzu öğrenin
pwd

# Dosyaları listeleyin
ls -la

# cPanel home dizini genelde:
cd ~/public_html

# Node.js var mı kontrol
node --version

# PostgreSQL var mı kontrol
psql --version
```

---

## 💡 Hızlı Bağlantı İçin Alias (İsteğe Bağlı)

Mac'inizde Terminal'de:

```bash
# .zshrc dosyasını düzenleyin
nano ~/.zshrc

# En alta ekleyin:
alias sunucum="ssh kullaniciadi@sunucuip"

# Kaydet ve çık (Ctrl+O, Enter, Ctrl+X)

# Yeniden yükle
source ~/.zshrc

# Artık sadece yazın:
sunucum
```

---

## 📞 Yardım

Herhangi bir sorun yaşarsanız:
1. Hosting firmanızın destek hattını arayın
2. "SSH erişimi açık mı?" diye sorun
3. Gerekirse "SSH nasıl bağlanırım?" diye sorun

**Hazır mısınız?** Şimdi Terminal'i açıp deneyebilirsiniz! 🚀


#!/usr/bin/env python3
"""
Resim kurtarma işlemini test eder
"""

import requests
import time

def test_wayback_machine():
    """Wayback Machine'i test eder"""
    test_url = "https://morfikirler.com/wp-content/uploads/news/e-pazar-yeri.jpg"
    
    print("🔍 Wayback Machine Test:")
    print(f"   Test URL: {test_url}")
    
    wayback_urls = [
        f"http://web.archive.org/web/{test_url}",
        f"https://web.archive.org/web/{test_url}",
        f"http://web.archive.org/web/20231001/{test_url}",
        f"https://web.archive.org/web/20230901/{test_url}",
    ]
    
    for wayback_url in wayback_urls:
        try:
            print(f"   Deneniyor: {wayback_url}")
            response = requests.head(wayback_url, timeout=10)
            print(f"   Durum: {response.status_code}")
            if response.status_code == 200:
                print("   ✅ Başarılı!")
                return wayback_url
        except Exception as e:
            print(f"   ❌ Hata: {e}")
        
        time.sleep(0.5)
    
    return None

def test_google_cache():
    """Google Cache'i test eder"""
    test_url = "https://morfikirler.com/wp-content/uploads/news/e-pazar-yeri.jpg"
    
    print("\n🔍 Google Cache Test:")
    print(f"   Test URL: {test_url}")
    
    cache_url = f"https://webcache.googleusercontent.com/search?q=cache:{test_url}"
    
    try:
        print(f"   Deneniyor: {cache_url}")
        response = requests.head(cache_url, timeout=10)
        print(f"   Durum: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Başarılı!")
            return cache_url
        else:
            print("   ❌ Başarısız")
    except Exception as e:
        print(f"   ❌ Hata: {e}")
    
    return None

def main():
    print("🧪 Resim Kurtarma Test Başlatılıyor...\n")
    
    wayback_result = test_wayback_machine()
    cache_result = test_google_cache()
    
    print(f"\n📊 SONUÇLAR:")
    print(f"Wayback Machine: {'✅ Çalışıyor' if wayback_result else '❌ Çalışmıyor'}")
    print(f"Google Cache: {'✅ Çalışıyor' if cache_result else '❌ Çalışmıyor'}")
    
    if wayback_result or cache_result:
        print(f"\n💡 Öneri: Resim kurtarma işlemi başlatılabilir!")
        print("   python3 recover_images.py")
    else:
        print(f"\n😞 Hiçbir yöntem çalışmıyor.")
        print("💡 Alternatif çözümler:")
        print("   1. Eski site yedeklerini kontrol edin")
        print("   2. Hosting sağlayıcısından yardım isteyin")
        print("   3. Resimleri manuel olarak yeniden yükleyin")

if __name__ == "__main__":
    main()

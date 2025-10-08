import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Sayfa Bulunamadı | Mor Fikirler',
  description: 'Aradığınız sayfa bulunamadı. Ana sayfaya dönebilir veya arama yapabilirsiniz.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Numarası */}
        <div className="mb-8">
          <h1 
            className="text-9xl md:text-[12rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 leading-none"
            style={{ fontFamily: 'var(--font-lora)' }}
          >
            404
          </h1>
        </div>

        {/* İkon */}
        <div className="mb-8 flex justify-center">
          <svg 
            className="w-32 h-32 text-purple-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>

        {/* Başlık ve Açıklama */}
        <div className="mb-12">
          <h2 
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: 'var(--font-lora)' }}
          >
            Sayfa Bulunamadı
          </h2>
          <p 
            className="text-xl text-gray-600 mb-2"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            Üzgünüz, aradığınız sayfa mevcut değil.
          </p>
          <p 
            className="text-lg text-gray-500"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            Sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
          </p>
        </div>

        {/* Butonlar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Ana Sayfaya Dön
          </Link>

          <Link
            href="/arama"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 rounded-lg hover:bg-gray-50 transition-all duration-300 font-semibold border-2 border-purple-600 shadow-md hover:shadow-lg"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Arama Yap
          </Link>
        </div>

        {/* Popüler Linkler */}
        <div className="mt-16 pt-12 border-t border-gray-200">
          <h3 
            className="text-lg font-semibold text-gray-900 mb-6"
            style={{ fontFamily: 'var(--font-lora)' }}
          >
            Popüler Sayfalar
          </h3>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/girisimcilik"
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors text-sm font-medium"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              Girişimcilik
            </Link>
            <Link
              href="/yatirimcilik"
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors text-sm font-medium"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              Yatırımcılık
            </Link>
            <Link
              href="/e-ticaret"
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors text-sm font-medium"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              E-Ticaret
            </Link>
            <Link
              href="/kisisel-gelisim"
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors text-sm font-medium"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              Kişisel Gelişim
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


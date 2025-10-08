'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface SearchArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  featured_image: string;
  published_at: string;
  authors: Array<{
    id: string;
    name: string;
    username: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchArticle[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Arama yap
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        setSearchResults(data.articles || []);
      } catch (error) {
        console.error('Arama hatası:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };
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

        {/* Arama */}
        <div className="mb-12">
          <div className="max-w-xl mx-auto relative">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Aradığınız içeriği bulun..."
                className="w-full px-6 py-4 text-lg border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                style={{ fontFamily: 'var(--font-nunito)' }}
              />
              <svg
                className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </form>

            {/* Arama Sonuçları Dropdown */}
            {searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[500px] overflow-y-auto z-50 text-left">
                {isSearching ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                    <p className="text-gray-500">Aranıyor...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-8 text-center">
                    <svg
                      className="w-16 h-16 text-gray-300 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-gray-500">Sonuç bulunamadı</p>
                    <p className="text-sm text-gray-400 mt-1">Farklı kelimeler deneyin</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                      <p className="text-sm text-gray-600 font-medium">
                        {searchResults.length} sonuç bulundu
                      </p>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {searchResults.slice(0, 8).map((article) => (
                        <Link
                          key={article.id}
                          href={`/${article.slug}`}
                          className="flex gap-4 p-4 hover:bg-purple-50 transition-colors group"
                        >
                          {/* Thumbnail */}
                          {article.featured_image && (
                            <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                              <Image
                                src={article.featured_image}
                                alt={article.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Category */}
                            {article.categories?.[0] && (
                              <span className="inline-block px-2 py-1 text-xs font-medium text-purple-600 bg-purple-100 rounded mb-2">
                                {article.categories[0].name}
                              </span>
                            )}
                            
                            {/* Title */}
                            <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-purple-600 transition-colors">
                              {article.title}
                            </h3>
                            
                            {/* Summary */}
                            {article.summary && (
                              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                {article.summary}
                              </p>
                            )}
                            
                            {/* Meta */}
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {article.authors?.[0] && (
                                <>
                                  <span>{article.authors[0].name}</span>
                                  <span>•</span>
                                </>
                              )}
                              <span>{format(new Date(article.published_at), 'd MMM yyyy', { locale: tr })}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    
                    {searchResults.length > 8 && (
                      <div className="p-4 bg-gray-50 text-center border-t border-gray-100 rounded-b-xl">
                        <p className="text-sm text-gray-600">
                          +{searchResults.length - 8} sonuç daha var
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ana Sayfaya Dön Butonu */}
        <div className="mb-12">
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


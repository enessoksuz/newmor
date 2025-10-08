'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

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

export default function Header() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchArticle[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Ana kategorileri çek
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        // Sadece üst kategorileri (parent_id === null) filtrele
        const mainCategories = data.filter((cat: Category) => cat.parent_id === null);
        setCategories(mainCategories);
      })
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

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
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* Ana Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="relative w-40 h-12 md:w-48 md:h-14">
              <Image
                src="https://morfikirler.com/wp-content/uploads/2023/08/logo.svg"
                alt="Mor Fikirler"
                fill
                className="object-contain"
                priority
                unoptimized
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {categories.slice(0, 6).map((category) => (
              <Link
                key={category.id}
                href={`/${category.slug}`}
                className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
              >
                {category.name}
              </Link>
            ))}

            {/* Arama İkonu */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="text-gray-700 hover:text-purple-600 transition-colors"
              aria-label="Arama"
            >
              <svg
                className="w-6 h-6"
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
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-gray-700 hover:text-purple-600"
            aria-label="Menü"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Arama Çubuğu (Desktop) */}
        {isSearchOpen && (
          <div className="hidden lg:block pb-4">
            <form onSubmit={handleSearch} className="relative max-w-2xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ne aramak istersiniz?"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              />
              <svg
                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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

              {/* Arama Sonuçları Dropdown */}
              {searchQuery.trim().length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[600px] overflow-y-auto z-50">
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
                      <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <p className="text-sm text-gray-600 font-medium">
                          {searchResults.length} sonuç bulundu
                        </p>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {searchResults.slice(0, 10).map((article) => (
                          <Link
                            key={article.id}
                            href={`/${article.slug}`}
                            onClick={() => {
                              setIsSearchOpen(false);
                              setSearchQuery('');
                              setSearchResults([]);
                            }}
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
                      
                      {searchResults.length > 10 && (
                        <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
                          <p className="text-sm text-gray-600">
                            +{searchResults.length - 10} sonuç daha var
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile Arama */}
            <div className="relative">
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ne aramak istersiniz?"
                  className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <svg
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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

              {/* Mobile Arama Sonuçları */}
              {searchQuery.trim().length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[400px] overflow-y-auto z-50">
                  {isSearching ? (
                    <div className="p-6 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Aranıyor...</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-sm text-gray-500">Sonuç bulunamadı</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {searchResults.slice(0, 5).map((article) => (
                        <Link
                          key={article.id}
                          href={`/${article.slug}`}
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                          className="block p-3 hover:bg-purple-50 transition-colors"
                        >
                          <div className="flex gap-3">
                            {article.featured_image && (
                              <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                                <Image
                                  src={article.featured_image}
                                  alt={article.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                                {article.title}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {article.authors?.[0]?.name}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                      {searchResults.length > 5 && (
                        <div className="p-3 bg-gray-50 text-center">
                          <p className="text-xs text-gray-600">
                            +{searchResults.length - 5} sonuç daha
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Navigation Links */}
            <nav className="flex flex-col space-y-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/${category.slug}`}
                  className="text-gray-700 hover:text-purple-600 font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}


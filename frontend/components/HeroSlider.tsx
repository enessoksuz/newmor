'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  featured_image: string;
  published_at: string;
  authors: Array<{
    name: string;
    username: string;
  }>;
}

export default function HeroSlider({ articles }: { articles: Article[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % articles.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [articles.length]);

  if (articles.length === 0) return null;

  const currentArticle = articles[currentIndex];

  return (
    <div className="relative w-full h-[500px] bg-gray-900 overflow-hidden">
      {/* Background Image */}
      {currentArticle.featured_image && (
        <Image
          src={currentArticle.featured_image}
          alt={currentArticle.title}
          fill
          className="object-cover opacity-50"
          priority
        />
      )}

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl">
            <Link href={`/${currentArticle.slug}`}>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 hover:text-purple-300 transition-colors" style={{ fontFamily: 'var(--font-lora)' }}>
                {currentArticle.title}
              </h2>
            </Link>
            {currentArticle.summary && (
              <p className="text-xl text-gray-200 mb-6 line-clamp-3">
                {currentArticle.summary}
              </p>
            )}
            <Link
              href={`/${currentArticle.slug}`}
              className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Devamını Oku
            </Link>
          </div>
        </div>
      </div>

      {/* Dots Navigation */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-2">
        {articles.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-purple-600 w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Arrow Navigation */}
      <button
        onClick={() => setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition-colors"
        aria-label="Previous slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={() => setCurrentIndex((prev) => (prev + 1) % articles.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition-colors"
        aria-label="Next slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}



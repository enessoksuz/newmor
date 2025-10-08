'use client';

import React, { useState } from 'react';

interface Heading {
  level: number;
  text: string;
  id: string;
}

export default function TableOfContents({ headings }: { headings: Heading[] }) {
  const [showAll, setShowAll] = useState(false);
  
  if (headings.length === 0) {
    return null;
  }

  const hasMore = headings.length > 5;

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm lg:sticky lg:top-24">
      <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-lora)' }}>
        İçindekiler
      </h3>
      
      {/* Desktop - Tüm başlıklar */}
      <nav className="hidden lg:block space-y-2">
        {headings.map((heading, index) => (
          <a
            key={index}
            href={`#${heading.id}`}
            className={`block text-sm text-gray-600 hover:text-purple-600 transition-colors ${
              heading.level === 1 ? 'font-semibold' : 
              heading.level === 2 ? 'ml-2' : 
              heading.level === 3 ? 'ml-4' : 
              'ml-6'
            }`}
          >
            {heading.text}
          </a>
        ))}
      </nav>

      {/* Mobile - İlk 5 başlık veya tümü */}
      <nav className="lg:hidden space-y-2">
        {(showAll ? headings : headings.slice(0, 5)).map((heading, index) => (
          <a
            key={index}
            href={`#${heading.id}`}
            className={`block text-sm text-gray-600 hover:text-purple-600 transition-colors ${
              heading.level === 1 ? 'font-semibold' : 
              heading.level === 2 ? 'ml-2' : 
              heading.level === 3 ? 'ml-4' : 
              'ml-6'
            }`}
          >
            {heading.text}
          </a>
        ))}
      </nav>
      
      {/* Devamını Gör Butonu - Sadece mobilde ve 5'ten fazla başlık varsa */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full lg:hidden text-sm font-medium text-purple-600 hover:text-purple-700 py-2 px-4 border border-purple-200 rounded-lg transition-colors"
        >
          {showAll ? 'Daha Az Göster' : `Devamını Gör (${headings.length - 5} daha)`}
        </button>
      )}
    </div>
  );
}


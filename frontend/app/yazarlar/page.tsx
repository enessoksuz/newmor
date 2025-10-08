'use client';

import { useEffect, useState } from 'react';

interface Author {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  bio?: string;
  article_count: number;
}

export default function YazarlarPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/authors`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch authors');
        }
        
        const data = await response.json();
        if (data.success) {
          setAuthors(data.data);
        }
      } catch (error) {
        console.error('Error fetching authors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthors();
  }, []);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, authorName: string) => {
    const target = e.target as HTMLImageElement;
    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&size=80&background=6366f1&color=fff`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yazarlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Yazarlarımız
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Mor Fikirler'de içerik üreten değerli yazarlarımız ve editörlerimiz ile tanışın.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {authors.map((author) => (
            <div key={author.id} className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
              <div className="mb-4">
                <img
                  src={author.avatar_url}
                  alt={author.full_name}
                  className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-gray-200"
                  onError={(e) => handleImageError(e, author.full_name)}
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {author.full_name}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                @{author.username}
              </p>
              {author.bio && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-3">
                  {author.bio}
                </p>
              )}
              <div className="text-xs text-gray-400">
                {author.article_count} makale
              </div>
            </div>
          ))}
        </div>

        {authors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Henüz yazar bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  );
}

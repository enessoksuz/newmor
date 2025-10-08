import { query } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Article {
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
    is_primary: boolean;
  }>;
}

async function searchArticles(searchQuery: string): Promise<Article[]> {
  if (!searchQuery || searchQuery.trim() === '') {
    return [];
  }

  try {
    const sql = `
      SELECT 
        a.*,
        json_agg(DISTINCT jsonb_build_object(
          'id', au.id,
          'name', au.full_name,
          'username', au.username
        )) FILTER (WHERE au.id IS NOT NULL) as authors,
        json_agg(DISTINCT jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug,
          'is_primary', ac.is_primary
        )) FILTER (WHERE c.id IS NOT NULL) as categories
      FROM articles a
      LEFT JOIN article_authors aa ON a.id = aa.article_id
      LEFT JOIN authors au ON aa.author_id = au.id
      LEFT JOIN article_categories ac ON a.id = ac.article_id
      LEFT JOIN categories c ON ac.category_id = c.id
      WHERE a.status = 'published'
        AND (
          a.title ILIKE $1
          OR a.content ILIKE $1
          OR a.summary ILIKE $1
        )
      GROUP BY a.id
      ORDER BY a.published_at DESC
      LIMIT 50
    `;

    const searchPattern = `%${searchQuery}%`;
    const result = await query(sql, [searchPattern]);
    return result.rows;
  } catch (error) {
    console.error('Error searching articles:', error);
    return [];
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const searchQuery = params.q || '';
  const articles = await searchArticles(searchQuery);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Başlık */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-lora)' }}>
            Arama Sonuçları
          </h1>
          {searchQuery && (
            <p className="text-xl text-gray-600">
              &quot;{searchQuery}&quot; için {articles.length} sonuç bulundu
            </p>
          )}
        </div>

        {/* Sonuçlar */}
        {!searchQuery ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Arama yapmak için bir kelime girin
            </p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Aramanızla eşleşen içerik bulunamadı
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/${article.slug}`}
                className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
              >
                {/* Featured Image */}
                {article.featured_image && (
                  <div className="relative w-full aspect-video overflow-hidden">
                    <Image
                      src={article.featured_image}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Category */}
                  {article.categories && article.categories.length > 0 && (
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 text-xs font-medium text-purple-600 bg-purple-100 rounded-full">
                        {article.categories.find((c) => c.is_primary)?.name ||
                          article.categories[0].name}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h2
                    className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors"
                    style={{ fontFamily: 'var(--font-lora)' }}
                  >
                    {article.title}
                  </h2>

                  {/* Summary */}
                  {article.summary && (
                    <p
                      className="text-gray-600 text-sm line-clamp-3 mb-4"
                      style={{ fontFamily: 'var(--font-nunito)' }}
                    >
                      {article.summary}
                    </p>
                  )}

                  {/* Author & Date */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    {article.authors && article.authors.length > 0 && (
                      <span className="font-medium">{article.authors[0].name}</span>
                    )}
                    <span>
                      {format(new Date(article.published_at), 'd MMM yyyy', {
                        locale: tr,
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


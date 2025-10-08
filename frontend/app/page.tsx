import { query } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// HTML entity'leri decode eden fonksiyon
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8230;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x60;/g, '`')
    .replace(/&#x3D;/g, '=');
}

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
  }>;
}

async function getFeaturedArticles(): Promise<Article[]> {
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
          'slug', c.slug
        )) FILTER (WHERE c.id IS NOT NULL) as categories
      FROM articles a
      LEFT JOIN article_authors aa ON a.id = aa.article_id
      LEFT JOIN authors au ON aa.author_id = au.id
      LEFT JOIN article_categories ac ON a.id = ac.article_id
      LEFT JOIN categories c ON ac.category_id = c.id
      WHERE a.status = 'published' AND a.is_featured = true
      GROUP BY a.id
      ORDER BY a.published_at DESC
      LIMIT 4
    `;

    const result = await query(sql, []);
    return result.rows;
  } catch (error) {
    console.error('Error fetching featured articles:', error);
    return [];
  }
}

async function getLatestArticles(): Promise<Article[]> {
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
          'slug', c.slug
        )) FILTER (WHERE c.id IS NOT NULL) as categories
      FROM articles a
      LEFT JOIN article_authors aa ON a.id = aa.article_id
      LEFT JOIN authors au ON aa.author_id = au.id
      LEFT JOIN article_categories ac ON a.id = ac.article_id
      LEFT JOIN categories c ON ac.category_id = c.id
      WHERE a.status = 'published'
      GROUP BY a.id
      ORDER BY a.published_at DESC
      LIMIT 12
    `;

    const result = await query(sql, []);
    return result.rows;
  } catch (error) {
    console.error('Error fetching latest articles:', error);
    return [];
  }
}

export default async function HomePage() {
  const [featuredArticles, latestArticles] = await Promise.all([
    getFeaturedArticles(),
    getLatestArticles()
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Mor Fikirler
          </h1>
          <p className="text-xl text-gray-600">
            Girişimcilik, Yatırımcılık ve İş Fikirleri
          </p>
        </header>

        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Öne Çıkan Yazılar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/${article.slug}`}
                  className="group"
                >
                  <article className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                    {article.featured_image && (
                      <div className="relative w-full aspect-video bg-gray-200">
                        <Image
                          src={article.featured_image}
                          alt={article.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {decodeHtmlEntities(article.title)}
                      </h3>
                      {article.summary && (
                        <p className="text-gray-600 line-clamp-3 mb-4">
                          {decodeHtmlEntities(article.summary)}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        {article.authors?.[0] && (
                          <span>{article.authors[0].name}</span>
                        )}
                        <span>
                          {format(new Date(article.published_at), 'd MMMM yyyy', { locale: tr })}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Latest Articles */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Son Yazılar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestArticles.map((article) => (
              <Link
                key={article.id}
                href={`/${article.slug}`}
                className="group"
              >
                <article className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {article.featured_image && (
                    <div className="relative w-full aspect-video bg-gray-200">
                      <Image
                        src={article.featured_image}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {decodeHtmlEntities(article.title)}
                    </h3>
                    {article.summary && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {decodeHtmlEntities(article.summary)}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      {article.authors?.[0] && (
                        <span>{article.authors[0].name}</span>
                      )}
                      <span>
                        {format(new Date(article.published_at), 'd MMM yyyy', { locale: tr })}
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

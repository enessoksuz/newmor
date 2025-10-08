import { query } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { Metadata } from 'next';

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

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  meta_title: string;
  meta_description: string;
}

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

async function getCategory(slug: string): Promise<Category | null> {
  try {
    const result = await query(
      'SELECT * FROM categories WHERE slug = $1',
      [slug]
    );
    return result.rowCount > 0 ? result.rows[0] : null;
  } catch (error) {
    return null;
  }
}

async function getCategoryArticles(categoryId: string): Promise<Article[]> {
  try {
    const sql = `
      SELECT 
        a.*,
        json_agg(DISTINCT jsonb_build_object(
          'name', au.full_name,
          'username', au.username
        )) FILTER (WHERE au.id IS NOT NULL) as authors
      FROM articles a
      LEFT JOIN article_authors aa ON a.id = aa.article_id
      LEFT JOIN authors au ON aa.author_id = au.id
      INNER JOIN article_categories ac ON a.id = ac.article_id
      WHERE ac.category_id = $1 AND a.status = 'published'
      GROUP BY a.id
      ORDER BY a.published_at DESC
      LIMIT 50
    `;

    const result = await query(sql, [categoryId]);
    return result.rows;
  } catch (error) {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return {
      title: 'Kategori Bulunamadı'
    };
  }

  return {
    title: category.meta_title || category.name,
    description: category.meta_description || category.description?.substring(0, 160),
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const articles = await getCategoryArticles(category.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Category Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
            <Link href="/" className="hover:text-blue-600">Anasayfa</Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium">{category.name}</span>
          </nav>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {category.name}
          </h1>
          
          {category.description && (
            <div 
              className="text-lg text-gray-600 prose max-w-none"
              dangerouslySetInnerHTML={{ __html: category.description }}
            />
          )}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {articles.length === 0 ? (
          <p className="text-center text-gray-500 py-12">
            Bu kategoride henüz makale bulunmuyor.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/${article.slug}`}
                className="group"
              >
                <article className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
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
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {decodeHtmlEntities(article.title)}
                    </h3>
                    {article.summary && (
                      <p className="text-sm text-gray-600 line-clamp-3 mb-auto">
                        {decodeHtmlEntities(article.summary)}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
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
        )}
      </div>
    </div>
  );
}


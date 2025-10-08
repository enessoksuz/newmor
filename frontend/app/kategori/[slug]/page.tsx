import { query } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { Metadata } from 'next';
import HeroSlider from '@/components/HeroSlider';

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
  parent_id: string | null;
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

async function getCategoryArticles(categoryId: string, limit?: number): Promise<Article[]> {
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
      ${limit ? `LIMIT ${limit}` : ''}
    `;

    const result = await query(sql, [categoryId]);
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getSiblingCategories(categoryId: string, parentId: string | null): Promise<Category[]> {
  try {
    const sql = `
      SELECT id, name, slug, description
      FROM categories
      WHERE ${parentId ? 'parent_id = $1' : 'parent_id IS NULL'} 
        AND id != $2
        AND is_active = true
      ORDER BY display_order, name
    `;

    const params = parentId ? [parentId, categoryId] : [categoryId];
    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getBreadcrumbs(category: Category): Promise<Array<{ name: string; slug: string }>> {
  const breadcrumbs: Array<{ name: string; slug: string }> = [];
  
  try {
    if (category.parent_id) {
      const parentResult = await query(
        'SELECT id, name, slug, parent_id FROM categories WHERE id = $1',
        [category.parent_id]
      );
      
      if (parentResult.rowCount > 0) {
        const parent = parentResult.rows[0];
        const parentBreadcrumbs = await getBreadcrumbs(parent);
        breadcrumbs.push(...parentBreadcrumbs);
      }
    }
    
    breadcrumbs.push({ name: category.name, slug: category.slug });
  } catch (error) {
    breadcrumbs.push({ name: category.name, slug: category.slug });
  }
  
  return breadcrumbs;
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

  const [heroArticles, allArticles, siblings, breadcrumbs] = await Promise.all([
    getCategoryArticles(category.id, 5),
    getCategoryArticles(category.id, 15),
    getSiblingCategories(category.id, category.parent_id),
    getBreadcrumbs(category)
  ]);

  const gridArticles = allArticles.slice(5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm" style={{ fontFamily: 'var(--font-nunito)' }}>
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.slug} className="flex items-center space-x-2">
                {index > 0 && <span className="text-gray-400">›</span>}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-purple-600 font-medium">{crumb.name}</span>
                ) : (
                  <Link 
                    href={`/kategori/${crumb.slug}`}
                    className="text-gray-600 hover:text-purple-600 transition-colors"
                  >
                    {crumb.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-lora)' }}>
            {category.name}
          </h1>
          
          {category.meta_description && (
            <p className="text-xl text-gray-600 max-w-3xl">
              {category.meta_description}
            </p>
          )}
        </div>
      </div>

      {/* Sibling Categories */}
      {siblings.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-wrap gap-3">
              {siblings.map((sibling) => (
                <Link
                  key={sibling.id}
                  href={`/kategori/${sibling.slug}`}
                  className="px-4 py-2 bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 rounded-full transition-colors text-sm font-medium"
                  style={{ fontFamily: 'var(--font-nunito)' }}
                >
                  {sibling.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hero Slider */}
      {heroArticles.length > 0 && (
        <HeroSlider articles={heroArticles} />
      )}

      {/* Articles Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {gridArticles.length === 0 ? (
          <p className="text-center text-gray-500 py-12">
            Bu kategoride daha fazla makale bulunmuyor.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {gridArticles.map((article) => (
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors" style={{ fontFamily: 'var(--font-lora)' }}>
                        {decodeHtmlEntities(article.title)}
                      </h3>
                      {article.summary && (
                        <p className="text-sm text-gray-600 line-clamp-3 mb-auto" style={{ fontFamily: 'var(--font-nunito)' }}>
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

            {/* Load More Button (placeholder for infinity scroll) */}
            <div className="text-center">
              <button className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                Daha Fazla Göster
              </button>
            </div>
          </>
        )}
      </div>

      {/* Category Description */}
      {category.description && (
        <div className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-[680px] mx-auto">
              <div 
                className="prose prose-lg max-w-none"
                style={{ fontFamily: 'var(--font-nunito)' }}
                dangerouslySetInnerHTML={{ __html: category.description }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


import { query } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mor Fikirler - Girişimcilik, Yatırımcılık ve İş Fikirleri',
  description: 'Girişimcilik, yatırımcılık, iş fikirleri, e-ticaret, kişisel gelişim ve daha fazlası hakkında ilham verici içerikler. İş dünyasında başarıya ulaşmanız için en güncel bilgiler ve pratik öneriler.',
};

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

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  meta_description: string;
}

interface Author {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  bio: string;
  article_count: number;
}

// Hero içerik - En son yayınlanan makale
async function getHeroArticle(): Promise<Article | null> {
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
      LIMIT 1
    `;

    const result = await query(sql, []);
    return result.rowCount > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error fetching hero article:', error);
    return null;
  }
}

// 1. Seviye kategorileri getir
async function getMainCategories(): Promise<Category[]> {
  try {
    const result = await query(
      `SELECT id, name, slug, description, meta_description
       FROM categories
       WHERE parent_id IS NULL AND is_active = true
       ORDER BY display_order, name`,
      []
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching main categories:', error);
    return [];
  }
}

// Kategori için son 4 makale
async function getCategoryArticles(categoryId: string): Promise<Article[]> {
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
      INNER JOIN article_categories ac2 ON a.id = ac2.article_id
      WHERE a.status = 'published' AND ac2.category_id = $1
      GROUP BY a.id
      ORDER BY a.published_at DESC
      LIMIT 4
    `;

    const result = await query(sql, [categoryId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching category articles:', error);
    return [];
  }
}

// Popüler yazarlar
async function getPopularAuthors(): Promise<Author[]> {
  try {
    const sql = `
      SELECT 
        au.id,
        au.full_name,
        au.username,
        au.avatar_url,
        au.bio,
        COUNT(DISTINCT aa.article_id) as article_count
      FROM authors au
      LEFT JOIN article_authors aa ON au.id = aa.author_id
      LEFT JOIN articles a ON aa.article_id = a.id AND a.status = 'published'
      WHERE au.is_active = true
      GROUP BY au.id, au.full_name, au.username, au.avatar_url, au.bio
      HAVING COUNT(DISTINCT aa.article_id) > 0
      ORDER BY article_count DESC
      LIMIT 8
    `;

    const result = await query(sql, []);
    return result.rows;
  } catch (error) {
    console.error('Error fetching popular authors:', error);
    return [];
  }
}

export default async function HomePage() {
  const [heroArticle, mainCategories, popularAuthors] = await Promise.all([
    getHeroArticle(),
    getMainCategories(),
    getPopularAuthors()
  ]);
  
  // Her kategori için son 4 makaleyi al
  const categoriesWithArticles = await Promise.all(
    mainCategories.map(async (category) => ({
      ...category,
      articles: await getCategoryArticles(category.id)
    }))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      {heroArticle && (
        <section className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link href={`/${heroArticle.slug}`} className="group">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Hero Image */}
                {heroArticle.featured_image && (
                  <div className="relative w-full aspect-video lg:aspect-[4/3] rounded-lg overflow-hidden">
                    <Image
                      src={heroArticle.featured_image}
                      alt={heroArticle.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      priority
                    />
                  </div>
                )}
                
                {/* Hero Content */}
                <div className="space-y-4">
                  {heroArticle.categories?.[0] && (
                    <span className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {heroArticle.categories[0].name}
                    </span>
                  )}
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors" style={{ fontFamily: 'var(--font-lora)' }}>
                    {decodeHtmlEntities(heroArticle.title)}
                  </h1>
                  {heroArticle.summary && (
                    <p className="text-xl text-gray-600 line-clamp-3" style={{ fontFamily: 'var(--font-nunito)' }}>
                      {decodeHtmlEntities(heroArticle.summary)}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500 pt-4">
                    {heroArticle.authors?.[0] && (
                      <span className="font-medium">{heroArticle.authors[0].name}</span>
                    )}
                    <span>•</span>
                    <span>{format(new Date(heroArticle.published_at), 'd MMMM yyyy', { locale: tr })}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Categories Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {categoriesWithArticles.map((category) => (
          category.articles.length > 0 && (
            <section key={category.id} className="space-y-6">
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-lora)' }}>
                  {category.name}
                </h2>
                <Link
                  href={`/${category.slug}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  style={{ fontFamily: 'var(--font-nunito)' }}
                >
                  Tümünü Gör
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* Category Articles - 4 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {category.articles.map((article) => (
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
            </section>
          )
        ))}
      </div>

      {/* Popular Authors */}
      {popularAuthors.length > 0 && (
        <section className="bg-white border-t border-gray-200 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center" style={{ fontFamily: 'var(--font-lora)' }}>
              Popüler Yazarlar
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-6">
              {popularAuthors.map((author) => (
                <Link
                  key={author.id}
                  href={`/yazar/${author.username}`}
                  className="group flex flex-col items-center text-center"
                >
                  {/* Author Avatar */}
                  <div className="relative w-24 h-24 mb-3">
                    {author.avatar_url ? (
                      <Image
                        src={author.avatar_url}
                        alt={author.full_name}
                        fill
                        className="rounded-full object-cover ring-4 ring-gray-100 group-hover:ring-purple-500 transition-all"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-purple-600 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-gray-100 group-hover:ring-purple-500 transition-all">
                        {author.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  {/* Author Name */}
                  <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors text-sm mb-1" style={{ fontFamily: 'var(--font-nunito)' }}>
                    {author.full_name}
                  </h3>
                  
                  {/* Article Count */}
                  <p className="text-xs text-gray-500">
                    {author.article_count} makale
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

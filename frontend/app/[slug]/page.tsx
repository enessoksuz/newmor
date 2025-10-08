import { query } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { Metadata } from 'next';
import TableOfContents from '@/components/TableOfContents';
import HeroSlider from '@/components/HeroSlider';

// HTML entity'leri decode eden component
function ArticleContent({ content }: { content: string }) {
  const decodedContent = decodeHtmlEntities(content);
  
  return (
    <div 
      className="article-content prose max-w-none"
      dangerouslySetInnerHTML={{ __html: decodedContent }}
    />
  );
}

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  featured_image: string;
  status: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  published_at: string;
  updated_at: string;
  view_count: number;
  authors: Array<{
    id: string;
    name: string;
    username: string;
    avatar_url: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    is_primary: boolean;
  }>;
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

interface StaticPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_title: string;
  meta_description: string;
}

interface CategoryArticle {
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

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const sql = `
      SELECT 
        a.*,
        json_agg(DISTINCT jsonb_build_object(
          'id', au.id,
          'name', au.full_name,
          'username', au.username,
          'avatar_url', au.avatar_url
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
      WHERE a.slug = $1 AND a.status = 'published'
      GROUP BY a.id
    `;

    const result = await query(sql, [slug]);

    if (result.rowCount === 0) {
      return null;
    }

    // Görüntülenme sayısını artır
    await query(
      'UPDATE articles SET view_count = view_count + 1 WHERE slug = $1',
      [slug]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

async function getRecommendedArticles(currentArticleId: string, categoryIds: string[]): Promise<Article[]> {
  try {
    // Aynı kategoriden önerilen makaleler
    const sql = `
      SELECT 
        a.*,
        json_agg(DISTINCT jsonb_build_object(
          'id', au.id,
          'name', au.full_name,
          'username', au.username,
          'avatar_url', au.avatar_url
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
        AND a.id != $1
        AND EXISTS (
          SELECT 1 FROM article_categories ac2
          WHERE ac2.article_id = a.id AND ac2.category_id = ANY($2)
        )
      GROUP BY a.id
      ORDER BY a.updated_at DESC
      LIMIT 16
    `;

    const result = await query(sql, [currentArticleId, categoryIds]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching recommended articles:', error);
    return [];
  }
}

// URL mapping kontrolü
async function getURLMapping(slug: string): Promise<{type: string; reference_id: string} | null> {
  try {
    const result = await query(
      'SELECT type, reference_id FROM url_mappings WHERE slug = $1',
      [slug]
    );
    return result.rowCount > 0 ? result.rows[0] : null;
  } catch (error) {
    return null;
  }
}

// Sabit sayfa fonksiyonları
async function getStaticPage(slug: string): Promise<StaticPage | null> {
  try {
    const result = await query(
      'SELECT * FROM static_pages WHERE slug = $1 AND is_active = true',
      [slug]
    );
    return result.rowCount > 0 ? result.rows[0] : null;
  } catch (error) {
    return null;
  }
}

// Kategori fonksiyonları
async function getCategory(slug: string): Promise<Category | null> {
  try {
    const result = await query(
      'SELECT * FROM categories WHERE slug = $1 AND is_active = true',
      [slug]
    );
    return result.rowCount > 0 ? result.rows[0] : null;
  } catch (error) {
    return null;
  }
}

async function getCategoryArticles(categoryId: string, limit?: number): Promise<CategoryArticle[]> {
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
      ORDER BY a.updated_at DESC
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

async function getChildCategories(parentId: string): Promise<Category[]> {
  try {
    const result = await query(
      `SELECT id, name, slug, description, meta_description
       FROM categories
       WHERE parent_id = $1 AND is_active = true
       ORDER BY display_order, name`,
      [parentId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function hasChildCategories(categoryId: string): Promise<boolean> {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM categories WHERE parent_id = $1 AND is_active = true',
      [categoryId]
    );
    return result.rows[0]?.count > 0;
  } catch (error) {
    return false;
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
  
  // URL mapping'den tip kontrolü yap
  const mapping = await getURLMapping(slug);
  
  if (!mapping) {
    return {
      title: 'Sayfa Bulunamadı',
      description: 'Aradığınız sayfa bulunamadı.'
    };
  }
  
  // Eğer sabit sayfa ise
  if (mapping.type === 'page') {
    const page = await getStaticPage(slug);
    if (page) {
      return {
        title: page.meta_title || page.title,
        description: page.meta_description || page.title,
      };
    }
  }
  
  // Eğer kategori ise
  if (mapping.type === 'category') {
    const category = await getCategory(slug);
    if (category) {
      return {
        title: category.meta_title || category.name,
        description: category.meta_description || category.description?.substring(0, 160),
      };
    }
  }
  
  // Makale ise
  const article = await getArticle(slug);
  if (!article) {
    return {
      title: 'Sayfa Bulunamadı',
      description: 'Aradığınız sayfa bulunamadı.'
    };
  }

  return {
    title: article.meta_title || article.title,
    description: article.meta_description || article.summary,
    keywords: article.meta_keywords,
    openGraph: {
      title: article.meta_title || article.title,
      description: article.meta_description || article.summary,
      images: article.featured_image ? [article.featured_image] : [],
      type: 'article',
      publishedTime: article.published_at,
      modifiedTime: article.updated_at,
      authors: article.authors?.map(a => a.name) || [],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.meta_title || article.title,
      description: article.meta_description || article.summary,
      images: article.featured_image ? [article.featured_image] : [],
    }
  };
}

// Parse headings from HTML content
function parseHeadings(content: string): Array<{ level: number; text: string; id: string }> {
  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
  const headings: Array<{ level: number; text: string; id: string }> = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = parseInt(match[1]);
    let text = match[2].replace(/<[^>]*>/g, '').trim(); // HTML taglarını temizle
    
    // HTML entity'lerini decode et
    text = text
      .replace(/&#8211;/g, '–') // em dash
      .replace(/&#8212;/g, '—') // en dash
      .replace(/&#8216;/g, "'") // left single quotation mark
      .replace(/&#8217;/g, "'") // right single quotation mark
      .replace(/&#8220;/g, '"') // left double quotation mark
      .replace(/&#8221;/g, '"') // right double quotation mark
      .replace(/&#8230;/g, '…') // horizontal ellipsis
      .replace(/&nbsp;/g, ' ') // non-breaking space
      .replace(/&amp;/g, '&') // ampersand
      .replace(/&lt;/g, '<') // less than
      .replace(/&gt;/g, '>') // greater than
      .replace(/&quot;/g, '"') // quotation mark
      .replace(/&#39;/g, "'") // apostrophe
      .replace(/&#x27;/g, "'") // apostrophe (hex)
      .replace(/&#x2F;/g, '/') // forward slash (hex)
      .replace(/&#x60;/g, '`') // grave accent (hex)
      .replace(/&#x3D;/g, '='); // equals sign (hex)
    
    const id = text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    headings.push({ level, text, id });
  }

  return headings;
}

// HTML entity'leri decode eden fonksiyon
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#8211;/g, '–') // em dash
    .replace(/&#8212;/g, '—') // en dash
    .replace(/&#8216;/g, "'") // left single quotation mark
    .replace(/&#8217;/g, "'") // right single quotation mark
    .replace(/&#8220;/g, '"') // left double quotation mark
    .replace(/&#8221;/g, '"') // right double quotation mark
    .replace(/&#8230;/g, '…') // horizontal ellipsis
    .replace(/&nbsp;/g, ' ') // non-breaking space
    .replace(/&amp;/g, '&') // ampersand
    .replace(/&lt;/g, '<') // less than
    .replace(/&gt;/g, '>') // greater than
    .replace(/&quot;/g, '"') // quotation mark
    .replace(/&#39;/g, "'") // apostrophe
    .replace(/&#x27;/g, "'") // apostrophe (hex)
    .replace(/&#x2F;/g, '/') // forward slash (hex)
    .replace(/&#x60;/g, '`') // grave accent (hex)
    .replace(/&#x3D;/g, '='); // equals sign (hex)
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // 404/410 kontrolü yap
  const notFoundCheck = await query(
    'SELECT status, redirect_to FROM not_found_logs WHERE url = $1',
    [`/${slug}`]
  );

  if (notFoundCheck.rowCount > 0) {
    const logEntry = notFoundCheck.rows[0];
    
    // 410 Gone durumu
    if (logEntry.status === 'gone_410') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-2xl w-full text-center">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">410</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Sayfa Kalıcı Olarak Kaldırıldı</h2>
            <p className="text-gray-600 mb-8">
              Bu sayfa artık mevcut değil ve geri gelmeyecek.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      );
    }
    
    // Yönlendirme
    if (logEntry.status === 'redirected' && logEntry.redirect_to) {
      redirect(logEntry.redirect_to);
    }
  }
  
  // URL mapping'den tip kontrolü yap
  const mapping = await getURLMapping(slug);
  
  if (!mapping) {
    notFound();
  }
  
  // Eğer sabit sayfa ise
  if (mapping.type === 'page') {
    const page = await getStaticPage(slug);
    if (!page) {
      notFound();
    }
    
    return (
      <div className="min-h-screen bg-white">
        {/* Sayfa İçeriği - Makale Tasarımı Gibi */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
          <div className="max-w-[680px] mx-auto">
            {/* Başlık */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6" style={{ fontFamily: 'var(--font-lora)' }}>
              {decodeHtmlEntities(page.title)}
            </h1>
            
            {/* İçerik */}
            <div 
              className="article-content prose max-w-none"
              style={{ fontFamily: 'var(--font-nunito)' }}
              dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(page.content) }}
            />
          </div>
        </div>
      </div>
    );
  }
  
  // Eğer kategori ise
  if (mapping.type === 'category') {
    const category = await getCategory(slug);
    if (!category) {
      notFound();
    }
    
    // Alt kategorisi var mı kontrol et
    const isParentCategory = await hasChildCategories(category.id);
    
    if (isParentCategory) {
      // ÜST KATEGORİ SAYFASI - Alt kategorileri olan kategori
      const [heroArticles, childCategories, siblings, breadcrumbs] = await Promise.all([
        getCategoryArticles(category.id, 5),
        getChildCategories(category.id),
        getSiblingCategories(category.id, category.parent_id),
        getBreadcrumbs(category)
      ]);
      
      // Her alt kategori için 4 makale al
      const childCategoriesWithArticles = await Promise.all(
        childCategories.map(async (child) => ({
          ...child,
          articles: await getCategoryArticles(child.id, 4)
        }))
      );
      
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
                        href={`/${crumb.slug}`}
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
                      href={`/${sibling.slug}`}
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

          {/* Child Categories Sections */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
            {childCategoriesWithArticles.map((child) => (
              <div key={child.id} className="space-y-6">
                {/* Category Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-lora)' }}>
                    {child.name}
                  </h2>
                  <Link
                    href={`/${child.slug}`}
                    className="text-purple-600 hover:text-purple-700 font-medium transition-colors flex items-center gap-2"
                    style={{ fontFamily: 'var(--font-nunito)' }}
                  >
                    Tümünü Gör
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                {/* Articles Grid - 4 columns */}
                {child.articles.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {child.articles.map((article) => (
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
                ) : (
                  <p className="text-gray-500 text-center py-8">Bu kategoride henüz içerik bulunmuyor.</p>
                )}
              </div>
            ))}
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
    
    // ALT KATEGORİ SAYFASI - Alt kategorisi olmayan kategori
    const [heroArticles, allArticles, siblings, breadcrumbs] = await Promise.all([
      getCategoryArticles(category.id, 5),
      getCategoryArticles(category.id, 14),
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
                      href={`/${crumb.slug}`}
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
                    href={`/${sibling.slug}`}
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
  
  // Kategori değilse makale render et
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const categoryIds = article.categories?.map(c => c.id) || [];
  const recommendedArticles = await getRecommendedArticles(article.id, categoryIds);
  const primaryCategory = article.categories?.find(c => c.is_primary) || article.categories?.[0];
  const headings = parseHeadings(article.content);

  return (
    <div className="min-h-screen bg-white">
      {/* ÜST KISIM - Header Section - Max 680px */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="max-w-[680px] mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
            <Link href="/" className="hover:text-purple-600 transition-colors">
              Anasayfa
            </Link>
            {primaryCategory && (
              <>
                <span className="text-gray-400">›</span>
                <Link 
                  href={`/${primaryCategory.slug}`}
                  className="hover:text-purple-600 transition-colors"
                >
                  {primaryCategory.name}
                </Link>
              </>
            )}
          </nav>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6" style={{ fontFamily: 'var(--font-lora)' }}>
            {decodeHtmlEntities(article.title)}
          </h1>

          {/* Summary/Meta Description */}
          <p className="text-xl text-gray-600 leading-relaxed mb-6">
            {decodeHtmlEntities(article.summary || article.meta_description || '')}
          </p>

          {/* Author & Date Info */}
          <div className="flex items-center gap-4 mb-8">
            {article.authors && article.authors.length > 0 && (
              <div className="flex items-center gap-3">
                {article.authors[0].avatar_url ? (
                  <Image
                    src={article.authors[0].avatar_url}
                    alt={article.authors[0].name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {article.authors[0].name.charAt(0)}
                  </div>
                )}
                <div>
                  <Link
                    href={`/yazar/${article.authors[0].username}`}
                    className="text-gray-900 font-medium hover:text-blue-600 transition-colors"
                  >
                    {article.authors[0].name}
                  </Link>
                  {article.authors.length > 1 && (
                    <span className="text-gray-600"> ve {article.authors.length - 1} diğer yazar</span>
                  )}
                  <div className="text-sm text-gray-500">
                    {format(new Date(article.published_at), 'd MMMM yyyy', { locale: tr })} tarihinde yayınlandı
                    {article.updated_at !== article.published_at && (
                      <> • {format(new Date(article.updated_at), 'd MMMM yyyy', { locale: tr })} tarihinde güncellendi</>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ALT KISIM - 3 Sütunlu Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sol Sütun - Table of Contents */}
          <div className="lg:col-span-3">
            <TableOfContents headings={headings} />
          </div>

          {/* Orta Sütun - İçerik */}
          <div className="lg:col-span-6">
            {/* Featured Image */}
            {article.featured_image && (
              <div className="relative w-full aspect-video mb-8 rounded-lg overflow-hidden">
                <Image
                  src={article.featured_image}
                  alt={article.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
            
            <ArticleContent content={article.content} />
          </div>

          {/* Sağ Sütun - Boş (şimdilik) */}
          <div className="lg:col-span-3">
            <div className="bg-gray-50 rounded-lg p-6 min-h-[400px]">
              <p className="text-gray-400 text-center">Bu alan gelecekte kullanılacak</p>
            </div>
          </div>
        </div>
      </div>

      {/* ÖNERİLEN İÇERİKLER - 4x4 Grid */}
      {recommendedArticles.length > 0 && (
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center" style={{ fontFamily: 'var(--font-lora)' }}>
              Önerilen İçerikler
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {recommendedArticles.slice(0, 16).map((recArticle) => (
                <Link
                  key={recArticle.id}
                  href={`/${recArticle.slug}`}
                  className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
                >
                  {/* Featured Image */}
                  {recArticle.featured_image && (
                    <div className="relative w-full aspect-video overflow-hidden">
                      <Image
                        src={recArticle.featured_image}
                        alt={recArticle.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="p-6">
                    {/* Category */}
                    {recArticle.categories && recArticle.categories.length > 0 && (
                      <div className="mb-3">
                        <span className="inline-block px-3 py-1 text-xs font-medium text-purple-600 bg-purple-100 rounded-full">
                          {recArticle.categories.find(c => c.is_primary)?.name || recArticle.categories[0].name}
                        </span>
                      </div>
                    )}
                    
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors" style={{ fontFamily: 'var(--font-lora)' }}>
                      {decodeHtmlEntities(recArticle.title)}
                    </h3>
                    
                    {/* Summary */}
                    {recArticle.summary && (
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4" style={{ fontFamily: 'var(--font-nunito)' }}>
                        {decodeHtmlEntities(recArticle.summary)}
                      </p>
                    )}
                    
                    {/* Author & Date */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      {recArticle.authors && recArticle.authors.length > 0 && (
                        <span className="font-medium">
                          {recArticle.authors[0].name}
                        </span>
                      )}
                      <span>
                        {format(new Date(recArticle.published_at), 'd MMM yyyy', { locale: tr })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


import { query } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { Metadata } from 'next';
import TableOfContents from '@/components/TableOfContents';

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
      ORDER BY a.published_at DESC
      LIMIT 16
    `;

    const result = await query(sql, [currentArticleId, categoryIds]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching recommended articles:', error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: 'Makale Bulunamadı',
      description: 'Aradığınız makale bulunamadı.'
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

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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
                  href={`/kategori/${primaryCategory.slug}`}
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


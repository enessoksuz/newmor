import { MetadataRoute } from 'next';
import { query } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://morfikirler.com';

  try {
    // Tüm yayınlanmış makaleleri çek
    const articlesResult = await query(`
      SELECT slug, updated_at, created_at
      FROM articles
      WHERE status = 'published'
      ORDER BY updated_at DESC
    `);

    // Tüm kategorileri çek
    const categoriesResult = await query(`
      SELECT slug, updated_at, created_at
      FROM categories
      ORDER BY name ASC
    `);

    const articles = articlesResult.rows;
    const categories = categoriesResult.rows;

    // Ana sayfa
    const homePage = {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    };

    // Makale sayfaları
    const articlePages = articles.map((article: any) => ({
      url: `${baseUrl}/${article.slug}`,
      lastModified: new Date(article.updated_at || article.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Kategori sayfaları
    const categoryPages = categories.map((category: any) => ({
      url: `${baseUrl}/kategori/${category.slug}`,
      lastModified: new Date(category.updated_at || category.created_at),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }));

    // Tüm sayfaları birleştir
    return [homePage, ...articlePages, ...categoryPages];

  } catch (error) {
    console.error('Sitemap generation error:', error);
    
    // Hata durumunda en azından ana sayfayı döndür
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
    ];
  }
}




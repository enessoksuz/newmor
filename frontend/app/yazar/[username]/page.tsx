import { query } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { Metadata } from 'next';

interface Author {
  id: string;
  full_name: string;
  username: string;
  email: string;
  bio: string;
  avatar_url: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  featured_image: string;
  published_at: string;
}

async function getAuthor(username: string): Promise<Author | null> {
  try {
    const result = await query(
      'SELECT * FROM authors WHERE username = $1',
      [username]
    );
    return result.rowCount > 0 ? result.rows[0] : null;
  } catch (error) {
    return null;
  }
}

async function getAuthorArticles(authorId: string): Promise<Article[]> {
  try {
    const sql = `
      SELECT a.*
      FROM articles a
      INNER JOIN article_authors aa ON a.id = aa.article_id
      WHERE aa.author_id = $1 AND a.status = 'published'
      ORDER BY a.published_at DESC
      LIMIT 50
    `;

    const result = await query(sql, [authorId]);
    return result.rows;
  } catch (error) {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const author = await getAuthor(username);

  if (!author) {
    return {
      title: 'Yazar Bulunamadı'
    };
  }

  return {
    title: `${author.full_name} - Yazar Profili`,
    description: author.bio ? author.bio.substring(0, 160).replace(/<[^>]*>/g, '') : `${author.full_name} tarafından yazılan makaleler`,
  };
}

export default async function AuthorPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const author = await getAuthor(username);

  if (!author) {
    notFound();
  }

  const articles = await getAuthorArticles(author.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Author Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
            <Link href="/" className="hover:text-blue-600">Anasayfa</Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium">Yazarlar</span>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium">{author.full_name}</span>
          </nav>

          <div className="flex items-start gap-6">
            {author.avatar_url ? (
              <Image
                src={author.avatar_url}
                alt={author.full_name}
                width={120}
                height={120}
                className="rounded-full"
              />
            ) : (
              <div className="w-30 h-30 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl font-bold">
                {author.full_name.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {author.full_name}
              </h1>
              {author.bio && (
                <div 
                  className="text-gray-600 prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: author.bio }}
                />
              )}
              <p className="text-sm text-gray-500 mt-4">
                {articles.length} makale yazıldı
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Articles */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Yazıları
        </h2>
        
        {articles.length === 0 ? (
          <p className="text-center text-gray-500 py-12">
            Henüz makale bulunmuyor.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
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
                      {article.title}
                    </h3>
                    {article.summary && (
                      <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                        {article.summary}
                      </p>
                    )}
                    <div className="text-xs text-gray-500">
                      {format(new Date(article.published_at), 'd MMMM yyyy', { locale: tr })}
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


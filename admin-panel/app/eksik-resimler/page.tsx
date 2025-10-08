'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import { Edit, ChevronLeft, ChevronRight, ImageOff, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function EksikResimlerPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);

  useEffect(() => {
    fetchArticles();
  }, [page]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      const res = await fetch(`/api/eksik-resimler?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setArticles(data.data);
        const totalPages = Math.ceil(data.total / 20);
        setTotalPages(totalPages);
        setTotalArticles(data.total);
      }
    } catch (error) { 
      console.error('Makaleler yüklenemedi:', error); 
    } finally { 
      setLoading(false); 
    }
  };

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const countPlaceholders = (content: string) => {
    if (!content) return 0;
    const matches = content.match(/placeholder/gi);
    return matches ? matches.length : 0;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <ImageOff className="w-8 h-8 text-orange-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Eksik Resimler</h1>
                <p className="mt-1 text-sm text-gray-500">
                  İçeriğinde placeholder barındıran {totalArticles?.toLocaleString('tr-TR') || '0'} makale bulundu
                </p>
              </div>
            </div>
          </div>
        </div>

        {totalArticles > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <p className="font-medium">Bu makalelerin içeriğinde placeholder resim bulunuyor.</p>
                <p className="mt-1">Makaleleri düzenleyip gerçek resimlerle değiştirmeniz önerilir.</p>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              {[1,2,3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <ImageOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Harika! Hiç eksik resim yok
            </h3>
            <p className="text-gray-500">
              Tüm makalelerde gerçek resimler kullanılıyor.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Başlık</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yazar</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placeholder Sayısı</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {articles.map((article) => {
                    const placeholderCount = countPlaceholders(article.content);
                    return (
                      <tr key={article.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-md">
                            {article.title}
                          </div>
                          <div className="text-sm text-gray-500">/{article.slug}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            article.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {article.status === 'published' ? 'Yayında' : 'Taslak'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {article.authors?.[0] ? (
                            <div className="flex items-center">
                              {article.authors[0].avatar_url ? (
                                <img 
                                  src={article.authors[0].avatar_url} 
                                  alt={article.authors[0].name}
                                  className="h-8 w-8 rounded-full object-cover mr-2"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium mr-2">
                                  {article.authors[0].name.charAt(0)}
                                </div>
                              )}
                              <span className="text-sm text-gray-600">{article.authors[0].name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-600">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <ImageOff className="w-3 h-3 mr-1" />
                            {placeholderCount} adet
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {article.published_at 
                            ? format(new Date(article.published_at), 'dd MMM yyyy', { locale: tr }) 
                            : format(new Date(article.created_at), 'dd MMM yyyy', { locale: tr })
                          }
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <Link 
                            href={`/articles/${article.id}`} 
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                          >
                            <Edit className="w-4 h-4 mr-1.5" />
                            Düzenle
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Sayfalama */}
            {totalPages > 1 && (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Sayfa {page} / {totalPages} (Toplam {totalArticles?.toLocaleString('tr-TR') || '0'} makale)
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => goToPage(page - 1)}
                      disabled={page === 1}
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Önceki
                    </button>
                    
                    {/* Sayfa numaraları */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg ${
                              page === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => goToPage(page + 1)}
                      disabled={page === totalPages}
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sonraki
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}


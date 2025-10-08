'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, Search, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function ArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAuthor, setFilterAuthor] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterFeatured, setFilterFeatured] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    fetchArticles();
  }, [page, searchQuery, filterStatus, filterCategory, filterAuthor, filterStartDate, filterEndDate, filterFeatured]);

  useEffect(() => {
    fetchFiltersData();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (filterStatus) {
        params.append('status', filterStatus);
      }
      if (filterCategory) {
        params.append('category', filterCategory);
      }
      if (filterAuthor) {
        params.append('author', filterAuthor);
      }
      if (filterStartDate) {
        params.append('startDate', filterStartDate);
      }
      if (filterEndDate) {
        params.append('endDate', filterEndDate);
      }
      if (filterFeatured) {
        params.append('featured', filterFeatured);
      }

      const res = await fetch(`/api/articles?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setArticles(data.data);
        const totalPages = Math.ceil(data.total / 20);
        setTotalPages(totalPages);
        setTotalArticles(data.total);
      }
    } catch (error) { 
      toast.error('Makaleler yüklenemedi'); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchFiltersData = async () => {
    try {
      const [categoriesRes, authorsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/authors')
      ]);
      
      const categoriesData = await categoriesRes.json();
      const authorsData = await authorsRes.json();
      
      if (categoriesData.success) {
        setCategories(categoriesData.data);
      }
      if (authorsData.success) {
        setAuthors(authorsData.data);
      }
    } catch (error) {
      console.error('Filtre verileri yüklenemedi:', error);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" makalesini silmek istediğinizden emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { 
        toast.success('Makale silindi'); 
        fetchArticles(); 
      } else { 
        toast.error(data.error || 'Makale silinemedi'); 
      }
    } catch (error) { 
      toast.error('Bir hata oluştu'); 
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Arama yaparken ilk sayfaya dön
    fetchArticles();
  };

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const clearFilters = () => {
    setFilterStatus('');
    setFilterCategory('');
    setFilterAuthor('');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterFeatured('');
    setPage(1);
  };

  const toggleSelectAll = () => {
    if (selectedArticles.length === articles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(articles.map(a => a.id));
    }
  };

  const toggleSelectArticle = (id: string) => {
    if (selectedArticles.includes(id)) {
      setSelectedArticles(selectedArticles.filter(aid => aid !== id));
    } else {
      setSelectedArticles([...selectedArticles, id]);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedArticles.length === 0) {
      toast.error('Lütfen işlem ve makale seçin');
      return;
    }

    const actionMessages: {[key: string]: string} = {
      delete: 'silmek',
      publish: 'yayınlamak',
      draft: 'taslak yapmak',
      feature: 'öne çıkarmak',
      unfeature: 'öne çıkarmaktan kaldırmak'
    };

    if (!confirm(`${selectedArticles.length} makaleyi ${actionMessages[bulkAction]} istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const res = await fetch('/api/articles/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkAction,
          articleIds: selectedArticles
        })
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        setSelectedArticles([]);
        setBulkAction('');
        fetchArticles();
      } else {
        toast.error(data.error || 'İşlem başarısız');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Makaleler</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Toplam {totalArticles?.toLocaleString('tr-TR') || '0'} makale
                </p>
          </div>
          <Link href="/articles/new" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            Yeni Makale
          </Link>
        </div>

        {/* Arama Formu */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSearch} className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Makale başlığı, içerik veya yazar ara..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ara
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Temizle
              </button>
            )}
          </form>

          {/* Filtre Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Gelişmiş Filtreler
            {(filterStatus || filterCategory || filterAuthor || filterStartDate || filterEndDate || filterFeatured) && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                {[filterStatus, filterCategory, filterAuthor, filterStartDate, filterEndDate, filterFeatured].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Filtreler */}
          {showFilters && (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Durum Filtresi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durum
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tümü</option>
                    <option value="published">Yayınlanmış</option>
                    <option value="draft">Taslak</option>
                  </select>
                </div>

                {/* Kategori Filtresi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tümü</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {'  '.repeat(cat.level || 0)}{cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Yazar Filtresi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yazar
                  </label>
                  <select
                    value={filterAuthor}
                    onChange={(e) => { setFilterAuthor(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tümü</option>
                    {authors.map((author) => (
                      <option key={author.id} value={author.id}>
                        {author.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Başlangıç Tarihi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlangıç Tarihi
                  </label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => { setFilterStartDate(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Bitiş Tarihi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => { setFilterEndDate(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Öne Çıkan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Öne Çıkan
                  </label>
                  <select
                    value={filterFeatured}
                    onChange={(e) => { setFilterFeatured(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tümü</option>
                    <option value="true">Evet</option>
                    <option value="false">Hayır</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              <div className="mt-4">
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Filtreleri Temizle
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Toplu İşlemler */}
        {selectedArticles.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedArticles.length} makale seçildi
              </span>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">İşlem seçin...</option>
                <option value="publish">Yayınla</option>
                <option value="draft">Taslak Yap</option>
                <option value="feature">Öne Çıkar</option>
                <option value="unfeature">Öne Çıkarmayı Kaldır</option>
                <option value="delete">Sil</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Uygula
              </button>
              <button
                onClick={() => setSelectedArticles([])}
                className="px-4 py-2 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-100"
              >
                Seçimi Temizle
              </button>
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
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedArticles.length === articles.length && articles.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Başlık</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yazar</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Görüntülenme</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {articles.map((article) => (
                    <tr key={article.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4">
                        <input
                          type="checkbox"
                          checked={selectedArticles.includes(article.id)}
                          onChange={() => toggleSelectArticle(article.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
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
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {article.published_at 
                          ? format(new Date(article.published_at), 'dd MMM yyyy', { locale: tr }) 
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {article.view_count || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link 
                            href={`/articles/${article.id}`} 
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                          >
                            <Edit className="w-4 h-4 mr-1.5" />
                            Düzenle
                          </Link>
                          <button 
                            onClick={() => handleDelete(article.id, article.title)} 
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
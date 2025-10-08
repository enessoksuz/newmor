'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { AlertCircle, Trash2, ExternalLink, ArrowRight, Ban } from 'lucide-react';

interface NotFoundLog {
  id: string;
  url: string;
  hit_count: number;
  status: 'active' | 'redirected' | 'gone_410';
  redirect_to: string | null;
  first_seen_at: string;
  last_seen_at: string;
  notes: string | null;
}

export default function NotFoundLogsPage() {
  const [logs, setLogs] = useState<NotFoundLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [statusFilter]);

  const fetchLogs = async () => {
    try {
      const url = statusFilter === 'all' 
        ? '/api/404-logs'
        : `/api/404-logs?status=${statusFilter}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setLogs(data.data);
      } else {
        console.error('API error:', data.message);
      }
    } catch (error) {
      console.error('Error fetching 404 logs:', error);
      setLogs([]); // Hata durumunda boş liste göster
    } finally {
      setLoading(false);
    }
  };

  const handleSetRedirect = async (id: string, url: string) => {
    if (!url.trim()) {
      alert('Lütfen yönlendirme URL\'si girin');
      return;
    }

    try {
      const response = await fetch(`/api/404-logs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'redirected',
          redirect_to: url,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchLogs();
        setEditingId(null);
        setRedirectUrl('');
      } else {
        alert('Hata: ' + data.message);
      }
    } catch (error) {
      console.error('Error setting redirect:', error);
      alert('Yönlendirme ayarlanırken hata oluştu');
    }
  };

  const handleSet410 = async (id: string) => {
    if (!confirm('Bu URL için 410 (Gone) durumu ayarlamak istediğinize emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/404-logs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'gone_410',
          redirect_to: null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchLogs();
      } else {
        alert('Hata: ' + data.message);
      }
    } catch (error) {
      console.error('Error setting 410:', error);
      alert('410 ayarlanırken hata oluştu');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/404-logs/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchLogs();
      } else {
        alert('Hata: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting log:', error);
      alert('Silme sırasında hata oluştu');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">Aktif 404</span>;
      case 'redirected':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">Yönlendirildi</span>;
      case 'gone_410':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">410 Gone</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">{status}</span>;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">404 Sayfalar</h1>
        <p className="text-gray-600">
          Bulunamayan sayfaları yönetin. Yönlendirme yapın veya 410 (Gone) durumu ayarlayın.
        </p>
      </div>

      {/* Filtreler */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'active'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Aktif 404
          </button>
          <button
            onClick={() => setStatusFilter('redirected')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'redirected'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Yönlendirilmiş
          </button>
          <button
            onClick={() => setStatusFilter('gone_410')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'gone_410'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            410 Gone
          </button>
        </div>
      </div>

      {/* Liste */}
      {logs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Henüz 404 kaydı bulunmuyor</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hit Sayısı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Son Görülme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                          {log.url}
                        </code>
                        {log.redirect_to && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <ArrowRight className="w-3 h-3" />
                            <code className="bg-blue-50 px-2 py-1 rounded">{log.redirect_to}</code>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-sm font-semibold bg-orange-100 text-orange-700 rounded-full">
                        {log.hit_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.last_seen_at).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {log.status === 'active' ? (
                        <div className="flex items-center gap-2">
                          {editingId === log.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={redirectUrl}
                                onChange={(e) => setRedirectUrl(e.target.value)}
                                placeholder="/yeni-url"
                                className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-900"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSetRedirect(log.id, redirectUrl)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                Kaydet
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setRedirectUrl('');
                                }}
                                className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                              >
                                İptal
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(log.id);
                                  setRedirectUrl('');
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium"
                              >
                                <ArrowRight className="w-4 h-4" />
                                Yönlendir
                              </button>
                              <button
                                onClick={() => handleSet410(log.id)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors font-medium"
                              >
                                <Ban className="w-4 h-4" />
                                410 Ver
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-medium"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {log.redirect_to && (
                            <a
                              href={log.redirect_to}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-xs"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Test Et
                            </a>
                          )}
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-medium"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bilgilendirme */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Nasıl Çalışır?</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Frontend'te olmayan bir sayfaya istek geldiğinde otomatik kayıt oluşturulur</li>
              <li><strong>Yönlendir:</strong> URL'yi başka bir sayfaya yönlendirin (301 redirect)</li>
              <li><strong>410 Ver:</strong> Sayfa kalıcı olarak silindiğini belirtin (SEO için önemli)</li>
              <li>Hit sayısı: Bu URL'ye kaç kere 404 verildiğini gösterir</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


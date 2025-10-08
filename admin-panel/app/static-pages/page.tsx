'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import AdminLayout from '@/components/AdminLayout';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface StaticPage {
  id: string;
  title: string;
  slug: string;
  footer_column: number | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function StaticPagesPage() {
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/static-pages');
      const data = await res.json();
      setPages(data);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast.error('Sayfalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" sayfasını silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/static-pages/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Sayfa silindi');
        fetchPages();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Sayfa silinemedi');
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error('Bir hata oluştu');
    }
  };

  const getFooterColumnText = (column: number | null) => {
    if (!column) return 'Footer\'da Gösterilmiyor';
    switch (column) {
      case 2: return 'Sütun 2 - Kategoriler';
      case 3: return 'Sütun 3 - Kurumsal';
      case 4: return 'Sütun 4 - Diğer';
      default: return 'Belirsiz';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Yükleniyor...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Sabit Sayfalar</h1>
          <Link
            href="/static-pages/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Yeni Sayfa
          </Link>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Başlık
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Footer Konumu
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Sıra
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {page.title}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 font-mono">/{page.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      {getFooterColumnText(page.footer_column)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{page.display_order}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        page.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {page.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <Link
                      href={`/static-pages/${page.id}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Düzenle
                    </Link>
                    <button
                      onClick={() => handleDelete(page.id, page.title)}
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pages.length === 0 && (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <Plus className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Henüz sayfa eklenmemiş</p>
                <p className="text-sm mt-2">Yeni bir sayfa eklemek için yukarıdaki butonu kullanın</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}


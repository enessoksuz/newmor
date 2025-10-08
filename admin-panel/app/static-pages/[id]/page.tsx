'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import SimpleEditor from '@/components/SimpleEditor';
import AdminLayout from '@/components/AdminLayout';
import { ArrowLeft, Save } from 'lucide-react';

interface StaticPage {
  id?: string;
  title: string;
  slug: string;
  content: string;
  meta_title: string;
  meta_description: string;
  footer_column: number | null;
  display_order: number;
  is_active: boolean;
}

export default function StaticPageEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState<StaticPage>({
    title: '',
    slug: '',
    content: '',
    meta_title: '',
    meta_description: '',
    footer_column: null,
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      if (p.id !== 'new') {
        fetchPage(p.id);
      } else {
        setLoading(false);
      }
    });
  }, [params]);

  const fetchPage = async (pageId: string) => {
    try {
      const res = await fetch(`/api/static-pages/${pageId}`);
      if (res.ok) {
        const data = await res.json();
        setPage(data);
      } else {
        toast.error('Sayfa bulunamadı');
        router.push('/static-pages');
      }
    } catch (error) {
      console.error('Error fetching page:', error);
      toast.error('Sayfa yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = id === 'new' 
        ? '/api/static-pages'
        : `/api/static-pages/${id}`;
      
      const method = id === 'new' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(page),
      });

      if (res.ok) {
        toast.success('Sayfa kaydedildi');
        router.push('/static-pages');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Kaydetme başarısız');
      }
    } catch (error) {
      console.error('Error saving page:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (value: string) => {
    setPage({ ...page, title: value });
    if (id === 'new' && !page.slug) {
      setPage({ ...page, title: value, slug: generateSlug(value) });
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
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/static-pages')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {id === 'new' ? 'Yeni Sayfa Oluştur' : 'Sayfayı Düzenle'}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow p-8 space-y-6">
          {/* Başlık */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Başlık *
            </label>
            <input
              type="text"
              value={page.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Sayfa başlığını girin"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Slug *
            </label>
            <input
              type="text"
              value={page.slug}
              onChange={(e) => setPage({ ...page, slug: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="sayfa-url-adresi"
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              🔗 URL: <span className="font-mono text-blue-600">/{page.slug}</span>
            </p>
          </div>

          {/* İçerik */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              İçerik
            </label>
            <SimpleEditor
              value={page.content}
              onChange={(value) => setPage({ ...page, content: value })}
            />
          </div>

          {/* Grid: Meta Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Meta Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Meta Title
              </label>
              <input
                type="text"
                value={page.meta_title}
                onChange={(e) => setPage({ ...page, meta_title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="SEO başlığı"
              />
            </div>

            {/* Meta Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Meta Description
              </label>
              <textarea
                value={page.meta_description}
                onChange={(e) => setPage({ ...page, meta_description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="SEO açıklaması"
              />
            </div>
          </div>

          {/* Grid: Footer & Display Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Footer Column */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Footer Sütunu
              </label>
              <select
                value={page.footer_column || ''}
                onChange={(e) => setPage({ 
                  ...page, 
                  footer_column: e.target.value ? parseInt(e.target.value) : null 
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Gösterme</option>
                <option value="2">Sütun 2</option>
                <option value="3">Sütun 3 - Kurumsal</option>
                <option value="4">Sütun 4 - Diğer</option>
              </select>
              <p className="mt-2 text-xs text-gray-500">
                Boş bırakırsanız footer&apos;da yer almaz
              </p>
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sıralama
              </label>
              <input
                type="number"
                value={page.display_order}
                onChange={(e) => setPage({ ...page, display_order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                placeholder="0"
              />
              <p className="mt-2 text-xs text-gray-500">
                Küçük değer önce gösterilir
              </p>
            </div>

            {/* Is Active */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Durum
              </label>
              <div className="flex items-center h-12">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={page.is_active}
                  onChange={(e) => setPage({ ...page, is_active: e.target.checked })}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="ml-3 block text-sm font-medium text-gray-700">
                  Aktif
                </label>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/static-pages')}
              className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              İptal
            </button>
          </div>
        </div>
      </form>
      </div>
    </AdminLayout>
  );
}


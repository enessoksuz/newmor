'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import FrontendEditor from '@/components/FrontendEditor';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface ArticleForm {
  title: string;
  slug: string;
  summary: string;
  content: string;
  featured_image: string;
  status: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  is_featured: boolean;
  author_ids: string[];
  category_ids: string[];
  primary_category_id: string;
}

export default function ArticleEditPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';

  const [form, setForm] = useState<ArticleForm>({
    title: '',
    slug: '',
    summary: '',
    content: '',
    featured_image: '',
    status: 'draft',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    is_featured: false,
    author_ids: [],
    category_ids: [],
    primary_category_id: '',
  });
  
  const [authors, setAuthors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [authorsRes, categoriesRes] = await Promise.all([
        fetch('/api/authors'),
        fetch('/api/categories'),
      ]);

      const authorsData = await authorsRes.json();
      const categoriesData = await categoriesRes.json();

      if (authorsData.success) setAuthors(authorsData.data);
      if (categoriesData.success) setCategories(categoriesData.data);

      if (!isNew) {
        fetchArticle();
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Veriler yüklenemedi');
    }
  };

  const fetchArticle = async () => {
    try {
      const res = await fetch(`/api/articles/${params.id}`);
      const data = await res.json();
      
      if (data.success) {
        const article = data.data;
        setForm({
          title: article.title,
          slug: article.slug,
          summary: article.summary || '',
          content: article.content || '',
          featured_image: article.featured_image || '',
          status: article.status,
          meta_title: article.meta_title || '',
          meta_description: article.meta_description || '',
          meta_keywords: article.meta_keywords || '',
          is_featured: article.is_featured || false,
          author_ids: article.authors?.map((a: any) => a.id) || [],
          category_ids: article.categories?.map((c: any) => c.id) || [],
          primary_category_id: article.categories?.find((c: any) => c.is_primary)?.id || '',
        });
      }
    } catch (error) {
      console.error('Fetch article error:', error);
      toast.error('Makale yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    const map: { [key: string]: string } = {
      'ç': 'c', 'ğ': 'g', 'ı': 'i', 'İ': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
      'Ç': 'c', 'Ğ': 'g', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
    };
    
    let slug = text.toLowerCase();
    Object.keys(map).forEach(key => {
      slug = slug.replace(new RegExp(key, 'g'), map[key]);
    });
    
    slug = slug.replace(/[^a-z0-9\s-]/g, '')
               .replace(/\s+/g, '-')
               .replace(/-+/g, '-')
               .trim();
    
    return slug;
  };

  const handleNameChange = (title: string) => {
    setForm({ ...form, title });
    if (isNew || !form.slug) {
      setForm({ ...form, title, slug: generateSlug(title) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = isNew ? '/api/articles' : `/api/articles/${params.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(isNew ? 'Makale oluşturuldu' : 'Makale güncellendi');
        router.push('/articles');
      } else {
        toast.error(data.error || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/articles"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNew ? 'Yeni Makale' : 'Makale Düzenle'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {!isNew && form.slug && (
              <a
                href={`http://localhost:3002/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Eye className="w-5 h-5 mr-2" />
                Önizleme
              </a>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ana İçerik */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Makale İçeriği</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Başlık *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="Makale başlığını girin..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: generateSlug(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Özet
                    </label>
                    <textarea
                      value={form.summary}
                      onChange={(e) => setForm({ ...form, summary: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="Makale özeti..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      İçerik *
                    </label>
                    <FrontendEditor
                      content={form.content}
                      onChange={(content) => setForm({ ...form, content })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Öne Çıkan Görsel URL
                    </label>
                    <input
                      type="url"
                      value={form.featured_image}
                      onChange={(e) => setForm({ ...form, featured_image: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Yan Panel */}
            <div className="space-y-6">
              {/* Yayın Ayarları */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Yayın Ayarları</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durum
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="draft">Taslak</option>
                      <option value="published">Yayında</option>
                      <option value="archived">Arşivlendi</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={form.is_featured}
                      onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_featured" className="ml-2 text-sm text-gray-700">
                      Öne Çıkan Makale
                    </label>
                  </div>
                </div>
              </div>

              {/* Yazarlar */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Yazarlar</h2>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {authors.map((author) => (
                    <label key={author.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={form.author_ids.includes(author.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm({ ...form, author_ids: [...form.author_ids, author.id] });
                          } else {
                            setForm({ ...form, author_ids: form.author_ids.filter(id => id !== author.id) });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{author.full_name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Kategoriler */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Kategoriler</h2>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={form.category_ids.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm({ ...form, category_ids: [...form.category_ids, category.id] });
                          } else {
                            setForm({ 
                              ...form, 
                              category_ids: form.category_ids.filter(id => id !== category.id),
                              primary_category_id: form.primary_category_id === category.id ? '' : form.primary_category_id
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{'  '.repeat(category.level)}{category.name}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ana Kategori
                  </label>
                  <select
                    value={form.primary_category_id}
                    onChange={(e) => setForm({ ...form, primary_category_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">Ana kategori seçin</option>
                    {categories
                      .filter(cat => form.category_ids.includes(cat.id))
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {'  '.repeat(cat.level)}{cat.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* SEO Ayarları */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">SEO Ayarları</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Başlık
                    </label>
                    <input
                      type="text"
                      value={form.meta_title}
                      onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                      placeholder={form.title || 'SEO başlığı...'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Açıklama
                    </label>
                    <textarea
                      value={form.meta_description}
                      onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                      rows={3}
                      placeholder={form.summary || 'SEO açıklaması...'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Anahtar Kelimeler
                    </label>
                    <input
                      type="text"
                      value={form.meta_keywords}
                      onChange={(e) => setForm({ ...form, meta_keywords: e.target.value })}
                      placeholder="anahtar, kelimeler, virgülle, ayrılmış"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Kaydet Butonu */}
          <div className="sticky bottom-0 bg-white border-t-2 border-blue-200 shadow-lg rounded-t-lg">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="text-sm text-gray-600">
                💾 Değişiklikler editörde tutulur. <strong>Kaydet butonuna basarak</strong> veritabanına kaydedin.
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/articles"
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-lg font-semibold"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {saving ? 'Veritabanına Kaydediliyor...' : 'Veritabanına Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

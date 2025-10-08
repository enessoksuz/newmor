'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { FileText, FolderTree, Users, Eye } from 'lucide-react';

interface Stats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalCategories: number;
  totalAuthors: number;
  totalViews: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalArticles: 0,
    publishedArticles: 0,
    draftArticles: 0,
    totalCategories: 0,
    totalAuthors: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const statsRes = await fetch('/api/stats');
      const statsData = await statsRes.json();

      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (error) {
      console.error('Stats fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Toplam Makale',
      value: stats.totalArticles,
      icon: FileText,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Yayınlanmış',
      value: stats.publishedArticles,
      icon: FileText,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Taslak',
      value: stats.draftArticles,
      icon: FileText,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Kategoriler',
      value: stats.totalCategories,
      icon: FolderTree,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Yazarlar',
      value: stats.totalAuthors,
      icon: Users,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Toplam Görüntülenme',
      value: stats.totalViews.toLocaleString('tr-TR'),
      icon: Eye,
      color: 'bg-pink-500',
      textColor: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            YeniMorFikir içerik yönetim sistemi
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {statCards.map((card) => (
              <div key={card.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className={`mt-2 text-3xl font-bold ${card.textColor}`}>
                      {card.value}
                    </p>
                  </div>
                  <div className={`${card.bgColor} p-3 rounded-lg`}>
                    <card.icon className={`w-8 h-8 ${card.textColor}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hoş Geldiniz!</h2>
          <p className="text-gray-600">
            YeniMorFikir admin paneline hoş geldiniz. Sol menüden makaleler, kategoriler ve yazarları yönetebilirsiniz.
          </p>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-500">✨ Hızlı işlemler için klavye kısayollarını kullanabilirsiniz</p>
            <p className="text-sm text-gray-500">🚀 Tüm değişiklikler anında PostgreSQL veritabanına kaydedilir</p>
            <p className="text-sm text-gray-500">🔍 SEO meta verileri otomatik olarak yönetilir</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

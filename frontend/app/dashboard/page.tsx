'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient, MonthlyStats } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<MonthlyStats[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [monthAlerts, setMonthAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/api/auth/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedSubject]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, subjectsData] = await Promise.all([
        apiClient.getMonthlyStats(selectedSubject || undefined),
        apiClient.getSubjects(),
      ]);
      setStats(statsData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBarClick = async (data: any) => {
    try {
      setSelectedMonth(data.month);
      const [year, month] = data.month.split('-');
      const alerts = await apiClient.getAlerts({
        subject: selectedSubject || undefined,
        year: parseInt(year),
        month: parseInt(month),
      });
      setMonthAlerts(alerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const viewAlertDetail = (id: string) => {
    router.push(`/alerts/${id}`);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Alert Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Hello, {user.name}</span>
            <a
              href="/api/auth/logout"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
            >
              Logout
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-gray-700 font-medium">Filter by Subject:</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            <a
              href="/alerts"
              className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              View All Alerts
            </a>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Alerts per Month</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" cursor="pointer" onClick={(data) => handleBarClick(data)} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Alert Details */}
        {selectedMonth && monthAlerts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Alerts for {selectedMonth}
              <button
                onClick={() => setSelectedMonth(null)}
                className="ml-4 text-sm text-gray-600 hover:text-gray-900"
              >
                (close)
              </button>
            </h2>
            <div className="space-y-3">
              {monthAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => viewAlertDetail(alert.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <div className="flex gap-3 mt-2 text-xs text-gray-500">
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        <span>{alert.metadata.location}</span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-800'
                          : alert.severity === 'HIGH'
                          ? 'bg-orange-100 text-orange-800'
                          : alert.severity === 'MEDIUM'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
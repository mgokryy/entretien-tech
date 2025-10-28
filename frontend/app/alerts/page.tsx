'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiClient, Alert } from '@/lib/api';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';

function groupByMonth(alerts: Alert[]) {
  return alerts.reduce<Record<string, Alert[]>>((acc, a) => {
    const d = new Date(a.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    (acc[key] ??= []).push(a);
    return acc;
  }, {});
}

export default function AlertsPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const grouped = useMemo(() => groupByMonth(alerts), [alerts]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/api/auth/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      (async () => {
        setLoading(true);
        try {
          const res = await apiClient.getAlerts();
          setAlerts(res);
        } catch (err) {
          console.error('Erreur lors du chargement des alertes:', err);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [user]);

  if (isLoading || loading) return <div className="p-6">Chargement…</div>;
  if (!user) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Alertes</h1>
        <Link href="/dashboard" className="ml-auto underline">← Retour dashboard</Link>
      </div>

      {Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, list]) => (
          <div key={month} className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-3">
              {month} <span className="text-sm text-gray-500">({list.length})</span>
            </h2>
            <ul className="divide-y">
              {list.map(a => (
                <li key={a.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{a.title}</div>
                    <div className="text-sm text-gray-600">
                      {a.severity} • {a.subject} • {new Date(a.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <Link
                    href={`/alerts/${a.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Détail
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  );
}

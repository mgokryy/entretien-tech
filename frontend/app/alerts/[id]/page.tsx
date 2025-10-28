'use client';

import { useEffect, useState } from 'react';
import { apiClient, Alert } from '@/lib/api';
import Link from 'next/link';

export default function AlertDetailPage({ params }: { params: { id: string } }) {
  const { id } = params; 

  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await apiClient.getAlert(id);
        setAlert(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-6">Chargement…</div>;

  if (!alert)
    return (
      <div className="p-6">
        <p className="mb-4">Alerte introuvable.</p>
        <Link href="/alerts" className="underline">
          ← Retour à la liste
        </Link>
      </div>
    );

  return (
    <div className="p-6 space-y-4">
      <Link href="/alerts" className="underline">
        ← Retour à la liste
      </Link>
      <h1 className="text-2xl font-bold">{alert.title}</h1>
      <p className="text-gray-700">{alert.message}</p>
      <div className="text-sm text-gray-600">
        <div><b>Severity:</b> {alert.severity}</div>
        <div><b>Subject:</b> {alert.subject}</div>
        <div><b>Date:</b> {new Date(alert.timestamp).toLocaleString()}</div>
      </div>
      <div>
        <h2 className="font-semibold mt-3 mb-1">Metadata</h2>
        <pre className="bg-gray-100 p-3 rounded">
          {JSON.stringify(alert.metadata, null, 2)}
        </pre>
      </div>
      <div className="text-sm text-gray-600">
        <b>ID:</b> {alert.id}
      </div>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { getAuditLogs } from '@/lib/auditService';
import type { AuditLog } from '@/types';
import { Badge } from '@/components/ui/Badge';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs({ limitCount: 200 }).then(l => { setLogs(l); setLoading(false); });
  }, []);

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-black text-white mb-6">Audit Logs ({logs.length})</h1>
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10">
            <tr className="text-left text-xs text-gray-500 uppercase tracking-widest">
              {['Actor', 'Action', 'Target', 'Time'].map(h => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.map(l => (
              <tr key={l.id} className="hover:bg-white/5">
                <td className="px-4 py-3">
                  <p className="text-white font-medium text-xs">{l.actorEmail}</p>
                  <Badge label={l.actorRole} variant="info" />
                </td>
                <td className="px-4 py-3 text-gray-300 text-xs font-mono">{l.action}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{l.targetId ? `${l.targetType}: ${l.targetId}` : l.details || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {l.createdAt?.toDate?.()?.toLocaleString() || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import type { AuditLogRecord } from '@/lib/db/audit-store';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadLogs() {
      try {
        const res = await fetch('/api/admin/audit-logs', {
          headers: { 'x-admin-key': 'nr-car-hire-admin-secret-2024' },
        });
        const data = await res.json();
        if (isMounted && data.success) {
          setLogs(data.data);
        }
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadLogs();
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: { 'x-admin-key': 'nr-car-hire-admin-secret-2024' },
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (err) {
      console.error('Failed to refresh audit logs:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Security & Audit Trail</h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable chronological logging of all administrative actions, vehicle adjustments,
            discount creations, and cancellations.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={refreshLogs}
          className="border-slate-700 bg-slate-800 text-slate-200"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold" />
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Admin / Actor</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Entity & ID</th>
                <th className="px-5 py-3">Metadata / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {logs.map((log) => {
                const date = new Date(log.createdAt).toLocaleString('en-AU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-3.5 text-slate-400">{date}</td>
                    <td className="px-5 py-3.5 text-slate-200 font-sans font-medium">
                      {log.adminId}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-full bg-slate-800 text-gold px-2.5 py-0.5 text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {log.entity}: <span className="text-slate-500">{log.entityId}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-sans text-xs">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

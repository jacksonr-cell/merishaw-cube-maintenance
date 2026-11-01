import React, { useState, useEffect } from 'react';
import type { AuditLog } from '../../types.ts';
import { api } from '../../api/client.ts';
import { ShieldCheck, RefreshCw, Filter, Search } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs({
        action: actionFilter !== 'all' ? actionFilter : undefined,
        limit: 100
      });
      setLogs(res.logs);
    } catch (err) {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Institutional Audit & Compliance Trail</h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable log of all user logins, ticket status transitions, staff dispatches, and accommodation updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="all">All Actions</option>
            <option value="USER_LOGIN">User Logins</option>
            <option value="TICKET_CREATED">Ticket Creations</option>
            <option value="TICKET_ASSIGNED">Staff Assignments</option>
            <option value="TICKET_STATUS_CHANGED">Status Transitions</option>
            <option value="WORK_LOG_ADDED">Work Logs</option>
            <option value="USER_CREATED">Account Creations</option>
          </select>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor (User)</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Recorded Details</th>
                <th className="py-3 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">Loading audit records...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-sans whitespace-nowrap">
                      {log.user_name ? (
                        <>
                          <span className="font-bold text-[#263238] block">{log.user_name}</span>
                          <span className="text-[10px] text-[#681C32] font-semibold capitalize">{log.user_role} ({log.user_code})</span>
                        </>
                      ) : (
                        <span className="text-slate-400 italic">System Event</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap text-[11px]">
                      {log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-700 text-[11px] max-w-md truncate">
                      {log.details_json || '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 text-[11px] whitespace-nowrap">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

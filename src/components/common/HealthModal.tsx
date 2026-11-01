import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.ts';
import { X, CheckCircle2, Database, Server, RefreshCw } from 'lucide-react';

interface HealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HealthModal: React.FC<HealthModalProps> = ({ isOpen, onClose }) => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (err) {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#681C32]" />
            <h2 className="text-sm font-bold text-[#263238]">System & Database Status</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {loading ? (
            <div className="py-8 text-center text-slate-400">Loading system status...</div>
          ) : health ? (
            <>
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>API Status: {health.status}</span>
                </div>
                <span className="font-mono text-emerald-700 text-[11px]">Database: {health.database}</span>
              </div>

              <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="flex justify-between">
                  <span className="text-slate-500">Service:</span>
                  <span className="font-medium text-slate-800">{health.system}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Database Engine:</span>
                  <span className="font-mono text-[#681C32] font-semibold flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-[#B99A55]" />
                    {health.engine}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Server Uptime:</span>
                  <span className="font-mono text-slate-800">{health.uptime_seconds}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Users in DB:</span>
                  <span className="font-mono text-slate-800">{health.records?.users}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Maintenance Tickets:</span>
                  <span className="font-mono text-slate-800">{health.records?.tickets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Server Timestamp:</span>
                  <span className="font-mono text-slate-500 text-[11px]">{health.timestamp}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-red-600">Unable to query backend health diagnostics.</p>
          )}

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="flex items-center gap-1 text-[#681C32] hover:text-[#4F1325] font-semibold hover:underline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Check
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import type { AdminMetrics } from '../../types.ts';
import { api } from '../../api/client.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { 
  Building2, Users, Wrench, Clock, AlertTriangle, 
  CheckCircle2, RefreshCw, Download, ArrowRight,
  TrendingUp, BarChart3, ShieldCheck
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
  onSelectTicket: (ticketId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
  onSelectTicket
}) => {
  const [stats, setStats] = useState<{
    metrics: AdminMetrics;
    statusCounts: Record<string, number>;
    faultDistribution: any[];
    requestsByBuilding: any[];
    staffWorkload: any[];
    recentActivities: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminStats();
      setStats(res);
    } catch (err) {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const metrics = stats?.metrics;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#681C32] mb-1">
            <ShieldCheck className="w-4 h-4 text-[#B99A55]" />
            <span>Campus Accommodation & Facility Management</span>
          </div>
          <h1 className="text-2xl font-bold text-[#263238]">
            Administrative Operations Center
          </h1>
          <p className="text-xs text-[#546E7A] mt-1">
            Institutional oversight of dormitory maintenance, technician assignments, and SLA performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={api.getExportCsvUrl()}
            download
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-[#263238] text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-[#B99A55]" />
            <span>Export CSV</span>
          </a>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-[#546E7A] transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-[#546E7A] font-semibold block">Total Requests</span>
          <span className="text-2xl font-bold text-[#263238] tabular-nums font-mono mt-0.5 block">
            {metrics?.totalTickets ?? '...'}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">All recorded</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-amber-800 font-semibold block">Awaiting Review</span>
          <span className="text-2xl font-bold text-amber-700 tabular-nums font-mono mt-0.5 block">
            {metrics?.awaitingReview ?? '...'}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">New submissions</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-blue-800 font-semibold block">Unassigned</span>
          <span className="text-2xl font-bold text-blue-700 tabular-nums font-mono mt-0.5 block">
            {metrics?.unassigned ?? '...'}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Pending staff allocation</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-sky-800 font-semibold block">Active Jobs</span>
          <span className="text-2xl font-bold text-sky-700 tabular-nums font-mono mt-0.5 block">
            {metrics?.activeJobs ?? '...'}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">In progress / parts</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-rose-800 font-semibold block">Overdue SLA</span>
          <span className="text-2xl font-bold text-rose-700 tabular-nums font-mono mt-0.5 block">
            {metrics?.overdueTickets ?? '...'}
          </span>
          <span className="text-[10px] text-rose-600 font-bold mt-1 block">Exceeded target SLA</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-emerald-800 font-semibold block">Resolved</span>
          <span className="text-2xl font-bold text-emerald-700 tabular-nums font-mono mt-0.5 block">
            {metrics?.resolvedCount ?? '...'}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Repairs completed</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-[#681C32] font-semibold block">Avg Resolution</span>
          <span className="text-2xl font-bold text-[#681C32] tabular-nums font-mono mt-0.5 block">
            {metrics?.avgResolutionHours ?? 0}h
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Ticket creation to close</span>
        </div>
      </div>

      {/* Two-Column Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fault Distribution by Category */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#681C32]" />
              <h3 className="text-sm font-bold text-[#263238]">Fault Distribution by Category</h3>
            </div>
            <span className="text-[11px] text-[#546E7A] font-semibold">Target SLA</span>
          </div>

          <div className="space-y-3">
            {stats?.faultDistribution.map((cat: any) => {
              const total = metrics?.totalTickets || 1;
              const percent = Math.round((cat.ticket_count / total) * 100);
              return (
                <div key={cat.id} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[#263238]">{cat.name}</span>
                    <span className="text-[#546E7A] font-mono">
                      {cat.ticket_count} tickets ({percent}%) · SLA: {cat.sla_hours}h
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#681C32] rounded-full transition-all"
                      style={{ width: `${Math.max(percent, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Requests by Residence Hall */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#681C32]" />
              <h3 className="text-sm font-bold text-[#263238]">Requests by Residential Building</h3>
            </div>
            <button
              onClick={() => onNavigate('locations')}
              className="text-xs font-bold text-[#681C32] hover:underline"
            >
              Manage Cubes →
            </button>
          </div>

          <div className="space-y-3">
            {stats?.requestsByBuilding.map((bld: any) => (
              <div key={bld.id} className="p-3 bg-[#F4F5F7] rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#263238]">{bld.name} ({bld.code})</p>
                  <p className="text-[11px] text-[#546E7A] mt-0.5">
                    {bld.resolved_count} of {bld.ticket_count} resolved
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold font-mono text-[#681C32]">{bld.ticket_count}</span>
                  <span className="text-[10px] text-slate-400 block">Total tickets</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Staff Workload & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance Staff Workload */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#681C32]" />
              <h3 className="text-sm font-bold text-[#263238]">Maintenance Technician Workload</h3>
            </div>
            <button
              onClick={() => onNavigate('tickets')}
              className="text-xs font-bold text-[#681C32] hover:underline"
            >
              Assign Jobs →
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {stats?.staffWorkload.length === 0 ? (
              <p className="py-4 text-[#546E7A] italic">No maintenance staff records found.</p>
            ) : (
              stats?.staffWorkload.map((stf: any) => (
                <div key={stf.staff_id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#263238]">{stf.staff_name}</p>
                    <p className="text-[11px] text-[#546E7A]">{stf.staff_trade || 'Technician'}</p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="font-bold text-amber-700 font-mono text-sm block">{stf.active_jobs}</span>
                      <span className="text-[10px] text-slate-400">Active</span>
                    </div>
                    <div>
                      <span className="font-bold text-emerald-700 font-mono text-sm block">{stf.completed_jobs}</span>
                      <span className="text-[10px] text-slate-400">Done</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Audit & Ticket Transitions Feed */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#681C32]" />
              <h3 className="text-sm font-bold text-[#263238]">Live Status Transitions</h3>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs font-bold text-[#681C32] hover:underline"
            >
              Full Audit Trail →
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {stats?.recentActivities.map((act: any) => (
              <div
                key={act.id}
                onClick={() => onSelectTicket(act.ticket_id)}
                className="p-2.5 rounded-lg border border-slate-200 hover:bg-[#FDF6F8] transition-colors cursor-pointer flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#681C32] text-[11px]">{act.reference_no}</span>
                    <StatusBadge status={act.new_status} />
                  </div>
                  <p className="text-[#263238] font-bold truncate max-w-xs mt-1">{act.ticket_title}</p>
                  <p className="text-[11px] text-[#546E7A] mt-0.5">
                    by {act.changed_by_name} ({act.changed_by_role})
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

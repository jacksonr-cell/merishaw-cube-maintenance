import React, { useState, useEffect } from 'react';
import type { Ticket, User } from '../../types.ts';
import { api } from '../../api/client.ts';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge.tsx';
import { QuickCubeReportCard } from './QuickCubeReportCard.tsx';
import { 
  Building2, Plus, Clock, CheckCircle2, AlertCircle, 
  ArrowRight, RefreshCw, FileText
} from 'lucide-react';

interface StudentDashboardProps {
  user: User;
  onOpenNewReport: () => void;
  onSelectTicket: (ticketId: string) => void;
  onViewAllTickets: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  onOpenNewReport,
  onSelectTicket,
  onViewAllTickets
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.getTickets({ limit: 10 });
      setTickets(res.tickets);
    } catch (err) {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const totalCount = tickets.length;
  const pendingCount = tickets.filter(t => t.status === 'Submitted' || t.status === 'Pending Review').length;
  const inProgressCount = tickets.filter(t => t.status === 'Assigned' || t.status === 'In Progress' || t.status === 'Awaiting Parts' || t.status === 'Awaiting Access').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

  const acc = user.accommodation;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Welcome Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#681C32] mb-1">
            <span>Student Accommodation Resident</span>
          </div>
          <h1 className="text-2xl font-bold text-[#263238]">
            Welcome, {user.full_name}
          </h1>
          <p className="text-xs text-[#546E7A] mt-1">
            Student ID: <span className="font-mono font-semibold text-[#263238]">{user.identifier_code}</span> · {user.department || 'Student Resident'}
          </p>
        </div>

        {/* Action Button */}
        <div className="shrink-0 flex items-center gap-3">
          <button
            onClick={onOpenNewReport}
            className="px-5 py-2.5 bg-[#681C32] hover:bg-[#4F1325] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 border border-[#501426]"
          >
            <Plus className="w-4 h-4 text-[#B99A55]" />
            <span>Report Maintenance Fault</span>
          </button>
        </div>
      </div>

      {/* Assigned Accommodation Card - Merishaw Maroon Banner with Gold Accents */}
      <div className="bg-[#681C32] text-white rounded-xl p-6 shadow-sm border border-[#501426]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#B99A55]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Assigned Dormitory & Cube Details
            </h2>
          </div>
          <span className="text-xs bg-[#4F1325] text-[#B99A55] border border-[#B99A55]/30 px-2.5 py-1 rounded font-semibold">
            Academic Year 2025/2026
          </span>
        </div>

        {acc ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-white/15">
            <div>
              <span className="text-[11px] text-white/70 block">Residence Hall</span>
              <p className="text-base font-bold text-white mt-0.5">{acc.building_name}</p>
              <span className="text-[10px] text-white/60">{acc.campus_zone}</span>
            </div>
            <div>
              <span className="text-[11px] text-white/70 block">Block / Floor</span>
              <p className="text-base font-bold text-white mt-0.5">{acc.block_name}</p>
              <span className="text-[10px] text-white/60">Floor #{acc.floor_number}</span>
            </div>
            <div>
              <span className="text-[11px] text-white/70 block">Room Number</span>
              <p className="text-base font-bold text-white mt-0.5">{acc.room_number}</p>
              <span className="text-[10px] text-white/60">Standard Residence Room</span>
            </div>
            <div>
              <span className="text-[11px] text-white/70 block">Assigned Cube / Bunk</span>
              <p className="text-base font-bold text-[#B99A55] mt-0.5">{acc.cube_label}</p>
              <span className="text-[10px] text-white/60">Cube #{acc.cube_number}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-white/80 italic">No assigned room or cube recorded for your account. Please visit the Accommodation Office.</p>
        )}
      </div>

      {/* Embedded Direct Cube Fault Key-In Section */}
      <QuickCubeReportCard
        user={user}
        onTicketCreated={() => {
          fetchTickets();
        }}
        onSelectTicket={onSelectTicket}
      />

      {/* Real KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-[#546E7A] font-semibold block">Total Reports</span>
          <span className="text-2xl font-bold text-[#263238] tabular-nums font-mono mt-1 block">{totalCount}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">Lifetime tickets submitted</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-amber-800 font-semibold block">Pending Triage</span>
          <span className="text-2xl font-bold text-amber-700 tabular-nums font-mono mt-1 block">{pendingCount}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">Awaiting admin review</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-blue-800 font-semibold block">Active Repairs</span>
          <span className="text-2xl font-bold text-blue-700 tabular-nums font-mono mt-1 block">{inProgressCount}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">Assigned or in progress</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-emerald-800 font-semibold block">Resolved</span>
          <span className="text-2xl font-bold text-emerald-700 tabular-nums font-mono mt-1 block">{resolvedCount}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">Completed repairs</span>
        </div>
      </div>

      {/* Recent Maintenance Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#681C32]" />
            <h3 className="text-sm font-bold text-[#263238]">Recent Maintenance Requests</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchTickets}
              disabled={loading}
              className="text-xs text-[#546E7A] hover:text-[#263238] flex items-center gap-1 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={onViewAllTickets}
              className="text-xs font-bold text-[#681C32] hover:text-[#4F1325] flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F4F5F7] border-b border-slate-200 text-[#546E7A] font-semibold">
                <th className="py-3 px-4">Ticket Ref</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#546E7A]">Loading your reports...</td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#546E7A]">
                    <p className="text-sm">You haven't submitted any maintenance requests yet.</p>
                    <button
                      onClick={onOpenNewReport}
                      className="mt-3 px-4 py-2 bg-[#681C32] hover:bg-[#4F1325] text-white rounded-lg font-bold inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-4 h-4 text-[#B99A55]" />
                      Report your first issue
                    </button>
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTicket(t.id)}
                    className="hover:bg-[#FDF6F8] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#681C32] whitespace-nowrap">
                      {t.reference_no}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#263238] max-w-xs truncate">
                      {t.title}
                    </td>
                    <td className="py-3.5 px-4 text-[#546E7A] whitespace-nowrap">
                      {t.cube_label || `Room ${t.room_number}`}
                    </td>
                    <td className="py-3.5 px-4 text-[#546E7A] whitespace-nowrap">
                      {t.category_name}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[#546E7A] whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
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

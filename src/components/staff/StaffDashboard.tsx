import React, { useState, useEffect } from 'react';
import type { Ticket, User } from '../../types.ts';
import { api } from '../../api/client.ts';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge.tsx';
import { 
  Wrench, CheckCircle2, Clock, AlertTriangle, 
  MapPin, RefreshCw, Search
} from 'lucide-react';

interface StaffDashboardProps {
  user: User;
  onSelectTicket: (ticketId: string) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  user,
  onSelectTicket
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'my_active' | 'awaiting' | 'completed' | 'all'>('my_active');
  const [search, setSearch] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.getTickets({
        staff_id: filterMode === 'all' ? undefined : user.id,
        status: filterMode === 'awaiting' ? 'Assigned' : filterMode === 'completed' ? 'Resolved' : undefined,
        search: search.trim() || undefined,
        limit: 50
      });
      setTickets(res.tickets);
    } catch (err) {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filterMode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  // Quick stats
  const activeCount = tickets.filter(t => t.assigned_to_staff_id === user.id && ['Assigned', 'In Progress', 'Awaiting Parts', 'Awaiting Access'].includes(t.status)).length;
  const inProgressCount = tickets.filter(t => t.assigned_to_staff_id === user.id && t.status === 'In Progress').length;
  const awaitingPartsCount = tickets.filter(t => t.assigned_to_staff_id === user.id && (t.status === 'Awaiting Parts' || t.status === 'Awaiting Access')).length;
  const completedCount = tickets.filter(t => t.assigned_to_staff_id === user.id && (t.status === 'Resolved' || t.status === 'Closed')).length;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Staff Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#681C32] mb-1">
            <Wrench className="w-4 h-4 text-[#B99A55]" />
            <span>Facilities Maintenance Operations</span>
          </div>
          <h1 className="text-2xl font-bold text-[#263238]">
            Technician Workbench: {user.full_name}
          </h1>
          <p className="text-xs text-[#546E7A] mt-1">
            Staff ID: <span className="font-mono font-semibold text-[#263238]">{user.identifier_code}</span> · Trade / Department: <strong className="text-[#681C32]">{user.department || 'General Maintenance'}</strong>
          </p>
        </div>
      </div>

      {/* Staff Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-[#546E7A] font-semibold block">Total Assigned</span>
          <span className="text-2xl font-bold text-[#263238] tabular-nums font-mono mt-1 block">{activeCount + completedCount}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">Work orders assigned</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-blue-800 font-semibold block">In Progress</span>
          <span className="text-2xl font-bold text-blue-700 tabular-nums font-mono mt-1 block">{inProgressCount}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">Currently on site</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-amber-800 font-semibold block">Awaiting Parts / Access</span>
          <span className="text-2xl font-bold text-amber-700 tabular-nums font-mono mt-1 block">{awaitingPartsCount}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">Pending requisitions</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-emerald-800 font-semibold block">Completed Jobs</span>
          <span className="text-2xl font-bold text-emerald-700 tabular-nums font-mono mt-1 block">{completedCount}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">Repaired & verified</span>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 p-1 bg-[#F4F5F7] rounded-lg">
          <button
            onClick={() => setFilterMode('my_active')}
            className={`px-3 py-1.5 font-semibold rounded-md transition-all ${
              filterMode === 'my_active' ? 'bg-[#681C32] text-white shadow-xs' : 'text-[#546E7A] hover:text-[#263238]'
            }`}
          >
            My Active Queue
          </button>
          <button
            onClick={() => setFilterMode('awaiting')}
            className={`px-3 py-1.5 font-semibold rounded-md transition-all ${
              filterMode === 'awaiting' ? 'bg-[#681C32] text-white shadow-xs' : 'text-[#546E7A] hover:text-[#263238]'
            }`}
          >
            New Assignments
          </button>
          <button
            onClick={() => setFilterMode('completed')}
            className={`px-3 py-1.5 font-semibold rounded-md transition-all ${
              filterMode === 'completed' ? 'bg-[#681C32] text-white shadow-xs' : 'text-[#546E7A] hover:text-[#263238]'
            }`}
          >
            Resolved Jobs
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 font-semibold rounded-md transition-all ${
              filterMode === 'all' ? 'bg-[#681C32] text-white shadow-xs' : 'text-[#546E7A] hover:text-[#263238]'
            }`}
          >
            All Facility Jobs
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search job reference or room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#681C32]"
          />
        </form>

        <button
          onClick={fetchJobs}
          disabled={loading}
          className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-[#546E7A] shrink-0 transition-colors"
          title="Refresh job list"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Jobs Work Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F4F5F7] border-b border-slate-200 text-[#546E7A] font-semibold">
                <th className="py-3 px-4">Work Order</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Location (Cube/Room)</th>
                <th className="py-3 px-4">Category & Item</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#546E7A]">Loading technician jobs...</td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#546E7A]">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                    <p className="font-semibold text-[#263238]">No maintenance jobs in this view.</p>
                    <p className="text-[11px] text-[#546E7A] mt-1">All assigned tasks are up to date.</p>
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
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#263238] max-w-xs truncate">{t.title}</p>
                      <p className="text-[11px] text-[#546E7A] max-w-xs truncate mt-0.5">{t.description}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold text-[#263238]">
                        <MapPin className="w-3.5 h-3.5 text-[#B99A55] shrink-0" />
                        <span>{t.cube_label || `Room ${t.room_number}`}</span>
                      </div>
                      <span className="text-[10px] text-[#546E7A] block pl-5">{t.building_name} · {t.block_name}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-[#263238]">{t.category_name}</span>
                      <span className="text-[10px] text-[#546E7A] block">{t.affected_item}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {t.staff_name ? (
                        <span className={`font-semibold ${t.assigned_to_staff_id === user.id ? 'text-[#681C32] font-bold' : 'text-[#263238]'}`}>
                          {t.assigned_to_staff_id === user.id ? 'You' : t.staff_name}
                        </span>
                      ) : (
                        <span className="text-amber-800 font-semibold">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket(t.id);
                        }}
                        className="px-3 py-1 bg-[#681C32] hover:bg-[#4F1325] text-white rounded font-bold text-xs shadow-xs transition-colors border border-[#501426]"
                      >
                        Update Job →
                      </button>
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

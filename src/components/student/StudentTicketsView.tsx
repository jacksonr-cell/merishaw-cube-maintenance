import React, { useState, useEffect } from 'react';
import type { Ticket, FaultCategory } from '../../types.ts';
import { api } from '../../api/client.ts';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge.tsx';
import { Search, Plus, Filter, RefreshCw, FileText } from 'lucide-react';

interface StudentTicketsViewProps {
  onSelectTicket: (ticketId: string) => void;
  onOpenNewReport: () => void;
}

export const StudentTicketsView: React.FC<StudentTicketsViewProps> = ({
  onSelectTicket,
  onOpenNewReport
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<FaultCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const [ticketRes, catRes] = await Promise.all([
        api.getTickets({
          status: statusFilter,
          category: categoryFilter,
          search: search.trim() || undefined
        }),
        api.getCategories()
      ]);
      setTickets(ticketRes.tickets);
      setCategories(catRes.categories);
    } catch (err) {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#263238]">My Maintenance Reports</h1>
          <p className="text-xs text-[#546E7A] mt-1">
            Track real-time progress, technician assignments, and repair updates for your cube.
          </p>
        </div>
        <button
          onClick={onOpenNewReport}
          className="px-4 py-2 bg-[#681C32] hover:bg-[#4F1325] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 border border-[#501426] transition-all"
        >
          <Plus className="w-4 h-4 text-[#B99A55]" />
          <span>New Maintenance Report</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket reference, title, or item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#681C32]"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#F4F5F7] border border-slate-300 rounded-lg text-[#263238] font-semibold focus:ring-2 focus:ring-[#681C32] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted (Pending)</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Awaiting Parts">Awaiting Parts</option>
            <option value="Awaiting Access">Awaiting Access</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
            <option value="Reopened">Reopened</option>
          </select>

          {/* Category selector */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-[#F4F5F7] border border-slate-300 rounded-lg text-[#263238] font-semibold focus:ring-2 focus:ring-[#681C32] focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={fetchTickets}
            disabled={loading}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-[#546E7A] transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Ticket List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F4F5F7] border-b border-slate-200 text-[#546E7A] font-semibold">
                <th className="py-3 px-4">Ticket Ref</th>
                <th className="py-3 px-4">Subject & Description</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Technician</th>
                <th className="py-3 px-4 text-right">Date Logged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#546E7A]">Loading reports...</td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#546E7A]">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-[#263238]">No maintenance tickets found matching criteria.</p>
                    <p className="text-[11px] text-[#546E7A] mt-1">Try resetting filters or submit a new report.</p>
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
                      <p className="font-bold text-[#263238] max-w-sm truncate">{t.title}</p>
                      <p className="text-[11px] text-[#546E7A] max-w-sm truncate mt-0.5">{t.description}</p>
                    </td>
                    <td className="py-3.5 px-4 text-[#546E7A] whitespace-nowrap">
                      <span className="font-semibold text-[#263238]">{t.cube_label}</span>
                      <span className="text-slate-400 block text-[10px]">{t.building_name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#546E7A] whitespace-nowrap">
                      <span className="font-medium text-[#263238]">{t.category_name}</span>
                      <span className="text-slate-400 block text-[10px]">{t.affected_item}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {t.staff_name ? (
                        <span className="text-emerald-800 font-semibold">{t.staff_name}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[#546E7A] whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
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

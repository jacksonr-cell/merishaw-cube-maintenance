import React, { useState, useEffect } from 'react';
import type { Ticket, FaultCategory, Building, User } from '../../types.ts';
import { api } from '../../api/client.ts';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge.tsx';
import { Search, Download, RefreshCw, Filter, UserCheck, Wrench } from 'lucide-react';

interface AdminTicketListProps {
  onSelectTicket: (ticketId: string) => void;
  staffList: User[];
  onTicketAssigned: () => void;
}

export const AdminTicketList: React.FC<AdminTicketListProps> = ({
  onSelectTicket,
  staffList,
  onTicketAssigned
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<FaultCategory[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');

  // Quick Assign Modal
  const [assigningTicket, setAssigningTicket] = useState<Ticket | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const [ticketRes, catRes, bldRes] = await Promise.all([
        api.getTickets({
          status: statusFilter,
          category: categoryFilter,
          priority: priorityFilter,
          building_id: buildingFilter,
          staff_id: staffFilter === 'unassigned' ? 'unassigned' : staffFilter !== 'all' ? staffFilter : undefined,
          search: search.trim() || undefined,
          limit: 100
        }),
        api.getCategories(),
        api.getBuildings()
      ]);
      setTickets(ticketRes.tickets);
      setCategories(catRes.categories);
      setBuildings(bldRes.buildings);
    } catch (err) {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, categoryFilter, priorityFilter, buildingFilter, staffFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  const handleConfirmAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTicket || !selectedStaffId) return;
    setSubmittingAssign(true);
    try {
      await api.assignTicket(assigningTicket.id, {
        staff_id: selectedStaffId,
        notes: assignNotes || undefined
      });
      setAssigningTicket(null);
      setSelectedStaffId('');
      setAssignNotes('');
      await fetchTickets();
      onTicketAssigned();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingAssign(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#263238]">Institutional Maintenance Requests</h1>
          <p className="text-xs text-[#546E7A] mt-1">
            Review, prioritize, and allocate dormitory repair tickets across campus accommodation blocks.
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
            onClick={fetchTickets}
            disabled={loading}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-[#546E7A] transition-colors"
            title="Refresh ticket records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Multi-Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search reference (e.g. MSH-2026-0001), student name, room, or issue description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#681C32]"
          />
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {/* Status */}
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

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-[#F4F5F7] border border-slate-300 rounded-lg text-[#263238] font-semibold focus:ring-2 focus:ring-[#681C32] focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="emergency">Emergency / Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Building */}
          <select
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="px-3 py-2 bg-[#F4F5F7] border border-slate-300 rounded-lg text-[#263238] font-semibold focus:ring-2 focus:ring-[#681C32] focus:outline-none"
          >
            <option value="all">All Halls / Dorms</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Category */}
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

          {/* Staff */}
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="px-3 py-2 bg-[#F4F5F7] border border-slate-300 rounded-lg text-[#263238] font-semibold focus:ring-2 focus:ring-[#681C32] focus:outline-none"
          >
            <option value="all">All Staff Allocations</option>
            <option value="unassigned">Unassigned Only</option>
            {staffList.map((stf) => (
              <option key={stf.id} value={stf.id}>{stf.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ticket Management Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F4F5F7] border-b border-slate-200 text-[#546E7A] font-semibold">
                <th className="py-3 px-4">Ticket Ref</th>
                <th className="py-3 px-4">Title & Details</th>
                <th className="py-3 px-4">Location (Cube/Room)</th>
                <th className="py-3 px-4">Reporter</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#546E7A]">Loading maintenance records...</td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#546E7A]">
                    No tickets found matching the specified filter criteria.
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
                      <span className="text-[10px] text-[#546E7A]">{t.category_name} · {t.affected_item}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <strong className="text-[#263238] block font-bold">{t.cube_label || `Room ${t.room_number}`}</strong>
                      <span className="text-[10px] text-[#546E7A]">{t.building_name} · {t.block_name}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-[#263238] block">{t.student_name}</span>
                      <span className="font-mono text-[10px] text-[#546E7A]">{t.student_code}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {t.staff_name ? (
                        <span className="text-emerald-800 font-semibold">{t.staff_name}</span>
                      ) : (
                        <span className="text-amber-800 italic font-semibold">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAssigningTicket(t);
                          setSelectedStaffId(t.assigned_to_staff_id || '');
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-[#681C32] bg-[#FDF6F8] hover:bg-[#F9E8ED] rounded border border-[#F2CBD5] transition-colors"
                      >
                        {t.assigned_to_staff_id ? 'Reassign' : 'Assign'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Assign Modal */}
      {assigningTicket && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-[#F4F5F7]">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#681C32]" />
                <h3 className="font-bold text-[#263238] text-sm">Assign Maintenance Technician</h3>
              </div>
              <button
                onClick={() => setAssigningTicket(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmAssignment} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-[#FDF6F8] rounded-lg border border-[#F2CBD5] text-[#263238] space-y-1">
                <p><span className="text-[#546E7A]">Ticket:</span> <strong>{assigningTicket.reference_no}</strong> - {assigningTicket.title}</p>
                <p><span className="text-[#546E7A]">Location:</span> {assigningTicket.building_name} ({assigningTicket.cube_label})</p>
                <p><span className="text-[#546E7A]">Category:</span> {assigningTicket.category_name}</p>
              </div>

              <div>
                <label className="block text-[#263238] font-semibold mb-1">Select Technician <span className="text-red-500">*</span></label>
                <select
                  required
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#681C32] text-[#263238] font-semibold focus:outline-none"
                >
                  <option value="">Choose Staff Member...</option>
                  {staffList.map((stf) => (
                    <option key={stf.id} value={stf.id}>
                      {stf.full_name} ({stf.department || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#263238] font-semibold mb-1">Assignment Instructions / Dispatch Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please bring electrical multimeter and replacement double socket plate..."
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[#263238] focus:ring-2 focus:ring-[#681C32] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningTicket(null)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-[#263238] hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssign || !selectedStaffId}
                  className="px-4 py-1.5 bg-[#681C32] hover:bg-[#4F1325] text-white rounded-lg font-bold disabled:opacity-50 transition-colors border border-[#501426]"
                >
                  {submittingAssign ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

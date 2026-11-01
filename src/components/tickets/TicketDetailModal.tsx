import React, { useState, useEffect } from 'react';
import type { Ticket, TicketStatusHistory, WorkLog, TicketComment, User, TicketStatus, Priority } from '../../types.ts';
import { api } from '../../api/client.ts';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge.tsx';
import { 
  X, Clock, Building2, User as UserIcon, Wrench, 
  Send, AlertTriangle, CheckCircle2, ShieldAlert
} from 'lucide-react';

interface TicketDetailModalProps {
  ticketId: string | null;
  onClose: () => void;
  currentUser: User | null;
  onTicketUpdated: () => void;
  availableStaff?: User[];
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticketId,
  onClose,
  currentUser,
  onTicketUpdated,
  availableStaff = []
}) => {
  const [data, setData] = useState<{
    ticket: Ticket;
    statusHistory: TicketStatusHistory[];
    workLogs: WorkLog[];
    comments: TicketComment[];
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Comment input
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Status transition form
  const [statusAction, setStatusAction] = useState<TicketStatus | ''>('');
  const [statusNotes, setStatusNotes] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Work log form
  const [showWorkLogForm, setShowWorkLogForm] = useState(false);
  const [actionTaken, setActionTaken] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [timeSpent, setTimeSpent] = useState('30');
  const [workLogSubmitting, setWorkLogSubmitting] = useState(false);

  // Assignment form (Admin)
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<Priority>('medium');
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const fetchDetails = async () => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTicketDetails(ticketId);
      setData(res);
      setSelectedStaffId(res.ticket.assigned_to_staff_id || '');
      setSelectedPriority(res.ticket.priority);
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchDetails();
      setStatusAction('');
      setShowWorkLogForm(false);
      setShowAssignForm(false);
    }
  }, [ticketId]);

  if (!ticketId) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommentSubmitting(true);
    try {
      await api.addComment(ticketId, { message: newComment.trim() });
      setNewComment('');
      await fetchDetails();
      onTicketUpdated();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusAction) return;
    setStatusSubmitting(true);
    try {
      await api.updateTicketStatus(ticketId, {
        status: statusAction,
        notes: statusNotes,
        resolution_summary: resolutionSummary,
        materials_used_summary: materialsUsed,
        rejection_reason: rejectionReason
      });
      setStatusAction('');
      setStatusNotes('');
      setResolutionSummary('');
      setMaterialsUsed('');
      setRejectionReason('');
      await fetchDetails();
      onTicketUpdated();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleAddWorkLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTaken.trim()) return;
    setWorkLogSubmitting(true);
    try {
      await api.addWorkLog(ticketId, {
        action_taken: actionTaken.trim(),
        parts_used: partsUsed.trim() || undefined,
        time_spent_minutes: parseInt(timeSpent, 10) || 30
      });
      setActionTaken('');
      setPartsUsed('');
      setShowWorkLogForm(false);
      await fetchDetails();
      onTicketUpdated();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setWorkLogSubmitting(false);
    }
  };

  const handleAssignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) return;
    setAssignSubmitting(true);
    try {
      await api.assignTicket(ticketId, {
        staff_id: selectedStaffId,
        priority: selectedPriority
      });
      setShowAssignForm(false);
      await fetchDetails();
      onTicketUpdated();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAssignSubmitting(false);
    }
  };

  const ticket = data?.ticket;
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';
  const isStaff = currentUser?.role === 'staff';
  const isStudent = currentUser?.role === 'student';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-[#681C32] bg-[#681C32]/10 border border-[#B99A55]/30 px-2.5 py-1 rounded">
              {ticket?.reference_no || 'Ticket Loading...'}
            </span>
            {ticket && (
              <>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {loading && !data ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading ticket information...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">{error}</div>
        ) : ticket ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title & Description Header */}
            <div>
              <h2 className="text-xl font-bold text-[#263238]">{ticket.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>Category: <strong className="text-[#263238]">{ticket.category_name}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Item: <strong className="text-[#263238]">{ticket.affected_item}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Submitted: <strong className="text-[#263238]">{new Date(ticket.created_at).toLocaleString()}</strong></span>
              </div>
              <div className="mt-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-sm text-[#263238] leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </div>
            </div>

            {/* Emergency Escalation Flag if applicable */}
            {ticket.is_escalated === 1 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>
                  <strong>Safety Escalation Flagged:</strong> {ticket.escalation_reason || 'High hazard level reported. Prioritized for immediate inspection.'}
                </span>
              </div>
            )}

            {/* Two-Column Information Strip: Location & Assigned Personnel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Location Card */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-xs">
                <div className="flex items-center gap-1.5 font-semibold text-[#681C32] mb-2">
                  <Building2 className="w-4 h-4 text-[#B99A55]" />
                  <span>Cube Location Details</span>
                </div>
                <div className="space-y-1 text-slate-600">
                  <p><span className="text-slate-400">Building:</span> <strong className="text-[#263238]">{ticket.building_name}</strong> ({ticket.building_code})</p>
                  <p><span className="text-slate-400">Block / Floor:</span> {ticket.block_name}</p>
                  <p><span className="text-slate-400">Room Number:</span> <strong className="text-[#263238]">{ticket.room_number}</strong></p>
                  <p><span className="text-slate-400">Cube / Bunk:</span> <span className="font-semibold text-[#681C32]">{ticket.cube_label}</span></p>
                </div>
              </div>

              {/* Stakeholders Card */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 font-semibold text-[#681C32]">
                    <UserIcon className="w-4 h-4 text-[#B99A55]" />
                    <span>Resident & Technician</span>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAssignForm(!showAssignForm)}
                      className="text-[#681C32] font-semibold hover:underline text-[11px]"
                    >
                      {ticket.assigned_to_staff_id ? 'Reassign' : 'Assign Staff'}
                    </button>
                  )}
                </div>
                <div className="space-y-1 text-slate-600">
                  <p><span className="text-slate-400">Resident:</span> <strong className="text-slate-800">{ticket.student_name}</strong> ({ticket.student_code})</p>
                  <p>
                    <span className="text-slate-400">Assigned Technician:</span>{' '}
                    {ticket.staff_name ? (
                      <span className="font-semibold text-emerald-800">{ticket.staff_name} ({ticket.staff_trade || 'Maintenance'})</span>
                    ) : (
                      <span className="text-amber-700 italic font-medium">Unassigned</span>
                    )}
                  </p>
                  {ticket.resolved_at && (
                    <p><span className="text-slate-400">Resolved Date:</span> {new Date(ticket.resolved_at).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Assignment Inline Form */}
            {showAssignForm && isAdmin && (
              <form onSubmit={handleAssignStaff} className="p-4 bg-[#FDF6F8] border border-[#B99A55]/30 rounded-lg text-xs space-y-3">
                <h4 className="font-semibold text-[#681C32]">Assign Maintenance Technician</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Technician</label>
                    <select
                      value={selectedStaffId}
                      onChange={(e) => setSelectedStaffId(e.target.value)}
                      required
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#681C32]"
                    >
                      <option value="">Select Technician...</option>
                      {availableStaff.map((stf) => (
                        <option key={stf.id} value={stf.id}>
                          {stf.full_name} ({stf.department || 'Staff'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Priority Override</label>
                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value as Priority)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#681C32]"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAssignForm(false)}
                    className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assignSubmitting}
                    className="px-3 py-1 bg-[#681C32] text-white rounded font-medium hover:bg-[#4F1325] border border-[#501426] disabled:opacity-50 transition-colors"
                  >
                    {assignSubmitting ? 'Saving...' : 'Confirm Assignment'}
                  </button>
                </div>
              </form>
            )}

            {/* Resolution Information Banner if Resolved */}
            {ticket.resolution_summary && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Work Completed & Resolution Summary</span>
                </div>
                <p className="text-emerald-950 leading-relaxed font-medium mt-1">{ticket.resolution_summary}</p>
                {ticket.materials_used_summary && (
                  <p className="text-slate-600 pt-1">
                    <span className="text-slate-400">Parts / Materials Consumed:</span> {ticket.materials_used_summary}
                  </p>
                )}
              </div>
            )}

            {/* Status Change / Action Bar for Staff or Admin */}
            {(isAdmin || isStaff || (isStudent && ticket.status === 'Resolved')) && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <span className="font-semibold text-slate-800">Workflow Action:</span>
                  <div className="flex flex-wrap gap-2">
                    {/* Staff Actions */}
                    {isStaff && ticket.status === 'Assigned' && (
                      <button
                        onClick={() => setStatusAction('In Progress')}
                        className="px-3 py-1.5 bg-[#681C32] text-white rounded font-medium hover:bg-[#4F1325] border border-[#501426] shadow-xs transition-colors"
                      >
                        Accept & Start Job
                      </button>
                    )}
                    {isStaff && ticket.status === 'In Progress' && (
                      <>
                        <button
                          onClick={() => setStatusAction('Resolved')}
                          className="px-3 py-1.5 bg-emerald-700 text-white rounded font-medium hover:bg-emerald-800 shadow-xs"
                        >
                          Mark as Resolved
                        </button>
                        <button
                          onClick={() => setStatusAction('Awaiting Parts')}
                          className="px-3 py-1.5 bg-amber-600 text-white rounded font-medium hover:bg-amber-700 shadow-xs"
                        >
                          Awaiting Parts
                        </button>
                        <button
                          onClick={() => setStatusAction('Awaiting Access')}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 shadow-xs"
                        >
                          Awaiting Room Access
                        </button>
                      </>
                    )}
                    {/* Student Confirmation */}
                    {isStudent && ticket.status === 'Resolved' && (
                      <>
                        <button
                          onClick={() => setStatusAction('Closed')}
                          className="px-3 py-1.5 bg-emerald-700 text-white rounded font-medium hover:bg-emerald-800"
                        >
                          Confirm & Close Ticket
                        </button>
                        <button
                          onClick={() => setStatusAction('Reopened')}
                          className="px-3 py-1.5 bg-rose-700 text-white rounded font-medium hover:bg-rose-800"
                        >
                          Problem Still Exists (Reopen)
                        </button>
                      </>
                    )}
                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <select
                          value={statusAction}
                          onChange={(e) => setStatusAction(e.target.value as TicketStatus)}
                          className="px-2.5 py-1.5 bg-white border border-slate-300 rounded font-medium"
                        >
                          <option value="">Select Status Transition...</option>
                          <option value="Pending Review">Pending Review</option>
                          <option value="Assigned">Assigned</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Awaiting Parts">Awaiting Parts</option>
                          <option value="Awaiting Access">Awaiting Access</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                          <option value="Reopened">Reopened</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-form if statusAction chosen */}
                {statusAction && (
                  <form onSubmit={handleUpdateStatus} className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                    <p className="font-semibold text-[#681C32]">
                      Confirm transition to: <span className="underline">{statusAction}</span>
                    </p>

                    {statusAction === 'Resolved' && (
                      <>
                        <div>
                          <label className="block text-slate-700 font-medium mb-1">
                            Repair Details / Resolution Summary <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            required
                            rows={2}
                            placeholder="Describe exact repair performed, tests conducted, and confirm the fixture is safe..."
                            value={resolutionSummary}
                            onChange={(e) => setResolutionSummary(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-medium mb-1">
                            Parts & Materials Used (optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 1x 13A socket faceplate, 2x 25mm mounting screws"
                            value={materialsUsed}
                            onChange={(e) => setMaterialsUsed(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                          />
                        </div>
                      </>
                    )}

                    {statusAction === 'Rejected' && (
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">
                          Reason for Rejection <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          required
                          rows={2}
                          placeholder="State why this report cannot be addressed (e.g. resident personal property, duplicate report)..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                        />
                      </div>
                    )}

                    {(statusAction === 'Awaiting Parts' || statusAction === 'Awaiting Access' || statusAction === 'Reopened') && (
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">
                          Explanation / Notes <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          required
                          rows={2}
                          placeholder="Provide details on parts requisitioned, tenant access scheduling, or reason for reopening..."
                          value={statusNotes}
                          onChange={(e) => setStatusNotes(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                        />
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setStatusAction('')}
                        className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={statusSubmitting}
                        className="px-3 py-1 bg-[#681C32] text-white rounded font-medium hover:bg-[#4F1325] border border-[#501426] disabled:opacity-50 transition-colors"
                      >
                        {statusSubmitting ? 'Updating...' : 'Save Status Change'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Work Logs Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#263238] flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#681C32]" />
                  <span>Technical Work Logs ({data.workLogs.length})</span>
                </h3>
                {(isStaff || isAdmin) && !showWorkLogForm && (
                  <button
                    onClick={() => setShowWorkLogForm(true)}
                    className="text-xs text-[#681C32] font-semibold hover:underline"
                  >
                    + Record Work Done
                  </button>
                )}
              </div>

              {/* Add Work Log Form */}
              {showWorkLogForm && (
                <form onSubmit={handleAddWorkLog} className="p-4 bg-[#FDF6F8] border border-[#B99A55]/30 rounded-lg text-xs space-y-3">
                  <h4 className="font-semibold text-[#681C32]">Record Maintenance Activity</h4>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Action Taken / Inspection Findings <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="e.g. Inspected circuit, re-terminated damaged wiring, verified continuity..."
                      value={actionTaken}
                      onChange={(e) => setActionTaken(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white text-[#263238] focus:ring-2 focus:ring-[#681C32]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Parts Used (if any)</label>
                      <input
                        type="text"
                        placeholder="e.g. 1x Fuse 13A"
                        value={partsUsed}
                        onChange={(e) => setPartsUsed(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-[#263238] focus:ring-2 focus:ring-[#681C32]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Time Spent (Minutes)</label>
                      <input
                        type="number"
                        min={5}
                        step={5}
                        value={timeSpent}
                        onChange={(e) => setTimeSpent(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-[#263238] focus:ring-2 focus:ring-[#681C32]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowWorkLogForm(false)}
                      className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={workLogSubmitting}
                      className="px-3 py-1 bg-[#681C32] text-white rounded font-medium hover:bg-[#4F1325] border border-[#501426] disabled:opacity-50 transition-colors"
                    >
                      {workLogSubmitting ? 'Recording...' : 'Add Work Log'}
                    </button>
                  </div>
                </form>
              )}

              {data.workLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                  No technician work logs have been submitted yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {data.workLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="font-semibold text-[#263238]">{log.staff_name}</span>
                        <span className="font-mono">{log.time_spent_minutes} mins · {new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-[#263238] font-medium">{log.action_taken}</p>
                      {log.parts_used && (
                        <p className="text-slate-500 mt-1"><span className="text-slate-400">Materials:</span> {log.parts_used}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit & Status History Timeline */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#263238] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#681C32]" />
                <span>Ticket Lifecycle & Status Timeline</span>
              </h3>
              <div className="relative pl-6 border-l-2 border-[#B99A55]/40 space-y-4 text-xs">
                {data.statusHistory.map((item, idx) => (
                  <div key={item.id} className="relative">
                    <div className="absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-[#681C32] border-2 border-white shadow-xs" />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#263238]">
                        {item.new_status}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(item.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">
                      Updated by <strong className="text-slate-700">{item.changed_by_name}</strong> ({item.changed_by_role})
                    </p>
                    {item.notes && (
                      <p className="text-[#263238] italic mt-0.5 bg-slate-50 p-2 rounded border border-slate-200/80">
                        "{item.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Clarification & Message Thread */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <h3 className="text-sm font-bold text-[#263238]">
                Clarification Messages & Notes
              </h3>

              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {data.comments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No clarification messages exchanged yet.</p>
                ) : (
                  data.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-3 rounded-lg text-xs leading-relaxed ${
                        comment.author_role === 'student'
                          ? 'bg-slate-100/90 text-[#263238] ml-0 mr-12'
                          : 'bg-[#FDF6F8] text-[#263238] ml-12 mr-0 border border-[#B99A55]/30'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-1">
                        <span className="text-[#681C32]">{comment.author_name} ({comment.author_role})</span>
                        <span className="text-[10px] text-slate-500">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p>{comment.message}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment input */}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Type clarification message or question..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#681C32] text-[#263238]"
                />
                <button
                  type="submit"
                  disabled={commentSubmitting || !newComment.trim()}
                  className="px-4 py-2 bg-[#681C32] text-white rounded-lg text-xs font-semibold hover:bg-[#4F1325] border border-[#501426] disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-[#B99A55]" />
                  Send
                </button>
              </form>
            </div>
          </div>
        ) : null}

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

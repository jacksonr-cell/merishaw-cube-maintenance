import React, { useState, useEffect } from 'react';
import type { BuildingTree, FaultCategory, Priority, User } from '../../types.ts';
import { api } from '../../api/client.ts';
import { 
  Wrench, CheckCircle2, AlertTriangle, ShieldAlert, 
  Send, Sparkles, Building2, MapPin, ChevronRight, RefreshCw
} from 'lucide-react';

interface QuickCubeReportCardProps {
  user: User;
  onTicketCreated: (ticketId: string) => void;
  onSelectTicket?: (ticketId: string) => void;
}

export const QuickCubeReportCard: React.FC<QuickCubeReportCardProps> = ({
  user,
  onTicketCreated,
  onSelectTicket
}) => {
  const acc = user.accommodation;

  // Mode: assigned cube vs common facility
  const [locationMode, setLocationMode] = useState<'assigned' | 'common'>(acc ? 'assigned' : 'common');

  // Location data for common area selection
  const [locations, setLocations] = useState<BuildingTree[]>([]);
  const [categories, setCategories] = useState<FaultCategory[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);

  // Common area cascade selections
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedCubeId, setSelectedCubeId] = useState('');

  // Fault details
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [affectedItem, setAffectedItem] = useState('');
  const [customItem, setCustomItem] = useState('');
  const [severity, setSeverity] = useState<Priority>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isHazard, setIsHazard] = useState(false);

  // Form states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<{ id: string; reference_no: string } | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoadingInitial(true);
    try {
      const [locRes, catRes] = await Promise.all([
        api.getLocationTree(),
        api.getCategories()
      ]);
      setLocations(locRes.tree);
      setCategories(catRes.categories);

      // Default category
      if (catRes.categories.length > 0) {
        const firstCat = catRes.categories[0];
        setSelectedCategoryId(firstCat.id);
        if (firstCat.affected_items?.length > 0) {
          setAffectedItem(firstCat.affected_items[0]);
        }
        if (firstCat.default_priority) {
          setSeverity(firstCat.default_priority);
        }
      }

      // Default building for common area if available
      if (locRes.tree.length > 0) {
        setSelectedBuildingId(locRes.tree[0].id);
      }
    } catch {
      // Handled silently or shown if user attempts submit
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCategoryId(catId);
    const cat = categories.find(c => c.id === catId);
    if (cat && cat.affected_items && cat.affected_items.length > 0) {
      setAffectedItem(cat.affected_items[0]);
    } else {
      setAffectedItem('Other');
    }
    if (cat?.default_priority) {
      setSeverity(cat.default_priority);
    }
  };

  const currentBuilding = locations.find(b => b.id === selectedBuildingId);
  const currentBlock = currentBuilding?.blocks.find(b => b.id === selectedBlockId);
  const currentRoom = currentBlock?.rooms.find(r => r.id === selectedRoomId);
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Determine target cube ID
    let targetCubeId = '';
    if (locationMode === 'assigned') {
      if (!acc?.cube_id) {
        setErrorMessage('No assigned cube found for your profile. Please switch to "Common Facility" or consult accommodation.');
        return;
      }
      targetCubeId = acc.cube_id;
    } else {
      if (!selectedCubeId) {
        setErrorMessage('Please complete the location details down to the specific cube or station.');
        return;
      }
      targetCubeId = selectedCubeId;
    }

    if (!selectedCategoryId) {
      setErrorMessage('Please select a fault category.');
      return;
    }

    if (!title.trim() || title.trim().length < 5) {
      setErrorMessage('Please provide a descriptive summary title (min 5 characters).');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage('Please provide a detailed problem description (min 10 characters).');
      return;
    }

    const finalItem = affectedItem === 'Custom...' ? customItem.trim() : affectedItem;
    const finalDescription = isHazard 
      ? `[ACTIVE SAFETY HAZARD REPORTED]\n${description.trim()}`
      : description.trim();

    setSubmitting(true);
    try {
      const res = await api.createTicket({
        cube_id: targetCubeId,
        category_id: selectedCategoryId,
        affected_item: finalItem || 'General Cube Maintenance',
        severity,
        title: title.trim(),
        description: finalDescription
      });

      const newId = res.ticket.id || '';
      const refNo = res.ticket.reference_no || 'Pending';
      setSubmittedTicket({ id: newId, reference_no: refNo });
      onTicketCreated(newId);

      // Reset fields
      setTitle('');
      setDescription('');
      setIsHazard(false);
      setCustomItem('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit cube maintenance report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForAnother = () => {
    setSubmittedTicket(null);
    setErrorMessage(null);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-[#FDF8F9] border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#681C32] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Wrench className="w-5 h-5 text-[#B99A55]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#681C32] bg-[#681C32]/10 px-2 py-0.5 rounded">
                Direct Cube Fault Key-In
              </span>
              <span className="text-[11px] text-[#546E7A] hidden sm:inline">· Instant Student Triage</span>
            </div>
            <h2 className="text-base font-bold text-[#263238] mt-0.5">
              Key In Cube Problem or Maintenance Request
            </h2>
          </div>
        </div>

        {/* Location mode segmented switch */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-lg text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => { setLocationMode('assigned'); setErrorMessage(null); }}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              locationMode === 'assigned'
                ? 'bg-[#681C32] text-white shadow-xs'
                : 'text-[#546E7A] hover:text-[#263238]'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${locationMode === 'assigned' ? 'text-[#B99A55]' : ''}`} />
            <span>My Assigned Cube</span>
          </button>
          <button
            type="button"
            onClick={() => { setLocationMode('common'); setErrorMessage(null); }}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              locationMode === 'common'
                ? 'bg-[#681C32] text-white shadow-xs'
                : 'text-[#546E7A] hover:text-[#263238]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Common Facility / Other</span>
          </button>
        </div>
      </div>

      {/* Success banner state */}
      {submittedTicket ? (
        <div className="p-6 sm:p-8 bg-[#F4F9F5] border-b border-emerald-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Report Successfully Logged
            </span>
            <h3 className="text-lg font-bold text-[#263238] mt-1">
              Ticket <span className="font-mono text-[#681C32]">#{submittedTicket.reference_no}</span>
            </h3>
            <p className="text-xs text-[#546E7A] max-w-md mx-auto mt-1">
              Your maintenance request has been submitted to the Merishaw Facilities Helpdesk. You can track progress in real-time below.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {onSelectTicket && (
              <button
                type="button"
                onClick={() => onSelectTicket(submittedTicket.id)}
                className="px-4 py-2 bg-[#681C32] hover:bg-[#4F1325] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <span>View Ticket Status</span>
                <ChevronRight className="w-4 h-4 text-[#B99A55]" />
              </button>
            )}
            <button
              type="button"
              onClick={handleResetForAnother}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-[#263238] text-xs font-semibold rounded-lg border border-slate-300 transition-colors"
            >
              Key In Another Problem
            </button>
          </div>
        </div>
      ) : (
        /* Form body */
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-xs font-sans">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Location details summary / cascade */}
          {locationMode === 'assigned' ? (
            <div className="bg-[#F8F9FA] border border-slate-200 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#681C32] shrink-0" />
                <div>
                  <span className="text-[11px] font-semibold text-[#546E7A] block">
                    Target Accommodation:
                  </span>
                  {acc ? (
                    <p className="text-xs font-bold text-[#263238]">
                      {acc.building_name} · {acc.block_name} · Room {acc.room_number} · <span className="text-[#681C32]">{acc.cube_label}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-amber-800 font-semibold">
                      No assigned cube on file. Please switch to "Common Facility / Other".
                    </p>
                  )}
                </div>
              </div>
              <span className="text-[10px] bg-white border border-slate-200 text-[#546E7A] px-2.5 py-1 rounded-md font-semibold self-start sm:self-auto">
                Auto-locked to your assigned bunk
              </span>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#263238] uppercase tracking-wide">
                  Select Common Area / Shared Facility Location
                </span>
                <span className="text-[11px] text-[#546E7A]">All fields required</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Residence Hall</label>
                  <select
                    value={selectedBuildingId}
                    onChange={(e) => {
                      setSelectedBuildingId(e.target.value);
                      setSelectedBlockId('');
                      setSelectedRoomId('');
                      setSelectedCubeId('');
                    }}
                    required
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-[#263238] focus:ring-2 focus:ring-[#681C32] focus:outline-none"
                  >
                    <option value="">Select Hall...</option>
                    {locations.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Block / Floor</label>
                  <select
                    value={selectedBlockId}
                    onChange={(e) => {
                      setSelectedBlockId(e.target.value);
                      setSelectedRoomId('');
                      setSelectedCubeId('');
                    }}
                    required
                    disabled={!selectedBuildingId}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-[#263238] focus:ring-2 focus:ring-[#681C32] focus:outline-none disabled:opacity-50"
                  >
                    <option value="">Select Block/Floor...</option>
                    {currentBuilding?.blocks.map((blk) => (
                      <option key={blk.id} value={blk.id}>{blk.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Room / Area</label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => {
                      setSelectedRoomId(e.target.value);
                      setSelectedCubeId('');
                    }}
                    required
                    disabled={!selectedBlockId}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-[#263238] focus:ring-2 focus:ring-[#681C32] focus:outline-none disabled:opacity-50"
                  >
                    <option value="">Select Room...</option>
                    {currentBlock?.rooms?.map((rm) => (
                      <option key={rm.id} value={rm.id}>{rm.room_number}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Cube / Station Unit</label>
                  <select
                    value={selectedCubeId}
                    onChange={(e) => setSelectedCubeId(e.target.value)}
                    required
                    disabled={!selectedRoomId}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-[#263238] focus:ring-2 focus:ring-[#681C32] focus:outline-none disabled:opacity-50"
                  >
                    <option value="">Select Cube Unit...</option>
                    {currentRoom?.cubes?.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Fault Category & Affected Item */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#263238] font-bold mb-1.5">
                Fault Category <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[#263238] font-semibold focus:ring-2 focus:ring-[#681C32] focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} (SLA: {cat.sla_hours}h)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#263238] font-bold mb-1.5">
                Affected Item / Fixture <span className="text-red-500">*</span>
              </label>
              <div className="space-y-1.5">
                <select
                  value={affectedItem}
                  onChange={(e) => setAffectedItem(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[#263238] focus:ring-2 focus:ring-[#681C32] focus:outline-none"
                >
                  {selectedCategory?.affected_items?.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                  <option value="Custom...">Custom / Other Fixture...</option>
                </select>

                {affectedItem === 'Custom...' && (
                  <input
                    type="text"
                    value={customItem}
                    onChange={(e) => setCustomItem(e.target.value)}
                    placeholder="Specify exact item (e.g. Window latch, Locker handle)..."
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[#263238] focus:ring-2 focus:ring-[#681C32] focus:outline-none"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Quick chips for popular cube items */}
          {selectedCategory && selectedCategory.affected_items?.length > 0 && (
            <div>
              <span className="text-[11px] text-[#546E7A] font-medium block mb-1">
                Common fixtures for {selectedCategory.name}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedCategory.affected_items.slice(0, 6).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setAffectedItem(item)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      affectedItem === item
                        ? 'bg-[#681C32] text-white border border-[#501426]'
                        : 'bg-slate-100 hover:bg-slate-200 text-[#263238] border border-slate-200'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Problem Summary Title */}
          <div>
            <label className="block text-[#263238] font-bold mb-1.5">
              Problem Summary <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Broken locker latch, Flickering study lamp, Window lock jammed"
              required
              minLength={5}
              maxLength={120}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-[#263238] font-medium focus:ring-2 focus:ring-[#681C32] focus:outline-none"
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-[#263238] font-bold mb-1.5">
              Problem Details & Specific Observations <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe what is faulty, when it started, and any symptoms (e.g. locker door does not align with the frame, study light buzzes when turned on)..."
              required
              minLength={10}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-[#263238] focus:ring-2 focus:ring-[#681C32] focus:outline-none resize-y"
            />
          </div>

          {/* Severity & Safety Hazard Indicators */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="block text-[#263238] font-bold">
                Urgency Level
              </label>
              <div className="flex items-center gap-2">
                {(['low', 'medium', 'high', 'emergency'] as Priority[]).map((p) => {
                  const isSelected = severity === p;
                  const colorStyles = 
                    p === 'emergency' 
                      ? isSelected ? 'bg-red-700 text-white border-red-800' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      : p === 'high'
                      ? isSelected ? 'bg-amber-700 text-white border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      : p === 'medium'
                      ? isSelected ? 'bg-blue-700 text-white border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                      : isSelected ? 'bg-slate-700 text-white border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';

                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSeverity(p)}
                      className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border transition-all ${colorStyles}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1 sm:pt-0">
              <input
                type="checkbox"
                checked={isHazard}
                onChange={(e) => setIsHazard(e.target.checked)}
                className="w-4 h-4 text-[#681C32] rounded border-slate-300 focus:ring-[#681C32]"
              />
              <span className="text-xs font-semibold text-[#263238] flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                Active safety/water/electrical hazard
              </span>
            </label>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <span className="text-[11px] text-[#546E7A]">
              Submits directly into institutional maintenance tracking with audit trail.
            </span>
            <button
              type="submit"
              disabled={submitting || loadingInitial}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#681C32] hover:bg-[#4F1325] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 border border-[#501426] disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#B99A55]" />
                  <span>Logging Problem...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-[#B99A55]" />
                  <span>Submit Cube Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

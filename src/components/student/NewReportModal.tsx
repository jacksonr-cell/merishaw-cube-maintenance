import React, { useState, useEffect } from 'react';
import type { BuildingTree, FaultCategory, Priority, User } from '../../types.ts';
import { api } from '../../api/client.ts';
import { X, AlertTriangle, CheckCircle2, ChevronRight, ShieldAlert, ArrowLeft } from 'lucide-react';

interface NewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onReportCreated: (ticketId: string) => void;
}

export const NewReportModal: React.FC<NewReportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onReportCreated
}) => {
  const [step, setStep] = useState<'form' | 'review'>('form');

  // Location data
  const [locations, setLocations] = useState<BuildingTree[]>([]);
  const [categories, setCategories] = useState<FaultCategory[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);

  // Form selections
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

  // Submitting state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setStep('form');
      setErrorMessage(null);
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoadingInitial(true);
    try {
      const [locRes, catRes] = await Promise.all([
        api.getLocationTree(),
        api.getCategories()
      ]);
      setLocations(locRes.tree);
      setCategories(catRes.categories);

      // Auto-populate with student's assigned accommodation
      const acc = currentUser?.accommodation;
      if (acc) {
        setSelectedBuildingId(acc.building_id);
        setSelectedBlockId(acc.block_id);
        setSelectedRoomId(acc.room_id);
        setSelectedCubeId(acc.cube_id);
      } else if (locRes.tree.length > 0) {
        setSelectedBuildingId(locRes.tree[0].id);
      }
    } catch (err: any) {
      setErrorMessage('Failed to load institutional accommodation data.');
    } finally {
      setLoadingInitial(false);
    }
  };

  if (!isOpen) return null;

  // Selected cascade objects
  const currentBuilding = locations.find(b => b.id === selectedBuildingId);
  const currentBlock = currentBuilding?.blocks.find(b => b.id === selectedBlockId);
  const currentRoom = currentBlock?.rooms.find(r => r.id === selectedRoomId);
  const currentCube = currentRoom?.cubes?.find(c => c.id === selectedCubeId);

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const handleCategoryChange = (catId: string) => {
    setSelectedCategoryId(catId);
    const cat = categories.find(c => c.id === catId);
    if (cat && cat.affected_items.length > 0) {
      setAffectedItem(cat.affected_items[0]);
    } else {
      setAffectedItem('Other');
    }
    if (cat?.default_priority) {
      setSeverity(cat.default_priority);
    }
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCubeId) {
      setErrorMessage('Please select a specific Cube or bunk location.');
      return;
    }
    if (!selectedCategoryId) {
      setErrorMessage('Please select a fault category.');
      return;
    }
    const finalItem = affectedItem === 'Custom...' ? customItem.trim() : affectedItem;
    if (!finalItem) {
      setErrorMessage('Please specify the affected item or fixture.');
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

    setStep('review');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    const finalItem = affectedItem === 'Custom...' ? customItem.trim() : affectedItem;

    try {
      const res = await api.createTicket({
        cube_id: selectedCubeId,
        category_id: selectedCategoryId,
        affected_item: finalItem,
        severity,
        title: title.trim(),
        description: description.trim()
      });

      onReportCreated(res.ticket.id || '');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit maintenance report.');
      setStep('form');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-[#681C32] text-white flex items-center justify-center text-xs font-bold">
              +
            </span>
            <h2 className="text-base font-bold text-[#681C32]">
              {step === 'form' ? 'Submit Cube Maintenance Report' : 'Review & Confirm Report'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Emergency Escalation Advisory Banner */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-lg flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-amber-900 space-y-1">
              <p className="font-semibold text-xs">Campus Safety Advisory</p>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Reports marked as Emergency are escalated to facility duty technicians immediately. Note that this system logs institutional maintenance requests and does not dispatch municipal emergency services (fire, police, ambulance).
              </p>
            </div>
          </div>

          {step === 'form' ? (
            <form id="maintenance-report-form" onSubmit={handleProceedToReview} className="space-y-4">
              {/* Location Cascade */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#263238] text-xs uppercase tracking-wide">1. Accommodation Location</span>
                  {currentUser?.accommodation && (
                    <span className="text-[11px] text-[#681C32] font-semibold">
                      Pre-filled with your assigned cube
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[#263238] focus:ring-2 focus:ring-[#681C32] focus:outline-none"
                    >
                      <option value="">Select Building...</option>
                      {locations.map((b) => (
                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
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
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[#263238] focus:ring-2 focus:ring-[#681C32] focus:outline-none disabled:opacity-50"
                    >
                      <option value="">Select Block/Floor...</option>
                      {currentBuilding?.blocks.map((blk) => (
                        <option key={blk.id} value={blk.id}>{blk.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Room Number</label>
                    <select
                      value={selectedRoomId}
                      onChange={(e) => {
                        setSelectedRoomId(e.target.value);
                        setSelectedCubeId('');
                      }}
                      required
                      disabled={!selectedBlockId}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[#263238] focus:ring-2 focus:ring-[#681C32] focus:outline-none disabled:opacity-50"
                    >
                      <option value="">Select Room...</option>
                      {currentBlock?.rooms?.map((rm) => (
                        <option key={rm.id} value={rm.id}>{rm.room_number}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Cube / Bunk Identifier</label>
                    <select
                      value={selectedCubeId}
                      onChange={(e) => setSelectedCubeId(e.target.value)}
                      required
                      disabled={!selectedRoomId}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[#681C32] focus:ring-2 focus:ring-[#681C32] focus:outline-none disabled:opacity-50 font-bold"
                    >
                      <option value="">Select Cube / Bunk...</option>
                      {currentRoom?.cubes?.map((cb) => (
                        <option key={cb.id} value={cb.id}>{cb.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Category & Item */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <span className="font-bold text-[#263238] text-xs uppercase tracking-wide">2. Fault Classification</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Predefined Fault Category</label>
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[#263238] focus:ring-2 focus:ring-[#681C32] focus:outline-none font-medium"
                    >
                      <option value="">Select Category...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} (SLA: {c.sla_hours}h)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Affected Item or Fixture</label>
                    <select
                      value={affectedItem}
                      onChange={(e) => setAffectedItem(e.target.value)}
                      required
                      disabled={!selectedCategoryId}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[#263238] focus:ring-2 focus:ring-[#681C32] focus:outline-none disabled:opacity-50"
                    >
                      {selectedCategory?.affected_items.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                      <option value="Custom...">Other Item (Type below)...</option>
                    </select>
                  </div>

                  {affectedItem === 'Custom...' && (
                    <div className="sm:col-span-2">
                      <label className="block text-slate-600 font-semibold mb-1">Specify Affected Item</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Wardrobe lower latch"
                        value={customItem}
                        onChange={(e) => setCustomItem(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[#263238] focus:ring-2 focus:ring-[#681C32] focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 font-semibold mb-1">Severity / Urgency Level</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'low', label: 'Low', desc: 'Cosmetic / Minor' },
                        { id: 'medium', label: 'Medium', desc: 'Standard Fault' },
                        { id: 'high', label: 'High', desc: 'Inconvenience / Risk' },
                        { id: 'emergency', label: 'Emergency', desc: 'Safety / Flood Hazard' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSeverity(item.id as Priority)}
                          className={`p-2.5 rounded-lg border text-left transition-colors ${
                            severity === item.id
                              ? item.id === 'emergency'
                                ? 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-400'
                                : 'bg-[#FDF6F8] border-[#681C32] text-[#681C32] ring-2 ring-[#F2CBD5]'
                              : 'bg-white border-slate-200 text-[#263238] hover:bg-slate-50'
                          }`}
                        >
                          <p className="font-bold text-xs">{item.label}</p>
                          <p className="text-[10px] text-[#546E7A]">{item.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Problem Description */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <span className="font-bold text-[#263238] text-xs uppercase tracking-wide">3. Fault Description</span>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Problem Summary Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Desk socket sparks when plugging laptop charger"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[#263238] focus:ring-2 focus:ring-[#681C32] text-sm font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Detailed Problem Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe exactly what happened, when it occurs, which part is loose or damaged, and any safety concerns..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[#263238] focus:ring-2 focus:ring-[#681C32] text-xs leading-relaxed focus:outline-none"
                  />
                  <p className="text-[11px] text-[#546E7A] mt-1">
                    Clear descriptions help technicians arrive with the correct tools and replacement parts.
                  </p>
                </div>
              </div>
            </form>
          ) : (
            // Step 2: Review Screen
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[#FDF6F8] border border-[#F2CBD5] space-y-3">
                <h3 className="font-bold text-[#681C32] text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#681C32]" />
                  <span>Verify Report Details</span>
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#546E7A] block text-[11px]">Location:</span>
                    <strong className="text-[#263238]">{currentBuilding?.name} · {currentBlock?.name}</strong>
                    <div className="text-[#681C32] font-bold">Room {currentRoom?.room_number} · {currentCube?.label}</div>
                  </div>
                  <div>
                    <span className="text-[#546E7A] block text-[11px]">Category & Item:</span>
                    <strong className="text-[#263238]">{selectedCategory?.name}</strong>
                    <div className="text-[#546E7A] font-medium">{affectedItem === 'Custom...' ? customItem : affectedItem}</div>
                  </div>
                  <div>
                    <span className="text-[#546E7A] block text-[11px]">Severity:</span>
                    <span className="capitalize font-bold text-[#263238]">{severity}</span>
                  </div>
                  <div>
                    <span className="text-[#546E7A] block text-[11px]">Expected SLA Target:</span>
                    <span className="font-bold text-[#681C32]">Within {selectedCategory?.sla_hours || 24} Hours</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F2CBD5]">
                  <span className="text-[#546E7A] block text-[11px]">Summary Title:</span>
                  <p className="font-bold text-[#263238]">{title}</p>
                </div>

                <div>
                  <span className="text-[#546E7A] block text-[11px]">Detailed Description:</span>
                  <p className="text-[#263238] whitespace-pre-wrap bg-white p-3 rounded border border-slate-200 mt-1">
                    {description}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {step === 'review' ? (
            <button
              type="button"
              onClick={() => setStep('form')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Edit Details
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
          )}

          {step === 'form' ? (
            <button
              type="submit"
              form="maintenance-report-form"
              className="px-5 py-2 text-xs font-bold text-white bg-[#681C32] hover:bg-[#4F1325] rounded-lg transition-all shadow-sm flex items-center gap-1.5 border border-[#501426]"
            >
              <span>Review Before Submission</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#B99A55]" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-bold text-white bg-[#681C32] hover:bg-[#4F1325] rounded-lg transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 border border-[#501426]"
            >
              {submitting ? 'Transmitting to Database...' : 'Confirm & Submit Report'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


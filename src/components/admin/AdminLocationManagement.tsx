import React, { useState, useEffect } from 'react';
import type { BuildingTree, User } from '../../types.ts';
import { api } from '../../api/client.ts';
import { Building2, Plus, Users, RefreshCw, X, Check, MapPin } from 'lucide-react';

export const AdminLocationManagement: React.FC = () => {
  const [tree, setTree] = useState<BuildingTree[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddBuilding, setShowAddBuilding] = useState(false);
  const [bldName, setBldName] = useState('');
  const [bldCode, setBldCode] = useState('');
  const [bldZone, setBldZone] = useState('');
  const [bldFloors, setBldFloors] = useState('4');

  // Assign Student Modal
  const [assigningCube, setAssigningCube] = useState<{ id: string; label: string; roomNumber: string; buildingName: string } | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [locRes, stuRes] = await Promise.all([
        api.getLocationTree(),
        api.getUsers({ role: 'student', is_active: '1' })
      ]);
      setTree(locRes.tree);
      setStudents(stuRes.users);
    } catch (err) {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createBuilding({
        name: bldName.trim(),
        code: bldCode.trim().toUpperCase(),
        campus_zone: bldZone.trim(),
        total_floors: parseInt(bldFloors, 10) || 4
      });
      setShowAddBuilding(false);
      setBldName('');
      setBldCode('');
      setBldZone('');
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningCube || !selectedStudentId) return;
    setSaving(true);
    try {
      await api.assignStudentCube({
        cube_id: assigningCube.id,
        student_id: selectedStudentId
      });
      setAssigningCube(null);
      setSelectedStudentId('');
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accommodation & Cube Hierarchy</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage residential halls, blocks, rooms, and individual student cubicles (cubes).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddBuilding(true)}
            className="px-4 py-2 bg-[#681C32] hover:bg-[#4F1325] text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2 border border-[#501426]"
          >
            <Plus className="w-4 h-4 text-[#B99A55]" />
            <span>Add Residence Hall</span>
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Buildings and Cubes Cards */}
      <div className="space-y-6">
        {loading && tree.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading accommodation structure...</div>
        ) : (
          tree.map((bld) => (
            <div key={bld.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Building Title Banner */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-[#681C32] text-[#B99A55] flex items-center justify-center font-bold text-xs shadow-xs">
                    {bld.code}
                  </span>
                  <div>
                    <h3 className="font-bold text-[#263238] text-sm">{bld.name}</h3>
                    <p className="text-[11px] text-[#546E7A]">{bld.campus_zone} · {bld.total_floors} Floors</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
                  <span>{bld.blocks.length} Blocks</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {bld.blocks.reduce((acc, blk) => acc + blk.rooms.length, 0)} Rooms
                  </span>
                </div>
              </div>

              {/* Blocks & Rooms Tree */}
              <div className="p-5 space-y-5">
                {bld.blocks.map((blk) => (
                  <div key={blk.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                        {blk.name} (Floor #{blk.floor_number})
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {blk.rooms.length} Rooms
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {blk.rooms.map((rm) => (
                        <div key={rm.id} className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="font-bold text-slate-900">{rm.room_number}</span>
                            <span className="text-[10px] text-slate-400">Capacity: {rm.capacity} residents</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {(rm.cubes || []).map((cb) => (
                              <div
                                key={cb.id}
                                className={`p-2.5 rounded-md border text-xs flex flex-col justify-between ${
                                  cb.occupant_name
                                    ? 'bg-[#FDF6F8] border-[#B99A55]/30'
                                    : cb.status === 'maintenance'
                                    ? 'bg-amber-50/60 border-amber-200'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-[#263238]">{cb.cube_number}</span>
                                    <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                                      cb.occupant_name
                                        ? 'bg-[#681C32]/10 text-[#681C32]'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {cb.occupant_name ? 'Occupied' : 'Vacant'}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-[#546E7A] mt-1 truncate">{cb.label}</p>
                                </div>

                                <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                                  {cb.occupant_name ? (
                                    <span className="text-[11px] font-semibold text-[#681C32] truncate max-w-[100px]" title={cb.occupant_name}>
                                      {cb.occupant_name}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">No resident</span>
                                  )}
                                  <button
                                    onClick={() => setAssigningCube({
                                      id: cb.id,
                                      label: cb.label,
                                      roomNumber: rm.room_number,
                                      buildingName: bld.name
                                    })}
                                    className="text-[10px] text-[#681C32] font-bold hover:underline"
                                  >
                                    {cb.occupant_name ? 'Reassign' : 'Assign'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Building Modal */}
      {showAddBuilding && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Add Residence Hall</h3>
              <button onClick={() => setShowAddBuilding(false)} className="p-1 text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleCreateBuilding} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Building / Hall Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mount Kenya Hall"
                  value={bldName}
                  onChange={(e) => setBldName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Code (3-4 letters)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MKH"
                    value={bldCode}
                    onChange={(e) => setBldCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Total Floors</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={bldFloors}
                    onChange={(e) => setBldFloors(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Campus Zone</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. West Campus Village"
                  value={bldZone}
                  onChange={(e) => setBldZone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddBuilding(false)} className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-1.5 bg-[#681C32] hover:bg-[#4F1325] text-white rounded-lg font-bold border border-[#501426] transition-colors">
                  {saving ? 'Creating...' : 'Create Hall'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Cube to Student Modal */}
      {assigningCube && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-[#263238] text-sm">Assign Student to Cube</h3>
              <button onClick={() => setAssigningCube(null)} className="p-1 text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleAssignStudent} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-[#FDF6F8] rounded-lg border border-[#B99A55]/30">
                <p><span className="text-slate-400">Target Cube:</span> <strong className="text-[#681C32]">{assigningCube.label}</strong></p>
                <p><span className="text-slate-400">Location:</span> {assigningCube.buildingName} · Room {assigningCube.roomNumber}</p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Student</label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-[#263238] focus:ring-2 focus:ring-[#681C32]"
                >
                  <option value="">Select Student...</option>
                  {students.map((stu) => (
                    <option key={stu.id} value={stu.id}>
                      {stu.full_name} ({stu.identifier_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAssigningCube(null)} className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium">Cancel</button>
                <button type="submit" disabled={saving || !selectedStudentId} className="px-4 py-1.5 bg-[#681C32] hover:bg-[#4F1325] text-white rounded-lg font-bold border border-[#501426] transition-colors">
                  {saving ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

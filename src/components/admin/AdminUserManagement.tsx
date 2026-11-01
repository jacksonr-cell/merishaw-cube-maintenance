import React, { useState, useEffect } from 'react';
import type { User, UserRole, BuildingTree } from '../../types.ts';
import { api } from '../../api/client.ts';
import { UserPlus, Search, UserCheck, UserX, RefreshCw, X, Shield, Building2 } from 'lucide-react';

export const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<BuildingTree[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formEmail, setFormEmail] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('student');
  const [formPassword, setFormPassword] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formCubeId, setFormCubeId] = useState('');
  const [submittingUser, setSubmittingUser] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [uRes, locRes] = await Promise.all([
        api.getUsers({
          role: roleFilter !== 'all' ? roleFilter : undefined,
          is_active: activeFilter !== 'all' ? activeFilter : undefined,
          search: search.trim() || undefined
        }),
        api.getLocationTree()
      ]);
      setUsers(uRes.users);
      setLocations(locRes.tree);
    } catch (err) {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, activeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleActive = async (user: User) => {
    const nextStatus = user.is_active === 1 ? 0 : 1;
    const confirmMsg = nextStatus === 0 
      ? `Are you sure you want to deactivate the account for ${user.full_name}?` 
      : `Reactivate account for ${user.full_name}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.updateUser(user.id, { is_active: nextStatus });
      await fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingUser(true);
    setModalError(null);

    try {
      await api.createUser({
        email: formEmail.trim(),
        identifier_code: formCode.trim(),
        full_name: formName.trim(),
        role: formRole,
        password: formPassword,
        phone: formPhone.trim() || undefined,
        department: formDepartment.trim() || undefined,
        cube_id: formRole === 'student' && formCubeId ? formCubeId : undefined
      });

      setShowCreateModal(false);
      // Reset form
      setFormEmail('');
      setFormCode('');
      setFormName('');
      setFormPassword('');
      setFormPhone('');
      setFormDepartment('');
      setFormCubeId('');
      await fetchUsers();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create user account.');
    } finally {
      setSubmittingUser(false);
    }
  };

  // Flatten all cubes for selection
  const allAvailableCubes: Array<{ id: string; label: string; buildingName: string }> = [];
  locations.forEach(bld => {
    bld.blocks.forEach(blk => {
      blk.rooms.forEach(rm => {
        (rm.cubes || []).forEach(cb => {
          allAvailableCubes.push({
            id: cb.id,
            label: `${rm.room_number} - ${cb.label}`,
            buildingName: bld.name
          });
        });
      });
    });
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student & Staff Accounts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Provision and manage institutional credentials, accommodation links, and role permissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setModalError(null);
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-[#681C32] hover:bg-[#4F1325] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 border border-[#501426]"
          >
            <UserPlus className="w-4 h-4 text-[#B99A55]" />
            <span>Provision New User</span>
          </button>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-[#546E7A] transition-colors"
            title="Refresh users"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, student ID, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#681C32]"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="staff">Maintenance Staff</option>
            <option value="supervisor">Supervisors</option>
            <option value="admin">Administrators</option>
          </select>

          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">All Account Statuses</option>
            <option value="1">Active Only</option>
            <option value="0">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-3 px-4">Institutional ID</th>
                <th className="py-3 px-4">Name & Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department / Program</th>
                <th className="py-3 px-4">Assigned Cube</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading user accounts...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No institutional accounts match search criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FDF6F8] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#263238] whitespace-nowrap">
                      {u.identifier_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#263238]">{u.full_name}</p>
                      <p className="text-[11px] text-[#546E7A]">{u.email}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                        u.role === 'admin'
                          ? 'bg-[#681C32]/10 text-[#681C32]'
                          : u.role === 'staff'
                          ? 'bg-blue-100 text-blue-900'
                          : u.role === 'supervisor'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#546E7A]">
                      {u.department || '—'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {u.role === 'student' ? (
                        u.cube_label ? (
                          <div>
                            <span className="font-semibold text-[#681C32] block">{u.cube_label}</span>
                            <span className="text-[10px] text-[#546E7A]">{u.building_name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not Assigned</span>
                        )
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                        u.is_active === 1 ? 'text-emerald-700' : 'text-slate-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active === 1 ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                        {u.is_active === 1 ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium border ${
                          u.is_active === 1
                            ? 'border-slate-300 text-slate-600 hover:text-red-700 hover:border-red-200 hover:bg-red-50'
                            : 'border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {u.is_active === 1 ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#681C32]" />
                <h3 className="font-bold text-[#263238] text-sm">Provision Institutional Account</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Account Role <span className="text-red-500">*</span></label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#681C32] font-medium"
                  >
                    <option value="student">Student</option>
                    <option value="staff">Maintenance Staff</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Institutional ID Code <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STD-2025-0099"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Legal Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daniel Kamau"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Official University Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  placeholder="e.g. daniel.kamau@merishaw.edu"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Initial Password <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Min 8 characters"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Contact</label>
                  <input
                    type="tel"
                    placeholder="+254 7..."
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department / Trade / Faculty</label>
                <input
                  type="text"
                  placeholder={formRole === 'student' ? 'e.g. School of Business' : 'e.g. Electrical Maintenance'}
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>

              {/* If student, allow assigning cube immediately */}
              {formRole === 'student' && (
                <div className="p-3 bg-[#FDF6F8] border border-[#B99A55]/30 rounded-lg">
                  <label className="block text-[#681C32] font-bold mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#B99A55]" />
                    <span>Assign Dormitory Cube (Optional)</span>
                  </label>
                  <select
                    value={formCubeId}
                    onChange={(e) => setFormCubeId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-[#263238] focus:ring-2 focus:ring-[#681C32]"
                  >
                    <option value="">Do not assign yet (assign later)...</option>
                    {allAvailableCubes.map((cb) => (
                      <option key={cb.id} value={cb.id}>
                        {cb.buildingName} · {cb.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUser}
                  className="px-5 py-2 bg-[#681C32] text-white rounded-lg font-bold hover:bg-[#4F1325] border border-[#501426] disabled:opacity-50 transition-colors"
                >
                  {submittingUser ? 'Provisioning...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../api/client.ts';
import { X, Building2, Key, UserCheck, Shield, CheckCircle, AlertCircle } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState<'profile' | 'password'>('profile');

  // Profile form state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      await api.updateProfile(fullName, phone);
      await refreshUser();
      setProfileMsg({ type: 'success', text: 'Profile details saved successfully.' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg(null);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const accommodation = user.accommodation;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#681C32]" />
            <h2 className="text-base font-bold text-[#263238]">Institutional Profile & Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 px-6 pt-2">
          <button
            onClick={() => setTab('profile')}
            className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'profile'
                ? 'border-[#681C32] text-[#681C32] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Account Details
          </button>
          <button
            onClick={() => setTab('password')}
            className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'password'
                ? 'border-[#681C32] text-[#681C32] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Security & Password
          </button>
        </div>

        <div className="p-6">
          {tab === 'profile' ? (
            <div className="space-y-6">
              {/* Accommodation Card if Student */}
              {user.role === 'student' && (
                <div className="p-4 rounded-lg bg-[#FDF6F8] border border-[#B99A55]/30">
                  <div className="flex items-center gap-2 text-[#681C32] font-semibold text-xs mb-2 uppercase tracking-wide">
                    <Building2 className="w-4 h-4 text-[#B99A55]" />
                    <span>Current Accommodation Assignment</span>
                  </div>
                  {accommodation ? (
                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-700">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Residence Hall:</span>
                        <span className="font-semibold text-[#681C32]">{accommodation.building_name} ({accommodation.building_code})</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Block / Floor:</span>
                        <span className="font-semibold">{accommodation.block_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Room Number:</span>
                        <span className="font-semibold text-slate-900">{accommodation.room_number}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Assigned Cube / Bunk:</span>
                        <span className="font-semibold text-[#681C32]">{accommodation.cube_label}</span>
                      </div>
                      <div className="col-span-2 text-[11px] text-slate-500 pt-1 border-t border-[#B99A55]/20 flex items-center justify-between">
                        <span>Period: {accommodation.academic_year} · {accommodation.semester}</span>
                        <span className="text-emerald-700 font-medium">Active Resident</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No assigned room or cube recorded for this term. Please see Housing Administration.</p>
                  )}
                </div>
              )}

              {/* Institutional Read-only identity */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Institutional ID:</span>
                  <span className="font-mono font-semibold text-slate-800">{user.identifier_code}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">System Role:</span>
                  <span className="capitalize font-semibold text-[#681C32]">{user.role}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px]">Official Email:</span>
                  <span className="text-slate-800 font-medium">{user.email}</span>
                </div>
              </div>

              {/* Editable profile fields */}
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {profileMsg && (
                  <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {profileMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{profileMsg.text}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#681C32] focus:border-[#681C32] text-[#263238]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Emergency Phone Contact
                  </label>
                  <input
                    type="tel"
                    placeholder="+254 700 000 000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#681C32] focus:border-[#681C32] text-[#263238]"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#681C32] hover:bg-[#4F1325] border border-[#501426] rounded-lg transition-colors disabled:opacity-50"
                  >
                    {profileSaving ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-start gap-2">
                <Shield className="w-4 h-4 text-[#681C32] shrink-0 mt-0.5" />
                <span>Choose a secure password with at least 8 characters. Passwords are securely hashed with scrypt cryptography.</span>
              </div>

              {passwordMsg && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {passwordMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#681C32] focus:border-[#681C32] text-[#263238]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#681C32] focus:border-[#681C32] text-[#263238]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#681C32] focus:border-[#681C32] text-[#263238]"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#681C32] hover:bg-[#4F1325] border border-[#501426] rounded-lg transition-colors disabled:opacity-50"
                >
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

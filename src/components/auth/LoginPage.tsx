import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../api/client.ts';
import { Shield, Key, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBack, onLoginSuccess }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recovery modal state
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryId, setRecoveryId] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryResponse, setRecoveryResponse] = useState<any>(null);
  const [resetTokenInput, setResetTokenInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setError(null);
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryLoading(true);
    setError(null);
    try {
      const res = await api.recoverPassword(recoveryId.trim());
      setRecoveryResponse(res);
      if (res.reset_token) {
        setResetTokenInput(res.reset_token);
      }
    } catch (err: any) {
      setError(err.message || 'Recovery request failed.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryLoading(true);
    try {
      const res = await api.resetPassword(resetTokenInput.trim(), newPasswordInput);
      setResetSuccessMsg(res.message);
      setTimeout(() => {
        setShowRecovery(false);
        setResetSuccessMsg(null);
        setRecoveryResponse(null);
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-6 font-sans">
      <button
        onClick={onBack}
        className="text-xs font-semibold text-[#681C32] hover:underline flex items-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Portal Overview</span>
      </button>

      {/* Institutional Sign-In Card */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        {/* Card Header with Merishaw Maroon */}
        <div className="p-6 bg-[#681C32] text-white space-y-1 border-b border-[#501426]">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-white text-[#681C32] flex items-center justify-center font-black text-xs shadow-xs border border-[#B99A55]">
              M
            </span>
            <span className="text-xs uppercase font-bold text-[#B99A55] tracking-wider">
              Merishaw University
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-white pt-1">
            Institutional Sign-In
          </h1>
          <p className="text-xs text-white/80">
            Dormitory cube maintenance and facility management
          </p>
        </div>

        {/* Card Body Form */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#263238] font-semibold mb-1">
                Institutional ID or Official Email
              </label>
              <input
                type="text"
                required
                placeholder="e.g. STD-2024-8841 or admin@merishaw.edu"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#681C32] focus:border-[#681C32]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#263238] font-semibold">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setShowRecovery(true);
                  }}
                  className="text-[11px] text-[#681C32] font-semibold hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-[#263238] focus:outline-none focus:ring-2 focus:ring-[#681C32] focus:border-[#681C32]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#681C32] hover:bg-[#4F1325] text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 border border-[#501426]"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-[#546E7A] block uppercase tracking-wide">
              Quick 1-Click Evaluation Accounts
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickSelect('admin@merishaw.edu', 'Admin@Merishaw2026!')}
                className="p-2 border border-[#F2CBD5] rounded-lg text-left bg-[#FDF6F8] hover:bg-[#F9E8ED] transition-colors"
              >
                <span className="font-bold text-[#681C32] block">Administrator</span>
                <span className="text-[10px] text-[#546E7A]">Dr. Evelyn Mwangi</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('alex.student@merishaw.edu', 'Student@Merishaw2026!')}
                className="p-2 border border-slate-200 rounded-lg text-left bg-white hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold text-[#B99A55] block">Student Resident</span>
                <span className="text-[10px] text-[#546E7A]">Alex Kiprono (Cube 204-A)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('sarah.electrician@merishaw.edu', 'Staff@Merishaw2026!')}
                className="p-2 border border-slate-200 rounded-lg text-left bg-white hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold text-blue-800 block">Staff (Electrical)</span>
                <span className="text-[10px] text-[#546E7A]">Sarah Muthoni</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('john.staff@merishaw.edu', 'Staff@Merishaw2026!')}
                className="p-2 border border-slate-200 rounded-lg text-left bg-white hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold text-emerald-800 block">Staff (Plumbing)</span>
                <span className="text-[10px] text-[#546E7A]">John Otieno</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Recovery Modal */}
      {showRecovery && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 text-xs animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-[#F4F5F7]">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#681C32]" />
                <h3 className="font-bold text-[#263238] text-sm">Account Password Recovery</h3>
              </div>
              <button
                onClick={() => {
                  setShowRecovery(false);
                  setRecoveryResponse(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {resetSuccessMsg ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Password Reset Successful</span>
                  </div>
                  <p>{resetSuccessMsg}</p>
                </div>
              ) : !recoveryResponse?.recovery_available ? (
                <form onSubmit={handleRecover} className="space-y-3">
                  <p className="text-[#546E7A]">
                    Enter your registered university email or Student/Staff ID. A secure recovery token will be generated.
                  </p>
                  <div>
                    <label className="block text-[#263238] font-semibold mb-1">Email or ID Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. alex.student@merishaw.edu"
                      value={recoveryId}
                      onChange={(e) => setRecoveryId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#681C32] focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowRecovery(false)}
                      className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-[#263238] font-medium hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={recoveryLoading}
                      className="px-4 py-1.5 bg-[#681C32] hover:bg-[#4F1325] text-white rounded-lg font-bold disabled:opacity-50 transition-colors"
                    >
                      {recoveryLoading ? 'Generating...' : 'Generate Recovery Token'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div className="p-3 bg-[#FDF6F8] rounded-lg border border-[#F2CBD5] space-y-1">
                    <p className="font-semibold text-[#681C32]">Campus Recovery Token Generated</p>
                    <p className="text-[11px] text-[#546E7A]">{recoveryResponse.message}</p>
                    <div className="p-2 bg-white rounded border border-[#F2CBD5] font-mono text-[11px] text-[#681C32] select-all">
                      {recoveryResponse.reset_token}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#263238] font-semibold mb-1">Recovery Token</label>
                    <input
                      type="text"
                      required
                      value={resetTokenInput}
                      onChange={(e) => setResetTokenInput(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-[#681C32] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#263238] font-semibold mb-1">New Password (min 8 chars)</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      placeholder="Enter new secure password..."
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#681C32] focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowRecovery(false)}
                      className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-[#263238] font-medium hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={recoveryLoading || !newPasswordInput}
                      className="px-4 py-1.5 bg-[#681C32] hover:bg-[#4F1325] text-white rounded-lg font-bold disabled:opacity-50 transition-colors"
                    >
                      {recoveryLoading ? 'Updating...' : 'Set New Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

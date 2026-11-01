import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Bell, LogOut, CheckCircle2, Menu } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenHealth: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  unreadCount,
  onOpenNotifications,
  onOpenProfile,
  onOpenHealth,
  onToggleMobileMenu,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-[#681C32] text-white shadow-md border-b border-[#501426]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Mobile Hamburger + Brand Identity */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Hamburger button for mobile/tablet when authenticated */}
            {user && onToggleMobileMenu && (
              <button
                onClick={onToggleMobileMenu}
                aria-label="Open navigation menu"
                className="lg:hidden p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors -ml-1"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
              className="text-left font-bold tracking-tight text-white hover:text-white/90 transition-opacity whitespace-nowrap shrink-0 flex items-center gap-2.5"
            >
              {/* Merishaw Crest Badge */}
              <span className="w-8 h-8 rounded-lg bg-white text-[#681C32] flex items-center justify-center text-sm font-black shadow-xs border border-[#B99A55]/40">
                M
              </span>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold leading-tight flex items-center gap-1.5">
                  Merishaw
                  <span className="text-[#B99A55] font-light">|</span>
                  <span className="font-normal text-white/90 text-sm sm:text-base">Cube Maintenance System</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] text-white/70 font-medium tracking-wider uppercase">
                  Directorate of Student Accommodation
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Public Navigation Links (Only shown when logged out) */}
          {!user && (
            <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-white/80">
              <button
                onClick={() => onNavigate('landing')}
                className={`hover:text-white transition-colors whitespace-nowrap pb-1 relative ${
                  currentView === 'landing' ? 'text-white font-bold' : ''
                }`}
              >
                Overview
                {currentView === 'landing' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B99A55]" />
                )}
              </button>
              <button
                onClick={() => onNavigate('emergency')}
                className={`hover:text-white transition-colors whitespace-nowrap pb-1 relative ${
                  currentView === 'emergency' ? 'text-white font-bold' : ''
                }`}
              >
                Emergency Protocol
                {currentView === 'emergency' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B99A55]" />
                )}
              </button>
              <button
                onClick={() => onNavigate('login')}
                className={`hover:text-white transition-colors whitespace-nowrap pb-1 relative ${
                  currentView === 'login' ? 'text-white font-bold' : ''
                }`}
              >
                Institutional Sign-In
                {currentView === 'login' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B99A55]" />
                )}
              </button>
            </nav>
          )}

          {/* Zone 3: Actions / Session Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {user ? (
              <>
                {/* System Online Badge */}
                <button
                  onClick={onOpenHealth}
                  title="System Engine & Database Health"
                  className="hidden md:flex items-center gap-1.5 text-xs text-white/85 hover:text-white transition-colors px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 border border-white/20"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono text-[11px]">System Online</span>
                </button>

                {/* Notifications Button */}
                <button
                  onClick={onOpenNotifications}
                  aria-label={`View notifications (${unreadCount} unread)`}
                  className="relative p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#B99A55] text-[#263238] text-[10px] font-black flex items-center justify-center border-2 border-[#681C32]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* User Profile Capsule */}
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-white text-[#681C32] flex items-center justify-center text-xs font-bold shadow-xs">
                    {user.full_name.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-xs leading-tight">
                    <p className="font-semibold text-white truncate max-w-[120px]">{user.full_name}</p>
                    <p className="text-[#B99A55] text-[11px] capitalize font-medium">{user.role}</p>
                  </div>
                </button>

                {/* Sign Out */}
                <button
                  onClick={logout}
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="px-4 py-2 text-xs font-bold text-[#681C32] bg-white rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 shadow-sm border border-[#B99A55]"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

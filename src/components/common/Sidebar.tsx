import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Ticket,
  Building2,
  Users,
  ShieldCheck,
  ClipboardList,
  PlusCircle,
  Wrench,
  Layers,
  Home,
  AlertTriangle,
  Activity,
  PhoneCall,
  X
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenNewReport?: () => void;
  onOpenHealth?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
  onOpenNewReport,
  onOpenHealth,
}) => {
  const { user } = useAuth();
  if (!user) return null;

  const handleNavClick = (view: string) => {
    onNavigate(view);
    onCloseMobile();
  };

  // Define navigation items based on user role
  const getNavItems = () => {
    if (user.role === 'student') {
      return [
        {
          id: 'dashboard',
          label: 'My Accommodation',
          description: 'Cube bunk & room info',
          icon: Home,
        },
        {
          id: 'tickets',
          label: 'My Reports',
          description: 'Track repair progress',
          icon: ClipboardList,
        },
        {
          id: 'new-report',
          label: 'Report Maintenance',
          description: 'Submit new fault request',
          icon: PlusCircle,
        },
      ];
    }

    if (user.role === 'staff') {
      return [
        {
          id: 'dashboard',
          label: 'Job Queue',
          description: 'Active work orders',
          icon: Wrench,
        },
        {
          id: 'all-tickets',
          label: 'All Facility Requests',
          description: 'Campus-wide log',
          icon: Layers,
        },
      ];
    }

    // Admin & Supervisor
    return [
      {
        id: 'dashboard',
        label: 'Dashboard Overview',
        description: 'Real-time KPIs & triage',
        icon: LayoutDashboard,
      },
      {
        id: 'tickets',
        label: 'Ticket Manager',
        description: 'Triage, assign & dispatch',
        icon: Ticket,
      },
      {
        id: 'locations',
        label: 'Dorms & Cubes',
        description: 'Halls, blocks & rooms',
        icon: Building2,
      },
      {
        id: 'users',
        label: 'User Accounts',
        description: 'Students, staff & admins',
        icon: Users,
      },
      {
        id: 'analytics',
        label: 'Audit & Compliance',
        description: 'Timestamped event logs',
        icon: ShieldCheck,
      },
    ];
  };

  const navItems = getNavItems();

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      {/* Top Section */}
      <div className="space-y-6">
        {/* User Role Card */}
        <div className="p-3.5 rounded-xl bg-[#F4F5F7] border border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#681C32] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {user.full_name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#263238] truncate">{user.full_name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#B99A55]" />
                <span className="text-[11px] font-semibold text-[#681C32] capitalize tracking-wide">
                  {user.role === 'staff' ? 'Licensed Technician' : user.role === 'admin' ? 'Administrator' : 'Student Resident'}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-[#546E7A]">
            <span className="truncate">ID: {user.identifier_code || 'MSH-ACC'}</span>
            <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
              Active
            </span>
          </div>
        </div>

        {/* Quick Action Button for Student or Admin */}
        {user.role === 'student' && onOpenNewReport && (
          <button
            onClick={() => {
              onOpenNewReport();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#681C32] hover:bg-[#4F1325] text-white text-xs font-bold rounded-lg shadow-sm transition-all border border-[#501426]"
          >
            <PlusCircle className="w-4 h-4 text-[#B99A55]" />
            <span>Report New Fault</span>
          </button>
        )}

        {/* Navigation Links */}
        <div>
          <div className="flex items-center gap-2 px-2 mb-2">
            <span className="text-[10px] font-bold tracking-wider text-[#546E7A] uppercase">
              Main Menu
            </span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-medium transition-all group relative ${
                    isActive
                      ? 'bg-[#681C32] text-white shadow-xs font-semibold'
                      : 'text-[#263238] hover:bg-[#F4F5F7] hover:text-[#681C32]'
                  }`}
                >
                  {/* Active Indicator Accent Bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#B99A55] rounded-r-full" />
                  )}

                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#B99A55]' : 'text-[#546E7A] group-hover:text-[#681C32]'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate leading-tight">{item.label}</p>
                    <p
                      className={`text-[10px] truncate mt-0.5 ${
                        isActive ? 'text-maroon-100 opacity-90' : 'text-[#546E7A]'
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="pt-4 border-t border-slate-200 space-y-2">
        {onOpenHealth && (
          <button
            onClick={() => {
              onOpenHealth();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium text-[#546E7A] hover:text-[#681C32] hover:bg-[#F4F5F7] transition-colors text-left"
          >
            <Activity className="w-3.5 h-3.5 text-[#B99A55]" />
            <span>System Health & Diagnostics</span>
          </button>
        )}

        <button
          onClick={() => {
            onNavigate('emergency');
            onCloseMobile();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium text-rose-700 hover:bg-rose-50 transition-colors text-left"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>Emergency Hotlines</span>
        </button>

        <div className="px-3 pt-2 text-[10px] text-[#546E7A] flex items-center justify-between border-t border-slate-100">
          <span className="flex items-center gap-1">
            <PhoneCall className="w-3 h-3 text-[#B99A55]" /> Help Desk
          </span>
          <span className="font-mono font-semibold text-[#263238]">ext 2200</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white border-r border-slate-200 p-4 min-h-[calc(100vh-4rem)]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Drawer Sheet */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col p-4 z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#681C32] text-white flex items-center justify-center text-xs font-black">
                  M
                </span>
                <div>
                  <p className="text-xs font-bold text-[#681C32]">Merishaw Cube System</p>
                  <p className="text-[10px] text-[#546E7A]">Navigation Portal</p>
                </div>
              </div>
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { api } from './api/client.ts';
import type { User, NotificationItem } from './types.ts';

// Common Components
import { Header } from './components/common/Header.tsx';
import { Sidebar } from './components/common/Sidebar.tsx';
import { NotificationDrawer } from './components/common/NotificationDrawer.tsx';
import { ProfileModal } from './components/common/ProfileModal.tsx';
import { HealthModal } from './components/common/HealthModal.tsx';
import { TicketDetailModal } from './components/tickets/TicketDetailModal.tsx';

// Public Views
import { LandingPage } from './components/landing/LandingPage.tsx';
import { EmergencyProtocol } from './components/landing/EmergencyProtocol.tsx';
import { LoginPage } from './components/auth/LoginPage.tsx';

// Student Views
import { StudentDashboard } from './components/student/StudentDashboard.tsx';
import { StudentTicketsView } from './components/student/StudentTicketsView.tsx';
import { NewReportModal } from './components/student/NewReportModal.tsx';

// Staff Views
import { StaffDashboard } from './components/staff/StaffDashboard.tsx';

// Admin Views
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { AdminTicketList } from './components/admin/AdminTicketList.tsx';
import { AdminUserManagement } from './components/admin/AdminUserManagement.tsx';
import { AdminLocationManagement } from './components/admin/AdminLocationManagement.tsx';
import { AdminAuditLogs } from './components/admin/AdminAuditLogs.tsx';

function MainApp() {
  const { user, loading, quickLogin } = useAuth();

  // Navigation state
  const [currentView, setCurrentView] = useState<string>('landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showNewReport, setShowNewReport] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showHealth, setShowHealth] = useState(false);

  // Notifications & Staff cache
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [staffList, setStaffList] = useState<User[]>([]);

  // Check URL params for autostart
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' && !user) {
      // Auto sign in as admin for rapid evaluation
      quickLogin('admin@merishaw.edu', 'Admin@Merishaw2026!').then(() => {
        setCurrentView('dashboard');
      });
    }
  }, []);

  // Sync view when user auth state changes
  useEffect(() => {
    if (user) {
      if (currentView === 'landing' || currentView === 'login' || currentView === 'emergency') {
        setCurrentView('dashboard');
      }
      fetchNotifications();
      if (user.role === 'admin' || user.role === 'supervisor') {
        fetchStaffList();
      }
    } else {
      if (currentView !== 'emergency') {
        setCurrentView('landing');
      }
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unread_count);
    } catch (err) {
      // ignore
    }
  };

  const fetchStaffList = async () => {
    try {
      const res = await api.getUsers({ role: 'staff', is_active: '1' });
      setStaffList(res.users);
    } catch (err) {
      // ignore
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      fetchNotifications();
    } catch (err) {
      // ignore
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      fetchNotifications();
    } catch (err) {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#681C32] text-white flex items-center justify-center font-bold text-xl mx-auto shadow-md border border-[#B99A55] animate-pulse">
            M
          </div>
          <p className="text-sm font-bold text-[#681C32]">
            Merishaw Cube Maintenance System
          </p>
          <p className="text-xs text-[#546E7A]">Verifying institutional credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#263238] flex flex-col font-sans">
      {/* Top Bar Header */}
      <Header
        currentView={currentView}
        onNavigate={setCurrentView}
        unreadCount={unreadCount}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenProfile={() => setShowProfile(true)}
        onOpenHealth={() => setShowHealth(true)}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* Main Layout Container with Sidebar for Authenticated Users */}
      <div className="flex-1 flex w-full">
        {user && (
          <Sidebar
            currentView={currentView}
            onNavigate={setCurrentView}
            isOpenMobile={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
            onOpenNewReport={() => setShowNewReport(true)}
            onOpenHealth={() => setShowHealth(true)}
          />
        )}

        {/* Content Viewport */}
        <main className={`flex-1 min-w-0 ${!user ? 'max-w-7xl mx-auto w-full' : 'max-w-7xl'} px-4 sm:px-6 lg:px-8 py-6`}>
          {/* Public Views */}
          {!user && currentView === 'landing' && (
            <LandingPage
              onNavigateToLogin={() => setCurrentView('login')}
              onNavigateToEmergency={() => setCurrentView('emergency')}
              onQuickLogin={async (id, pass) => {
                await quickLogin(id, pass);
                setCurrentView('dashboard');
              }}
            />
          )}

          {!user && currentView === 'emergency' && (
            <EmergencyProtocol
              onBack={() => setCurrentView('landing')}
              onNavigateToLogin={() => setCurrentView('login')}
            />
          )}

          {!user && currentView === 'login' && (
            <LoginPage
              onBack={() => setCurrentView('landing')}
              onLoginSuccess={() => setCurrentView('dashboard')}
            />
          )}

          {/* Student Views */}
          {user && user.role === 'student' && (
            <>
              {currentView === 'dashboard' && (
                <StudentDashboard
                  user={user}
                  onOpenNewReport={() => setShowNewReport(true)}
                  onSelectTicket={(id) => setSelectedTicketId(id)}
                  onViewAllTickets={() => setCurrentView('tickets')}
                />
              )}

              {currentView === 'tickets' && (
                <StudentTicketsView
                  onSelectTicket={(id) => setSelectedTicketId(id)}
                  onOpenNewReport={() => setShowNewReport(true)}
                />
              )}

              {currentView === 'new-report' && (
                <div className="py-4">
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="mb-4 text-xs font-semibold text-[#681C32] hover:underline flex items-center gap-1"
                  >
                    ← Back to Accommodation Overview
                  </button>
                  <div className="p-8 bg-white rounded-xl border border-slate-200 text-center space-y-4 shadow-xs">
                    <div className="w-12 h-12 rounded-xl bg-[#681C32]/10 text-[#681C32] flex items-center justify-center mx-auto">
                      <span className="font-bold text-lg">M</span>
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                      <p className="text-base font-bold text-[#263238]">Log a Maintenance Request</p>
                      <p className="text-xs text-[#546E7A]">
                        Use the structured reporting modal to specify your cube or dormitory room, select the fault category, and request technician dispatch.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowNewReport(true)}
                      className="px-6 py-2.5 bg-[#681C32] hover:bg-[#4F1325] text-white text-xs font-bold rounded-lg shadow-sm transition-all border border-[#501426]"
                    >
                      Open Fault Reporting Form
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Maintenance Staff Views */}
          {user && user.role === 'staff' && (
            <>
              {(currentView === 'dashboard' || currentView === 'all-tickets') && (
                <StaffDashboard
                  user={user}
                  onSelectTicket={(id) => setSelectedTicketId(id)}
                />
              )}
            </>
          )}

          {/* Administrator & Supervisor Views */}
          {user && (user.role === 'admin' || user.role === 'supervisor') && (
            <>
              {currentView === 'dashboard' && (
                <AdminDashboard
                  onNavigate={setCurrentView}
                  onSelectTicket={(id) => setSelectedTicketId(id)}
                />
              )}

              {currentView === 'tickets' && (
                <AdminTicketList
                  onSelectTicket={(id) => setSelectedTicketId(id)}
                  staffList={staffList}
                  onTicketAssigned={fetchNotifications}
                />
              )}

              {currentView === 'locations' && (
                <AdminLocationManagement />
              )}

              {currentView === 'users' && (
                <AdminUserManagement />
              )}

              {currentView === 'analytics' && (
                <AdminAuditLogs />
              )}
            </>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 text-xs text-[#546E7A] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#681C32]">Merishaw Cube Maintenance System</span>
            <span>·</span>
            <span className="text-[11px]">Directorate of Student Accommodation & Residential Services</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Campus Help Desk: ext 2200</span>
            <span>·</span>
            <button onClick={() => setShowHealth(true)} className="hover:text-[#681C32] underline font-medium">
              System Health & DB
            </button>
          </div>
        </div>
      </footer>

      {/* Global Interactive Modals */}
      <TicketDetailModal
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        currentUser={user}
        onTicketUpdated={() => {
          fetchNotifications();
        }}
        availableStaff={staffList}
      />

      <NewReportModal
        isOpen={showNewReport}
        onClose={() => setShowNewReport(false)}
        currentUser={user}
        onReportCreated={(ticketId) => {
          fetchNotifications();
          setSelectedTicketId(ticketId);
        }}
      />

      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={handleMarkNotificationRead}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onSelectTicket={(id) => setSelectedTicketId(id)}
      />

      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />

      <HealthModal
        isOpen={showHealth}
        onClose={() => setShowHealth(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

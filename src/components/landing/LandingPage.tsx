import React from 'react';
import { 
  Building2, ShieldCheck, Wrench, Clock, 
  ArrowRight, CheckCircle2, AlertTriangle, FileText 
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToEmergency: () => void;
  onQuickLogin: (identifier: string, pass: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToLogin,
  onNavigateToEmergency,
  onQuickLogin
}) => {
  return (
    <div className="space-y-12 pb-12 font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-10 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Content */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#681C32] bg-[#FDF6F8] px-3 py-1.5 rounded-md border border-[#F2CBD5]">
              <Building2 className="w-4 h-4 text-[#681C32]" />
              <span className="tracking-wide">Directorate of Student Accommodation & Residential Services</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#263238] tracking-tight leading-tight">
              Merishaw Cube Maintenance System
            </h1>

            <p className="text-sm sm:text-base text-[#546E7A] leading-relaxed max-w-2xl">
              One centralized institutional platform for dormitory residents, facility administrators, and licensed maintenance technicians to report, dispatch, and track campus accommodation repairs.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={onNavigateToLogin}
                className="px-6 py-3 bg-[#681C32] hover:bg-[#4F1325] text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm transition-all flex items-center gap-2 border border-[#501426]"
              >
                <span>Access Institutional Portal</span>
                <ArrowRight className="w-4 h-4 text-[#B99A55]" />
              </button>

              <button
                onClick={onNavigateToEmergency}
                className="px-5 py-3 bg-white hover:bg-slate-50 text-[#263238] font-semibold text-xs sm:text-sm rounded-lg border border-slate-300 transition-colors flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Emergency Safety Protocol</span>
              </button>
            </div>

            {/* Quick Evaluation Role Switcher Strip */}
            <div className="pt-5 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-[11px] font-bold text-[#263238] uppercase tracking-wider">
                  Instant Test Sign-In (Evaluation Accounts)
                </span>
                <span className="text-[10px] text-[#B99A55] font-semibold">1-Click Direct Access</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  onClick={() => onQuickLogin('admin@merishaw.edu', 'Admin@Merishaw2026!')}
                  className="p-2.5 rounded-lg border border-[#F2CBD5] bg-[#FDF6F8] hover:bg-[#F9E8ED] text-left transition-colors group"
                >
                  <span className="text-[10px] uppercase font-bold text-[#681C32] block group-hover:underline">Administrator</span>
                  <span className="text-xs font-bold text-[#263238] block truncate">Dr. Evelyn Mwangi</span>
                  <span className="text-[10px] text-[#546E7A]">Directorate Head</span>
                </button>

                <button
                  onClick={() => onQuickLogin('alex.student@merishaw.edu', 'Student@Merishaw2026!')}
                  className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-left transition-colors group"
                >
                  <span className="text-[10px] uppercase font-bold text-[#B99A55] block group-hover:underline">Student Resident</span>
                  <span className="text-xs font-bold text-[#263238] block truncate">Alex Kiprono</span>
                  <span className="text-[10px] text-[#546E7A]">Mount Meru 204-A</span>
                </button>

                <button
                  onClick={() => onQuickLogin('sarah.electrician@merishaw.edu', 'Staff@Merishaw2026!')}
                  className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-left transition-colors group"
                >
                  <span className="text-[10px] uppercase font-bold text-blue-800 block group-hover:underline">Electrician</span>
                  <span className="text-xs font-bold text-[#263238] block truncate">Sarah Muthoni</span>
                  <span className="text-[10px] text-[#546E7A]">Power Systems</span>
                </button>

                <button
                  onClick={() => onQuickLogin('john.staff@merishaw.edu', 'Staff@Merishaw2026!')}
                  className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-left transition-colors group"
                >
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block group-hover:underline">Plumbing Staff</span>
                  <span className="text-xs font-bold text-[#263238] block truncate">John Otieno</span>
                  <span className="text-[10px] text-[#546E7A]">Fittings & Water</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Hero Image Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-xl overflow-hidden shadow-md border border-slate-200 bg-slate-100 aspect-16/10 lg:aspect-4/3">
              <img
                src="/src/assets/images/hero_dormitory_campus_1792678996282.jpg"
                alt="Merishaw University Residential Hall Campus"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#4F1325]/90 via-[#4F1325]/20 to-transparent flex items-end p-5">
                <div className="text-white space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#B99A55]">
                    Mount Meru & Great Rift Residences
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-white">
                    Standardized Cube & Room Maintenance Workflows
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Standards & Key Features */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[#681C32] block mb-1">
            Standard Operating Procedures
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#263238]">
            Engineered for Accountable Campus Living
          </h2>
          <p className="text-xs sm:text-sm text-[#546E7A] mt-1.5">
            Every submitted fault follows an auditable lifecycle from triage and dispatch to technician sign-off and student closure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#FDF6F8] text-[#681C32] border border-[#F2CBD5] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#263238]">Kiosk & Shared-PC Ready</h3>
            <p className="text-xs text-[#546E7A] leading-relaxed">
              Designed to work smoothly on hall lobby kiosk terminals, shared computer labs, tablets, and personal computers with zero smartphone dependency.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#263238]">Target SLA Guarantees</h3>
            <p className="text-xs text-[#546E7A] leading-relaxed">
              Sanitation faults addressed within 6 hours; electrical faults within 12 hours. Clear SLA tracking flags overdue tickets automatically.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#263238]">100% Verified Audit Trails</h3>
            <p className="text-xs text-[#546E7A] leading-relaxed">
              Every status transition, technician work log, and parts consumption record is permanently recorded with timestamps for complete institutional accountability.
            </p>
          </div>
        </div>
      </section>

      {/* Visual Campus Showcase Strip */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xs aspect-4/3 bg-slate-100">
            <img
              src="/src/assets/images/cube_study_bedroom_1792678996793.jpg"
              alt="Student Accommodation Cube Room"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#681C32] block">
              Cube-Level Granularity
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#263238]">
              Pinpoint Fixtures to Individual Resident Cubes
            </h2>
            <p className="text-xs text-[#546E7A] leading-relaxed">
              Unlike generic hall request forms, Merishaw associates maintenance requests directly with specific cube bunks (Cube A, B, C, D), desks, lockers, and windows.
            </p>
            <ul className="space-y-2.5 text-xs text-[#263238]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#681C32] shrink-0" />
                <span>Pre-filled resident accommodation details</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#681C32] shrink-0" />
                <span>Predefined fault categories and component dropdowns</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#681C32] shrink-0" />
                <span>Immediate confirmation with ticket reference code</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SLA Target Reference Table */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-[#263238]">Official Institutional SLA Targets</h3>
            <p className="text-xs text-[#546E7A]">Standard response benchmarks according to university regulations</p>
          </div>
          <span className="text-xs text-[#B99A55] font-mono font-bold bg-[#FDFBF6] px-2.5 py-1 rounded border border-[#EFE2C5] self-start sm:self-auto">
            Merishaw Facilities Manual 2026
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-lg">
            <span className="font-bold text-rose-900 block">Sanitation & Bathrooms</span>
            <span className="text-lg font-black text-rose-700 font-mono mt-1 block">6 Hours SLA</span>
            <span className="text-[11px] text-rose-800">Immediate hygiene priority</span>
          </div>

          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg">
            <span className="font-bold text-amber-900 block">Plumbing & Water</span>
            <span className="text-lg font-black text-amber-700 font-mono mt-1 block">8 Hours SLA</span>
            <span className="text-[11px] text-amber-800">Pipes, taps & basins</span>
          </div>

          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg">
            <span className="font-bold text-blue-900 block">Electrical & Power</span>
            <span className="text-lg font-black text-blue-700 font-mono mt-1 block">12 Hours SLA</span>
            <span className="text-[11px] text-blue-800">Sockets, breakers & wiring</span>
          </div>

          <div className="p-3.5 bg-[#F4F5F7] border border-slate-200 rounded-lg">
            <span className="font-bold text-[#263238] block">Furniture & Carpentry</span>
            <span className="text-lg font-black text-[#546E7A] font-mono mt-1 block">36-48 Hours</span>
            <span className="text-[11px] text-[#546E7A]">Beds, desks & cupboards</span>
          </div>
        </div>
      </section>
    </div>
  );
};

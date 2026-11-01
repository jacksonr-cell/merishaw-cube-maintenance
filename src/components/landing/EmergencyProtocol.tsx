import React from 'react';
import { ShieldAlert, Phone, AlertTriangle, ArrowLeft } from 'lucide-react';

interface EmergencyProtocolProps {
  onBack: () => void;
  onNavigateToLogin: () => void;
}

export const EmergencyProtocol: React.FC<EmergencyProtocolProps> = ({
  onBack,
  onNavigateToLogin
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 font-sans">
      <div>
        <button
          onClick={onBack}
          className="text-xs font-semibold text-[#681C32] hover:underline flex items-center gap-1.5 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portal Overview</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 px-3 py-1 rounded-md border border-red-200 w-fit mb-3">
          <ShieldAlert className="w-4 h-4 text-red-600" />
          <span>Institutional Safety Escalation Protocol</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#263238]">
          Emergency Maintenance & Life Safety Procedures
        </h1>
        <p className="text-xs sm:text-sm text-[#546E7A] mt-1.5">
          Immediate instructions for residential accommodation hazards requiring urgent facility isolation.
        </p>
      </div>

      {/* Critical Advisory Banner */}
      <div className="p-5 bg-red-50 border-2 border-red-300 rounded-xl space-y-2 text-xs text-red-950">
        <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 text-red-700 shrink-0" />
          <span>DO NOT RELY ON WEB TICKETING FOR ACTIVE LIFE HAZARDS</span>
        </div>
        <p className="leading-relaxed">
          The Merishaw Cube Maintenance System is an asynchronous facility repair portal. Submitting a ticket does <strong>NOT</strong> contact municipal police, fire, or ambulance services. If there is an active fire, medical crisis, or severe structural collapse, evacuate immediately and call campus emergency numbers below.
        </p>
      </div>

      {/* Hotlines */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] text-[#546E7A] font-bold block uppercase">Campus Security 24/7</span>
          <p className="text-lg font-bold font-mono text-[#681C32]">+254 (0) 700 999 111</p>
          <span className="text-[10px] text-slate-400 block">Main Gate Control Room</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] text-[#546E7A] font-bold block uppercase">Facility Duty Technician</span>
          <p className="text-lg font-bold font-mono text-[#681C32]">+254 (0) 711 888 222</p>
          <span className="text-[10px] text-slate-400 block">On-call electrical / plumbing duty</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] text-[#546E7A] font-bold block uppercase">Campus Health Center</span>
          <p className="text-lg font-bold font-mono text-[#681C32]">+254 (0) 722 777 333</p>
          <span className="text-[10px] text-slate-400 block">Emergency triage clinic</span>
        </div>
      </div>

      {/* Specific Hazard Instructions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#263238]">Hazard Action Guides</h2>

        <div className="space-y-4 text-xs divide-y divide-slate-100">
          <div className="pt-3">
            <h3 className="font-bold text-[#681C32] text-sm mb-1">Exposed Wiring or Electrical Sparking</h3>
            <p className="text-[#546E7A] leading-relaxed">
              1. Immediately step away from the fixture. Do not touch bare copper wires or water near sockets.<br />
              2. Do not attempt to extinguish electrical fires with water.<br />
              3. Alert the Hall Warden on your floor and log an Emergency ticket with the exact room and cube number.
            </p>
          </div>

          <div className="pt-3">
            <h3 className="font-bold text-[#681C32] text-sm mb-1">Major Water Pipe Burst or Ceiling Flooding</h3>
            <p className="text-[#546E7A] leading-relaxed">
              1. Elevate laptops, study materials, and electrical devices off the floor and study desk.<br />
              2. If safe, turn off the local isolation stopcock located outside the bathroom cluster.<br />
              3. Notify the Hall Porter immediately and submit an Emergency Plumbing ticket.
            </p>
          </div>

          <div className="pt-3">
            <h3 className="font-bold text-[#681C32] text-sm mb-1">Shattered Window Glazing</h3>
            <p className="text-[#546E7A] leading-relaxed">
              1. Keep clear of falling glass shards.<br />
              2. Do not lean against cracked window panes or casement frames.<br />
              3. Flag as High Priority under the "Windows & Glazing" category.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onNavigateToLogin}
          className="px-6 py-2.5 bg-[#681C32] hover:bg-[#4F1325] text-white rounded-lg font-bold text-xs shadow-sm transition-all border border-[#501426]"
        >
          Proceed to Sign In & Submit Report →
        </button>
      </div>
    </div>
  );
};


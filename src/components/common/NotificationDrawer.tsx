import React from 'react';
import type { NotificationItem } from '../../types.ts';
import { X, Check, CheckCheck, Clock, AlertTriangle, Info, Wrench } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSelectTicket: (ticketId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectTicket
}) => {
  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />;
      case 'assignment':
        return <Wrench className="w-4 h-4 text-[#681C32] shrink-0 mt-0.5" />;
      case 'success':
        return <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#263238]">Notifications</h2>
            {unreadCount > 0 && (
              <span className="text-xs bg-[#681C32]/10 text-[#681C32] border border-[#B99A55]/30 font-semibold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-[#681C32] hover:text-[#4F1325] flex items-center gap-1 font-medium transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5 text-[#B99A55]" />
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>No notifications at this time.</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-lg transition-colors flex items-start gap-3 ${
                  item.is_read ? 'hover:bg-slate-50' : 'bg-[#FDF6F8] hover:bg-[#FDF2F4] border border-[#B99A55]/30'
                }`}
              >
                {getIcon(item.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${item.is_read ? 'text-[#263238]' : 'text-[#681C32]'}`}>
                      {item.title}
                    </p>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {item.message}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    {item.ticket_id && (
                      <button
                        onClick={() => {
                          onSelectTicket(item.ticket_id!);
                          onClose();
                        }}
                        className="text-xs font-semibold text-[#681C32] hover:text-[#4F1325] hover:underline"
                      >
                        View Ticket →
                      </button>
                    )}
                    {!item.is_read && (
                      <button
                        onClick={() => onMarkAsRead(item.id)}
                        className="text-[11px] text-slate-500 hover:text-slate-800"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

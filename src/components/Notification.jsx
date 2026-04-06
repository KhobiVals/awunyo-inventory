import React, { useEffect, useState } from 'react';

export default function Notification({ notification }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [notification]);

  if (!notification) return null;

  const colors = {
    success: 'bg-emerald-600',
    error:   'bg-red-600',
    warning: 'bg-amber-500',
  };

  const icons = {
    success: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    error: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    warning: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  };

  return (
    <div
      className={`
        fixed left-4 right-4 z-[9999]
        ${colors[notification.type] || colors.success}
        text-white px-4 py-3 rounded-2xl shadow-2xl
        flex items-center gap-2.5 max-w-sm mx-auto
        transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}
      style={{
        top: '16px',
        fontSize: '0.8125rem',
        fontWeight: 600,
      }}
    >
      {icons[notification.type] || icons.success}
      <span className="flex-1 leading-snug">{notification.msg}</span>
    </div>
  );
}

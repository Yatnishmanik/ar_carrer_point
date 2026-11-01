'use client';

import { Check, X, Info, TriangleAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';

const variants = {
  success: { title: 'Success', icon: Check, panel: 'border-emerald-500 bg-emerald-50', badge: 'bg-emerald-500' },
  error: { title: 'Error', icon: X, panel: 'border-rose-500 bg-rose-50', badge: 'bg-rose-500' },
  warning: { title: 'Warning', icon: TriangleAlert, panel: 'border-amber-500 bg-amber-50', badge: 'bg-amber-500' },
  info: { title: 'Information', icon: Info, panel: 'border-blue-500 bg-blue-50', badge: 'bg-blue-500' },
};

export function ToastNotification() {
  const { toast, hideToast, t } = useApp();
  const variant = variants[toast.type];
  const Icon = variant.icon;

  return (
    <div className="pointer-events-none fixed right-3 top-24 z-[100] w-[calc(100%_-_24px)] max-w-sm sm:right-6">
      {toast.show && <div
        role={toast.type === 'error' || toast.type === 'warning' ? 'alert' : 'status'}
        aria-atomic="true"
        className={`pointer-events-auto flex items-start gap-3 rounded-r-lg border-l-[3px] px-4 py-3.5 shadow-lg ${variant.panel}`}
      >
        <span aria-hidden="true" className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${variant.badge}`}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-800">{t(variant.title)}</p>
          <p className="mt-1 break-words text-sm leading-5 text-slate-600">{t(toast.message)}</p>
        </div>
        <button type="button" onClick={hideToast} aria-label={t('Dismiss notification')} className="-mr-1 -mt-0.5 shrink-0 rounded-md p-1 text-slate-400 hover:bg-black/5 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500">
          <X className="h-4 w-4" />
        </button>
      </div>}
    </div>
  );
}

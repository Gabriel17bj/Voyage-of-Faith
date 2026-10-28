import React from 'react';
import { ChevronLeft } from 'lucide-react';

export const TopBar: React.FC<{
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}> = ({ title, onBack, right }) => (
  <header className="sticky top-0 z-10 bg-white border-b border-line pt-[env(safe-area-inset-top)]">
    <div className="mx-auto max-w-lg h-14 px-2 flex items-center gap-1">
      {onBack ? (
        <button
          onClick={onBack}
          className="w-11 h-11 -ml-1 flex items-center justify-center rounded-full text-ink active:bg-slate-100"
          aria-label="뒤로"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      ) : (
        <span className="w-2" />
      )}
      <h1 className="flex-1 min-w-0 truncate text-lg font-bold">{title}</h1>
      {right}
    </div>
  </header>
);

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white active:bg-brand-dark disabled:bg-slate-300',
  secondary: 'bg-white text-ink border border-line active:bg-slate-50 disabled:text-slate-400',
  ghost: 'bg-transparent text-brand active:bg-blue-50 disabled:text-slate-400',
  danger: 'bg-white text-rose-600 border border-rose-200 active:bg-rose-50',
};

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; block?: boolean }
> = ({ variant = 'primary', block, className = '', ...props }) => (
  <button
    {...props}
    className={`h-13 min-h-[52px] px-5 rounded-xl text-base font-bold transition-colors ${VARIANTS[variant]} ${
      block ? 'w-full' : ''
    } ${className}`}
  />
);

export const ProgressBar: React.FC<{ value: number; max: number; className?: string }> = ({ value, max, className = '' }) => (
  <div className={`h-2 rounded-full bg-slate-200 overflow-hidden ${className}`}>
    <div className="h-full bg-brand rounded-full transition-[width] duration-300" style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
  </div>
);

export const Stars: React.FC<{ count: number; size?: string }> = ({ count, size = 'text-base' }) => (
  <span className={`${size} tracking-tight`} aria-label={`별 ${count}개`}>
    {[1, 2, 3].map((i) => (
      <span key={i} className={i <= count ? 'text-amber-400' : 'text-slate-300'}>
        ★
      </span>
    ))}
  </span>
);

export const Notice: React.FC<{ tone?: 'error' | 'info' | 'success'; children: React.ReactNode }> = ({
  tone = 'info',
  children,
}) => {
  const styles =
    tone === 'error'
      ? 'bg-rose-50 border-rose-200 text-rose-800'
      : tone === 'success'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
      : 'bg-blue-50 border-blue-200 text-blue-900';
  return (
    <div role={tone === 'error' ? 'alert' : undefined} className={`rounded-xl border px-4 py-3 text-[15px] leading-relaxed ${styles}`}>
      {children}
    </div>
  );
};

export function formatDuration(ms: number): string {
  const sec = Math.floor((ms || 0) / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

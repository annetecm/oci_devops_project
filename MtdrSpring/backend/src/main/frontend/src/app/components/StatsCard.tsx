import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
}

// Map the soft `iconBgColor` token to a richer accent + gradient.
// Keeps the existing prop API while letting us style each card cohesively.
const accentMap: Record<string, { bar: string; gradientFrom: string; ring: string }> = {
  'bg-slate-100':   { bar: 'bg-slate-500',   gradientFrom: 'from-slate-50/80',   ring: 'ring-slate-200/70' },
  'bg-amber-100':   { bar: 'bg-amber-500',   gradientFrom: 'from-amber-50/80',   ring: 'ring-amber-200/70' },
  'bg-orange-100':  { bar: 'bg-orange-500',  gradientFrom: 'from-orange-50/80',  ring: 'ring-orange-200/70' },
  'bg-emerald-100': { bar: 'bg-emerald-500', gradientFrom: 'from-emerald-50/80', ring: 'ring-emerald-200/70' },
  'bg-green-100':   { bar: 'bg-emerald-500', gradientFrom: 'from-emerald-50/80', ring: 'ring-emerald-200/70' },
  'bg-rose-100':    { bar: 'bg-rose-500',    gradientFrom: 'from-rose-50/80',    ring: 'ring-rose-200/70' },
  'bg-red-100':     { bar: 'bg-red-700',     gradientFrom: 'from-red-50/80',     ring: 'ring-red-200/70' },
  'bg-blue-100':    { bar: 'bg-blue-500',    gradientFrom: 'from-blue-50/80',    ring: 'ring-blue-200/70' },
  'bg-purple-100':  { bar: 'bg-purple-500',  gradientFrom: 'from-purple-50/80',  ring: 'ring-purple-200/70' },
};

const fallback = { bar: 'bg-slate-500', gradientFrom: 'from-slate-50/80', ring: 'ring-slate-200/70' };

export default function StatsCard({ title, value, icon: Icon, iconColor, iconBgColor }: StatsCardProps) {
  const accent = accentMap[iconBgColor] ?? fallback;

  return (
    <div
      className={`group relative rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden bg-gradient-to-br ${accent.gradientFrom} via-white to-white`}
    >
      {/* Left accent bar */}
      <span className={`absolute top-0 bottom-0 left-0 w-1 ${accent.bar}`} />

      <div className="p-5 pl-6 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">
            {title}
          </p>
          <p className="text-4xl text-slate-900 tracking-tight leading-none tabular-nums">
            {value}
          </p>
        </div>
        <div
          className={`shrink-0 w-12 h-12 rounded-xl ${iconBgColor} ring-1 ring-inset ${accent.ring} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}
        >
          <Icon className={`w-6 h-6 ${iconColor}`} strokeWidth={2.25} />
        </div>
      </div>
    </div>
  );
}

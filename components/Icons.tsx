type IconProps = { className?: string };
const base = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const HomeIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1z" /></svg>
);
export const CompassIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></svg>
);
export const LibraryIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M5 4h4v16H5zM10 4h4v16h-4z" /><path d="m15.5 5.5 3.7-1 3 14.5-3.7 1z" transform="translate(-2 0)" /></svg>
);
export const UserIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></svg>
);
export const SearchIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
);
export const LockIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}><rect x="5" y="10.5" width="14" height="9.5" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>
);
export const CheckIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const BookmarkIcon = ({ className, filled }: IconProps & { filled?: boolean }) => (
  <svg {...base} className={className} fill={filled ? "currentColor" : "none"}><path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z" /></svg>
);
export const ChevronLeftIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="m15 5-7 7 7 7" /></svg>
);

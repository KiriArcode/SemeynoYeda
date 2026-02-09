
interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
}

export function ProgressBar({ value, className = '' }: ProgressBarProps) {
  return (
    <div className={`w-full h-0.5 bg-nebula rounded-full overflow-hidden ${className}`}>
      <div 
        className="h-full bg-gradient-to-r from-portal to-portal/70 transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

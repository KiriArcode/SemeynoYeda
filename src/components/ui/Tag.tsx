
interface TagProps {
  children: React.ReactNode;
  variant?: 'default' | 'gastritis' | 'freezable' | 'quick' | 'prep-day';
  className?: string;
}

const tagStyles = {
  default: 'bg-portal/12 text-portal border-portal',
  gastritis: 'bg-portal-dim/12 text-portal-dim border-portal-dim',
  freezable: 'bg-accent-cyan/12 text-accent-cyan border-accent-cyan',
  quick: 'bg-accent-orange/12 text-accent-orange border-accent-orange',
  'prep-day': 'bg-accent-purple/12 text-accent-purple border-accent-purple'
};

export function Tag({ children, variant = 'default', className = '' }: TagProps) {
  return (
    <span className={`
      inline-flex items-center px-2 py-0.5 text-xs font-medium
      rounded-tag border
      ${tagStyles[variant]}
      ${className}
    `}>
      {children}
    </span>
  );
}

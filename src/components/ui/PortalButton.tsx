import { type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface PortalButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

export function PortalButton({
  children,
  onClick,
  disabled = false,
  size = 'md',
  variant = 'primary',
  className = '',
  icon,
  fullWidth = false,
  loading = false,
}: PortalButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]',
  };

  const variantStyles = {
    primary: {
      bg: 'var(--portal)',
      text: 'var(--text-inverse)',
      shadow: '0 0 20px rgba(57, 255, 20, 0.5)',
      hoverShadow: '0 0 30px rgba(57, 255, 20, 0.8)',
    },
    secondary: {
      bg: 'var(--portal-dim)',
      text: 'var(--text-inverse)',
      shadow: '0 0 20px rgba(0, 230, 118, 0.5)',
      hoverShadow: '0 0 30px rgba(0, 230, 118, 0.8)',
    },
    danger: {
      bg: 'var(--accent-pink)',
      text: 'var(--text-inverse)',
      shadow: '0 0 20px rgba(255, 107, 157, 0.5)',
      hoverShadow: '0 0 30px rgba(255, 107, 157, 0.8)',
    },
  };

  const style = variantStyles[variant];

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative overflow-hidden rounded-button font-heading font-semibold
        flex items-center justify-center gap-2
        transition-all duration-300
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        backgroundColor: style.bg,
        color: style.text,
        boxShadow: style.shadow,
      }}
      whileHover={
        !disabled && !loading
          ? {
              scale: 1.02,
              boxShadow: style.hoverShadow,
            }
          : {}
      }
      whileTap={
        !disabled && !loading
          ? {
              scale: 0.98,
            }
          : {}
      }
    >
      {/* Animated background glow */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at center, ${style.bg}, transparent)`,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Scan line effect */}
      {!disabled && !loading && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
          }}
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
            repeatDelay: 1,
          }}
        />
      )}

      {/* Particles around the button */}
      {!disabled && !loading && (
        <>
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                backgroundColor: style.bg,
                boxShadow: `0 0 4px ${style.bg}`,
                top: '50%',
                left: '50%',
              }}
              animate={{
                x: [0, (Math.random() - 0.5) * 40],
                y: [0, (Math.random() - 0.5) * 40],
                opacity: [1, 0],
                scale: [1, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeOut',
                delay: i * 0.3,
              }}
            />
          ))}
        </>
      )}

      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {loading ? (
          <>
            <motion.div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <span>Загрузка...</span>
          </>
        ) : (
          <>
            {icon && <span className="flex items-center">{icon}</span>}
            {children}
          </>
        )}
      </span>
    </motion.button>
  );
}

// Preset variants
export function PortalActionButton({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <PortalButton 
      onClick={onClick}
      variant="primary"
      icon={<Sparkles size={18} />}
      className={className}
    >
      {children}
    </PortalButton>
  );
}

export function PortalDangerButton({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <PortalButton 
      onClick={onClick}
      variant="danger"
      className={className}
    >
      {children}
    </PortalButton>
  );
}

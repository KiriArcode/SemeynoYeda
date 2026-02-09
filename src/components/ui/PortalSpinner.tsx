import { motion } from 'motion/react';

interface PortalSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PortalSpinner({ size = 'md', className = '' }: PortalSpinnerProps) {
  const sizeMap = {
    sm: 40,
    md: 60,
    lg: 80,
  };

  const spinnerSize = sizeMap[size];

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative" style={{ width: spinnerSize, height: spinnerSize }}>
        {/* Outer ring with portal glow */}
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{
            borderColor: 'var(--portal)',
            boxShadow: '0 0 20px rgba(57, 255, 20, 0.5), inset 0 0 20px rgba(57, 255, 20, 0.3)',
          }}
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
            scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
          }}
        />

        {/* Middle ring */}
        <motion.div
          className="absolute rounded-full border-2"
          style={{
            borderColor: 'var(--portal)',
            opacity: 0.6,
            top: '15%',
            left: '15%',
            right: '15%',
            bottom: '15%',
            boxShadow: '0 0 15px rgba(57, 255, 20, 0.4)',
          }}
          animate={{
            rotate: -360,
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Inner ring */}
        <motion.div
          className="absolute rounded-full border-2"
          style={{
            borderColor: 'var(--portal)',
            opacity: 0.8,
            top: '30%',
            left: '30%',
            right: '30%',
            bottom: '30%',
            boxShadow: '0 0 10px rgba(57, 255, 20, 0.6)',
          }}
          animate={{
            rotate: 360,
            opacity: [0.8, 0.4, 0.8],
          }}
          transition={{
            rotate: { duration: 1, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
          }}
        />

        {/* Center glow */}
        <motion.div
          className="absolute rounded-full bg-[var(--portal)]"
          style={{
            top: '40%',
            left: '40%',
            right: '40%',
            bottom: '40%',
            boxShadow: '0 0 20px rgba(57, 255, 20, 0.8)',
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[var(--portal)]"
            style={{
              top: '50%',
              left: '50%',
              boxShadow: '0 0 4px rgba(57, 255, 20, 0.8)',
            }}
            animate={{
              x: [0, Math.cos((i * Math.PI * 2) / 6) * (spinnerSize / 2)],
              y: [0, Math.sin((i * Math.PI * 2) / 6) * (spinnerSize / 2)],
              opacity: [1, 0],
              scale: [1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Full screen loading overlay
interface PortalLoadingProps {
  text?: string;
}

export function PortalLoading({ text = 'Открываем портал...' }: PortalLoadingProps) {
  return (
    <motion.div
      className="fixed inset-0 bg-void/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <PortalSpinner size="lg" />
      {text && (
        <motion.p
          className="mt-6 text-portal font-mono text-sm"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  );
}

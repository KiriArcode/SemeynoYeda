import { createContext, useContext, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface PortalTransitionContextType {
  triggerTransition: (callback: () => void) => void;
}

const PortalTransitionContext = createContext<PortalTransitionContextType | null>(null);

export function usePortalTransition() {
  const context = useContext(PortalTransitionContext);
  if (!context) {
    throw new Error('usePortalTransition must be used within PortalTransitionProvider');
  }
  return context;
}

interface PortalTransitionProviderProps {
  children: ReactNode;
}

export function PortalTransitionProvider({ children }: PortalTransitionProviderProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const triggerTransition = (callback: () => void) => {
    setIsTransitioning(true);
    
    // Wait for portal animation to peak, then execute callback
    setTimeout(() => {
      callback();
      // Wait a bit before hiding the portal
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 400);
  };

  return (
    <PortalTransitionContext.Provider value={{ triggerTransition }}>
      {children}
      <PortalTransitionOverlay isActive={isTransitioning} />
    </PortalTransitionContext.Provider>
  );
}

interface PortalTransitionOverlayProps {
  isActive: boolean;
}

function PortalTransitionOverlay({ isActive }: PortalTransitionOverlayProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Background overlay */}
          <motion.div
            className="absolute inset-0 bg-void"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.95 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Portal effect */}
          <div className="relative w-64 h-64">
            {/* Outer rings */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border-2"
                style={{
                  borderColor: 'var(--portal)',
                  opacity: 0.8 - i * 0.1,
                  boxShadow: `0 0 ${30 - i * 3}px rgba(57, 255, 20, 0.${8 - i})`,
                }}
                initial={{
                  scale: 0,
                  rotate: 0,
                }}
                animate={{
                  scale: [0, 1.5 + i * 0.2, 0],
                  rotate: [0, i % 2 === 0 ? 360 : -360, 0],
                  opacity: [0, 0.8 - i * 0.1, 0],
                }}
                transition={{
                  duration: 0.8,
                  ease: 'easeOut',
                  delay: i * 0.05,
                }}
              />
            ))}

            {/* Center portal */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{
                scale: [0, 1.2, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 0.8,
                ease: 'easeInOut',
              }}
            >
              <div
                className="w-32 h-32 rounded-full bg-[var(--portal)]"
                style={{
                  boxShadow: '0 0 80px rgba(57, 255, 20, 1), inset 0 0 40px rgba(57, 255, 20, 0.8)',
                }}
              />
            </motion.div>

            {/* Energy particles */}
            {[...Array(16)].map((_, i) => {
              const angle = (i * Math.PI * 2) / 16;
              const distance = 120;
              return (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute w-2 h-2 rounded-full bg-[var(--portal)]"
                  style={{
                    top: '50%',
                    left: '50%',
                    marginTop: -4,
                    marginLeft: -4,
                    boxShadow: '0 0 8px rgba(57, 255, 20, 1)',
                  }}
                  initial={{
                    x: 0,
                    y: 0,
                    scale: 0,
                  }}
                  animate={{
                    x: [0, Math.cos(angle) * distance, 0],
                    y: [0, Math.sin(angle) * distance, 0],
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 0.8,
                    ease: 'easeOut',
                    delay: i * 0.02,
                  }}
                />
              );
            })}

            {/* Lightning bolts effect */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`bolt-${i}`}
                className="absolute w-1 rounded-full bg-[var(--portal)]"
                style={{
                  top: '50%',
                  left: '50%',
                  height: '60%',
                  marginLeft: -2,
                  transformOrigin: 'top center',
                  rotate: `${i * 60}deg`,
                  boxShadow: '0 0 10px rgba(57, 255, 20, 1)',
                }}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{
                  scaleY: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 0.6,
                  ease: 'easeInOut',
                  delay: 0.1 + i * 0.05,
                }}
              />
            ))}
          </div>

          {/* Glitch text effect */}
          <motion.div
            className="absolute bottom-1/4 text-portal font-mono text-sm"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: [0, -2, 2, -1, 1, 0],
            }}
            transition={{
              duration: 0.8,
              ease: 'easeInOut',
            }}
          >
            Opening Portal...
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// HOC to wrap page content with transition animation
interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

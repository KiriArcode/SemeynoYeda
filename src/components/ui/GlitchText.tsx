import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface GlitchTextProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span';
  glitchOnHover?: boolean;
  continuous?: boolean;
  intensity?: 'low' | 'medium' | 'high';
}

export function GlitchText({ 
  text, 
  className = '', 
  as: Tag = 'span',
  glitchOnHover = false,
  continuous = false,
  intensity = 'medium'
}: GlitchTextProps) {
  const [isGlitching, setIsGlitching] = useState(false);
  const [displayText, setDisplayText] = useState(text);

  // Символы для глитч-эффекта
  const glitchChars = '!<>-_\\/[]{}—=+*^?#_ₓ₂₃₄₅₆₇₈₉';
  
  // Настройки интенсивности
  const intensityMap = {
    low: { duration: 100, chars: 2 },
    medium: { duration: 80, chars: 3 },
    high: { duration: 50, chars: 5 },
  };

  const config = intensityMap[intensity];

  // Проверка prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  // Continuous mode: периодический глитч
  useEffect(() => {
    if (!continuous || prefersReducedMotion) return;

    const interval = setInterval(() => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), config.duration * 3);
    }, Math.random() * 5000 + 3000); // каждые 3-8 секунд

    return () => clearInterval(interval);
  }, [continuous, config.duration, prefersReducedMotion]);

  // Анимация глитч-эффекта
  useEffect(() => {
    if (!isGlitching || prefersReducedMotion) {
      setDisplayText(text);
      return;
    }

    let frame = 0;
    const maxFrames = 5;
    
    const glitchInterval = setInterval(() => {
      if (frame >= maxFrames) {
        setDisplayText(text);
        setIsGlitching(false);
        clearInterval(glitchInterval);
        return;
      }

      // Заменяем случайные символы на глитч
      // Используем параметр chars для контроля количества заменяемых символов
      const charsToReplace = Math.min(config.chars, text.length);
      const indicesToReplace = new Set<number>();
      
      // Выбираем случайные индексы для замены
      while (indicesToReplace.size < charsToReplace && indicesToReplace.size < text.length) {
        const randomIndex = Math.floor(Math.random() * text.length);
        if (frame < maxFrames - 1) {
          indicesToReplace.add(randomIndex);
        }
      }

      const glitched = text.split('').map((char, i) => {
        if (indicesToReplace.has(i)) {
          return glitchChars[Math.floor(Math.random() * glitchChars.length)];
        }
        return char;
      }).join('');

      setDisplayText(glitched);
      frame++;
    }, config.duration);

    return () => clearInterval(glitchInterval);
  }, [isGlitching, text, config.duration, config.chars, prefersReducedMotion]);

  // Обработчик наведения
  const handleMouseEnter = () => {
    if (glitchOnHover && !isGlitching && !prefersReducedMotion) {
      setIsGlitching(true);
    }
  };

  // Обработчик ухода курсора - плавное завершение эффекта
  const handleMouseLeave = () => {
    if (glitchOnHover && isGlitching && !prefersReducedMotion) {
      // Даём эффекту завершиться естественным образом через небольшую задержку
      setTimeout(() => {
        setIsGlitching(false);
      }, config.duration * 2);
    }
  };

  // Touch поддержка для мобильных
  const handleTouch = () => {
    if (glitchOnHover && !isGlitching && !prefersReducedMotion) {
      setIsGlitching(true);
    }
  };

  return (
    <Tag 
      className={`relative inline-block font-heading ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouch}
      style={{ 
        cursor: glitchOnHover ? 'pointer' : 'default',
      }}
    >
      {/* Основной текст */}
      <motion.span
        className="relative z-10"
        animate={isGlitching && !prefersReducedMotion ? {
          x: [0, -2, 2, -1, 1, 0],
          filter: [
            'none',
            'hue-rotate(90deg)',
            'hue-rotate(-90deg)',
            'hue-rotate(180deg)',
            'none',
          ],
        } : {}}
        transition={{
          duration: 0.3,
          ease: 'easeInOut',
        }}
      >
        {displayText}
      </motion.span>

      {/* Цветовые слои глитча */}
      {isGlitching && !prefersReducedMotion && (
        <>
          {/* Зелёный слой */}
          <motion.span
            className="absolute top-0 left-0 text-portal opacity-70 pointer-events-none z-0 font-heading"
            aria-hidden="true"
            animate={{
              x: [0, -3, 2, -2, 0],
              clipPath: [
                'inset(0 0 0 0)',
                'inset(40% 0 60% 0)',
                'inset(60% 0 40% 0)',
                'inset(20% 0 80% 0)',
                'inset(0 0 0 0)',
              ],
            }}
            transition={{
              duration: 0.3,
              ease: 'easeInOut',
            }}
          >
            {text}
          </motion.span>
          
          {/* Голубой слой */}
          <motion.span
            className="absolute top-0 left-0 text-accent-cyan opacity-70 pointer-events-none z-0 font-heading"
            aria-hidden="true"
            animate={{
              x: [0, 3, -2, 2, 0],
              clipPath: [
                'inset(0 0 0 0)',
                'inset(20% 0 80% 0)',
                'inset(80% 0 20% 0)',
                'inset(60% 0 40% 0)',
                'inset(0 0 0 0)',
              ],
            }}
            transition={{
              duration: 0.3,
              ease: 'easeInOut',
            }}
          >
            {text}
          </motion.span>
        </>
      )}

      {/* Эффект сканирования */}
      {isGlitching && !prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: `repeating-linear-gradient(0deg, transparent, transparent 2px, var(--portal-glow) 2px, var(--portal-glow) 4px)`,
          }}
          animate={{
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 0.2,
            repeat: 2,
          }}
        />
      )}
    </Tag>
  );
}

// Preset компоненты для удобного использования

export function GlitchHeading({ children, className = '' }: { children: string; className?: string }) {
  return (
    <GlitchText 
      text={children} 
      as="h1" 
      continuous 
      intensity="low"
      className={className}
    />
  );
}

export function GlitchTitle({ children, className = '' }: { children: string; className?: string }) {
  return (
    <GlitchText 
      text={children} 
      as="h2" 
      glitchOnHover
      intensity="medium"
      className={className}
    />
  );
}

import { useState } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'motion/react';
import type { Recipe, FamilyMember, WabbaRating } from '../../data/schema';
import { X, Heart } from 'lucide-react';

const MEMBER_BADGE: Record<string, React.CSSProperties> = {
  kolya: { background: 'rgba(0,229,255,0.10)', color: '#00E5FF', borderColor: 'rgba(0,229,255,0.25)' },
  kristina: { background: 'rgba(255,107,157,0.10)', color: '#FF6B9D', borderColor: 'rgba(255,107,157,0.25)' },
  both: { background: 'rgba(57,255,20,0.10)', color: '#39FF14', borderColor: 'rgba(57,255,20,0.25)' },
};

interface WabbaCardStackProps {
  cards: Recipe[];
  evaluator: FamilyMember;
  onSwipe: (recipe: Recipe, rating: WabbaRating) => void;
  loading: boolean;
}

export function WabbaCardStack({ cards, evaluator, onSwipe, loading }: WabbaCardStackProps) {
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const topCard = cards[0];
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -50, 50, 200], [0.5, 1, 1, 0.5]);
  const leftOpacity = useTransform(x, [-200, -50], [1, 0]);
  const rightOpacity = useTransform(x, [50, 200], [0, 1]);

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const threshold = 80;
    const vx = info.velocity.x;
    const offset = info.offset.x;
    if (offset > threshold || vx > 500) {
      setDirection('right');
      animate(x, 400, { duration: 0.2 }).then(() => {
        topCard && onSwipe(topCard, 'like');
        x.set(0);
        setDirection(null);
      });
    } else if (offset < -threshold || vx < -500) {
      setDirection('left');
      animate(x, -400, { duration: 0.2 }).then(() => {
        topCard && onSwipe(topCard, 'dislike');
        x.set(0);
        setDirection(null);
      });
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 25 });
    }
  }

  function handleLike() {
    if (!topCard || direction) return;
    setDirection('right');
    animate(x, 400, { duration: 0.2 }).then(() => {
      onSwipe(topCard, 'like');
      x.set(0);
      setDirection(null);
    });
  }

  function handleDislike() {
    if (!topCard || direction) return;
    setDirection('left');
    animate(x, -400, { duration: 0.2 }).then(() => {
      onSwipe(topCard, 'dislike');
      x.set(0);
      setDirection(null);
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="font-body text-text-muted text-sm">Загрузка карточек...</div>
      </div>
    );
  }

  if (!topCard) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="font-body text-text-secondary text-center">
          Все рецепты уже оценены
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-full max-w-sm h-[400px] flex items-center justify-center">
        {/* Background cards */}
        {cards.slice(1, 3).map((card, i) => (
          <div
            key={card.id}
            className="absolute bg-card border border-elevated rounded-card shadow-card w-[calc(100%-24px)] h-[360px]"
            style={{
              top: 20 + (i + 1) * 8,
              left: 12 + (i + 1) * 8,
              zIndex: 1 - (i + 1),
              transform: `scale(${1 - (i + 1) * 0.04})`,
            }}
          />
        ))}

        {/* Top draggable card */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.5}
          onDragEnd={handleDragEnd}
          style={{ x, rotate, opacity, zIndex: 10 }}
          className="absolute cursor-grab active:cursor-grabbing touch-none bg-card border border-elevated rounded-card shadow-card w-[calc(100%-24px)] h-[360px] overflow-hidden"
        >
          <motion.div
            className="absolute top-8 left-8 w-20 h-20 rounded-full border-4 border-kristina/50 flex items-center justify-center bg-kristina/20 text-kristina pointer-events-none"
            style={{ opacity: leftOpacity }}
          >
            <X className="w-10 h-10" />
          </motion.div>
          <motion.div
            className="absolute top-8 right-8 w-20 h-20 rounded-full border-4 border-kolya/50 flex items-center justify-center bg-kolya/20 text-kolya pointer-events-none"
            style={{ opacity: rightOpacity }}
          >
            <Heart className="w-10 h-10" />
          </motion.div>

          <div className="p-4 h-full flex flex-col">
            <h3 className="font-heading text-xl font-extrabold text-text-primary mb-1">
              {topCard.title}
            </h3>
            {topCard.subtitle && (
              <p className="text-sm text-text-muted font-body mb-2">{topCard.subtitle}</p>
            )}
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span
                className="text-[10px] px-2 py-0.5 font-heading font-semibold border rounded-full"
                style={MEMBER_BADGE[topCard.suitableFor]}
              >
                {topCard.suitableFor === 'kolya' ? 'Коля' : topCard.suitableFor === 'kristina' ? 'Кристина' : 'Оба'}
              </span>
              <span className="text-[10px] font-mono text-text-dim">{topCard.totalTime} мин</span>
            </div>
            <p className="text-xs text-text-secondary font-body line-clamp-2 mb-2">
              {topCard.ingredients.slice(0, 4).map((i) => i.name).join(', ')}
              {topCard.ingredients.length > 4 ? '...' : ''}
            </p>
            <div className="mt-auto pt-2 flex justify-center gap-6">
              <button
                type="button"
                onClick={handleDislike}
                disabled={!!direction}
                className="min-w-[56px] min-h-[56px] rounded-full bg-rift border-2 border-nebula flex items-center justify-center text-text-muted hover:border-kristina/50 hover:text-kristina hover:bg-kristina/10 transition-colors disabled:opacity-50"
                aria-label="Не подходит"
              >
                <X className="w-7 h-7" />
              </button>
              <button
                type="button"
                onClick={handleLike}
                disabled={!!direction}
                className="min-w-[56px] min-h-[56px] rounded-full bg-rift border-2 border-nebula flex items-center justify-center text-text-muted hover:border-kolya/50 hover:text-kolya hover:bg-kolya/10 transition-colors disabled:opacity-50"
                aria-label="Подходит"
              >
                <Heart className="w-7 h-7" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
      <p className="text-[10px] font-mono text-text-ghost text-center">
        {evaluator === 'kolya' ? 'Коля' : 'Кристина'} оценивает · влево — нет · вправо — да
      </p>
    </div>
  );
}

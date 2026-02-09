import { type ReactNode } from 'react';
import { motion } from 'motion/react';
import { GlitchText } from './GlitchText';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string | ReactNode;
  description?: string;
  action?: ReactNode;
  jpText?: string;
  rickMode?: boolean;
  variant?: 'default' | 'recipes' | 'menu' | 'freezer' | 'shopping';
}

const rickComments: Record<string, string[]> = {
  recipes: [
    'Даже Рик не может готовить без рецептов, Морти.',
    'В этой вселенной нет места для пустой коллекции рецептов.',
    'Готовка — это наука, а наука требует рецептов!',
    'Морти, добавь рецепт, или я создам портал в другое измерение.',
  ],
  menu: [
    'Планирование меню — это как создание портала: нужно знать, куда идёшь.',
    'В мультивселенной есть миллионы блюд, а у тебя меню пустое.',
    'Даже в C-137 нужно планировать меню заранее.',
    'Морти, без меню мы будем есть только пиццу из всех измерений.',
  ],
  freezer: [
    'Твоя морозилка пуста, как моя душа.',
    'В этой вселенной даже морозилка должна быть заполнена.',
    'Даже Рик не может готовить без заготовок из морозилки.',
    'Морти, заморозь что-нибудь, или мы останемся без еды.',
  ],
  shopping: [
    'Список покупок пуст, как мои эмоции.',
    'В мультивселенной есть всё, кроме твоего списка покупок.',
    'Даже Рик не может готовить без ингредиентов.',
    'Морти, добавь продукты в список, или мы останемся голодными.',
  ],
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  jpText,
  rickMode = false,
  variant = 'default',
}: EmptyStateProps) {
  const rickComment = rickMode && variant !== 'default' 
    ? rickComments[variant]?.[Math.floor(Math.random() * rickComments[variant].length)]
    : null;

  const displayTitle = typeof title === 'string' ? (
    rickMode ? (
      <GlitchText 
        text={title} 
        glitchOnHover 
        intensity="low"
        className="text-xl font-heading font-bold text-text-primary"
      />
    ) : (
      <h2 className="text-xl font-heading font-bold text-text-primary">{title}</h2>
    )
  ) : title;

  return (
    <motion.div
      className="empty-state flex flex-col items-center justify-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {icon && (
        <motion.div
          className="mb-4 text-text-muted"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {icon}
        </motion.div>
      )}

      <div className="mb-2">
        {displayTitle}
      </div>

      {jpText && (
        <p className="text-xs font-jp text-text-muted mb-2">{jpText}</p>
      )}

      {description && (
        <p className="text-sm text-text-secondary mb-4 max-w-md">{description}</p>
      )}

      {rickComment && (
        <motion.div
          className="mb-4 px-4 py-2 bg-portal/10 border border-portal/20 rounded-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-xs font-mono text-portal italic">"{rickComment}"</p>
          <p className="text-xs text-text-muted mt-1">— Рик Санчез</p>
        </motion.div>
      )}

      {action && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}

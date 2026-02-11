import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWabba } from '../hooks/useWabba';
import { EvaluatorPicker } from '../components/wabba/EvaluatorPicker';
import { WabbaCardStack } from '../components/wabba/WabbaCardStack';
import type { FamilyMember } from '../data/schema';
import { ArrowLeft } from 'lucide-react';

export function WabbaPage() {
  const [evaluator, setEvaluator] = useState<FamilyMember | null>(null);
  const { cards, loading, swipe } = useWabba(evaluator);

  return (
    <div className="container mx-auto px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-text-muted hover:text-portal font-body text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Link>
        {evaluator && evaluator !== 'both' && (
          <button
            type="button"
            onClick={() => setEvaluator(null)}
            className="text-xs font-heading font-semibold text-portal hover:underline"
          >
            Сменить
          </button>
        )}
      </div>

      <h1 className="font-heading text-2xl font-bold text-text-primary mb-6">
        Wabba
      </h1>

      {!evaluator || evaluator === 'both' ? (
        <EvaluatorPicker onSelect={setEvaluator} />
      ) : (
        <WabbaCardStack
          cards={cards}
          evaluator={evaluator}
          onSwipe={swipe}
          loading={loading}
        />
      )}
    </div>
  );
}

export default WabbaPage;

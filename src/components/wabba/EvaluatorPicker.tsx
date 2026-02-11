import type { FamilyMember } from '../../data/schema';
import { User } from 'lucide-react';

interface EvaluatorPickerProps {
  onSelect: (member: FamilyMember) => void;
}

const EVALUATORS: { member: FamilyMember; label: string; colorClass: string }[] = [
  { member: 'kolya', label: 'Коля', colorClass: 'bg-kolya/10 text-kolya border-kolya/25 hover:bg-kolya/20' },
  { member: 'kristina', label: 'Кристина', colorClass: 'bg-kristina/10 text-kristina border-kristina/25 hover:bg-kristina/20' },
];

export function EvaluatorPicker({ onSelect }: EvaluatorPickerProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-text-secondary font-body text-sm text-center">
        Кто оценивает рецепты?
      </p>
      <div className="flex gap-4">
        {EVALUATORS.map(({ member, label, colorClass }) => (
          <button
            key={member}
            type="button"
            onClick={() => onSelect(member)}
            className={`flex min-w-[132px] min-h-[132px] flex-col items-center justify-center gap-2 rounded-card border-2 transition-all ${colorClass}`}
            style={{ minWidth: 132, minHeight: 132 }}
          >
            <User className="w-10 h-10" />
            <span className="font-heading font-bold text-lg">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

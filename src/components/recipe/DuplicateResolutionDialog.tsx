import { Modal } from '../ui/Modal';
import type { Recipe } from '../../data/schema';

interface DuplicateResolutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
  existingId: string;
  onResolve: (action: 'update' | 'skip') => void;
}

export function DuplicateResolutionDialog({
  isOpen,
  onClose,
  recipe,
  existingId,
  onResolve,
}: DuplicateResolutionDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Обнаружен дубликат рецепта"
      footer={
        <>
          <button
            onClick={() => {
              onResolve('skip');
              onClose();
            }}
            className="px-4 py-2 bg-rift border border-nebula text-text-mid font-heading font-semibold text-sm rounded-button hover:bg-nebula transition-colors"
          >
            Пропустить
          </button>
          <button
            onClick={() => {
              onResolve('update');
              onClose();
            }}
            className="px-4 py-2 bg-portal text-void font-heading font-semibold text-sm rounded-button hover:bg-portal-dim transition-colors"
          >
            Обновить существующий
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-text-primary font-body">
          Рецепт <strong>{recipe.title}</strong> уже существует в базе данных.
        </p>
        <div className="bg-card border border-nebula rounded-card p-3">
          <p className="text-text-muted text-xs mb-1">Существующий ID:</p>
          <p className="text-text-dim font-mono text-xs">{existingId}</p>
        </div>
        <p className="text-text-muted text-sm">
          Выберите действие:
        </p>
        <ul className="list-disc list-inside text-text-muted text-sm space-y-1 ml-2">
          <li><strong>Обновить существующий</strong> — заменит данные существующего рецепта данными из импорта</li>
          <li><strong>Пропустить</strong> — не будет импортирован</li>
        </ul>
      </div>
    </Modal>
  );
}

import { useState, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { downloadTextFile } from '../../lib/fileDownload';
import { Copy, Download } from 'lucide-react';

interface AIPromptGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  recipeNames?: string[];
}

const PROMPT_TEMPLATE = `Ты — помощник для создания структурированных данных рецептов для приложения SemeynoYeda.

ЗАДАЧА:
Создай JSON массив рецептов на основе предоставленного списка названий блюд. Каждый рецепт должен быть полностью структурированным объектом.

СТРУКТУРА РЕЦЕПТА:

Обязательные поля:
- id: строка в формате "seed-<slug>" (например, "seed-kabachkovyj-sous")
- slug: url-friendly строка на латинице с дефисами (например, "kabachkovyj-sous")
- title: название рецепта на русском
- category: один из: "main" | "sauce" | "side" | "breakfast" | "snack" | "soup" | "dessert"
- tags: массив тегов из списка: "gastritis-safe" | "soft-texture" | "rich-feel" | "freezable" | "quick" | "prep-day" | "batch-cooking" | "overnight" | "packable" | "low-calorie" | "blanch-before-freeze" | "double-coating"
- suitableFor: "kolya" | "kristina" | "both"
- prepTime: число (минуты подготовки)
- cookTime: число (минуты готовки)
- totalTime: число (общее время, обычно prepTime + cookTime)
- servings: число (количество порций)
- ingredients: массив объектов { name: string, amount: number, unit: string, optional?: boolean, note?: string }
  - unit: один из: "г" | "кг" | "мл" | "л" | "шт" | "ст.л." | "ч.л." | "стакан" | "щепотка" | "по вкусу"
- steps: массив объектов { order: number, text: string, duration?: number, equipment?: object, parallel?: boolean, tip?: string }
  - equipment: { id: string, label: string, settings?: string, duration?: number }
  - equipment.id: один из: "stove" | "oven" | "air-grill" | "e-grill" | "steamer" | "blender" | "mixer" | "grinder" | "vacuum" | "bowls"
- equipment: массив строк EquipmentId (все используемое оборудование)
- storage: объект { fridge?: number, freezer?: number, vacuumSealed?: boolean }

Опциональные поля:
- subtitle: подзаголовок (например, "база для Коли", "заготовка на 3 месяца")
- notes: заметки и советы
- source: источник рецепта
- imageUrl: URL изображения
- reheating: массив инструкций разогрева [{ forWhom: string, method: string, equipment: string, temperature?: string, duration: number }]
- version: число (версия рецепта)

ВАЖНО:
1. Все поля должны быть заполнены корректно. Не используй значения, которых нет в списках допустимых.
2. Для каждого рецепта создай реалистичные ингредиенты и пошаговые инструкции.
3. Если рецепт содержит овощи или рыбу, добавь тег "double-coating" (техника двойного покрытия: сначала бланширование в молоке для удаления запаха, потом готовка с соусом).
4. Если рецепт можно заморозить, добавь тег "freezable" и заполни storage.freezer.
5. Если рецепт готовится быстро (<15 мин), добавь тег "quick".
6. Если рецепт подходит для заготовок выходного дня, добавь тег "prep-day".
7. Для Коли (gastritis) избегай острого, кислого, жареного, очень жирного. Используй тег "gastritis-safe".
8. Для Кристины можно использовать более богатые вкусы, тег "rich-feel".
9. Если рецепт подходит обоим, используй suitableFor: "both".

ФОРМАТ ВЫВОДА:
Верни ТОЛЬКО валидный JSON массив рецептов, без дополнительного текста, без markdown форматирования, без объяснений. Начни сразу с открывающей квадратной скобки [.

ПРИМЕР:
[
  {
    "id": "seed-kabachkovyj-sous",
    "slug": "kabachkovyj-sous",
    "title": "Кабачковый соус",
    "subtitle": "база для Коли",
    "category": "sauce",
    "tags": ["gastritis-safe", "freezable", "quick", "double-coating"],
    "suitableFor": "kolya",
    "prepTime": 5,
    "cookTime": 15,
    "totalTime": 20,
    "servings": 6,
    "ingredients": [
      { "name": "кабачок", "amount": 300, "unit": "г" },
      { "name": "картофель", "amount": 100, "unit": "г" },
      { "name": "оливковое масло", "amount": 1, "unit": "ст.л." },
      { "name": "вода", "amount": 100, "unit": "мл" }
    ],
    "steps": [
      {
        "order": 1,
        "text": "Кабачок и картофель нарезать кубиками",
        "duration": 5
      },
      {
        "order": 2,
        "text": "Отварить в воде до мягкости",
        "duration": 12,
        "equipment": {
          "id": "stove",
          "label": "Газовая плита",
          "settings": "средний огонь",
          "duration": 12
        },
        "parallel": true,
        "tip": "Пока варится — можно формовать котлеты"
      },
      {
        "order": 3,
        "text": "Пробить блендером до гладкости",
        "duration": 2,
        "equipment": {
          "id": "blender",
          "label": "Блендер",
          "settings": "насадка для пюре"
        }
      },
      {
        "order": 4,
        "text": "Добавить оливковое масло, перемешать. Разлить по порциям",
        "duration": 1
      }
    ],
    "equipment": ["stove", "blender"],
    "storage": {
      "fridge": 4,
      "freezer": 3,
      "vacuumSealed": false
    }
  }
]

СПИСОК РЕЦЕПТОВ ДЛЯ СОЗДАНИЯ:
{recipeNamesList}

Создай JSON массив для всех перечисленных рецептов.`;

export function AIPromptGenerator({ isOpen, onClose, recipeNames = [] }: AIPromptGeneratorProps) {
  const [recipeNamesInput, setRecipeNamesInput] = useState(recipeNames.join('\n'));
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');

  const generatePrompt = useCallback(() => {
    const namesList = recipeNamesInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((name, index) => `${index + 1}. ${name}`)
      .join('\n');

    if (!namesList) {
      setGeneratedPrompt('Пожалуйста, введите хотя бы одно название рецепта.');
      return;
    }

    const prompt = PROMPT_TEMPLATE.replace('{recipeNamesList}', namesList || 'Список не предоставлен');
    setGeneratedPrompt(prompt);
  }, [recipeNamesInput]);

  const copyToClipboard = useCallback(() => {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt);
    }
  }, [generatedPrompt]);

  const downloadPrompt = useCallback(() => {
    if (generatedPrompt) {
      downloadTextFile(generatedPrompt, 'ai-recipe-prompt.txt', 'text/plain');
    }
  }, [generatedPrompt]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Генератор промпта для AI"
      footer={
        <button
          onClick={onClose}
          className="px-4 py-2 bg-rift border border-nebula text-text-mid font-heading font-semibold text-sm rounded-button hover:bg-nebula transition-colors"
        >
          Закрыть
        </button>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="ai-prompt-recipe-names" className="block text-text-primary font-heading font-semibold text-sm mb-2">
            Список названий рецептов (по одному на строку):
          </label>
          <textarea
            id="ai-prompt-recipe-names"
            name="ai-prompt-recipe-names"
            value={recipeNamesInput}
            onChange={(e) => setRecipeNamesInput(e.target.value)}
            placeholder="Кабачковый соус&#10;Морковно-тыквенный соус&#10;Рыбные биточки"
            className="w-full h-32 px-3 py-2 bg-rift border border-nebula rounded-card text-text-primary font-body text-sm focus:outline-none focus:border-portal/50 resize-none"
          />
          <button
            onClick={generatePrompt}
            className="mt-2 px-4 py-2 bg-portal text-void font-heading font-semibold text-sm rounded-button hover:bg-portal-dim transition-colors"
          >
            Сгенерировать промпт
          </button>
        </div>

        {generatedPrompt && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="ai-prompt-generated" className="block text-text-primary font-heading font-semibold text-sm">
                Сгенерированный промпт:
              </label>
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-heading font-semibold text-portal border border-portal/50 rounded-button hover:bg-portal/10 transition-colors"
                  title="Скопировать в буфер обмена"
                >
                  <Copy className="w-3 h-3" />
                  Копировать
                </button>
                <button
                  onClick={downloadPrompt}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-heading font-semibold text-portal border border-portal/50 rounded-button hover:bg-portal/10 transition-colors"
                  title="Скачать как файл"
                >
                  <Download className="w-3 h-3" />
                  Скачать
                </button>
              </div>
            </div>
            <textarea
              id="ai-prompt-generated"
              name="ai-prompt-generated"
              value={generatedPrompt}
              readOnly
              className="w-full h-64 px-3 py-2 bg-rift border border-nebula rounded-card text-text-primary font-mono text-xs focus:outline-none focus:border-portal/50 resize-none"
            />
            <p className="text-text-muted text-xs">
              Скопируйте этот промпт в Gemini или Claude для генерации JSON рецептов.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

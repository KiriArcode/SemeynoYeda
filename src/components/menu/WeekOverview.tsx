import type { MenuDay } from '../../data/schema';

interface WeekOverviewProps {
  days: MenuDay[];
  activeDay: string | null;
  onDayClick: (dayOfWeek: string) => void;
}

const SHORT_DAYS: Record<string, string> = {
  'Понедельник': 'ПН',
  'Вторник': 'ВТ',
  'Среда': 'СР',
  'Четверг': 'ЧТ',
  'Пятница': 'ПТ',
  'Суббота': 'СБ',
  'Воскресенье': 'ВС',
};

const PREP_DAYS = ['Суббота', 'Воскресенье'];

export function WeekOverview({ days, activeDay, onDayClick }: WeekOverviewProps) {
  return (
    <div className="bg-panel border border-elevated rounded-card p-3 mb-4 shadow-card">
      <span className="block text-[10px] font-mono text-portal-dim tracking-[1.5px] mb-2 uppercase">
        Week Overview
      </span>
      <div className="flex" style={{ gap: '2px' }}>
        {days.map((day) => {
          const short = SHORT_DAYS[day.dayOfWeek] || day.dayOfWeek.slice(0, 2);
          const isActive = activeDay === day.dayOfWeek;
          const isPrepDay = PREP_DAYS.includes(day.dayOfWeek);
          const filledMeals = day.meals.filter(
            (m) => m.recipes.length > 0 && !m.recipes.every((r) => r.coffeeOnly)
          ).length;
          const dateObj = new Date(day.date);
          const dateLabel = `${dateObj.getDate()} ${dateObj.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')}`;

          return (
            <button
              key={day.date}
              onClick={() => onDayClick(isActive ? '' : day.dayOfWeek)}
              className={`flex-1 flex flex-col items-center py-2 rounded-md transition-all min-w-0 ${
                isActive
                  ? 'bg-portal/12 border border-portal/30'
                  : 'border border-transparent hover:bg-hover'
              }`}
              style={{ gap: '2px' }}
            >
              <span
                className={`text-xs font-heading font-bold ${
                  isActive ? 'text-portal' : isPrepDay ? 'text-plasma' : 'text-text-secondary'
                }`}
              >
                {short}
              </span>
              <span className="text-[9px] font-mono text-text-muted leading-tight">
                {dateLabel}
              </span>
              <div className="flex items-center justify-center mt-0.5" style={{ gap: '3px', minHeight: '12px' }}>
                {isPrepDay ? (
                  <span className="text-[10px]">📦</span>
                ) : (
                  Array.from({ length: 4 }).map((_, i) => (
                    <span
                      key={i}
                      className={`block w-[5px] h-[5px] rounded-full ${
                        i < filledMeals
                          ? isActive
                            ? 'bg-portal'
                            : 'bg-portal/50'
                          : 'bg-nebula'
                      }`}
                    />
                  ))
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

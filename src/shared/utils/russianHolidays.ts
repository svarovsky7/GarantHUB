// Российские праздничные дни
export interface Holiday {
  date: string; // формат MM-DD
  name: string;
  isNonWorking: boolean; // нерабочий день
}

// Постоянные праздники (не зависят от года)
export const RUSSIAN_HOLIDAYS: Holiday[] = [
  { date: '01-01', name: 'Новый год', isNonWorking: true },
  { date: '01-02', name: 'Новогодние каникулы', isNonWorking: true },
  { date: '01-03', name: 'Новогодние каникулы', isNonWorking: true },
  { date: '01-04', name: 'Новогодние каникулы', isNonWorking: true },
  { date: '01-05', name: 'Новогодние каникулы', isNonWorking: true },
  { date: '01-06', name: 'Новогодние каникулы', isNonWorking: true },
  { date: '01-07', name: 'Рождество Христово', isNonWorking: true },
  { date: '01-08', name: 'Новогодние каникулы', isNonWorking: true },
  { date: '02-23', name: 'День защитника Отечества', isNonWorking: true },
  { date: '03-08', name: 'Международный женский день', isNonWorking: true },
  { date: '05-01', name: 'Праздник Весны и Труда', isNonWorking: true },
  { date: '05-09', name: 'День Победы', isNonWorking: true },
  { date: '06-12', name: 'День России', isNonWorking: true },
  { date: '11-04', name: 'День народного единства', isNonWorking: true },
];

// Проверка, является ли дата праздником
export function isHoliday(date: Date): Holiday | null {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateString = `${month}-${day}`;
  
  return RUSSIAN_HOLIDAYS.find(h => h.date === dateString) || null;
}

// Проверка, является ли дата выходным днем (суббота или воскресенье)
export function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 - воскресенье, 6 - суббота
}

// Проверка, является ли дата нерабочим днем
export function isNonWorkingDay(date: Date): boolean {
  const holiday = isHoliday(date);
  return isWeekend(date) || (holiday ? holiday.isNonWorking : false);
}

// Получить название праздника для даты
export function getHolidayName(date: Date): string | null {
  const holiday = isHoliday(date);
  return holiday ? holiday.name : null;
}
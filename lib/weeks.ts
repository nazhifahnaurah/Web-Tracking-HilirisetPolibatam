const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des',
];

export interface WeekInfo {
  index: number;
  weekInMonth: number;
  month: number;
  year: number;
  label: string;      // "Week 1 · Juli 2026"
  monthLabel: string; // "Juli 2026"
}

export interface MonthGroup {
  label: string;   // "Juli 2026"
  short: string;   // "Jul"
  month: number;
  year: number;
  weeks: WeekInfo[];
}

export interface YearGroup {
  year: number;
  months: MonthGroup[];
}

function generateWeeks(): WeekInfo[] {
  const weeks: WeekInfo[] = [];
  const weekInMonthCount: Record<string, number> = {};

  const start = new Date(2026, 6, 1);
  while (start.getDay() !== 1) start.setDate(start.getDate() + 1);

  const end = new Date(2028, 11, 31);
  const current = new Date(start);
  let index = 1;

  while (current <= end) {
    const month = current.getMonth();
    const year = current.getFullYear();
    const key = `${year}-${month}`;
    weekInMonthCount[key] = (weekInMonthCount[key] || 0) + 1;
    const weekInMonth = weekInMonthCount[key];

    weeks.push({
      index,
      weekInMonth,
      month,
      year,
      label: `Week ${weekInMonth} · ${MONTH_NAMES[month]} ${year}`,
      monthLabel: `${MONTH_NAMES[month]} ${year}`,
    });

    index++;
    current.setDate(current.getDate() + 7);
  }

  return weeks;
}

export const WEEKS = generateWeeks();
export const TOTAL_WEEKS = WEEKS.length;

// Grouped by year → month
export const YEAR_GROUPS: YearGroup[] = [];
for (const week of WEEKS) {
  let yg = YEAR_GROUPS.find((g) => g.year === week.year);
  if (!yg) {
    yg = { year: week.year, months: [] };
    YEAR_GROUPS.push(yg);
  }
  let mg = yg.months.find((m) => m.month === week.month);
  if (!mg) {
    mg = {
      label: week.monthLabel,
      short: MONTH_SHORT[week.month],
      month: week.month,
      year: week.year,
      weeks: [],
    };
    yg.months.push(mg);
  }
  mg.weeks.push(week);
}

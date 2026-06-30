'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { WEEKS, TOTAL_WEEKS, YEAR_GROUPS } from '@/lib/weeks';

interface WeekPickerProps {
  currentWeek: number;
  onWeekChange: (week: number) => void;
}

export function WeekPicker({ currentWeek, onWeekChange }: WeekPickerProps) {
  const [open, setOpen] = useState(false);

  const currentWeekInfo = WEEKS[currentWeek - 1];
  const activeYear = currentWeekInfo?.year ?? YEAR_GROUPS[0]?.year;
  const activeMonthLabel = currentWeekInfo?.monthLabel;

  const activeYearGroup = YEAR_GROUPS.find((g) => g.year === activeYear);
  const activeMonthGroup = activeYearGroup?.months.find((m) => m.label === activeMonthLabel);

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      {/* Prev / label / toggle / Next */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onWeekChange(currentWeek - 1)}
          disabled={currentWeek <= 1}
          className="rounded-lg border border-border bg-secondary p-2 hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Minggu sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-1.5 hover:bg-secondary/60 transition-colors"
          aria-label="Buka/tutup pemilih minggu"
        >
          <span className="text-base font-bold text-foreground">
            {currentWeekInfo?.label ?? `Week ${currentWeek}`}
          </span>
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        <button
          onClick={() => onWeekChange(currentWeek + 1)}
          disabled={currentWeek >= TOTAL_WEEKS}
          className="rounded-lg border border-border bg-secondary p-2 hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Minggu berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Collapsible panel */}
      {open && (
        <>
          {/* Year tabs */}
          <div className="flex gap-2 border-t border-border pt-3">
            {YEAR_GROUPS.map((yg) => (
              <button
                key={yg.year}
                onClick={() => onWeekChange(yg.months[0].weeks[0].index)}
                className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
                  yg.year === activeYear
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                {yg.year}
              </button>
            ))}
          </div>

          {/* Month pills */}
          {activeYearGroup && (
            <div className="flex flex-wrap gap-1.5">
              {activeYearGroup.months.map((mg) => (
                <button
                  key={mg.label}
                  onClick={() => onWeekChange(mg.weeks[0].index)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    mg.label === activeMonthLabel
                      ? 'bg-primary/20 text-primary border border-primary/40 font-semibold'
                      : 'bg-secondary text-foreground hover:bg-secondary/80'
                  }`}
                >
                  {mg.short}
                </button>
              ))}
            </div>
          )}

          {/* Week buttons */}
          {activeMonthGroup && (
            <div className="flex gap-2">
              {activeMonthGroup.weeks.map((week) => (
                <button
                  key={week.index}
                  onClick={() => {
                    onWeekChange(week.index);
                    setOpen(false);
                  }}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                    currentWeek === week.index
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground hover:bg-secondary/80'
                  }`}
                >
                  Week {week.weekInMonth}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

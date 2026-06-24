'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AttendanceLegend } from '@/components/employee/AttendanceLegend';

interface AttendanceRecord {
  id: number;
  date: string;
  status?: string;
  timesheet_status?: string | null;
}

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
  onDayClick?: (dateStr: string) => void;
}

export function AttendanceCalendar({ records, month, year, onMonthChange, onDayClick }: AttendanceCalendarProps) {
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const prevMonth = () => {
    if (month === 1) onMonthChange(12, year - 1);
    else onMonthChange(month - 1, year);
  };
  const nextMonth = () => {
    if (month === 12) onMonthChange(1, year + 1);
    else onMonthChange(month + 1, year);
  };

  // Build a map of date -> status color
  const dateStatusMap = useMemo(() => {
    const map: Record<string, string> = {};
    records.forEach(r => {
      const d = r.date; // "YYYY-MM-DD"
      if (r.status === 'Completed' && r.timesheet_status === 'submitted') {
        map[d] = 'green';
      } else if (r.status === 'Completed' && r.timesheet_status === 'pending') {
        map[d] = 'yellow';
      } else if (r.status === 'WFH') {
        map[d] = 'purple';
      } else if (r.status === 'Working') {
        map[d] = 'orange';
      }
    });
    return map;
  }, [records]);

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const calendarDays: (number | null)[] = [];
  // Pad start (Mon=0 index)
  const startPad = (firstDayOfMonth + 6) % 7; // Convert Sunday=0 to Monday=0
  for (let i = 0; i < startPad; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green': return 'bg-emerald-500 text-white ring-emerald-400/30';
      case 'yellow': return 'bg-amber-400 text-white ring-amber-400/30';
      case 'orange': return 'bg-orange-500 text-white ring-orange-400/30';
      case 'purple': return 'bg-purple-500 text-white ring-purple-400/30';
      default: return '';
    }
  };

  return (
    <Card className="rounded-xl border-border shadow-sm p-4 md:p-6 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
          {monthNames[month - 1]} {year}
        </h3>
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
          <div key={d} className="text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => {
          if (day === null) return <div key={`pad-${idx}`} />;
          
          const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const color = dateStatusMap[dateStr];
          const isToday = dateStr === todayStr;
          const dayDate = new Date(year, month - 1, day);
          const isPast = dayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const isWeekend = dayDate.getDay() === 0;
          
          // If past weekday with no record -> red (absent)
          const showRed = isPast && !color && !isWeekend;
          
          const isClickable = !!onDayClick && (color || showRed || isPast || isToday);

          return (
            <div
              key={dateStr}
              onClick={() => {
                if (isClickable && onDayClick) {
                  onDayClick(dateStr);
                }
              }}
              className={cn(
                "aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all relative",
                isClickable ? "cursor-pointer hover:scale-105" : "",
                color ? `${getColorClasses(color)} ring-2` : '',
                showRed ? 'bg-red-100 text-red-600 ring-2 ring-red-300/30' : '',
                !color && !showRed ? 'text-muted-foreground hover:bg-muted' : '',
                isToday && !color ? 'ring-2 ring-indigo-500 text-primary font-black' : '',
                isToday && color ? 'ring-offset-2 ring-offset-background' : ''
              )}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border">
        <AttendanceLegend />
      </div>
    </Card>
  );
}

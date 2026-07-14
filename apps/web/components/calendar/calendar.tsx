'use client';

import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  events?: Array<{
    date: Date;
    title: string;
    type: 'confirmed' | 'pending' | 'cancelled';
  }>;
  minDate?: Date;
  maxDate?: Date;
}

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function Calendar({
  selectedDate,
  onDateSelect,
  events = [],
  minDate,
  maxDate,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const weeks: Date[][] = [];
  let day = startDate;

  while (day <= endDate) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => isSameDay(event.date, date));
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((date, idx) => {
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isDisabled = isDateDisabled(date);
          const dayEvents = getEventsForDay(date);

          return (
            <button
              key={idx}
              onClick={() => !isDisabled && onDateSelect(date)}
              disabled={isDisabled}
              className={`
                relative p-2 h-20 text-left rounded-lg transition
                ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                ${isToday(date) ? 'bg-primary-50 ring-2 ring-primary-500' : ''}
                ${isSelected ? 'bg-primary-100 ring-2 ring-primary-600' : ''}
                ${!isDisabled && isCurrentMonth ? 'hover:bg-gray-50 cursor-pointer' : ''}
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span
                className={`
                  text-sm font-medium
                  ${isToday(date) ? 'text-primary-600' : ''}
                  ${isSelected ? 'text-primary-700' : ''}
                `}
              >
                {format(date, 'd')}
              </span>

              {/* Events indicator */}
              {dayEvents.length > 0 && (
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 2).map((event, eventIdx) => (
                    <div
                      key={eventIdx}
                      className={`
                        text-xs px-1 py-0.5 rounded truncate
                        ${event.type === 'confirmed' ? 'bg-green-100 text-green-700' : ''}
                        ${event.type === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${event.type === 'cancelled' ? 'bg-red-100 text-red-700' : ''}
                      `}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-xs text-gray-500">+{dayEvents.length - 2} más</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

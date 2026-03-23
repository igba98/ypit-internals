'use client';

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";

export function DatePicker({ name, required }: { name: string; required?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Hidden input for FormData injection */}
      <input 
        type="hidden" 
        name={name} 
        value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""} 
        required={required} 
      />
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-11 w-full items-center justify-start rounded-md border border-gray-200 bg-transparent px-3 py-2 text-left text-sm shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary",
          !selectedDate && "text-gray-500",
          isOpen && "ring-1 ring-primary border-primary"
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-auto rounded-md border border-gray-200 bg-white p-3 shadow-lg outline-none"
          >
            <div className="flex items-center justify-between pb-4">
              <button
                type="button"
                className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center rounded-md hover:bg-gray-100"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-sm font-medium">{format(currentMonth, "MMMM yyyy")}</div>
              <button
                type="button"
                className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center rounded-md hover:bg-gray-100"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="w-8">{day}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, idx) => {
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);
                
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedDate(day);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "h-8 w-8 rounded-md p-0 text-sm font-normal transition-colors flex items-center justify-center",
                      !isCurrentMonth && "text-gray-300",
                      isCurrentMonth && !isSelected && "hover:bg-gray-100 hover:text-gray-900 text-gray-700",
                      isSelected && "bg-primary text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white",
                      isTodayDate && !isSelected && "bg-gray-100 text-primary font-bold"
                    )}
                  >
                    {format(day, "d")}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

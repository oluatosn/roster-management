'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Minus, Download, Calendar, BarChart, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useStore } from '@/lib/store';
import { generateSchedule } from '@/lib/scheduling';
import type { Member } from '@/lib/types';

export default function RosterScheduler() {
  const members = useStore((state) => state.members);
  const schedule = useStore((state) => state.schedule);
  const setSchedule = useStore((state) => state.setSchedule);
  const schedulingRules = useStore((state) => state.schedulingRules);
  const specialEvents = useStore((state) => state.specialEvents);
  const markMemberUnavailable = useStore((state) => state.markMemberUnavailable);

  const [expandedDate, setExpandedDate] = useState<Date | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedYear, setSelectedYear] = useState(2025);

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from(
    { length: 11 },
    (_, i) => currentYear + i
  );

  useEffect(() => {
    if (members.length > 0) {
      const newSchedule = generateSchedule(members, selectedYear, schedulingRules, specialEvents);
      setSchedule(newSchedule);
    }
  }, [members, selectedYear, schedulingRules, specialEvents, setSchedule]);

  const toggleDateExpansion = (date: Date) => {
    setExpandedDate(expandedDate?.getTime() === date.getTime() ? null : date);
  };

  const exportSchedule = (day: { date: Date; firstService: Member[]; secondService: Member[]; thirdService: Member[]; }) => {
    const rows = [['Service', 'Members']];
    const formatMembers = (members: Member[]) => members.map(m => m.name).join(', ');
    rows.push(['First Service', formatMembers(day.firstService)]);

    // Only add rows for services that exist (based on special events)
    if (day.secondService.length > 0) {
      rows.push(['Second Service', formatMembers(day.secondService)]);
    }
    if (day.thirdService.length > 0) {
      rows.push(['Third Service', formatMembers(day.thirdService)]);
    }

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `church_roster_${new Date(day.date).toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const calculateStats = () => {
    const stats = members.reduce((acc, member) => {
      acc[member.id] = { first: 0, second: 0, third: 0, total: 0 };
      return acc;
    }, {} as Record<number, { first: number; second: number; third: number; total: number; }>);

    schedule.forEach(day => {
      day.firstService.forEach(m => {
        stats[m.id].first++;
        stats[m.id].total++;
      });
      day.secondService.forEach(m => {
        stats[m.id].second++;
        stats[m.id].total++;
      });
      day.thirdService.forEach(m => {
        stats[m.id].third++;
        stats[m.id].total++;
      });
    });

    return stats;
  };

  const MemberList = ({ members }: { members: Member[] }) => (
    <div className="flex flex-wrap gap-1">
      {members.map(member => (
        <span
          key={member.id}
          className="px-2 py-1 rounded text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          style={{ borderLeft: `3px solid ${member.color}` }}
        >
          {member.name}
        </span>
      ))}
    </div>
  );

  const getServiceNumberLabel = (day: typeof schedule[0], serviceType: 'firstService' | 'secondService' | 'thirdService') => {
    if (day.specialEvent) {
      const totalServices = day.specialEvent.numberOfServices;
      if (serviceType === 'secondService' && totalServices < 2) return null;
      if (serviceType === 'thirdService' && totalServices < 3) return null;
    }
    return `${day[serviceType].length} members`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <CardTitle>Service Schedule</CardTitle>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="ml-4 p-2 rounded border bg-white dark:bg-gray-800"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowStats(!showStats)}>
            <BarChart className="w-4 h-4 mr-2" />
            {showStats ? 'Hide' : 'Show'} Stats
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showStats && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Service Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(calculateStats()).map(([memberId, stats]) => {
                const member = members.find(m => m.id === Number(memberId));
                if (!member) return null;
                return (
                  <div key={memberId} className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow">
                    <h4 className="font-semibold" style={{ color: member.color }}>{member.name}</h4>
                    <p>First: {stats.first}</p>
                    <p>Second: {stats.second}</p>
                    <p>Third: {stats.third}</p>
                    <p className="font-semibold">Total: {stats.total}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 border text-left">Date</th>
                <th className="p-2 border text-left">First Service</th>
                <th className="p-2 border text-left">Second Service</th>
                <th className="p-2 border text-left">Third Service</th>
                <th className="p-2 border text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((day) => {
                const date = new Date(day.date);
                const hasSpecialEvent = day.specialEvent !== undefined;
                return (
                  <tr key={date.toISOString()} className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                    <td className="p-2 border">
                      <div>
                        {date.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      {hasSpecialEvent && (
                        <div className="text-sm text-blue-500 dark:text-blue-400">
                          {day.specialEvent.name} ({day.specialEvent.numberOfServices} services)
                        </div>
                      )}
                    </td>
                    <td className="p-2 border">
                      {expandedDate?.getTime() === date.getTime() ? (
                        <MemberList members={day.firstService} />
                      ) : (
                        getServiceNumberLabel(day, 'firstService')
                      )}
                    </td>
                    <td className="p-2 border">
                      {hasSpecialEvent && day.specialEvent.numberOfServices < 2 ? (
                        <span className="text-gray-400 italic">Not scheduled</span>
                      ) : (
                        expandedDate?.getTime() === date.getTime() ? (
                          <MemberList members={day.secondService} />
                        ) : (
                          getServiceNumberLabel(day, 'secondService')
                        )
                      )}
                    </td>
                    <td className="p-2 border">
                      {hasSpecialEvent && day.specialEvent.numberOfServices < 3 ? (
                        <span className="text-gray-400 italic">Not scheduled</span>
                      ) : (
                        expandedDate?.getTime() === date.getTime() ? (
                          <MemberList members={day.thirdService} />
                        ) : (
                          getServiceNumberLabel(day, 'thirdService')
                        )
                      )}
                    </td>
                    <td className="p-2 border">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDateExpansion(date)}
                        >
                          {expandedDate?.getTime() === date.getTime() ? (
                            <Minus className="w-4 h-4" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => exportSchedule(day)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDate(date);
                            setShowDatePicker(true);
                          }}
                        >
                          <Calendar className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Dialog>
          <DialogContent
            open={showDatePicker}
            onOpenChange={(open) => {
              setShowDatePicker(open);
              if (!open) {
                setSelectedDate(null);
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>Mark Members as Unavailable</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-4"
                onClick={() => setShowDatePicker(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>
            {selectedDate && (
              <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
                <p className="text-sm sticky top-0 bg-white dark:bg-gray-800 z-10">
                  Select members who are unavailable on {selectedDate.toLocaleDateString()}:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {members.map((member) => {
                    const isUnavailable = member.unavailableDates.some(
                      date => new Date(date).toDateString() === selectedDate.toDateString()
                    );
                    return (
                      <label
                        key={member.id}
                        className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isUnavailable}
                          onChange={() => markMemberUnavailable(member.id, selectedDate)}
                          className="rounded"
                        />
                        <span className="flex-grow">
                          {member.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

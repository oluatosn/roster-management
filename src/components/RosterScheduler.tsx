import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Download, Calendar, Users, BarChart } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const RosterScheduler = () => {
  // Generate sample members (29 members)
  const generateMembers = () => {
    const memberTypes = [
      { isHOD: true, hasChildren: true, preferFirstService: true },
      { hasChildren: true, preferFirstService: false },
      { hasChildren: false, preferFirstService: false }
    ];

    return Array.from({ length: 29 }, (_, index) => {
      const type = index === 0 ? memberTypes[0] :
                  index < 10 ? memberTypes[1] : memberTypes[2];

      return {
        id: index + 1,
        name: `Member ${index + 1}`,
        isHOD: type.isHOD || false,
        hasChildren: type.hasChildren,
        preferFirstService: type.preferFirstService,
        lastServiceDate: null,
        serviceCount: 0,
        unavailableDates: [],
        color: `hsl(${Math.random() * 360}, 70%, 80%)`
      };
    });
  };

  const [members, setMembers] = useState(generateMembers());
  const [membersPerService] = useState(10);
  const [schedule, setSchedule] = useState([]);
  const [expandedDate, setExpandedDate] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showStats, setShowStats] = useState(false);

  // Statistics tracking
  const [stats, setStats] = useState({
    memberStats: {},
    serviceDistribution: {
      firstService: {},
      secondService: {},
      thirdService: {}
    }
  });

  // Generate all Sundays for 2025
  const generateSundays = () => {
    const sundays = [];
    const currentDate = new Date(2025, 0, 1);
    while (currentDate.getFullYear() === 2025) {
      if (currentDate.getDay() === 0) {
        sundays.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return sundays;
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const generateSchedule = () => {
    const sundays = generateSundays();
    const newSchedule = [];
    let lastFirstServiceMembers = new Set();

    // Reset service counts
    const updatedMembers = members.map(m => ({ ...m, serviceCount: 0 }));
    setMembers(updatedMembers);

    sundays.forEach((sunday) => {
      const availableMembers = updatedMembers.filter(m =>
        !m.unavailableDates.some(date =>
          date.toDateString() === sunday.toDateString()
        )
      );

      const daySchedule = {
        date: sunday,
        firstService: [],
        secondService: [],
        thirdService: []
      };

      // First Service Assignment
      const firstServiceCandidates = availableMembers.filter(m =>
        (m.isHOD || !m.hasChildren || m.preferFirstService) &&
        !lastFirstServiceMembers.has(m.id)
      );

      // Ensure HOD is included in first service if available
      const hod = availableMembers.find(m => m.isHOD);
      if (hod && !lastFirstServiceMembers.has(hod.id)) {
        daySchedule.firstService.push(hod);
        hod.serviceCount++;
      }

      // Fill remaining first service slots
      const remainingFirstSlots = membersPerService - daySchedule.firstService.length;
      if (remainingFirstSlots > 0) {
        const shuffledFirstCandidates = shuffleArray(firstServiceCandidates);
        for (let i = 0; i < remainingFirstSlots && i < shuffledFirstCandidates.length; i++) {
          if (!daySchedule.firstService.find(m => m.id === shuffledFirstCandidates[i].id)) {
            daySchedule.firstService.push(shuffledFirstCandidates[i]);
            shuffledFirstCandidates[i].serviceCount++;
          }
        }
      }

      lastFirstServiceMembers = new Set(daySchedule.firstService.map(m => m.id));

      // Remove assigned members from available pool
      const remainingMembers = availableMembers.filter(m =>
        !daySchedule.firstService.find(assigned => assigned.id === m.id)
      );

      // Second Service Assignment
      const shuffledForSecond = shuffleArray(remainingMembers);
      daySchedule.secondService = shuffledForSecond.slice(0, membersPerService);
      daySchedule.secondService.forEach(m => m.serviceCount++);

      // Third Service Assignment
      const remainingForThird = shuffledForSecond.slice(membersPerService);
      const thirdServicePool = [...remainingForThird, ...remainingMembers.filter(m =>
        !daySchedule.secondService.find(assigned => assigned.id === m.id)
      )];

      daySchedule.thirdService = shuffleArray(thirdServicePool).slice(0, membersPerService);
      daySchedule.thirdService.forEach(m => m.serviceCount++);

      newSchedule.push(daySchedule);
    });

    return newSchedule;
  };

  useEffect(() => {
    const newSchedule = generateSchedule();
    setSchedule(newSchedule);
    updateStats(newSchedule);
  }, [members]);

  const updateStats = (currentSchedule) => {
    const newStats = {
      memberStats: {},
      serviceDistribution: {
        firstService: {},
        secondService: {},
        thirdService: {}
      }
    };

    members.forEach(member => {
      newStats.memberStats[member.id] = {
        totalServices: 0,
        firstService: 0,
        secondService: 0,
        thirdService: 0
      };
    });

    currentSchedule.forEach(day => {
      day.firstService.forEach(member => {
        newStats.memberStats[member.id].totalServices++;
        newStats.memberStats[member.id].firstService++;
      });
      day.secondService.forEach(member => {
        newStats.memberStats[member.id].totalServices++;
        newStats.memberStats[member.id].secondService++;
      });
      day.thirdService.forEach(member => {
        newStats.memberStats[member.id].totalServices++;
        newStats.memberStats[member.id].thirdService++;
      });
    });

    setStats(newStats);
  };

  const toggleDateExpansion = (date) => {
    setExpandedDate(expandedDate && expandedDate.getTime() === date.getTime() ? null : date);
  };

  const markMemberUnavailable = (memberId, date) => {
    setMembers(prevMembers => {
      const updatedMembers = prevMembers.map(member => {
        if (member.id === memberId) {
          const unavailableDates = [...member.unavailableDates];
          const dateIndex = unavailableDates.findIndex(d =>
            d.toDateString() === date.toDateString()
          );

          if (dateIndex === -1) {
            unavailableDates.push(date);
          } else {
            unavailableDates.splice(dateIndex, 1);
          }

          return { ...member, unavailableDates };
        }
        return member;
      });
      return updatedMembers;
    });
  };

  const exportToCSV = () => {
    const rows = [['Date', 'Service', 'Members']];

    schedule.forEach(day => {
      const date = day.date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      rows.push([date, 'First Service', day.firstService.map(m => m.name).join(', ')]);
      rows.push([date, 'Second Service', day.secondService.map(m => m.name).join(', ')]);
      rows.push([date, 'Third Service', day.thirdService.map(m => m.name).join(', ')]);
    });

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'church_roster_2025.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const MemberDialog = ({ member }) => (
    <Dialog>
      <DialogTrigger>
        <span className="cursor-pointer hover:underline"
              style={{ backgroundColor: member.color }}>
          {member.name}
        </span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{member.name}</DialogTitle>
          <DialogDescription>
            <div className="space-y-4 mt-4">
              <div>
                <h4 className="font-semibold">Member Details:</h4>
                <p>Role: {member.isHOD ? 'HOD' : 'Regular Member'}</p>
                <p>Has Children: {member.hasChildren ? 'Yes' : 'No'}</p>
                <p>Prefers First Service: {member.preferFirstService ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <h4 className="font-semibold">Service Statistics:</h4>
                {stats.memberStats[member.id] && (
                  <>
                    <p>Total Services: {stats.memberStats[member.id].totalServices}</p>
                    <p>First Service: {stats.memberStats[member.id].firstService}</p>
                    <p>Second Service: {stats.memberStats[member.id].secondService}</p>
                    <p>Third Service: {stats.memberStats[member.id].thirdService}</p>
                  </>
                )}
              </div>
              <div>
                <h4 className="font-semibold">Unavailable Dates:</h4>
                {member.unavailableDates.length > 0 ? (
                  <ul>
                    {member.unavailableDates.map(date => (
                      <li key={date.toISOString()}>
                        {date.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No unavailable dates set</p>
                )}
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-4">
      <Card className="w-full max-w-6xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Church Service Roster 2025</CardTitle>
          <div className="flex gap-2">
            <Button onClick={() => setShowStats(!showStats)} className="flex items-center gap-2">
              <BarChart className="w-4 h-4" />
              {showStats ? 'Hide' : 'Show'} Stats
            </Button>
            <Button onClick={exportToCSV} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showStats && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Service Distribution Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {members.map(member => (
                  <Card key={member.id} className="p-4">
                    <h4 className="font-semibold">{member.name}</h4>
                    {stats.memberStats[member.id] && (
                      <div className="text-sm">
                        <p>Total: {stats.memberStats[member.id].totalServices}</p>
                        <p>First: {stats.memberStats[member.id].firstService}</p>
                        <p>Second: {stats.memberStats[member.id].secondService}</p>
                        <p>Third: {stats.memberStats[member.id].thirdService}</p>
                      </div>
                    )}
                  </Card>
                ))}
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
                {schedule.map((day) => (
                  <tr key={day.date.toISOString()} className="hover:bg-gray-50">
                    <td className="p-2 border">
                      {expandedDate?.getTime() === day.date.getTime()
                        ? day.secondService.map(m => (
                            <span key={m.id} className="mr-2">
                              <MemberDialog member={m} />
                            </span>
                          ))
                        : `${day.secondService.length} members`}
                    </td>
                    <td className="p-2 border">
                      {expandedDate?.getTime() === day.date.getTime()
                        ? day.thirdService.map(m => (
                            <span key={m.id} className="mr-2">
                              <MemberDialog member={m} />
                            </span>
                          ))
                        : `${day.thirdService.length} members`}
                    </td>
                    <td className="p-2 border">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDateExpansion(day.date)}
                          className="flex items-center gap-1"
                        >
                          {expandedDate?.getTime() === day.date.getTime()
                            ? <Minus className="w-4 h-4" />
                            : <Plus className="w-4 h-4" />}
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Calendar className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage Availability</DialogTitle>
                              <DialogDescription>
                                Mark members as unavailable for {day.date.toLocaleDateString()}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              {members.map(member => (
                                <div key={member.id} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`unavailable-${member.id}-${day.date.getTime()}`}
                                    checked={member.unavailableDates.some(
                                      d => d.toDateString() === day.date.toDateString()
                                    )}
                                    onChange={() => markMemberUnavailable(member.id, day.date)}
                                    className="w-4 h-4"
                                  />
                                  <label
                                    htmlFor={`unavailable-${member.id}-${day.date.getTime()}`}
                                    className="text-sm"
                                  >
                                    {member.name}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full max-w-6xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Member Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map(member => (
              <Card key={member.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold" style={{ color: member.color }}>
                      {member.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {member.isHOD ? 'HOD' : member.hasChildren ? 'Has Children' : 'Regular Member'}
                    </p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Calendar className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Manage {member.name}'s Availability</DialogTitle>
                      </DialogHeader>
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Unavailable Dates:</h4>
                        {member.unavailableDates.length > 0 ? (
                          <ul className="space-y-2">
                            {member.unavailableDates.map(date => (
                              <li key={date.toISOString()} className="flex justify-between items-center">
                                <span>{date.toLocaleDateString()}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markMemberUnavailable(member.id, date)}
                                >
                                  Remove
                                </Button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-600">No unavailable dates set</p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RosterScheduler;">

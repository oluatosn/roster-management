import { Member, ServiceSchedule, SchedulingRules, SpecialEvent } from './types';

function isDateAffectedBySpecialEvent(date: Date, event: SpecialEvent): boolean {
  if (!event.active) return false;

  const eventStart = new Date(event.startDate);
  const eventEnd = new Date(event.endDate);

  if (!event.isRecurring) {
    return date >= eventStart && date <= eventEnd;
  }

  if (!event.recurrencePattern) return false;

  const pattern = event.recurrencePattern;
  const dateToCheck = new Date(date);

  switch (pattern.type) {
    case 'monthly': {
      if (pattern.weekNumber && pattern.dayOfWeek !== undefined) {
        // Handle "nth weekday of month" pattern
        const weekNum = pattern.weekNumber;
        const targetDay = pattern.dayOfWeek;

        // If it's last week (-1), count backwards from end of month
        if (weekNum === -1) {
          const lastDay = new Date(dateToCheck.getFullYear(), dateToCheck.getMonth() + 1, 0);
          let count = 0;
          for (let d = lastDay.getDate(); d > 0; d--) {
            const checkDate = new Date(dateToCheck.getFullYear(), dateToCheck.getMonth(), d);
            if (checkDate.getDay() === targetDay) {
              count++;
              if (count === 1) {
                return dateToCheck.getDate() === d;
              }
            }
          }
        } else {
          // Count forward from start of month
          let count = 0;
          for (let d = 1; d <= dateToCheck.getDate(); d++) {
            const checkDate = new Date(dateToCheck.getFullYear(), dateToCheck.getMonth(), d);
            if (checkDate.getDay() === targetDay) {
              count++;
              if (count === weekNum) {
                return dateToCheck.getDate() === d;
              }
            }
          }
        }
        return false;
      }
      return dateToCheck.getDate() === (pattern.dayOfMonth || eventStart.getDate());
    }
    case 'bimonthly': {
      const monthDiff = (dateToCheck.getFullYear() - eventStart.getFullYear()) * 12 +
                       (dateToCheck.getMonth() - eventStart.getMonth());
      return monthDiff % 2 === 0 && pattern.weekNumber !== undefined && pattern.dayOfWeek !== undefined ?
        isNthWeekdayOfMonth(dateToCheck, pattern.weekNumber, pattern.dayOfWeek) :
        dateToCheck.getDate() === (pattern.dayOfMonth || eventStart.getDate());
    }
    case 'quarterly': {
      const monthDiff = (dateToCheck.getFullYear() - eventStart.getFullYear()) * 12 +
                       (dateToCheck.getMonth() - eventStart.getMonth());
      return monthDiff % 3 === 0 && pattern.weekNumber !== undefined && pattern.dayOfWeek !== undefined ?
        isNthWeekdayOfMonth(dateToCheck, pattern.weekNumber, pattern.dayOfWeek) :
        dateToCheck.getDate() === (pattern.dayOfMonth || eventStart.getDate());
    }
    case 'yearly': {
      return dateToCheck.getMonth() === eventStart.getMonth() &&
             (pattern.weekNumber !== undefined && pattern.dayOfWeek !== undefined ?
              isNthWeekdayOfMonth(dateToCheck, pattern.weekNumber, pattern.dayOfWeek) :
              dateToCheck.getDate() === (pattern.dayOfMonth || eventStart.getDate()));
    }
    case 'custom': {
      if (!pattern.customInterval) return false;
      const daysDiff = Math.floor((dateToCheck.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff >= 0 && daysDiff % pattern.customInterval === 0;
    }
    default:
      return false;
  }
}

function isNthWeekdayOfMonth(date: Date, weekNumber: number, targetDay: number): boolean {
  if (weekNumber === -1) {
    // Last occurrence of the weekday
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    let count = 0;
    for (let d = lastDay.getDate(); d > 0; d--) {
      const checkDate = new Date(date.getFullYear(), date.getMonth(), d);
      if (checkDate.getDay() === targetDay) {
        count++;
        if (count === 1) {
          return date.getDate() === d;
        }
      }
    }
  } else {
    // Nth occurrence of the weekday
    let count = 0;
    for (let d = 1; d <= date.getDate(); d++) {
      const checkDate = new Date(date.getFullYear(), date.getMonth(), d);
      if (checkDate.getDay() === targetDay) {
        count++;
        if (count === weekNumber) {
          return date.getDate() === d;
        }
      }
    }
  }
  return false;
}

export function generateSundays(year: number): Date[] {
  const sundays: Date[] = [];
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  const firstSunday = new Date(startDate);
  firstSunday.setDate(firstSunday.getDate() + (7 - firstSunday.getDay()) % 7);

  let currentDate = new Date(firstSunday);
  while (currentDate <= endDate) {
    sundays.push(new Date(currentDate.getTime()));
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return sundays;
}

export function generateSchedule(
  members: Member[],
  year: number = 2025,
  schedulingRules: SchedulingRules,
  specialEvents: SpecialEvent[] = []
): ServiceSchedule[] {
  const sundays = generateSundays(year);
  const schedule: ServiceSchedule[] = [];
  let lastServiceAssignments = new Map<number, string>();

  // Helper function to assign members to a service while respecting min/max constraints
  const assignMembersToService = (
    candidates: Member[],
    currentService: Member[],
    maxMembers: number
  ): Member[] => {
    const availableSlots = maxMembers - currentService.length;
    if (availableSlots <= 0 || candidates.length === 0) return currentService;

    const membersToAdd = Math.min(availableSlots, candidates.length);
    const shuffledCandidates = [...candidates].sort(() => Math.random() - 0.5);
    return [...currentService, ...shuffledCandidates.slice(0, membersToAdd)];
  };

  for (const sunday of sundays) {
    const normalizedDate = new Date(Date.UTC(
      sunday.getFullYear(),
      sunday.getMonth(),
      sunday.getDate()
    ));

    const availableMembers = members.filter(
      (m) => !m.unavailableDates.some((d) => {
        const normalizedUnavailable = new Date(Date.UTC(
          d.getFullYear(),
          d.getMonth(),
          d.getDate()
        ));
        return normalizedUnavailable.getTime() === normalizedDate.getTime();
      })
    );

    const daySchedule: ServiceSchedule = {
      date: normalizedDate,
      firstService: [],
      secondService: [],
      thirdService: [],
    };

    // Check for special events affecting this date
    const affectingEvent = specialEvents.find(event => isDateAffectedBySpecialEvent(normalizedDate, event));
    const numberOfServices = affectingEvent ? affectingEvent.numberOfServices : 3;

    // First Service - prioritize HOD and members who prefer first service
    const hodMember = availableMembers.find(
      (m) => m.isHOD && (!schedulingRules.maintainConsistentTimes || lastServiceAssignments.get(m.id) !== 'first')
    );
    if (hodMember) {
      daySchedule.firstService.push(hodMember);
    }

    // Filter candidates based on scheduling rules
    let firstServiceCandidates = availableMembers.filter(m => {
      if (daySchedule.firstService.includes(m)) return false;
      if (schedulingRules.maintainConsistentTimes && lastServiceAssignments.get(m.id) === 'first') return false;

      if (schedulingRules.respectPreferences) {
        if (schedulingRules.prioritizeChildrenForLater && m.hasChildren) return false;
        if (!m.preferFirstService) return false;
      }

      return true;
    });

    // Assign members to first service
    daySchedule.firstService = assignMembersToService(
      firstServiceCandidates,
      daySchedule.firstService,
      schedulingRules.maxMembersPerService
    );

    if (numberOfServices >= 2) {
      // Handle second and third services
      const remainingMembers = availableMembers.filter(
        (m) => !daySchedule.firstService.includes(m)
      );

      const withChildren = remainingMembers.filter((m) => m.hasChildren);
      const withoutChildren = remainingMembers.filter((m) => !m.hasChildren);

      // Distribute members with children between second and third services
      if (schedulingRules.prioritizeChildrenForLater) {
        let secondServiceCandidates = withChildren.filter(
          m => !schedulingRules.maintainConsistentTimes || lastServiceAssignments.get(m.id) !== 'second'
        );
        daySchedule.secondService = assignMembersToService(
          secondServiceCandidates,
          daySchedule.secondService,
          schedulingRules.maxMembersPerService
        );

        if (numberOfServices === 3) {
          let thirdServiceCandidates = withChildren.filter(
            m => !schedulingRules.maintainConsistentTimes || lastServiceAssignments.get(m.id) !== 'third'
          );
          daySchedule.thirdService = assignMembersToService(
            thirdServiceCandidates,
            daySchedule.thirdService,
            schedulingRules.maxMembersPerService
          );
        }
      }

      // Fill remaining slots with members without children
      const fillRemainingSlots = () => {
        const remainingForSecond = withoutChildren.filter(
          m => !schedulingRules.maintainConsistentTimes || lastServiceAssignments.get(m.id) !== 'second'
        );
        daySchedule.secondService = assignMembersToService(
          remainingForSecond,
          daySchedule.secondService,
          schedulingRules.maxMembersPerService
        );

        if (numberOfServices === 3) {
          const remainingForThird = withoutChildren.filter(
            m => !schedulingRules.maintainConsistentTimes || lastServiceAssignments.get(m.id) !== 'third'
          );
          daySchedule.thirdService = assignMembersToService(
            remainingForThird,
            daySchedule.thirdService,
            schedulingRules.maxMembersPerService
          );
        }
      };

      fillRemainingSlots();
    }

    // Ensure minimum members requirement is met where possible
    const redistributeIfNeeded = () => {
      const services = ['firstService', 'secondService', 'thirdService'] as const;
      const allRemaining = availableMembers.filter(m =>
        !daySchedule.firstService.includes(m) &&
        !daySchedule.secondService.includes(m) &&
        !daySchedule.thirdService.includes(m)
      );

      for (const service of services) {
        if (numberOfServices === 1 && service !== 'firstService') continue;
        if (numberOfServices === 2 && service === 'thirdService') continue;

        if (daySchedule[service].length < schedulingRules.minMembersPerService) {
          const needed = schedulingRules.minMembersPerService - daySchedule[service].length;
          const candidates = allRemaining.filter(m =>
            !schedulingRules.maintainConsistentTimes ||
            lastServiceAssignments.get(m.id) !== service
          );

          if (candidates.length > 0) {
            const additional = assignMembersToService(
              candidates,
              daySchedule[service],
              schedulingRules.maxMembersPerService
            );
            daySchedule[service] = additional;
          }
        }
      }
    };

    redistributeIfNeeded();

    // Update service history if maintaining consistent times
    if (schedulingRules.maintainConsistentTimes) {
      daySchedule.firstService.forEach((m) => lastServiceAssignments.set(m.id, 'first'));
      daySchedule.secondService.forEach((m) => lastServiceAssignments.set(m.id, 'second'));
      daySchedule.thirdService.forEach((m) => lastServiceAssignments.set(m.id, 'third'));
    }

    // Add the special event reference if there is one
    if (affectingEvent) {
      daySchedule.specialEvent = affectingEvent;
    }

    schedule.push(daySchedule);
  }

  return schedule;
}

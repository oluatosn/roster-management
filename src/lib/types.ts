export interface Member {
  id: number;
  name: string;
  isHOD: boolean;
  hasChildren: boolean;
  preferFirstService: boolean;
  lastServiceDate: Date | null;
  serviceCount: number;
  unavailableDates: Date[];
  color: string;
}

export interface ServiceSchedule {
  date: Date;
  firstService: Member[];
  secondService: Member[];
  thirdService: Member[];
  specialEvent?: SpecialEvent; // Reference to the special event if this date is affected
}

export interface SchedulingRules {
  minMembersPerService: number;
  maxMembersPerService: number;
  minDaysBetweenServices: number;
  respectPreferences: boolean;
  prioritizeChildrenForLater: boolean;
  maintainConsistentTimes: boolean;
}

export type RecurrencePattern = {
  type: 'monthly' | 'bimonthly' | 'quarterly' | 'yearly' | 'custom';
  dayOfMonth?: number;  // For monthly/bimonthly/quarterly/yearly events
  customInterval?: number;  // For custom recurrence (in days)
  weekNumber?: 1 | 2 | 3 | 4 | -1;  // -1 for last week
  dayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0 = Sunday, 1 = Monday, etc.
}

export interface SpecialEvent {
  id: number;
  name: string;
  numberOfServices: number;
  startDate: Date;
  endDate: Date;  // For multi-day events
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  active: boolean;  // To temporarily disable without deleting
}

export interface SystemSettings {
  version: string;
}

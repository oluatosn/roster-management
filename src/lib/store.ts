"use client";

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Member, ServiceSchedule, SchedulingRules, SpecialEvent, SystemSettings } from './types';

// Helper function to convert date strings to Date objects in an object
function convertDates<T extends Record<string, any>>(obj: T): T {
  const newObj = { ...obj };
  for (const key in newObj) {
    if (typeof newObj[key] === 'string' && newObj[key].match(/^\d{4}-\d{2}-\d{2}T/)) {
      newObj[key] = new Date(newObj[key]);
    } else if (Array.isArray(newObj[key])) {
      newObj[key] = newObj[key].map((item: any) => {
        if (typeof item === 'string' && item.match(/^\d{4}-\d{2}-\d{2}T/)) {
          return new Date(item);
        }
        if (typeof item === 'object' && item !== null) {
          return convertDates(item);
        }
        return item;
      });
    } else if (typeof newObj[key] === 'object' && newObj[key] !== null) {
      newObj[key] = convertDates(newObj[key]);
    }
  }
  return newObj;
}

interface StoreState {
  members: Member[];
  schedule: ServiceSchedule[];
  schedulingRules: SchedulingRules;
  specialEvents: SpecialEvent[];
  systemSettings: SystemSettings;

  setMembers: (members: Member[]) => void;
  addMember: (member: Omit<Member, 'id'>) => void;
  removeMember: (id: number) => void;
  updateMember: (id: number, updates: Partial<Member>) => void;
  setSchedule: (schedule: ServiceSchedule[]) => void;
  markMemberUnavailable: (memberId: number, date: Date) => void;
  updateSchedulingRules: (rules: Partial<SchedulingRules>) => void;

  addSpecialEvent: (event: Omit<SpecialEvent, 'id'>) => void;
  updateSpecialEvent: (id: number, updates: Partial<SpecialEvent>) => void;
  removeSpecialEvent: (id: number) => void;
  toggleSpecialEvent: (id: number) => void;

  resetStore: () => void;
}

const initialSchedulingRules: SchedulingRules = {
  minMembersPerService: 5,
  maxMembersPerService: 10,
  minDaysBetweenServices: 7,
  respectPreferences: true,
  prioritizeChildrenForLater: true,
  maintainConsistentTimes: true
};

const initialSystemSettings: SystemSettings = {
  version: '1.0.0'
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      members: [],
      schedule: [],
      schedulingRules: initialSchedulingRules,
      specialEvents: [],
      systemSettings: initialSystemSettings,

      setMembers: (members) => set({ members }),

      addMember: (member) => {
        const state = get();
        const newMember = {
          ...member,
          id: Math.max(0, ...state.members.map(m => m.id)) + 1,
          unavailableDates: member.unavailableDates.map(d => new Date(d)),
          lastServiceDate: member.lastServiceDate ? new Date(member.lastServiceDate) : null
        };
        set({ members: [...state.members, newMember] });
      },

      removeMember: (id) => set((state) => ({
        members: state.members.filter((m) => m.id !== id)
      })),

      updateMember: (id, updates) => set((state) => ({
        members: state.members.map((m) =>
          m.id === id ? { ...m, ...updates } : m
        )
      })),

      setSchedule: (schedule) => set({
        schedule: schedule.map(day => ({
          ...day,
          date: new Date(day.date)
        }))
      }),

      markMemberUnavailable: (memberId, date) => set((state) => ({
        members: state.members.map((member) => {
          if (member.id !== memberId) return member;

          const dateString = date.toDateString();
          const unavailableDates = member.unavailableDates.filter(
            d => d.toDateString() !== dateString
          );

          if (unavailableDates.length === member.unavailableDates.length) {
            unavailableDates.push(new Date(date));
          }

          return { ...member, unavailableDates };
        })
      })),

      updateSchedulingRules: (rules) => set((state) => ({
        schedulingRules: { ...state.schedulingRules, ...rules }
      })),

      addSpecialEvent: (event) => {
        const state = get();
        const newEvent = {
          ...event,
          id: Math.max(0, ...state.specialEvents.map(e => e.id)) + 1,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate)
        };
        set({ specialEvents: [...state.specialEvents, newEvent] });
      },

      updateSpecialEvent: (id, updates) => set((state) => ({
        specialEvents: state.specialEvents.map((event) =>
          event.id === id ? {
            ...event,
            ...updates,
            startDate: updates.startDate ? new Date(updates.startDate) : event.startDate,
            endDate: updates.endDate ? new Date(updates.endDate) : event.endDate
          } : event
        )
      })),

      removeSpecialEvent: (id) => set((state) => ({
        specialEvents: state.specialEvents.filter((event) => event.id !== id)
      })),

      toggleSpecialEvent: (id) => set((state) => ({
        specialEvents: state.specialEvents.map((event) =>
          event.id === id ? { ...event, active: !event.active } : event
        )
      })),

      resetStore: () => set({
        members: [],
        schedule: [],
        schedulingRules: initialSchedulingRules,
        specialEvents: [],
        systemSettings: initialSystemSettings
      }),
    }),
    {
      name: 'church-roster-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        members: state.members,
        schedule: state.schedule,
        schedulingRules: state.schedulingRules,
        specialEvents: state.specialEvents,
        systemSettings: state.systemSettings
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert all date strings back to Date objects after rehydration
          state.members = state.members.map(member => ({
            ...member,
            unavailableDates: member.unavailableDates.map(d => new Date(d)),
            lastServiceDate: member.lastServiceDate ? new Date(member.lastServiceDate) : null
          }));

          state.schedule = state.schedule.map(day => ({
            ...day,
            date: new Date(day.date)
          }));

          state.specialEvents = state.specialEvents.map(event => ({
            ...event,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate)
          }));
        }
      }
    }
  )
);

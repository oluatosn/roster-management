'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { SpecialEvent, RecurrencePattern } from '@/lib/types';

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEvent: SpecialEvent | null;
  newEvent: Omit<SpecialEvent, 'id'>;
  setNewEvent: (event: Omit<SpecialEvent, 'id'>) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const EventDialog = ({
  open,
  onOpenChange,
  editingEvent,
  newEvent,
  setNewEvent,
  onSave,
  onCancel
}: EventDialogProps) => {
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleNumberOfServicesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty input for manual typing
    if (value === '') {
      setNewEvent({ ...newEvent, numberOfServices: 0 });
      setValidationError('Number of services cannot be zero');
      return;
    }

    const numValue = parseInt(value, 10);

    // Validate the number
    if (isNaN(numValue)) {
      setValidationError('Please enter a valid number');
    } else if (numValue <= 0) {
      setValidationError('Number of services must be greater than zero');
    } else if (numValue > 3) {
      setValidationError('Maximum number of services is 3');
    } else {
      setValidationError(null);
    }

    setNewEvent({ ...newEvent, numberOfServices: numValue });
  };

  const handleSave = () => {
    // Check for empty fields
    if (!newEvent.name.trim()) {
      setValidationError('Event name is required');
      return;
    }

    // Validate number of services
    if (newEvent.numberOfServices <= 0 || newEvent.numberOfServices > 3) {
      setValidationError('Number of services must be between 1 and 3');
      return;
    }

    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(newEvent.startDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(newEvent.endDate);
    endDate.setHours(0, 0, 0, 0);

    // Check if dates are in the past
    if (startDate < today) {
      setValidationError('Start date cannot be in the past');
      return;
    }

    // Check if end date is before start date
    if (endDate < startDate) {
      setValidationError('End date cannot be before start date');
      return;
    }

    // If all validations pass
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-gray-900 bg-white border-gray-200 dark:border-gray-800 max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white text-xl">
            {editingEvent ? 'Edit Event' : 'Add New Event'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-900 dark:text-gray-300 font-medium mb-1">
              Event Name
            </label>
            <input
              type="text"
              value={newEvent.name}
              onChange={(e) => {
                setNewEvent({ ...newEvent, name: e.target.value });
                if (e.target.value.trim()) {
                  setValidationError(null);
                }
              }}
              className="w-full p-2 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-900 dark:text-gray-300 font-medium mb-1">
              Number of Services
            </label>
            <input
              type="number"
              min="1"
              max="3"
              value={newEvent.numberOfServices === 0 ? '' : newEvent.numberOfServices}
              onChange={handleNumberOfServicesChange}
              className="w-full p-2 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              required
            />
            {validationError && (
              <Alert className="mt-2 border border-red-200 bg-red-50 dark:bg-red-900/50 dark:border-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
                <AlertDescription className="text-red-600 dark:text-red-400 ml-2">
                  {validationError}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-900 dark:text-gray-300 font-medium mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={new Date(newEvent.startDate).toISOString().split('T')[0]}
                onChange={(e) => {
                  const newStartDate = new Date(e.target.value);
                  if (newStartDate > newEvent.endDate) {
                    setValidationError('Start date cannot be after end date');
                  } else {
                    setValidationError(null);
                  }
                  setNewEvent({ ...newEvent, startDate: newStartDate });
                }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-2 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-900 dark:text-gray-300 font-medium mb-1">
                End Date
              </label>
              <input
                type="date"
                value={new Date(newEvent.endDate).toISOString().split('T')[0]}
                onChange={(e) => {
                  const newEndDate = new Date(e.target.value);
                  if (newEndDate < newEvent.startDate) {
                    setValidationError('End date cannot be before start date');
                  } else {
                    setValidationError(null);
                  }
                  setNewEvent({ ...newEvent, endDate: newEndDate });
                }}
                min={new Date(newEvent.startDate).toISOString().split('T')[0]}
                className="w-full p-2 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newEvent.isRecurring}
                onChange={(e) => setNewEvent({
                  ...newEvent,
                  isRecurring: e.target.checked,
                  recurrencePattern: e.target.checked ? { type: 'monthly' } : undefined
                })}
                className="rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-blue-500"
              />
              <span className="text-gray-900 dark:text-gray-300">Recurring Event</span>
            </label>
          </div>
          {newEvent.isRecurring && (
            <div>
              <label className="block text-sm text-gray-900 dark:text-gray-300 font-medium mb-1">
                Recurrence Pattern
              </label>
              <select
                value={newEvent.recurrencePattern?.type || 'monthly'}
                onChange={(e) => setNewEvent({
                  ...newEvent,
                  recurrencePattern: {
                    type: e.target.value as RecurrencePattern['type'],
                    customInterval: e.target.value === 'custom' ? 7 : undefined
                  }
                })}
                className="w-full p-2 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="bimonthly">Every 2 Months</option>
                <option value="quarterly">Every 3 Months</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom Interval</option>
              </select>
              {newEvent.recurrencePattern?.type === 'custom' && (
                <div className="mt-2">
                  <label className="block text-sm text-gray-900 dark:text-gray-300 font-medium mb-1">
                    Days between occurrences
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newEvent.recurrencePattern.customInterval}
                    onChange={(e) => setNewEvent({
                      ...newEvent,
                      recurrencePattern: {
                        ...newEvent.recurrencePattern,
                        customInterval: Number(e.target.value)
                      }
                    })}
                    className="w-full p-2 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
              {['monthly', 'bimonthly', 'quarterly', 'yearly'].includes(newEvent.recurrencePattern?.type || '') && (
                <div className="mt-2 space-y-2">
                  <div>
                    <label className="block text-sm text-gray-900 dark:text-gray-300 font-medium mb-1">
                      Week of Month
                    </label>
                    <select
                      value={newEvent.recurrencePattern?.weekNumber || 1}
                      onChange={(e) => setNewEvent({
                        ...newEvent,
                        recurrencePattern: {
                          ...newEvent.recurrencePattern,
                          weekNumber: Number(e.target.value) as 1 | 2 | 3 | 4 | -1
                        }
                      })}
                      className="w-full p-2 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value={1}>First</option>
                      <option value={2}>Second</option>
                      <option value={3}>Third</option>
                      <option value={4}>Fourth</option>
                      <option value={-1}>Last</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-900 dark:text-gray-300 font-medium mb-1">
                      Day of Week
                    </label>
                    <select
                      value={newEvent.recurrencePattern?.dayOfWeek || 0}
                      onChange={(e) => setNewEvent({
                        ...newEvent,
                        recurrencePattern: {
                          ...newEvent.recurrencePattern,
                          dayOfWeek: Number(e.target.value) as 0 | 1 | 2 | 3 | 4 | 5 | 6
                        }
                      })}
                      className="w-full p-2 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value={0}>Sunday</option>
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="ghost"
              onClick={onCancel}
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!!validationError || newEvent.numberOfServices === 0}
            >
              {editingEvent ? 'Update' : 'Add'} Event
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

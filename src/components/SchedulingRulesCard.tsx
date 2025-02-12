'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '@/lib/store';

export function SchedulingRulesCard() {
  const schedulingRules = useStore((state) => state.schedulingRules);
  const updateSchedulingRules = useStore((state) => state.updateSchedulingRules);

  const [formRules, setFormRules] = useState(schedulingRules);
  const [isDirty, setIsDirty] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Handle unsaved changes warning
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      return (e.returnValue = 'You have unsaved changes. Are you sure you want to leave?');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Clear feedback after timeout
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleInputChange = (field: string, value: number | boolean | string) => {
    setFormRules(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleNumberInput = (field: string, value: string) => {
    // Allow empty string for clearing input
    if (value === '') {
      handleInputChange(field, '');
      return;
    }

    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0) {
      setFeedback({
        type: 'error',
        message: 'Value must be a positive number greater than zero'
      });
      return;
    }
    handleInputChange(field, num);
  };

  const validateForm = () => {
    // Check for empty values
    if (formRules.minMembersPerService === '' ||
        formRules.maxMembersPerService === '' ||
        formRules.minDaysBetweenServices === '') {
      setFeedback({
        type: 'error',
        message: 'All numeric fields are required'
      });
      return false;
    }

    // Validate numeric values
    const min = Number(formRules.minMembersPerService);
    const max = Number(formRules.maxMembersPerService);
    const days = Number(formRules.minDaysBetweenServices);

    if (min <= 0 || max <= 0 || days <= 0) {
      setFeedback({
        type: 'error',
        message: 'All numeric values must be greater than zero'
      });
      return false;
    }

    if (min > max) {
      setFeedback({
        type: 'error',
        message: 'Minimum members cannot be greater than maximum members'
      });
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    try {
      // Convert string values to numbers before saving
      const updatedRules = {
        ...formRules,
        minMembersPerService: Number(formRules.minMembersPerService),
        maxMembersPerService: Number(formRules.maxMembersPerService),
        minDaysBetweenServices: Number(formRules.minDaysBetweenServices)
      };

      updateSchedulingRules(updatedRules);
      setFeedback({
        type: 'success',
        message: 'Scheduling rules updated successfully'
      });
      setIsDirty(false);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: 'Failed to update scheduling rules'
      });
    }
  };

  const handleCancel = () => {
    setFormRules(schedulingRules);
    setIsDirty(false);
    setFeedback(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Scheduling Rules</CardTitle>
        {isDirty && (
          <span className="text-sm text-yellow-500">
            You have unsaved changes
          </span>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold">Service Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                  Minimum Members per Service *
                  <span className="text-xs text-gray-500 ml-1">(must be greater than 0)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formRules.minMembersPerService}
                  onChange={(e) => handleNumberInput('minMembersPerService', e.target.value)}
                  className="w-full p-2 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                  Maximum Members per Service *
                  <span className="text-xs text-gray-500 ml-1">(must be greater than 0)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formRules.maxMembersPerService}
                  onChange={(e) => handleNumberInput('maxMembersPerService', e.target.value)}
                  className="w-full p-2 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                  Minimum Days Between Services *
                  <span className="text-xs text-gray-500 ml-1">(must be greater than 0)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formRules.minDaysBetweenServices}
                  onChange={(e) => handleNumberInput('minDaysBetweenServices', e.target.value)}
                  className="w-full p-2 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <h3 className="text-lg font-semibold">Service Preferences</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formRules.respectPreferences}
                  onChange={(e) => handleInputChange('respectPreferences', e.target.checked)}
                  className="rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-blue-500"
                />
                <span className="text-gray-900 dark:text-gray-300">Respect member service preferences when possible</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formRules.prioritizeChildrenForLater}
                  onChange={(e) => handleInputChange('prioritizeChildrenForLater', e.target.checked)}
                  className="rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-blue-500"
                />
                <span className="text-gray-900 dark:text-gray-300">Prioritize members with children for later services</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formRules.maintainConsistentTimes}
                  onChange={(e) => handleInputChange('maintainConsistentTimes', e.target.checked)}
                  className="rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-blue-500"
                />
                <span className="text-gray-900 dark:text-gray-300">Try to maintain consistent service times for members</span>
              </label>
            </div>
          </div>

          {feedback && (
            <Alert className={feedback.type === 'success' ? 'bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-800'}>
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
              <AlertDescription className={feedback.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {feedback.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={!isDirty}
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isDirty}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

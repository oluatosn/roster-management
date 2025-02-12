'use client';

import React, { useState } from 'react';
import { Users, Calendar, Settings, Upload, Download, RefreshCw, Plus, Pencil, Trash2, Toggle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MemberManagement } from './MemberManagement';
import { SchedulingRulesCard } from './SchedulingRulesCard';
import { EventDialog } from './EventDialog';
import { useStore } from '@/lib/store';
import { sampleMembers } from '@/lib/sampleData';
import type { SpecialEvent } from '@/lib/types';

export const AdminPage = () => {
  const members = useStore((state) => state.members);
  const addMember = useStore((state) => state.addMember);
  const resetStore = useStore((state) => state.resetStore);
  const specialEvents = useStore((state) => state.specialEvents);
  const addSpecialEvent = useStore((state) => state.addSpecialEvent);
  const updateSpecialEvent = useStore((state) => state.updateSpecialEvent);
  const removeSpecialEvent = useStore((state) => state.removeSpecialEvent);
  const toggleSpecialEvent = useStore((state) => state.toggleSpecialEvent);

  const [activeTab, setActiveTab] = useState('members');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SpecialEvent | null>(null);

  const [newEvent, setNewEvent] = useState<Omit<SpecialEvent, 'id'>>({
    name: '',
    numberOfServices: 2,
    startDate: new Date(),
    endDate: new Date(),
    isRecurring: false,
    active: true,
  });

  const handleExportData = () => {
    const data = {
      members,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `church-roster-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (window.confirm('This will replace all existing data. Are you sure?')) {
          resetStore();
          data.members.forEach((member: any) => addMember(member));
        }
      } catch (error) {
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const formatRecurrencePattern = (pattern: SpecialEvent['recurrencePattern']): string => {
    if (!pattern) return 'One-time event';
    switch (pattern.type) {
      case 'monthly': return 'Monthly';
      case 'bimonthly': return 'Every 2 months';
      case 'quarterly': return 'Every 3 months';
      case 'yearly': return 'Yearly';
      case 'custom': return `Every ${pattern.customInterval} days`;
      default: return 'Custom pattern';
    }
  };

  const handleEventSave = () => {
    if (editingEvent) {
      updateSpecialEvent(editingEvent.id, newEvent);
    } else {
      addSpecialEvent(newEvent);
    }
    setShowEventDialog(false);
    handleEventDialogClose();
  };

  const handleEventDialogClose = () => {
    setShowEventDialog(false);
    setEditingEvent(null);
    setNewEvent({
      name: '',
      numberOfServices: 2,
      startDate: new Date(),
      endDate: new Date(),
      isRecurring: false,
      active: true,
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowImportDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import Data
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm('Load sample member data?')) {
                sampleMembers.forEach(member => addMember(member));
              }
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Load Sample Data
          </Button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex space-x-1 mb-6">
        {[
          { id: 'members', icon: Users, label: 'Members' },
          { id: 'scheduling', icon: Calendar, label: 'Scheduling Rules' },
          { id: 'settings', icon: Settings, label: 'Settings' },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`flex items-center px-4 py-2 rounded-md text-sm ${
              activeTab === id
                ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white'
            }`}
            onClick={() => setActiveTab(id)}
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </button>
        ))}
      </div>

      {/* Content sections */}
      {activeTab === 'members' && <MemberManagement />}
      {activeTab === 'scheduling' && <SchedulingRulesCard />}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Special Events</span>
                <Button onClick={() => setShowEventDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {specialEvents.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No special events configured</p>
                ) : (
                  <div className="divide-y">
                    {specialEvents.map((event) => (
                      <div key={event.id} className="py-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{event.name}</h4>
                          <p className="text-sm text-gray-500">
                            {event.isRecurring
                              ? formatRecurrencePattern(event.recurrencePattern)
                              : `${new Date(event.startDate).toLocaleDateString()} - ${new Date(event.endDate).toLocaleDateString()}`
                            }
                          </p>
                          <p className="text-sm text-gray-500">{event.numberOfServices} services</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSpecialEvent(event.id)}
                          >
                            <Toggle className={`w-4 h-4 ${event.active ? 'text-green-500' : 'text-gray-500'}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingEvent(event);
                              setNewEvent(event);
                              setShowEventDialog(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this event?')) {
                                removeSpecialEvent(event.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Other settings cards */}
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => {
                    if (window.confirm('This will clear all data. Are you sure?')) {
                      resetStore();
                    }
                  }}
                >
                  Clear All Data
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>Version: 1.0.0</p>
                <p>Last Schedule Generation: {new Date().toLocaleDateString()}</p>
                <p>Total Members: {members.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upload a JSON file containing your roster data. This will replace all existing data.
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="w-full"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Dialog */}
      <EventDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        editingEvent={editingEvent}
        newEvent={newEvent}
        setNewEvent={setNewEvent}
        onSave={handleEventSave}
        onCancel={handleEventDialogClose}
      />
    </div>
  );
};

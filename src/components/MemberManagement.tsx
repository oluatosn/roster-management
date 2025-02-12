'use client';

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStore } from '@/lib/store';
import type { Member } from '@/lib/types';

export function MemberManagement() {
  const { members, addMember, updateMember, removeMember } = useStore();
  const [open, setOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    isHOD: false,
    hasChildren: false,
    preferFirstService: false,
    serviceCount: 0,
    unavailableDates: [],
    color: '#' + Math.floor(Math.random()*16777215).toString(16)
  });

  const existingHOD = members.some(member => member.isHOD);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    addMember({
      ...newMember,
      lastServiceDate: null,
    });
    handleClose();
  };

  const handleClose = () => {
    setOpen(false);
    setNewMember({
      name: '',
      isHOD: false,
      hasChildren: false,
      preferFirstService: false,
      serviceCount: 0,
      unavailableDates: [],
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    });
  };

  const toggleMemberAttribute = (memberId: number, attribute: keyof Member) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      if (attribute === 'isHOD' && !member.isHOD && existingHOD) {
        return;
      }
      updateMember(memberId, {
        [attribute]: !member[attribute]
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Church Members</CardTitle>
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{member.name}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to remove ${member.name}?`)) {
                        removeMember(member.id);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={member.isHOD}
                    onChange={() => toggleMemberAttribute(member.id, 'isHOD')}
                    disabled={existingHOD && !member.isHOD}
                    className="rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-blue-500"
                  />
                  <span className={`${existingHOD && !member.isHOD ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-gray-300"}`}>
                    Head of Department
                    {existingHOD && !member.isHOD && " (Already assigned)"}
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={member.hasChildren}
                    onChange={() => toggleMemberAttribute(member.id, 'hasChildren')}
                    className="rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-blue-500"
                  />
                  <span className="text-gray-900 dark:text-gray-300">Has Children</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={member.preferFirstService}
                    onChange={() => toggleMemberAttribute(member.id, 'preferFirstService')}
                    className="rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-blue-500"
                  />
                  <span className="text-gray-900 dark:text-gray-300">Prefers First Service</span>
                </label>
              </div>
              {member.unavailableDates.length > 0 && (
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <p>Unavailable dates: {member.unavailableDates.length}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-900 dark:text-gray-300 font-medium mb-1">
                Name
              </label>
              <input
                type="text"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                className="w-full p-2 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newMember.isHOD}
                  onChange={(e) => {
                    if (!existingHOD || !e.target.checked) {
                      setNewMember({ ...newMember, isHOD: e.target.checked });
                    }
                  }}
                  disabled={existingHOD && !newMember.isHOD}
                  className="rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-blue-500"
                />
                <span className={`${existingHOD && !newMember.isHOD ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-gray-300"}`}>
                  Head of Department
                  {existingHOD && !newMember.isHOD && " (Already assigned)"}
                </span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newMember.hasChildren}
                  onChange={(e) => setNewMember({ ...newMember, hasChildren: e.target.checked })}
                  className="rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-blue-500"
                />
                <span className="text-gray-900 dark:text-gray-300">Has Children</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newMember.preferFirstService}
                  onChange={(e) => setNewMember({ ...newMember, preferFirstService: e.target.checked })}
                  className="rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-blue-500"
                />
                <span className="text-gray-900 dark:text-gray-300">Prefers First Service</span>
              </label>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Member
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

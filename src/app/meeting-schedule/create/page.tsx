'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import MainLayout from '../../../components/layout/MainLayout';
import type { ActionMeta, OnChangeValue } from 'react-select';

const Select = dynamic(() => import('react-select'), { ssr: false });

interface Option {
  value: string;
  label: string;
}

export default function CreateMeeting() {
  const router = useRouter();

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<readonly Option[]>([]);
  const [platform, setPlatform] = useState<Option | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const platformOptions: Option[] = [
    { value: 'zoom', label: 'Zoom' },
    { value: 'google_meet', label: 'Google Meet' },
    { value: 'microsoft_teams', label: 'Microsoft Teams' },
    { value: 'webex', label: 'Webex' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    async function fetchUsers() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/users', {
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          const errorText = await response.text();
          console.error(`Failed to fetch users: ${response.status} ${response.statusText} - ${errorText}`);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    }
    fetchUsers();
  }, []);

  const handleMemberChange = (newValue: OnChangeValue<Option, true>, actionMeta: ActionMeta<Option>) => {
    setSelectedMembers(newValue);
    setErrorMessage(null);
  };

  const handlePlatformChange = (newValue: OnChangeValue<Option, false>, actionMeta: ActionMeta<Option>) => {
    setPlatform(newValue);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const memberIds = selectedMembers.map((member) => member.value);

    const payload = {
      title,
      description,
      memberIds,
      platform: platform ? platform.value : '',
      meeting_date: startDate,
      location: '',
      endDate,
    };

    try {
      const response = await fetch('/api/meeting-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setErrorMessage(null);
        router.push('/meeting-schedule');
      } else {
        setErrorMessage('Failed to create meeting schedule');
      }
    } catch (error) {
      console.error('Error creating meeting schedule:', error);
      setErrorMessage('Error creating meeting schedule');
    }
  };

  const userOptions = users.map((user: { id: string; name: string }) => ({
    value: user.id,
    label: user.name,
  }));

  return (
    <MainLayout>
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create Meeting Schedule</h1>
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6 bg-[var(--card-background)] border border-[var(--card-border)] rounded-lg p-6 shadow-sm">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">Meeting Title</label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrorMessage(null); }}
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md bg-[var(--input-bg)]"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">Meeting Description</label>
            <textarea
              id="description"
              required
              value={description}
              onChange={(e) => { setDescription(e.target.value); setErrorMessage(null); }}
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md bg-[var(--input-bg)]"
              rows={4}
            />
          </div>

          <div>
            <label htmlFor="member" className="block text-sm font-medium mb-1">Members</label>
            <Select
              id="member"
              isMulti
              options={userOptions}
              value={selectedMembers}
              onChange={handleMemberChange as unknown as (newValue: unknown, actionMeta: ActionMeta<unknown>) => void}
              className="basic-multi-select"
              classNamePrefix="select"
            />
          </div>

          <div>
            <label htmlFor="platform" className="block text-sm font-medium mb-1">Meeting Platform</label>
            <Select
              id="platform"
              options={platformOptions}
              value={platform}
              onChange={handlePlatformChange as unknown as (newValue: unknown, actionMeta: ActionMeta<unknown>) => void}
              className="basic-single-select"
              classNamePrefix="select"
              placeholder="Select platform"
              isClearable
              required
            />
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium mb-1">Start Date</label>
            <input
              id="startDate"
              type="datetime-local"
              required
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setErrorMessage(null); }}
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md bg-[var(--input-bg)]"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium mb-1">End Date</label>
            <input
              id="endDate"
              type="datetime-local"
              required
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setErrorMessage(null); }}
              className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md bg-[var(--input-bg)]"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/meeting-schedule')}
              className="px-4 py-2 border border-[var(--input-border)] rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-md text-sm"
              disabled={!platform}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}

'use client';

import React, { useEffect, useState, ChangeEvent, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { ActionMeta, OnChangeValue } from 'react-select';

const Select = dynamic(() => import('react-select'), { ssr: false });

interface Option {
  value: string;
  label: string;
}

interface MeetingSchedule {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  platform: Option | null;
  selectedMembers: Option[];
}

interface EditMeetingSchedulePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditMeetingSchedulePage({ params }: EditMeetingSchedulePageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [meeting, setMeeting] = useState<MeetingSchedule>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    platform: null,
    selectedMembers: []
  });
  const [users, setUsers] = useState<Option[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

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
          const userOptions = data.map((user: { id: string; name: string }) => ({
            value: user.id,
            label: user.name,
          }));
          setUsers(userOptions);
        } else {
          console.error('Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const res = await fetch(`/api/meeting-schedules/${id}`);
        if (!res.ok) {
          throw new Error('Failed to fetch meeting schedule');
        }
        const data = await res.json();

        // Map members to Option[]
        const membersOptions = data.members?.map((member: any) => ({
          value: member.id,
          label: member.name,
        })) || [];

        // Find platform option
        const platformOption = platformOptions.find(opt => opt.value === data.platform) || null;

        setMeeting({
          title: data.title || '',
          description: data.description || '',
          startDate: data.meeting_date || '',
          endDate: data.endDate || '',
          platform: platformOption,
          selectedMembers: membersOptions,
        });
        setLoading(false);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
        setLoading(false);
      }
    };

    fetchMeeting();
  }, [id]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMeeting((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMembersChange = (newValue: unknown, actionMeta: ActionMeta<unknown>) => {
    setMeeting((prev) => ({
      ...prev,
      selectedMembers: newValue as Option[]
    }));
  };

  const handlePlatformChange = (newValue: unknown, actionMeta: ActionMeta<unknown>) => {
    setMeeting((prev) => ({
      ...prev,
      platform: newValue as Option | null
    }));
  };

  const handleSave = async () => {
    setUpdateError(null);
    try {
      const payload = {
        title: meeting.title,
        description: meeting.description,
        memberIds: meeting.selectedMembers.map(m => m.value),
        platform: meeting.platform ? meeting.platform.value : '',
        meeting_date: meeting.startDate,
        endDate: meeting.endDate,
      };

      const res = await fetch(`/api/meeting-schedules/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to update meeting schedule');
      }
      router.push('/meeting-schedule');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setUpdateError(err.message);
      } else {
        setUpdateError('An unknown error occurred');
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this meeting schedule?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/meeting-schedules/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to delete meeting schedule');
      }
      router.push('/meeting-schedule');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600 dark:text-red-400">{error}</p>;

  return (
    <div className="p-8 max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Edit Meeting Schedule</h1>
      {updateError && <p className="mb-4 text-red-600 dark:text-red-400">{updateError}</p>}
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
        <div>
          <label htmlFor="title" className="block mb-1 font-medium text-gray-900 dark:text-white">Meeting Title</label>
          <input
            id="title"
            type="text"
            name="title"
            value={meeting.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="description" className="block mb-1 font-medium text-gray-900 dark:text-white">Meeting Description</label>
          <textarea
            id="description"
            name="description"
            value={meeting.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="member" className="block mb-1 font-medium text-gray-900 dark:text-white">Members</label>
          <Select
            id="member"
            isMulti
            options={users}
            value={meeting.selectedMembers}
            onChange={handleMembersChange}
            className="basic-multi-select"
            classNamePrefix="select"
          />
        </div>
        <div>
          <label htmlFor="platform" className="block mb-1 font-medium text-gray-900 dark:text-white">Meeting Platform</label>
          <Select
            id="platform"
            options={platformOptions}
            value={meeting.platform}
            onChange={handlePlatformChange}
            className="basic-single-select"
            classNamePrefix="select"
            placeholder="Select platform"
            isClearable
            required
          />
        </div>
        <div>
          <label htmlFor="startDate" className="block mb-1 font-medium text-gray-900 dark:text-white">Start Date</label>
          <input
            id="startDate"
            type="datetime-local"
            name="startDate"
            value={meeting.startDate}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block mb-1 font-medium text-gray-900 dark:text-white">End Date</label>
          <input
            id="endDate"
            type="datetime-local"
            name="endDate"
            value={meeting.endDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/meeting-schedule')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

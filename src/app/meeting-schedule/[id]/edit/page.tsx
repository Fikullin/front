'use client';

import React, { useEffect, useState, ChangeEvent, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { ActionMeta, OnChangeValue } from 'react-select';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '../../../../contexts/ThemeContext';
import { usePathname } from 'next/navigation';

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
  url: string;
}

interface EditMeetingSchedulePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditMeetingSchedulePage({ params }: EditMeetingSchedulePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check if user has a theme preference in localStorage
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setDarkMode(!darkMode);
  };

  const [meeting, setMeeting] = useState<MeetingSchedule>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    platform: null,
    selectedMembers: [],
    url: ''
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
          url: data.url || ''
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
        url: meeting.url
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
    <div className="min-h-screen bg-[var(--background)]">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-[var(--card-background)] border-r border-[var(--card-border)] h-screen shadow-sm fixed">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center w-full">
              <Image 
                src="/rams.png" 
                alt="RAMS Logo" 
                width={50} 
                height={50} 
                className="flex-shrink-0"
              />
               <Image 
                src="/PUI-KEKAL.png" 
                alt="PUI-KEKAL Logo" 
                width={90} 
                height={90} 
                className="flex-shrink-0"
              />
              <Image 
                src="/aislogo.png" 
                alt="AIS Logo" 
                width={80} 
                height={80} 
                className="flex-shrink-0"
              />
            </div>
          </div>

            {/* Theme Toggle Button */}
        <button 
          onClick={toggleDarkMode} 
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-900 ml-2 mt-1"
          aria-label="Toggle theme"
        >
          {!darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </button>
          
          <nav className="mt-1">
            <Link href="/dashboard" className={`flex items-center px-4 py-3 ${pathname === '/dashboard' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              Dashboard
            </Link>
            
            <Link href="/projects" className={`flex items-center px-4 py-3 ${pathname.startsWith('/projects') ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              Projects
            </Link>
            
            <Link href="/tasks" className={`flex items-center px-4 py-3 ${pathname.startsWith('/tasks') ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              Task
              <span className="ml-auto bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 rounded-full px-2 py-0.5 text-xs">3</span>
            </Link>

            <Link href="/meeting-schedule" className={`flex items-center px-4 py-3 ${pathname.startsWith('/meeting-schedule') ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z" />
              </svg>
              Meeting Schedule
            </Link>
            
            <Link href="/users" className={`flex items-center px-4 py-3 ${pathname.startsWith('/users') ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              Users
            </Link> 
          </nav>
        </div>

        {/* Main Content */}
        <div className="ml-64 w-full">
          <main className="p-8 max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded shadow">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Edit Meeting Schedule</h1>
            {updateError && <p className="mb-4 text-red-600 dark:text-red-400">{updateError}</p>}
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
              <div>
                <label htmlFor="title" className="block mb-1 font-medium text-gray-900 dark:text-gray-100">Meeting Title</label>
                <input
                  id="title"
                  type="text"
                  name="title"
                  value={meeting.title}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label htmlFor="description" className="block mb-1 font-medium text-gray-900 dark:text-gray-100">Meeting Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={meeting.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label htmlFor="member" className="block mb-1 font-medium text-gray-900 dark:text-gray-100">Members</label>
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
                <label htmlFor="platform" className="block mb-1 font-medium text-gray-900 dark:text-gray-100">Meeting Platform</label>
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
                <label htmlFor="url" className="block mb-1 font-medium text-gray-900 dark:text-gray-100">Meeting URL</label>
                <input
                  id="url"
                  type="url"
                  name="url"
                  value={meeting.url}
                  onChange={(e) => setMeeting((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="Enter meeting link"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label htmlFor="startDate" className="block mb-1 font-medium text-gray-900 dark:text-gray-100">Start Date</label>
                <input
                  id="startDate"
                  type="datetime-local"
                  name="startDate"
                  value={meeting.startDate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block mb-1 font-medium text-gray-900 dark:text-gray-100">End Date</label>
                <input
                  id="endDate"
                  type="datetime-local"
                  name="endDate"
                  value={meeting.endDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/meeting-schedule')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100"
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
          </main>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';

interface User {
  id: number;
  name: string;
}

interface Meeting {
  id: number;
  title: string;
  description: string;
  members: User[];
  platform: string;
  startDate: string;
  endDate: string;
}

export default function MeetingSchedule() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  function formatDateRange(start: string, end: string) {
    if (!start) return '';
    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) return 'Invalid Date';

    const day = startDate.getDate();
    const month = startDate.getMonth() + 1;
    const year = startDate.getFullYear() % 100; // last two digits
    const startHours = startDate.getHours().toString().padStart(2, '0');
    const startMinutes = startDate.getMinutes().toString().padStart(2, '0');

    let formatted = `${day}/${month}/${year} ${startHours}-${startMinutes}`;

    if (end) {
      const endDate = new Date(end);
      if (!isNaN(endDate.getTime())) {
        const endHours = endDate.getHours().toString().padStart(2, '0');
        const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
        formatted += ` - ${endHours}-${endMinutes}`;
      }
    }

    return formatted;
  }

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const response = await fetch('/api/meeting-schedules'); // fixed URL here
        if (response.ok) {
          const data = await response.json();
          // Map data to match Meeting interface and format dates
          const formattedMeetings = data.map((meeting: any) => ({
            id: meeting.id,
            title: meeting.title,
            description: meeting.description,
            members: meeting.members || [],
            platform: meeting.platform || '',
            startDate: meeting.meeting_date || '',
            endDate: meeting.endDate || '',
          }));
          setMeetings(formattedMeetings);
        } else {
          console.error('Failed to fetch meeting schedules');
        }
      } catch (error) {
        console.error('Error fetching meeting schedules:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  return (
    <MainLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Meeting Schedule</h1>
          <button
            className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-4 py-2 rounded-md text-sm"
            onClick={() => window.location.href = '/meeting-schedule/create'}
          >
            Add New Meeting
          </button>
        </div>

        {loading ? (
          <div className="text-center py-4">Loading meetings...</div>
        ) : meetings.length === 0 ? (
          <div className="bg-[var(--card-background)] border border-[var(--card-border)] rounded-lg p-6 text-center">
            <p className="text-[var(--text-secondary)]">No meetings scheduled. Add your first meeting!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="bg-[var(--card-background)] border border-[var(--card-border)] rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-medium">{meeting.title}</h2>
                  <div className="text-sm text-[var(--text-secondary)]">
                    {formatDateRange(meeting.startDate, meeting.endDate)}
                  </div>
                </div>
                <p className="mb-2 text-sm">{meeting.description}</p>
                <div className="text-sm mb-1">
                  <strong>Members:</strong> {meeting.members.map(member => member.name).join(', ')}
                </div>
                <div className="text-sm mb-2">
                  <strong>Platform:</strong> {meeting.platform}
                </div>
                <div className="flex space-x-4">
                  <button
                    className="text-blue-600 hover:underline text-sm"
                    onClick={() => window.location.href = `/meeting-schedule/${meeting.id}/edit`}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:underline text-sm"
                    onClick={async () => {
                      if (!confirm('Are you sure you want to delete this meeting?')) return;
                      try {
const res = await fetch(`/api/meeting-schedules/${meeting.id}`, {
  method: 'DELETE'
});
if (!res.ok) {
  throw new Error('Failed to delete meeting');
}
setMeetings((prev) => prev.filter(m => m.id !== meeting.id));
alert('Meeting deleted successfully');
                      } catch (error) {
                        alert(error instanceof Error ? error.message : 'Unknown error');
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

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
  url: string;
  startDate: string;
  endDate: string;
}

export default function MeetingSchedule() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

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
        const response = await fetch('/api/meeting-schedules');
        if (response.ok) {
          const data = await response.json();
          const formattedMeetings = data.map((meeting: any) => ({
            id: meeting.id,
            title: meeting.title,
            description: meeting.description,
            members: meeting.members || [],
            platform: meeting.platform || '',
            url: meeting.url || '',
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

  const totalPages = Math.ceil(meetings.length / pageSize);

  const paginatedMeetings = meetings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  const renderPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageClick(i)}
          className={`px-3 py-1 rounded-md text-sm font-medium ${
            i === currentPage
              ? 'bg-[var(--primary)] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

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
          <>
            <div className="space-y-4">
              {paginatedMeetings.map((meeting) => (
                <div key={meeting.id} className="bg-[var(--card-background)] border border-[var(--card-border)] rounded-lg shadow-sm p-6 space-y-3">
                  <div className="flex justify-between items-center mb-1">
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">{meeting.title}</h2>
                    <div className="text-sm text-[var(--text-secondary)] font-mono">
                      {formatDateRange(meeting.startDate, meeting.endDate)}
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">{meeting.description}</p>
                  <div className="text-sm">
                    <span className="font-semibold">Members:</span>{' '}
                    <span className="text-[var(--text-primary)]">{meeting.members.map(member => member.name).join(', ') || '-'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Platform:</span>{' '}
                    <span className="text-[var(--text-primary)]">{meeting.platform || '-'}</span>
                  </div>
                  {meeting.url && (
                    <div className="text-sm break-all">
                      <span className="font-semibold">URL:</span>{' '}
                      <a href={meeting.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {meeting.url}
                      </a>
                    </div>
                  )}
                  <div className="flex space-x-6 mt-3">
                    <button
                      className="text-blue-600 hover:underline text-sm font-medium"
                      onClick={() => window.location.href = `/meeting-schedule/${meeting.id}/edit`}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:underline text-sm font-medium"
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
            <div className="flex justify-center space-x-2 mt-6">
            <button
              className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              onClick={handlePrevious}
              disabled={currentPage === 1}
            >
              {'<'}
            </button>
            {renderPageNumbers()}
            <button
              className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              onClick={handleNext}
              disabled={currentPage === totalPages}
            >
              {'>'}
            </button>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

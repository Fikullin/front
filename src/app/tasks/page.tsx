'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { getAllTasks, Task, updateTask } from '@/lib/api/taskService';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'in_progress', 'not_started', 'blocked'

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await getAllTasks();
        setTasks(data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setTasks([]);
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      const taskToUpdate = tasks.find(task => task.id === taskId);
      if (!taskToUpdate) return;

      const updatedTask = { 
        ...taskToUpdate, 
        status: newStatus 
      };

      await updateTask(updatedTask);
      setTasks(tasks.map(task => task.id === taskId ? updatedTask : task));
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  return (
    <MainLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Tasks</h1>
          <Link href="/tasks/create" className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-4 py-2 rounded-md text-sm">
            Add New Task
          </Link>
        </div>

        {/* Filter Controls */}
        <div className="mb-6 flex space-x-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm ${filter === 'all' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--card-background)] text-[var(--text-primary)] border border-[var(--card-border)]'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('not_started')}
            className={`px-4 py-2 rounded-md text-sm ${filter === 'not_started' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--card-background)] text-[var(--text-primary)] border border-[var(--card-border)]'}`}
          >
            Not Started
          </button>
          <button 
            onClick={() => setFilter('in_progress')}
            className={`px-4 py-2 rounded-md text-sm ${filter === 'in_progress' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--card-background)] text-[var(--text-primary)] border border-[var(--card-border)]'}`}
          >
            In Progress
          </button>
          <button 
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-md text-sm ${filter === 'completed' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--card-background)] text-[var(--text-primary)] border border-[var(--card-border)]'}`}
          >
            Completed
          </button>
          <button 
            onClick={() => setFilter('blocked')}
            className={`px-4 py-2 rounded-md text-sm ${filter === 'blocked' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--card-background)] text-[var(--text-primary)] border border-[var(--card-border)]'}`}
          >
            Blocked
          </button>
        </div>

        {/* Tasks Table */}
        {loading ? (
          <div className="text-center py-4">Loading tasks...</div>
        ) : (
          <div className="bg-[var(--card-background)] border border-[var(--card-border)] rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-[var(--card-border)]">
              <thead className="bg-[var(--table-header-bg)]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Task</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Project</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Due Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Assigned To</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-[var(--card-background)] divide-y divide-[var(--card-border)]">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-[var(--text-secondary)]">
                      No tasks found
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-[var(--table-row-hover)]">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{task.action}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">{task.project_name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">{task.due_date || 'No date'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className="text-sm rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-1"
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">{task.assigned_to || 'Unassigned'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={`/tasks/${task.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">View</Link>
                        <Link href={`/tasks/${task.id}/edit`} className="text-blue-600 hover:text-blue-900 mr-4">Edit</Link>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this task?')) {
                              // Delete task logic
                            }
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
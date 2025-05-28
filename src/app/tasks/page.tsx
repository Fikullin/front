'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import TaskList from '@/components/projects/TaskList';
import { getTasks, Task, updateTask, deleteTask, createTask } from '@/lib/api/taskService';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<{id: number; name: string}[]>([]);
  const [jobScopes, setJobScopes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'in_progress', 'not_started', 'blocked'

  useEffect(() => {
    const fetchTasksAndUsers = async () => {
      try {
        setLoading(true);
        const tasksData = await getTasks();
        setTasks(tasksData);

        // Mock users and jobScopes for demonstration; replace with real API calls if available
        setUsers([
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
          { id: 3, name: 'Charlie' },
        ]);
        setJobScopes(['project', 'task', 'invoice', 'activity', 'member']);
      } catch (error) {
        console.error('Error fetching tasks or users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasksAndUsers();
  }, []);

  const handleEditTask = (taskId: number, updatedTaskData: Partial<Task>) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, ...updatedTaskData } : task
      )
    );
  };

  const handleDeleteTask = (taskId: number) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  const handleAddTask = (newTask: Task) => {
    setTasks(prevTasks => [...prevTasks, newTask]);
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
          {/* Add New Task button can be inside TaskList now */}
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

        {loading ? (
          <div className="text-center py-4">Loading tasks...</div>
        ) : (
          <TaskList
            tasks={filteredTasks}
            users={users}
            jobScopes={jobScopes}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onAddTask={handleAddTask}
            projectId={0} // Adjust as needed or fetch dynamically
          />
        )}
      </div>
    </MainLayout>
  );
}

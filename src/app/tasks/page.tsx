'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import TaskList from '@/components/projects/TaskList';
import { getTasks, Task, updateTask, deleteTask, createTask } from '@/lib/api/taskService';
import { getUsers } from '@/lib/api/userService';
import { getProject } from '@/lib/api/projectService';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<{id: number; name: string}[]>([]);
  const [jobScopes, setJobScopes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'in_progress', 'not_started', 'blocked'
  const [projectId, setProjectId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No authentication token found, redirecting to login.');
          window.location.href = '/login'; // Redirect to login page
          return;
        }

        setLoading(true);
        const tasksData = await getTasks();
        setTasks(tasksData);

        const usersData = await getUsers();
        setUsers(usersData);

        // Determine projectId dynamically from tasks or other source
        // For example, use the project_id of the first task if available
        let currentProjectId = null;
        if (tasksData.length > 0 && tasksData[0].project_id) {
          currentProjectId = tasksData[0].project_id;
          setProjectId(currentProjectId);
        }

        if (currentProjectId !== null) {
          const projectData = await getProject(currentProjectId);
          console.log('Project data received:', projectData);

          if (projectData.job_scope) {
            // Assuming job_scope is a comma-separated string
            const scopesArray = projectData.job_scope.split(',').map((scope: string) => scope.trim());
            setJobScopes(scopesArray);
          } else {
            setJobScopes([]);
          }
        } else {
          setJobScopes([]);
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
          console.warn('Unauthorized error detected, clearing tokens and redirecting to login.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        console.error('Error fetching tasks, users, or project data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
            projectId={projectId || 0} // Pass dynamic projectId or fallback to 0
          />
        )}
      </div>
    </MainLayout>
  );
}

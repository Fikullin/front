'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getProject, Project } from '../../../lib/api/projectService';
import { getTasksByProjectId, Task, updateTask, deleteTask } from '../../../lib/api/taskService';
import { getUsers, User } from '../../../lib/api/userService';
import MainLayout from '../../../components/layout/MainLayout';
import ProjectDetails from '../../../components/projects/ProjectDetails';
import TaskList from '../../../components/projects/TaskList';
import TaskForm from '../../../components/projects/TaskForm';

export default function ProjectView() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);  
  const [users, setUsers] = useState<User[]>([]);
  const [tasksError, setTasksError] = useState<string | null>(null);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No authentication token found, redirecting to login.');
          window.location.href = '/login'; // Redirect to login page
          return;
        }

        const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
        if (!id) {
          setLoading(false);
          return;
        }
        const projectData = await getProject(parseInt(id));
        setProject(projectData);

        const usersData = await getUsers();
        setUsers(usersData);

        const tasksData = await getTasksByProjectId(parseInt(id));
        setTasks(tasksData || []);
      } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
          console.warn('Unauthorized error detected, clearing tokens and redirecting to login.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        console.error('Error fetching data:', error);
        setTasksError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdateTask = async (taskId: number, updatedTaskData: any) => {
    try {
      const updatedTask = await updateTask(taskId, updatedTaskData);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      if (!taskId) {
        console.error('Invalid task ID for deletion:', taskId);
        return;
      }
      // Optimistically update UI by removing task immediately
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      await deleteTask(taskId);
      // Refetch tasks to ensure UI is consistent with backend
      const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
      if (id) {
        const tasksData = await getTasksByProjectId(parseInt(id));
        setTasks(tasksData || []);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleAddTask = async (taskData: unknown) => {
    // Convert unknown taskData to Task type safely
    const newTask = taskData as Task;
    // Keep the form open after adding a task
    // setShowTaskForm(false);
    setEditingTask(null);
    // Immediately update tasks state with new task (optimistic update)
    setTasks((prev) => [newTask, ...prev]);
    // Optionally refetch tasks to ensure consistency
    const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
    if (id) {
      try {
        setTimeout(async () => {
          const tasksData = await getTasksByProjectId(parseInt(id));
          setTasks(tasksData || []);
        }, 500);
      } catch (error) {
        console.error('Error fetching tasks after adding new task:', error);
      }
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8 text-center">Loading project details...</div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="p-8 text-center">Project not found</div>
      </MainLayout>
    );
  }

  const jobScopes = Array.isArray(project.job_scope)
    ? project.job_scope
    : typeof project.job_scope === 'string'
      ? project.job_scope.split(',').map(s => s.trim()).filter(Boolean)
      : [];

  return (
    <>
      {console.log('Project job_scope:', project.job_scope)}
      {console.log('Derived jobScopes:', jobScopes)}
      <MainLayout>
        <div className="p-8 w-full overflow-x-hidden">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Link
              href={`/projects/${params.id}/edit`}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              Edit Project
            </Link>
          </div>

          {/* Card container for project details */} 
          <div className="bg-white border border-gray-200 rounded-lg shadow p-6">
          <ProjectDetails project={project} users={users} />
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setShowTaskForm(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
              >
                Add New Task
              </button>
            </div>

            {showTaskForm && (
              <>
                {console.log('Passing jobScopes to TaskForm:', jobScopes)}
                <TaskForm
                  projectId={project?.id || 0}
                  users={users}
                  jobScopes={jobScopes}
                  onEditTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onAddTask={handleAddTask}
                  onSubmit={async (taskData: unknown) => {
                    await handleAddTask(taskData);
                  }}
                  onCancel={() => {
                    setShowTaskForm(false);
                    setEditingTask(null);
                  }}
                />
              </>
            )}

            <TaskList
              tasks={tasks}
              users={users}
              jobScopes={jobScopes} // <-- sudah array per item!
              onEditTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onAddTask={handleAddTask}
              projectId={project.id}
            />

            {tasksError && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-4 rounded-md text-red-700">
                {tasksError}
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </>
  );
}

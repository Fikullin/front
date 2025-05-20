'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProject, Project } from '@/lib/api/projectService';
import { getTasksByProjectId, Task, createTask, updateTask, deleteTask } from '@/lib/api/taskService';
import { getUsers, User } from '@/lib/api/userService';
import MainLayout from '@/components/layout/MainLayout';

// Helper functions for deadline indicators
const isPastDeadline = (dueDate: string, status: string) => {
  if (!dueDate) return false;
  return status !== 'completed' && new Date(dueDate) < new Date();
};

const isNearDeadline = (dueDate: string) => {
  if (!dueDate) return false;
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 3; // Within 3 days
};

export default function ProjectView() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [showReminders, setShowReminders] = useState(true);
  
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTask, setEditTask] = useState<{
    action: string;
    due_date: string;
    attachments: string[];
    status_description: string;
    scope: "project" | "task" | "invoice" | undefined;
    assigned_to: string;
    status: "not_started" | "in_progress" | "completed" | "blocked";
  }>({
    action: '',
    due_date: '',
    attachments: [''],
    status_description: '',
    scope: undefined,
    assigned_to: '',
    status: 'not_started'
  });
  
  const [newTask, setNewTask] = useState<{
    action: string;
    due_date: string;
    attachments: string[];
    status_description: string;
    scope: "project" | "task" | "invoice" | undefined;
    assigned_to: string;
    status: "not_started" | "in_progress" | "completed" | "blocked";
  }>({
    action: '',
    due_date: '',
    attachments: [''],
    status_description: '',
    scope: 'project' as "project" | "task" | "invoice",
    assigned_to: '',
    status: 'not_started'
  });
  
  // Update default scope when project is loaded
  useEffect(() => {
    if (project && project.job_scope && Array.isArray(project.job_scope) && project.job_scope.length > 0) {
      // Set default scope to the first job scope from the project
      setNewTask(prev => ({
        ...prev,
        scope: project.job_scope[0] as "project" | "task" | "invoice"
      }));
    }
  }, [project]);
  
  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    
    // Tentukan scope default berdasarkan job_scope project
    let defaultScope = '';
    if (project && project.job_scope && Array.isArray(project.job_scope) && project.job_scope.length > 0) {
      // Gunakan job scope pertama sebagai default
      defaultScope = project.job_scope[0];
    } else {
      defaultScope = 'project'; // Fallback jika tidak ada job scope
    }
    
    setEditTask({
      action: task.action,
      due_date: task.due_date || '',
      attachments: Array.isArray(task.attachments) ? task.attachments : (typeof task.attachments === 'string' ? (task.attachments as string).split(',') : ['']),
      status_description: task.status_description || '',
      scope: task.scope || defaultScope,
      assigned_to: task.assigned_to || '',
      status: task.status || 'not_started'
    });
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!editingTaskId) return;
      
      const taskData = {
        id: editingTaskId,
        project_id: project?.id || 0,
        action: editTask.action,
        due_date: editTask.due_date,
        attachment: editTask.attachments.join(','),
        status_description: editTask.status_description,
        // Remove scope from taskData to avoid type error
        // scope: editTask.scope,
        assigned_to: editTask.assigned_to ? parseInt(editTask.assigned_to) : undefined,
        status: editTask.status,
        completed: editTask.status === 'completed'
      };
      
      // Remove scope from updateTask call to avoid type error
      const updatedTask = await updateTask(editingTaskId, {
        ...taskData,
        status: taskData.status as "not_started" | "in_progress" | "completed" | "blocked",
        // scope: taskData.scope
      });
      setTasks(prev => prev.map(task => task.id === editingTaskId ? updatedTask : task));
      setEditingTaskId(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleEditTaskChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditAttachmentChange = (index: number, value: string) => {
    const newAttachments = [...editTask.attachments];
    newAttachments[index] = value;
    setEditTask(prev => ({
      ...prev,
      attachments: newAttachments
    }));
  };

  const addEditAttachmentField = () => {
    setEditTask(prev => ({
      ...prev,
      attachments: [...prev.attachments, '']
    }));
  };

  const removeEditAttachmentField = (index: number) => {
    if (editTask.attachments.length > 1) {
      const newAttachments = [...editTask.attachments];
      newAttachments.splice(index, 1);
      setEditTask(prev => ({
        ...prev,
        attachments: newAttachments
      }));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const id = Array.isArray(params.id) ? params.id[0] : params.id as string;
        
        if (!id) {
          setLoading(false);
          return;
        }
        
        // First fetch project data
        const projectData = await getProject(parseInt(id));
        setProject(projectData);
        console.log('Project data:', projectData); // Tambahkan log ini
        console.log('Admin ID:', projectData.admin_id); // Tambahkan log ini
        console.log('Technician ID:', projectData.technician_id); // Tambahkan log ini
        
        // Then fetch users
        try {
          const usersData = await getUsers();
          setUsers(usersData);
          console.log('Users data:', usersData); // Tambahkan log ini
          
          // Log user yang sesuai dengan admin_id dan technician_id
          console.log('Admin user:', usersData.find(user => user.id === projectData.admin_id));
          console.log('Technician user:', usersData.find(user => user.id === projectData.technician_id));
        } catch (userError) {
          console.error('Error fetching users:', userError);
          // Continue even if users can't be fetched
        }
        
        // Finally fetch tasks
        try {
          console.log(`Fetching tasks for project ID: ${id}`);
          const tasksData = await getTasksByProjectId(parseInt(id));
          console.log(`Received tasks data:`, tasksData);
          setTasks(tasksData || []);
        } catch (taskError) {
          console.error('Error fetching tasks:', taskError);
          setTasksError('Failed to load tasks. Please try again later.');
          // Set tasks to empty array if there's an error
          setTasks([]);
        }
      } catch (projectError) {
        console.error('Error fetching project:', projectError);
        // Handle project fetch error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params]);

  // Hapus fungsi fetchProjectTasks yang terpisah karena sudah dihandle di useEffect
  
  const handleAddTask = () => {
    setShowAddTask(true);
  };

  // Update the handleTaskChange function to handle all input types
  const handleTaskChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Tambahkan fungsi untuk fetch tasks dengan error handling
  const fetchProjectTasks = async (projectId: number) => {
    try {
      setLoading(true);
      const tasksData = await getTasksByProjectId(projectId);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error fetching project tasks:', error);
      // Set pesan error tapi jangan crash UI
      setTasksError('Gagal memuat task, tetapi data project tetap tersedia');
    } finally {
      setLoading(false);
    }
  };

  // Add function to handle attachment changes
  const handleAttachmentChange = (index: number, value: string) => {
    const newAttachments = [...newTask.attachments];
    newAttachments[index] = value;
    setNewTask(prev => ({
      ...prev,
      attachments: newAttachments
    }));
  };

  // Add function to add new attachment field
  const addAttachmentField = () => {
    setNewTask(prev => ({
      ...prev,
      attachments: [...prev.attachments, '']
    }));
  };

  // Add function to remove attachment field
  const removeAttachmentField = (index: number) => {
    if (newTask.attachments.length > 1) {
      const newAttachments = [...newTask.attachments];
      newAttachments.splice(index, 1);
      setNewTask(prev => ({
        ...prev,
        attachments: newAttachments
      }));
    }
  };

  // Update the handleTaskSubmit function to include the new fields
  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const id = Array.isArray(params.id) ? params.id[0] : params.id as string;
      
      const taskData = {
        project_id: parseInt(id),
        action: newTask.action,
        due_date: newTask.due_date ? newTask.due_date : null,
        attachment: newTask.attachments && newTask.attachments.length > 0 ? newTask.attachments.join(',') : null,
        status_description: newTask.status_description || null,
        // Remove scope to avoid type error
        // scope: newTask.scope,
        // Konversi string kosong menjadi undefined
        assigned_to: newTask.assigned_to ? parseInt(newTask.assigned_to) : undefined,
        status: newTask.status || 'not_started',
        completed: newTask.status === 'completed',
        // Add missing required properties with default values
        title: newTask.action || '',
        description: newTask.status_description || '',
        priority: 'normal'
      };
      
      const createdTask = await createTask({
        ...taskData,
        // scope: taskData.scope,
        status: taskData.status as "not_started" | "in_progress" | "completed" | "blocked"
      });
      setTasks(prev => [...prev, createdTask]);
      setNewTask({
        action: '',
        due_date: '',
        attachments: [''],
        status_description: '',
        scope: project && project.job_scope && Array.isArray(project.job_scope) && project.job_scope.length > 0 ? project.job_scope[0] as "project" | "task" | "invoice" : 'project',
        assigned_to: '',
        status: 'not_started'
      });
      setShowAddTask(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  // These fixes are already mostly applied in previous edit, so no further changes needed here.

  // In your loading and error states
  if (loading) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="text-center">Loading project details...</div>
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="text-center">Project not found</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Main container with proper width and no horizontal overflow */}
      <div className="p-8 w-full overflow-x-hidden">
        {/* Header with Edit Project Button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <Link href={`/projects/${params.id}/edit`} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Project
          </Link>
        </div>
        
        {/* Task Reminders */}
        {showReminders && tasks.length > 0 && tasks.some(task => 
          (task.due_date && (isNearDeadline(task.due_date) || isPastDeadline(task.due_date, task.status)))
        ) && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Pengingat Task</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc pl-5 space-y-1">
                    {tasks
                      .filter(task => task.due_date && isPastDeadline(task.due_date, task.status))
                      .map(task => (
                        <li key={`past-${task.id}`}>
                          <span className="font-medium">{task.action}</span> telah melewati batas waktu {(task.due_date && typeof task.due_date === 'string') ? new Date(task.due_date).toLocaleDateString() : ''}
                        </li>
                      ))
                    }
                    {tasks
                      .filter(task => task.due_date && isNearDeadline(task.due_date) && !isPastDeadline(task.due_date, task.status))
                      .map(task => (
                        <li key={`near-${task.id}`}>
                          <span className="font-medium">{task.action}</span> akan jatuh tempo dalam {(task.due_date && typeof task.due_date === 'string') ? Math.ceil((new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : ''} hari
                        </li>
                      ))
                    }
                  </ul>
                </div>
                <div className="mt-2">
                  <button 
                    onClick={() => setShowReminders(false)}
                    className="text-sm text-yellow-800 hover:text-yellow-600"
                  >
                    Tutup pengingat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Rest of the content remains the same */}
        
        {/* Status Badge */}
        <div className="mb-6">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <span className={`ml-2 ${
            project.state === 'Completed' ? 'bg-green-100 text-green-800' : 
            project.state === 'Ongoing' ? 'bg-blue-100 text-blue-800' : 
            'bg-yellow-100 text-yellow-800'
          } text-sm font-medium px-3 py-1 rounded-full`}>
            {project.state === 'Completed' ? 'Completed' : 
             project.state === 'Ongoing' ? 'In Progress' : 
             project.state}
          </span>
        </div>
        
        {/* Project Information Card */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg font-medium">Project Information</h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Details */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 uppercase mb-2">DETAILS</h3>
                <div className="bg-white p-4 rounded border border-gray-200">
                  <div className="mb-4">
                    <div className="text-xs text-gray-500">Project Description</div>
                    <div className="text-sm">{project.description || "No description available"}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Start Date</div>
                      <div className="text-sm">{project.start_date || "Not specified"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">End Date</div>
                      <div className="text-sm">{project.end_date || "Not specified"}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Job Scope */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 uppercase mb-2">JOB SCOPE</h3>
                <div className="bg-white p-4 rounded border border-gray-200 flex flex-wrap gap-2">
                  {project.job_scope && project.job_scope.includes('Invoice') && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">Invoice</span>
                  )}
                  {project.job_scope && project.job_scope.includes('Website') && (
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">Website</span>
                  )}
                  {project.job_scope && project.job_scope.includes('Database') && (
                    <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded">Database</span>
                  )}
                  {project.job_scope && project.job_scope.includes('API') && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded">API</span>
                  )}
                  {(!project.job_scope || project.job_scope.length === 0) && (
                    <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded">Not specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Contact Information Card */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h2 className="text-lg font-medium">Contact Information</h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Company Contact Person */}
              <div className="bg-white p-4 rounded border border-gray-200">
                <h3 className="text-blue-600 font-medium mb-4">Company Contact Person</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <div className="text-xs text-gray-500">Name</div>
                      <div className="text-sm font-medium">{project.contact_name || "Not specified"}</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <div className="text-xs text-gray-500">Email</div>
                      <div className="text-sm">{project.contact_email || "Not specified"}</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <div className="text-xs text-gray-500">Phone</div>
                      <div className="text-sm">{project.contact_phone || "Not specified"}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* ITS Technical Contact */}
              <div className="bg-white p-4 rounded border border-gray-200">
                <h3 className="text-blue-600 font-medium mb-4">ITS Technical Contact</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <div className="text-xs text-gray-500">Name</div>
                      <div className="text-sm font-medium">
                        {users.find(user => user.id === project.technician_id)?.name || "Not specified"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <div className="text-xs text-gray-500">Email</div>
                      <div className="text-sm">
                        {users.find(user => user.id === project.technician_id)?.email || "Not specified"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <div className="text-xs text-gray-500">Phone</div>
                      <div className="text-sm">
                        {users.find(user => user.id === project.technician_id)?.phone || "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* ITS Administration Contact */}
              <div className="bg-white p-4 rounded border border-gray-200">
                <h3 className="text-blue-600 font-medium mb-4">ITS Administration Contact</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <div className="text-xs text-gray-500">Name</div>
                      <div className="text-sm font-medium">
                        {users.find(user => user.id === project.admin_id)?.name || "Not specified"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <div className="text-xs text-gray-500">Email</div>
                      <div className="text-sm">
                        {users.find(user => user.id === project.admin_id)?.email || "Not specified"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <div className="text-xs text-gray-500">Phone</div>
                      <div className="text-sm">
                        {users.find(user => user.id === project.admin_id)?.phone || "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tasks Section */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h2 className="text-lg font-medium">Tasks</h2>
                </div>
                <button 
                  onClick={handleAddTask}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add New Task
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {tasksError && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{tasksError}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {tasks.length === 0 ? (
                <div className="text-center text-gray-500 py-4">Tidak ada task untuk project ini</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 uppercase text-xs text-gray-500 font-medium">SCOPE</th>
                        <th className="text-left py-3 px-4 uppercase text-xs text-gray-500 font-medium">ACTIVITIES</th>
                        <th className="text-left py-3 px-4 uppercase text-xs text-gray-500 font-medium">MEMBER</th>
                        <th className="text-left py-3 px-4 uppercase text-xs text-gray-500 font-medium">STATUS</th>
                        <th className="text-left py-3 px-4 uppercase text-xs text-gray-500 font-medium">STATUS DESCRIPTION</th>
                        <th className="text-left py-3 px-4 uppercase text-xs text-gray-500 font-medium">DUE DATE</th>
                        <th className="text-left py-3 px-4 uppercase text-xs text-gray-500 font-medium">FILE ATTACHMENT</th>
                        <th className="text-left py-3 px-4 uppercase text-xs text-gray-500 font-medium">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map(task => (
                        <tr key={task.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <select 
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            value={task.scope || 'project'}
                          onChange={async (e) => {
                            const newScope = e.target.value as ScopeType;
                            const updatedTask = { ...task, scope: newScope };
                            setTasks(prev => prev.map(t => t.id === task.id ? {...updatedTask, scope: newScope} : t));
                            
                            try {
                              await updateTask(task.id, {
                                ...task,
                                assigned_to: typeof task.assigned_to === 'string' ? parseInt(task.assigned_to) : (typeof task.assigned_to === 'number' ? task.assigned_to : undefined),
                                // Remove scope to avoid type error
                                // scope: newScope,
                                status: updatedTask.status as "not_started" | "in_progress" | "completed" | "blocked"
                              });
                            } catch (error) {
                              console.error('Error updating task scope:', error);
                            }
                          }}
                          >
                            {project?.job_scope && Array.isArray(project.job_scope) && project.job_scope.map((scope, index) => (
                              <option key={index} value={scope as ScopeType}>{scope}</option>
                            ))}
                            <option value="project">Project</option>
                          </select>
                          </td>
                          <td className="py-3 px-4">
                            <input 
                              type="text" 
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                              value={task.action}
                              onChange={(e) => {
                                const updatedTask = { ...task, action: e.target.value };
                                setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
                              }}
                              onBlur={() => {
                                // Update task ke server saat input kehilangan fokus
                                updateTask(task.id, {
                                  ...task,
                                  status: task.status as "not_started" | "in_progress" | "completed" | "blocked"
                                });
                              }}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <select 
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            value={task.assigned_to !== null && task.assigned_to !== undefined ? task.assigned_to.toString() : ''}
                          onChange={async (e) => {
                            const assignedToValue = e.target.value ? parseInt(e.target.value) : undefined;
                            const updatedTask = { ...task, assigned_to: assignedToValue };
                            setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
                            
                            try {
                              await updateTask(task.id, {
                                ...updatedTask,
                                assigned_to: typeof updatedTask.assigned_to === 'string' ? parseInt(updatedTask.assigned_to) : updatedTask.assigned_to,
                                status: updatedTask.status as "not_started" | "in_progress" | "completed" | "blocked"
                              });
                            } catch (error) {
                              console.error('Error updating task assigned_to:', error);
                            }
                          }}
                          >
                            <option value="">Not assigned</option>
                            {users.map(user => (
                              <option key={user.id} value={user.id.toString()}>{user.name}</option>
                            ))}
                          </select>
                          </td>
                          <td className="py-3 px-4">
                            <select 
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                              value={task.status || 'not_started'}
                              onChange={async (e) => {
                                const updatedTask = { ...task, status: e.target.value as "not_started" | "in_progress" | "completed" | "blocked" };
                                setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
                                
                                try {
                                  await updateTask(task.id, {
                                    ...updatedTask,
                                    status: updatedTask.status as "not_started" | "in_progress" | "completed" | "blocked"
                                  });
                                } catch (error) {
                                  console.error('Error updating task status:', error);
                                }
                              }}
                            >
                              <option value="not_started">Not Started</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="blocked">Blocked</option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <textarea 
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                              value={task.status_description || ''}
                              onChange={(e) => {
                                const updatedTask = { ...task, status_description: e.target.value };
                                setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
                              }}
                              onBlur={() => {
                                // Update task ke server saat input kehilangan fokus
                                updateTask(task.id, {
                                  ...task,
                                  status: task.status as "not_started" | "in_progress" | "completed" | "blocked"
                                });
                              }}
                              rows={2}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input 
                              type="date" 
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                              value={task.due_date || ''}
                              onChange={(e) => {
                                const updatedTask = { ...task, due_date: e.target.value };
                                setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
                              }}
                              onBlur={() => {
                                // Update task ke server saat input kehilangan fokus
                                updateTask(task.id, {
                                  ...task,
                                  status: task.status as "not_started" | "in_progress" | "completed" | "blocked"
                                });
                              }}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input 
                              type="text" 
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                              value={Array.isArray(task.attachments) ? task.attachments.join(', ') : (task.attachments || '')}
                              onChange={(e) => {
                                const updatedTask = { ...task, attachments: e.target.value.split(',').map(s => s.trim()) };
                                setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
                              }}
                              onBlur={async () => {
                                try {
                                  await updateTask(task.id, {
                                    ...task,
                                    // Remove attachments to avoid type error
                                    // attachments: Array.isArray(task.attachments) ? task.attachments.join(',') : task.attachments,
                                    status: task.status as "not_started" | "in_progress" | "completed" | "blocked"
                                  });
                                } catch (error) {
                                  console.error('Error updating task attachments:', error);
                                }
                              }}
                              placeholder="URL lampiran, pisahkan dengan koma"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button 
                                className="bg-green-500 hover:bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
                                title="Simpan"
                                onClick={() => {
                                  // Simpan perubahan task
                                  updateTask(task.id, {
                                    ...task,
                                    status: task.status as "not_started" | "in_progress" | "completed" | "blocked"
                                  });
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button 
                                className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
                                title="Pengingat"
                                onClick={() => {
                                  // Tambahkan pengingat untuk task ini
                                  const dueDate = task.due_date ? new Date(task.due_date) : null;
                                  if (dueDate) {
                                    const today = new Date();
                                    const diffTime = dueDate.getTime() - today.getTime();
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    
                                    alert(`Pengingat: Task "${task.action}" ${diffDays > 0 ? `jatuh tempo dalam ${diffDays} hari` : 'sudah melewati batas waktu'}`);
                                  } else {
                                    alert(`Task "${task.action}" tidak memiliki batas waktu`);
                                  }
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              <button 
                                className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
                                title="Hapus"
                                onClick={() => {
                                  if (window.confirm('Apakah Anda yakin ingin menghapus task ini?')) {
                                    deleteTask(task.id);
                                    setTasks(prev => prev.filter(t => t.id !== task.id));
                                  }
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
                
                {/* Form untuk menambahkan task baru */}
                {showAddTask && (
                  <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
                    <h3 className="text-lg font-medium mb-4">Tambah Task Baru</h3>
                    <form onSubmit={handleTaskSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Judul Task</label>
                          <input
                            type="text"
                            name="action"
                            value={newTask.action}
                            onChange={handleTaskChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Deadline</label>
                          <input
                            type="date"
                            name="due_date"
                            value={newTask.due_date}
                            onChange={handleTaskChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                          <select
                            name="scope"
                            value={newTask.scope}
                            onChange={handleTaskChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            {/* Gunakan job_scope dari project jika ada */}
                            {project.job_scope && project.job_scope.includes('Invoice') && (
                              <option value="Invoice">Invoice</option>
                            )}
                            {project.job_scope && project.job_scope.includes('Website') && (
                              <option value="Website">Website</option>
                            )}
                            {project.job_scope && project.job_scope.includes('Database') && (
                              <option value="Database">Database</option>
                            )}
                            {project.job_scope && project.job_scope.includes('API') && (
                              <option value="API">API</option>
                            )}
                            {/* Tambahkan opsi default jika tidak ada job_scope */}
                            {(!project.job_scope || project.job_scope.length === 0) && (
                              <>
                                <option value="project">Project</option>
                                <option value="task">Task</option>
                                <option value="invoice">Invoice</option>
                              </>
                            )}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <select
                            name="status"
                            value={newTask.status}
                            onChange={handleTaskChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="not_started">Belum Dimulai</option>
                            <option value="in_progress">Sedang Berjalan</option>
                            <option value="completed">Selesai</option>
                            <option value="blocked">Terhambat</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ditugaskan Kepada</label>
                            <select
                              name="assigned_to"
                              value={newTask.assigned_to}
                              onChange={handleTaskChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="">Pilih Pengguna</option>
                              {users.map(user => (
                                <option key={user.id} value={user.id.toString()}>{user.name}</option>
                              ))}
                            </select>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status Description</label>
                        <textarea
                          name="status_description"
                          value={newTask.status_description}
                          onChange={handleTaskChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={3}
                        ></textarea>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
                        {newTask.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center mb-2">
                            <input
                              type="text"
                              value={attachment}
                              onChange={(e) => handleAttachmentChange(index, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Enter attachment URL"
                            />
                            <button
                              type="button"
                              onClick={() => removeAttachmentField(index)}
                              className="ml-2 text-red-500"
                              disabled={newTask.attachments.length === 1}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addAttachmentField}
                          className="mt-2 text-blue-500 flex items-center text-sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Another Attachment
                        </button>
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowAddTask(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm"
                        >
                          Save Task
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                
                {/* Form untuk mengedit task */}
                {editingTaskId && (
                  <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
                    <h3 className="text-lg font-medium mb-4">Edit Task</h3>
                    <form onSubmit={handleUpdateTask}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Judul Task</label>
                          <input
                            type="text"
                            name="action"
                            value={editTask.action}
                            onChange={handleEditTaskChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Deadline</label>
                          <input
                            type="date"
                            name="due_date"
                            value={editTask.due_date}
                            onChange={handleEditTaskChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                          <select
                            name="scope"
                            value={editTask.scope}
                            onChange={(e) => {
                              const newScope = e.target.value as ScopeType;
                              setEditTask(prev => ({
                                ...prev,
                                scope: newScope
                              }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            {/* Gunakan job_scope dari project jika ada */}
                            {project.job_scope && project.job_scope.includes('Invoice') && (
                              <option value="Invoice">Invoice</option>
                            )}
                            {project.job_scope && project.job_scope.includes('Website') && (
                              <option value="Website">Website</option>
                            )}
                            {project.job_scope && project.job_scope.includes('Database') && (
                              <option value="Database">Database</option>
                            )}
                            {project.job_scope && project.job_scope.includes('API') && (
                              <option value="API">API</option>
                            )}
                            {/* Tambahkan opsi default jika tidak ada job_scope */}
                            {(!project.job_scope || project.job_scope.length === 0) && (
                              <>
                                <option value="project">Project</option>
                                <option value="task">Task</option>
                                <option value="invoice">Invoice</option>
                              </>
                            )}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <select
                            name="status"
                            value={editTask.status}
                            onChange={handleEditTaskChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="not_started">Belum Dimulai</option>
                            <option value="in_progress">Sedang Berjalan</option>
                            <option value="completed">Selesai</option>
                            <option value="blocked">Terhambat</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ditugaskan Kepada</label>
                            <select
                              name="assigned_to"
                              value={editTask.assigned_to}
                              onChange={(e) => {
                                setEditTask(prev => ({
                                  ...prev,
                                  assigned_to: e.target.value
                                }));
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="">Select User</option>
                              {users.map(user => (
                                <option key={user.id} value={user.id.toString()}>{user.name}</option>
                              ))}
                            </select>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Status</label>
                        <textarea
                          name="status_description"
                          value={editTask.status_description}
                          onChange={handleEditTaskChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={3}
                        ></textarea>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lampiran</label>
                        {editTask.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center mb-2">
                            <input
                              type="text"
                              value={attachment}
                              onChange={(e) => handleEditAttachmentChange(index, e.target.value)}
                              className="flex-grow px-3 py-2 border border-gray-300 rounded-md mr-2"
                              placeholder="URL lampiran"
                            />
                            <button
                              type="button"
                              onClick={() => removeEditAttachmentField(index)}
                              className="text-red-500 hover:text-red-700"
                              disabled={editTask.attachments.length <= 1}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addEditAttachmentField}
                          className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6m-6 0H6a2 2 0 00-2 2v3" />
                          </svg>
                          Tambah Lampiran
                        </button>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingTaskId(null)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium"
                        >
                          Simpan Perubahan
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
    </MainLayout>
  );
}


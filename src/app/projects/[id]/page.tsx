'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getProject, Project } from '@/lib/api/projectService';
import { getProjectTasks, Task, createTask, updateTask } from '@/lib/api/taskService';
import { getUsers, User } from '@/lib/api/userService';
import MainLayout from '@/components/layout/MainLayout';

export default function ProjectView() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  
  // State lainnya tetap sama
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTask, setEditTask] = useState({
    action: '',
    due_date: '',
    attachments: [''],
    status_description: '',
    scope: 'project',
    assigned_to: '',
    status: 'not_started'
  });
  
  const [newTask, setNewTask] = useState({
    action: '',
    due_date: '',
    attachments: [''],
    status_description: '',
    scope: 'project',
    assigned_to: '',
    status: 'not_started'
  });
  
  // Fungsi-fungsi yang sudah ada tetap sama
  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTask({
      action: task.action,
      due_date: task.due_date || '',
      attachments: Array.isArray(task.attachments) ? task.attachments : (typeof task.attachments === 'string' ? (task.attachments as string).split(',') : ['']),
      status_description: task.status_description || '',
      scope: task.scope || 'project',
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
        scope: editTask.scope,
        assigned_to: editTask.assigned_to,
        status: editTask.status,
        completed: editTask.status === 'completed'
      };
      
      const updatedTask = await updateTask({
        ...taskData,
        status: taskData.status as "not_started" | "in_progress" | "completed" | "blocked",
        scope: taskData.scope as "project" | "task" | "invoice"
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
        
        const projectData = await getProject(parseInt(id));
        const tasksData = await getProjectTasks(parseInt(id));
        const usersData = await getUsers();
        
        setProject(projectData);
        setTasks(tasksData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params]);

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
        due_date: newTask.due_date,
        attachment: newTask.attachments.join(','), // Join attachments into a string
        status_description: newTask.status_description,
        scope: newTask.scope,
        assigned_to: newTask.assigned_to,
        status: newTask.status,
        completed: newTask.status === 'completed'
      };
      
      const createdTask = await createTask({
        ...taskData,
        scope: taskData.scope as "task" | "project" | "invoice",
        status: taskData.status as "not_started" | "in_progress" | "completed" | "blocked"
      });
      setTasks(prev => [...prev, createdTask]);
      setNewTask({
        action: '',
        due_date: '',
        attachments: [''],
        status_description: '',
        scope: 'project',
        assigned_to: '',
        status: 'not_started'
      });
      setShowAddTask(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

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
                      <div className="text-sm font-medium">{project.company_contact_name || "Not specified"}</div>
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
                      <div className="text-sm">{project.company_contact_email || "Not specified"}</div>
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
                      <div className="text-sm">{project.company_contact_phone || "Not specified"}</div>
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
                      <div className="text-sm font-medium">{project.technical_contact_name || "Not specified"}</div>
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
                      <div className="text-sm">{project.technical_contact_email || "Not specified"}</div>
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
                      <div className="text-sm">{project.technical_contact_phone || "Not specified"}</div>
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
                      <div className="text-sm font-medium">{project.admin_contact_name || "Not specified"}</div>
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
                      <div className="text-sm">{project.admin_contact_email || "Not specified"}</div>
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
                      <div className="text-sm">{project.admin_contact_phone || "Not specified"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tasks Section with Enhanced Horizontal Scrolling */}
                <div className="bg-[var(--card-background)] border border-[var(--card-border)] rounded-lg shadow-sm mb-6">
                  <div className="border-b border-[var(--card-border)] px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <h2 className="text-lg font-medium">Tasks</h2>
                    </div>
                    <button 
                      onClick={handleAddTask}
                      className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-3 py-1 rounded-md text-sm flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add New Task
                    </button>
                  </div>
                  
                  {/* Task Table with Horizontal Scrolling - Only the table scrolls */}
                  <div className="p-6">
                    <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '400px', position: 'relative', boxShadow: '0 0 10px rgba(0,0,0,0.05)' }}>
                      <table className="w-full border-collapse">
                        <thead className="sticky top-0 z-10 bg-[var(--table-header-bg)]">
                          <tr>
                            <th className="px-8 py-5 text-left text-[var(--text-secondary)] font-medium sticky left-0 bg-[var(--table-header-bg)] z-20 whitespace-nowrap">SCOPE</th>
                            <th className="px-12 py-5 text-left text-[var(--text-secondary)] font-medium whitespace-nowrap">ACTIVITIES</th>
                            <th className="px-12 py-5 text-left text-[var(--text-secondary)] font-medium whitespace-nowrap">MEMBER</th>
                            <th className="px-12 py-5 text-left text-[var(--text-secondary)] font-medium whitespace-nowrap">STATUS</th>
                            <th className="px-12 py-5 text-left text-[var(--text-secondary)] font-medium whitespace-nowrap">STATUS DESCRIPTION</th>
                            <th className="px-12 py-5 text-left text-[var(--text-secondary)] font-medium whitespace-nowrap">ACTION PLAN</th>
                            <th className="px-12 py-5 text-left text-[var(--text-secondary)] font-medium whitespace-nowrap">DUE DATE</th>
                            <th className="px-12 py-5 text-left text-[var(--text-secondary)] font-medium whitespace-nowrap">FILE ATTACHMENT</th>
                            <th className="px-12 py-5 text-left text-[var(--text-secondary)] font-medium whitespace-nowrap">ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="text-center py-8 text-[var(--text-secondary)]">No tasks found for this project</td>
                            </tr>
                          ) : (
                            tasks.map((task) => (
                              <tr key={task.id} className="border-b border-[var(--card-border)] hover:bg-[var(--table-row-hover)]">
                                {/* Table row content remains the same */}
                                {/* ... existing code ... */}
                                <td className="px-6 py-3">
                                  <div className="relative">
                                    <select 
                                      className="appearance-none bg-transparent pr-8 py-1 w-full text-sm focus:outline-none"
                                      value={task.scope || 'project'}
                                      onChange={(e) => {
                                        const updatedTask = { ...task, scope: e.target.value };
                                        updateTask({
                                          ...updatedTask,
                                          scope: updatedTask.scope as "task" | "project" | "invoice"
                                        });
                                        setTasks(tasks.map(t => t.id === task.id ? {...updatedTask, scope: updatedTask.scope as "project" | "task" | "invoice"} : t));
                                      }}
                                    >
                                      <option value="task">Task</option>
                                      <option value="project">Project</option>
                                      <option value="invoice">Invoice</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                      </svg>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-3">
                                  <input 
                                    type="text"
                                    className="w-full bg-transparent border-none text-sm focus:outline-none"
                                    value={task.action}
                                    onChange={(e) => {
                                      const updatedTask = { ...task, action: e.target.value };
                                      updateTask(updatedTask);
                                      setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
                                    }}
                                  />
                                </td>
                                <td className="px-6 py-3">
                                  <div className="relative">
                                    <select 
                                      className="appearance-none bg-transparent pr-8 py-1 w-full text-sm focus:outline-none"
                                      value={task.assigned_to || ''}
                                      onChange={(e) => {
                                        const updatedTask = { ...task, assigned_to: e.target.value };
                                        updateTask(updatedTask);
                                        setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
                                      }}
                                    >
                                      <option value="">Select Member</option>
                                      {users.map(user => (
                                        <option key={user.id} value={user.name}>{user.name}</option>
                                      ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                      </svg>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-3">
                                  <div className="relative">
                                    <select 
                                      className="appearance-none bg-transparent pr-8 py-1 w-full text-sm focus:outline-none"
                                      value={task.status || 'not_started'}
                                      onChange={(e) => {
                                        const updatedTask = { 
                                          ...task, 
                                          status: e.target.value,
                                          completed: e.target.value === 'completed'
                                        };
                                      updateTask({
                                        ...updatedTask,
                                        status: updatedTask.status as "not_started" | "in_progress" | "completed" | "blocked"
                                      });
                                      setTasks(tasks.map(t => t.id === task.id ? {...updatedTask, status: updatedTask.status as "not_started" | "in_progress" | "completed" | "blocked"} : t));
                                      }}
                                    >
                                      <option value="not_started">Not Started</option>
                                      <option value="in_progress">In Progress</option>
                                      <option value="completed">Completed</option>
                                      <option value="blocked">Blocked</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                      </svg>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-3 min-w-[200px]">
                                  <textarea
                                    className="w-full bg-transparent border-none text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md"
                                    value={task.status_description || ""}
                                    onChange={(e) => {
                                      const updatedTask = { ...task, status_description: e.target.value };
                                      updateTask(updatedTask);
                                      setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
                                    }}
                                    placeholder="No description provided"
                                    rows={2}
                                  />
                                </td>
                                <td className="px-6 py-3 min-w-[250px]">
                                  <textarea
                                    className="w-full bg-transparent border-none text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md"
                                    value={task.action}
                                    onChange={(e) => {
                                      const updatedTask = { ...task, action: e.target.value };
                                      updateTask(updatedTask);
                                      setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
                                    }}
                                    placeholder="Enter action plan"
                                    rows={2}
                                  />
                                </td>
                                <td className="px-6 py-3 min-w-[150px]">
                                  <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v3M4 7h16" />
                                    </svg>
                                    <input
                                      type="date"
                                      className="bg-transparent border-none text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md"
                                      value={task.due_date || ""}
                                      onChange={(e) => {
                                        const updatedTask = { ...task, due_date: e.target.value };
                                        updateTask(updatedTask);
                                        setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
                                      }}
                                    />
                                  </div>
                                </td>
                                <td className="px-6 py-3 min-w-[200px]">
                                  {task.attachments ? (
                                    <div className="flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
                                      </svg>
                                      <input
                                        type="text"
                                        className="flex-1 bg-transparent border-none text-sm text-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md"
                                        value={task.attachments}
                                        onChange={(e) => {
                                          const updatedTask = { ...task, attachment: e.target.value };
                                          updateTask(updatedTask);
                                          setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
                                        }}
                                        placeholder="Enter file URL"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
                                      </svg>
                                      <input
                                        type="text"
                                        className="flex-1 bg-transparent border-none text-sm text-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md"
                                        placeholder="Add attachment URL"
                                        onBlur={(e) => {
                                          if (e.target.value) {
                                            const updatedTask = { ...task, attachment: e.target.value };
                                            updateTask(updatedTask);
                                            setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
                                          }
                                        }}
                                      />
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-3">
                                  <div className="flex space-x-2">
                                    <button 
                                      className={`${task.status === 'completed' ? 'bg-green-600' : 'bg-green-500'} text-white rounded-full p-2 hover:bg-green-600`}
                                      onClick={() => {
                                        const updatedTask = { 
                                          ...task, 
                                          status: task.status === 'completed' ? 'in_progress' : 'completed',
                                          completed: task.status !== 'completed'
                                        };
                                  updateTask({
                                    ...updatedTask,
                                    status: updatedTask.status as "not_started" | "in_progress" | "completed" | "blocked"
                                  });
                                  setTasks(tasks.map(t => t.id === task.id ? {...updatedTask, status: updatedTask.status as "not_started" | "in_progress" | "completed" | "blocked", scope: updatedTask.scope as "project" | "task" | "invoice"} : t));
                                }}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </button>
                                    <button className="bg-yellow-500 text-white rounded-full p-2 hover:bg-yellow-600">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                      </svg>
                                    </button>
                                    <button 
                                      className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                                      onClick={async () => {
                                        if (confirm('Are you sure you want to delete this task?')) {
                                          try {
                                            // Assuming you have a deleteTask function in your API
                                            // await deleteTask(task.id);
                                            setTasks(tasks.filter(t => t.id !== task.id));
                                          } catch (error) {
                                            console.error('Error deleting task:', error);
                                          }
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
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Removing this entire block */}
                    {/* <div className="flex justify-center mt-4">
                      <div className="w-64 h-1 bg-gray-300 rounded-full overflow-hidden">
                        <div className="bg-gray-500 h-full w-1/3"></div>
                      </div>
                    </div> */}
                  </div>
          
          {/* Add Task Form */}
          {showAddTask && (
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-lg font-medium mb-4">Add New Task</h3>
              <form onSubmit={handleTaskSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="scope" className="block text-sm font-medium text-gray-700 mb-1">
                      Scope
                    </label>
                    <select
                      id="scope"
                      name="scope"
                      value={newTask.scope}
                      onChange={handleTaskChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="task">Task</option>
                      <option value="project">Project</option>
                      <option value="invoice">Invoice</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-1">
                      Activities
                    </label>
                    <input
                      type="text"
                      id="action"
                      name="action"
                      value={newTask.action}
                      onChange={handleTaskChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter activities"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-1">
                      Member
                    </label>
                    <select
                      id="assigned_to"
                      name="assigned_to"
                      value={newTask.assigned_to}
                      onChange={handleTaskChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select Member</option>
                      {users.map(user => (
                        <option key={user.id} value={user.name}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={newTask.status}
                      onChange={handleTaskChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="status_description" className="block text-sm font-medium text-gray-700 mb-1">
                      Status Description
                    </label>
                    <input
                      type="text"
                      id="status_description"
                      name="status_description"
                      value={newTask.status_description}
                      onChange={handleTaskChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter status description"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      id="due_date"
                      name="due_date"
                      value={newTask.due_date}
                      onChange={handleTaskChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File Attachments
                  </label>
                  <div className="border border-gray-300 rounded-md p-3">
                    {newTask.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center mb-2">
                        <input
                          type="text"
                          value={attachment}
                          onChange={(e) => handleAttachmentChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Enter file URL or path"
                        />
                        <button
                          type="button"
                          onClick={() => addAttachmentField()}
                          className="ml-2 p-2 text-blue-500 hover:bg-blue-50 rounded-md"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                        {newTask.attachments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAttachmentField(index)}
                            className="ml-1 p-2 text-red-500 hover:bg-red-50 rounded-md"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTask(false)}
                    className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Add Task
                  </button>
                </div>
              </form>
            </div>
          )}
      </div>
      </div>
      </MainLayout>
    );
  }

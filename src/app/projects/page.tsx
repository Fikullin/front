  'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { getProjects, deleteProject, Project } from '@/lib/api/projectService';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Define Task interface
interface Task {
  id: number;
  project_id: number;
  action: string;
  due_date: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  assigned_to: string;
  scope: 'task' | 'project' | 'invoice';
  completed: boolean;
  status_description?: string;
  deleted?: boolean;
}

// Mock functions for task management (replace with actual API calls)
const getProjectTasks = async (projectId: number): Promise<Task[]> => {
  // This would be replaced with an actual API call
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        id: 1,
        project_id: projectId,
        action: 'Design database schema',
        due_date: '2023-12-15',
        status: 'in_progress',
        assigned_to: 'John Doe',
        scope: 'project',
        completed: false
      },
      {
        id: 2,
        project_id: projectId,
        action: 'Implement user authentication',
        due_date: '2023-12-20',
        status: 'not_started',
        assigned_to: 'Jane Smith',
        scope: 'task',
        completed: false
      }
    ];
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    return [];
  }
};

const updateTask = async (task: Task): Promise<Task> => {
  // This would be replaced with an actual API call
  try {
    console.log('Updating task:', task);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return task;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

const createTask = async (task: Partial<Task>): Promise<Task> => {
  // This would be replaced with an actual API call
  try {
    console.log('Creating task:', task);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      id: Math.floor(Math.random() * 1000),
      project_id: task.project_id || 0,
      action: task.action || '',
      due_date: task.due_date || '',
      status: task.status || 'not_started',
      assigned_to: task.assigned_to || '',
      scope: task.scope || 'task',
      completed: task.completed || false,
      status_description: task.status_description
    };
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

// Task Item Component with Drag and Drop
const TaskItem = ({ task, index, moveTask, updateTaskHandler }: { 
  task: Task, 
  index: number, 
  moveTask: (dragIndex: number, hoverIndex: number) => void,
  updateTaskHandler: (taskId: number, updatedFields: Partial<Task>) => void
}) => {
  const ref = useRef<HTMLTableRowElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'TASK',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const [, drop] = useDrop({
    accept: 'TASK',
    hover: (item: { index: number }, monitor) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      
      if (dragIndex === hoverIndex) {
        return;
      }
      
      moveTask(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });
  
  drag(drop(ref));
  
  // Function to handle task deletion
  const handleDeleteTask = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      // Mark the task for deletion by setting a special flag
      updateTaskHandler(task.id, { deleted: true });
    }
  };
  
  return (
    <tr 
      ref={ref} 
      className={`border-b hover:bg-gray-50 ${isDragging ? 'opacity-50' : ''}`}
      style={{ cursor: 'move' }}
    >
      <td className="px-4 py-3">
        <select 
          className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
          value={task.scope}
          onChange={(e) => updateTaskHandler(task.id, { scope: e.target.value as 'task' | 'project' | 'invoice' })}
        >
          <option value="task">Task</option>
          <option value="project">Project</option>
          <option value="invoice">Invoice</option>
        </select>
      </td>
      <td className="px-4 py-3">
        <input 
          type="text" 
          className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
          defaultValue={task.action}
          onBlur={(e) => updateTaskHandler(task.id, { action: e.target.value })}
        />
      </td>
      <td className="px-4 py-3">
        <select 
          className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
          value={task.assigned_to || ''}
          onChange={(e) => updateTaskHandler(task.id, { assigned_to: e.target.value })}
        >
          <option value="">Select Member</option>
          <option value="John Doe">John Doe</option>
          <option value="Jane Smith">Jane Smith</option>
        </select>
      </td>
      <td className="px-4 py-3">
        <select 
          className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
          value={task.status}
          onChange={(e) => updateTaskHandler(task.id, { 
            status: e.target.value as 'not_started' | 'in_progress' | 'completed' | 'blocked' 
          })}
        >
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="blocked">Blocked</option>
        </select>
      </td>
      <td className="px-4 py-3">
        <input 
          type="text" 
          className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
          defaultValue={task.status_description || ''}
          onBlur={(e) => updateTaskHandler(task.id, { status_description: e.target.value })}
        />
      </td>
      <td className="px-4 py-3">
        <input 
          type="date" 
          className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
          value={task.due_date || ''}
          onChange={(e) => updateTaskHandler(task.id, { due_date: e.target.value })}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => updateTaskHandler(task.id, { status: 'completed' })}
            className="p-1 bg-green-500 text-white rounded-full hover:bg-green-600"
            title="Mark as completed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button 
            onClick={handleDeleteTask}
            className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            title="Delete task"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [projectTasks, setProjectTasks] = useState<{[key: number]: Task[]}>({});
  const [showAddTask, setShowAddTask] = useState<number | null>(null);
  const [newTask, setNewTask] = useState({
    action: '',
    due_date: '',
    attachments: [''],
    status_description: '',
    scope: 'project',
    assigned_to: '',
    status: 'not_started'
  });
  const router = useRouter();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log('Fetching projects...');
        const data = await getProjects();
        console.log('Projects fetched:', data);
        setProjects(data || []); // Ensure we always have an array
        setLoading(false);
      } catch (error) {
        console.error('Error in component while fetching projects:', error);
        setProjects([]); // Set empty array on error
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(id);
        setProjects(projects.filter(project => project.id !== id));
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const toggleProjectDetails = async (projectId: number) => {
    if (expandedProject === projectId) {
      setExpandedProject(null);
    } else {
      setExpandedProject(projectId);
      if (!projectTasks[projectId]) {
        try {
          const tasks = await getProjectTasks(projectId);
          setProjectTasks(prev => ({
            ...prev,
            [projectId]: tasks
          }));
        } catch (error) {
          console.error('Error fetching project tasks:', error);
          setProjectTasks(prev => ({
            ...prev,
            [projectId]: []
          }));
        }
      }
    }
  };

  return (
    <MainLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Projects</h1>
          <Link href="/projects/create" className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-4 py-2 rounded-md text-sm">
            Add New Project
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-4">Loading projects...</div>
        ) : (
          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="bg-[var(--card-background)] border border-[var(--card-border)] rounded-lg p-6 text-center">
                <p className="text-[var(--text-secondary)]">No projects found. Create your first project!</p>
              </div>
            ) : (
              projects.map(project => (
                <div key={project.id} className="bg-[var(--card-background)] border border-[var(--card-border)] rounded-lg shadow-sm overflow-hidden">
                  <div className="px-6 py-4 flex justify-between items-center border-b border-[var(--card-border)]">
                    <div className="flex items-center">
                      <div className="mr-4">
                        <span className={`inline-flex items-center justify-center h-10 w-10 rounded-full ${
                          project.state === 'Completed' ? 'bg-green-100 text-green-800' : 
                          project.state === 'Ongoing' ? 'bg-blue-100 text-blue-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {project.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-lg font-medium">{project.name}</h2>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {project.start_date && project.end_date ? 
                            `${project.start_date} - ${project.end_date}` : 
                            'No dates specified'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        project.state === 'Completed' ? 'bg-green-100 text-green-800' : 
                        project.state === 'Ongoing' ? 'bg-blue-100 text-blue-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {project.state}
                      </span>
                    </div>
                  </div>

                  <div className="px-6 py-3 bg-[var(--table-header-bg)] flex justify-between items-center">
                    <div className="flex space-x-4">
                      <Link href={`/projects/${project.id}`} className="text-sm text-blue-600 hover:text-blue-800">View Details</Link>
                      <Link href={`/projects/${project.id}/edit`} className="text-sm text-indigo-600 hover:text-indigo-800">Edit</Link>
                      <button 
                        onClick={() => handleDelete(project.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

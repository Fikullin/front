import axios from 'axios';


// Task interface definition
export interface Task {
  id: number;
  project_id: number;
  project_name?: string;
  action: string;
  due_date: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  assigned_to: string;
  scope: 'task' | 'project' | 'invoice';
  status_description?: string;
  attachments?: string[];
}

// Get all tasks
export const getAllTasks = async (): Promise<Task[]> => {
  try {
    // For development/testing, you can use this mock data
    // Remove this and uncomment the axios call when your backend is ready
    return mockTasks;
    
    // Uncomment this when your backend is ready
    // const response = await axios.get(`${API_URL}/tasks`);
    // return response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

// Get tasks for a specific project
export const getProjectTasks = async (projectId: number): Promise<Task[]> => {
  try {
    // For development/testing
    return mockTasks.filter(task => task.project_id === projectId);
    
    // Uncomment this when your backend is ready
    // const response = await axios.get(`${API_URL}/projects/${projectId}/tasks`);
    // return response.data;
  } catch (error) {
    console.error(`Error fetching tasks for project ${projectId}:`, error);
    throw error;
  }
};

// Get a single task by ID
export const getTask = async (taskId: number): Promise<Task> => {
  try {
    // For development/testing
    const task = mockTasks.find(task => task.id === taskId);
    if (!task) throw new Error(`Task with ID ${taskId} not found`);
    return task;
    
    // Uncomment this when your backend is ready
    // const response = await axios.get(`${API_URL}/tasks/${taskId}`);
    // return response.data;
  } catch (error) {
    console.error(`Error fetching task ${taskId}:`, error);
    throw error;
  }
};

// Create a new task
export const createTask = async (task: Omit<Task, 'id'>): Promise<Task> => {
  try {
    // For development/testing
    const newTask = {
      ...task,
      id: Math.max(0, ...mockTasks.map(t => t.id)) + 1
    };
    mockTasks.push(newTask);
    return newTask;
    
    // Uncomment this when your backend is ready
    // const response = await axios.post(`${API_URL}/tasks`, task);
    // return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

// Update an existing task
export const updateTask = async (task: Task): Promise<Task> => {
  try {
    // For development/testing
    const index = mockTasks.findIndex(t => t.id === task.id);
    if (index === -1) throw new Error(`Task with ID ${task.id} not found`);
    mockTasks[index] = task;
    return task;
    
    // Uncomment this when your backend is ready
    // const response = await axios.put(`${API_URL}/tasks/${task.id}`, task);
    // return response.data;
  } catch (error) {
    console.error(`Error updating task ${task.id}:`, error);
    throw error;
  }
};

// Delete a task
export const deleteTask = async (taskId: number): Promise<void> => {
  try {
    // For development/testing
    const index = mockTasks.findIndex(task => task.id === taskId);
    if (index === -1) throw new Error(`Task with ID ${taskId} not found`);
    mockTasks.splice(index, 1);
    
    // Uncomment this when your backend is ready
    // await axios.delete(`${API_URL}/tasks/${taskId}`);
  } catch (error) {
    console.error(`Error deleting task ${taskId}:`, error);
    throw error;
  }
};

// Mock data for development/testing
const mockTasks: Task[] = [
  {
    id: 1,
    project_id: 1,
    project_name: "Website Redesign",
    action: "Design homepage mockup",
    due_date: "2023-12-15",
    status: "in_progress",
    assigned_to: "John Doe",
    scope: "task",
    status_description: "Working on final revisions"
  },
  {
    id: 2,
    project_id: 1,
    project_name: "Website Redesign",
    action: "Implement responsive navigation",
    due_date: "2023-12-20",
    status: "not_started",
    assigned_to: "Jane Smith",
    scope: "task"
  },
  {
    id: 3,
    project_id: 2,
    project_name: "Mobile App Development",
    action: "Create user authentication flow",
    due_date: "2023-12-10",
    status: "completed",
    assigned_to: "Mike Johnson",
    scope: "task",
    status_description: "Completed and tested"
  },
  {
    id: 4,
    project_id: 2,
    project_name: "Mobile App Development",
    action: "Design app icon",
    due_date: "2023-12-05",
    status: "blocked",
    assigned_to: "Sarah Williams",
    scope: "task",
    status_description: "Waiting for brand guidelines"
  },
  {
    id: 5,
    project_id: 3,
    project_name: "E-commerce Platform",
    action: "Set up payment gateway",
    due_date: "2023-12-25",
    status: "in_progress",
    assigned_to: "David Brown",
    scope: "task"
  }
];
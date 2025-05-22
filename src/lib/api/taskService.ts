import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Task {
  project_name: string;
  id: number;
  project_id: number;
  action: string;
  due_date?: string;
  attachments?: string[] | string;
  status_description?: string;
  scope?: 'project' | 'task' | 'invoice' | 'job' | string;
  assigned_to?: number | string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  completed?: boolean;
  created_at?: string;
  updated_at?: string;
  title?: string;
  description?: string;
  priority?: string;
  created_by?: number;
}

export interface CreateTaskData {
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null; // Tambahkan null sebagai tipe yang valid
  project_id: number;
  assigned_to: number;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
  assigned_to?: number;
}

// Mendapatkan semua task
export const getTasks = async (): Promise<Task[]> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new Error('Authentication required');
    }
    
    const response = await axios.get(`${API_URL}/tasks`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    // Return empty array instead of throwing error to prevent UI crashes
    return [];
  }
};

// Mendapatkan task berdasarkan ID
export const getTaskById = async (id: number): Promise<Task> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new Error('Authentication required');
    }
    
    const response = await axios.get(`${API_URL}/tasks/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching task with ID ${id}:`, error);
    throw error;
  }
};

// Mendapatkan task berdasarkan project ID
export const getTasksByProjectId = async (projectId: number): Promise<Task[]> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      return []; // Return empty array instead of throwing error
    }
    
    const response = await axios.get(`${API_URL}/projects/${projectId}/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // Increase timeout to 30 seconds
    });
    
    // Check if response data is valid
    if (!response.data) {
      console.warn(`Empty response from tasks API for project ${projectId}`);
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching tasks for project ${projectId}:`, error);
    // Log more detailed error information
    if (axios.isAxiosError(error) && error.response) {
      console.error('Server response:', error.response.status, error.response.data);
    }
    // Return empty array instead of throwing error to prevent UI crashes
    return [];
  }
};

// Membuat task baru
export const createTask = async (taskData: CreateTaskData): Promise<Task> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new Error('Authentication required');
    }
    
    // Pastikan due_date adalah null jika string kosong
    const sanitizedData = {
      ...taskData,
      due_date: taskData.due_date === '' ? null : taskData.due_date
    };
    
    const response = await axios.post(`${API_URL}/tasks`, sanitizedData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

// Memperbarui task
export const updateTask = async (id: number, taskData: UpdateTaskData): Promise<Task> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new Error('Authentication required');
    }
    
    const response = await axios.put(`${API_URL}/tasks/${id}`, taskData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error updating task with ID ${id}:`, error);
    throw error;
  }
};

// Menghapus task
export const deleteTask = async (id: number): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    await axios.delete(`${API_URL}/tasks/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    console.log(`Task dengan ID ${id} berhasil dihapus`);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      // Task sudah tidak ada, anggap sukses
      console.warn(`Task dengan ID ${id} tidak ditemukan (404), dianggap sudah terhapus.`);
      return;
    }
    // Untuk error lain, log saja
    console.error(`Error deleting task with ID ${id}:`, error);
    return;
  }
};

// Mengubah status task
export const updateTaskStatus = async (id: number, status: string): Promise<Task> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new Error('Authentication required');
    }
    
    const response = await axios.patch(`${API_URL}/tasks/${id}/status`, { status }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error updating status for task with ID ${id}:`, error);
    throw error;
  }
};
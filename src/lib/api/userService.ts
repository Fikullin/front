import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: string;
  phone?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
  role?: string;
  phone?: string;
}

// Mock data to use when API fails
const mockUsers: User[] = [
  { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin' },
  { id: 2, name: 'Project Manager', email: 'pm@example.com', role: 'admin' },
  { id: 3, name: 'Tech User', email: 'tech@example.com', role: 'technician' },
  { id: 4, name: 'Developer', email: 'dev@example.com', role: 'technician' }
];

export const getUsers = async (): Promise<User[]> => {
  try {
    console.log('Fetching users from:', `${API_URL}/users`);
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      return mockUsers;
    }
    
    const response = await axios.get(`${API_URL}/users`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    // Return mock data on error
    return mockUsers;
  }
};

export const getUserById = async (id: number): Promise<User> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      const mockUser = mockUsers.find(user => user.id === id);
      if (mockUser) return mockUser;
      throw new Error('User not found and no token available');
    }
    
    const response = await axios.get(`${API_URL}/users/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching user with ID ${id}:`, error);
    // Return a mock user if the real one can't be fetched
    const mockUser = mockUsers.find(user => user.id === id);
    if (mockUser) return mockUser;
    throw error;
  }
};

export const createUser = async (userData: CreateUserData): Promise<User> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new Error('Authentication required');
    }
    
    const response = await axios.post(`${API_URL}/users`, userData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (id: number, userData: UpdateUserData): Promise<User> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new Error('Authentication required');
    }
    
    const response = await axios.put(`${API_URL}/users/${id}`, userData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error updating user with ID ${id}:`, error);
    throw error;
  }
};

export const deleteUser = async (id: number): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new Error('Authentication required');
    }
    
    await axios.delete(`${API_URL}/users/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error(`Error deleting user with ID ${id}:`, error);
    throw error;
  }
};
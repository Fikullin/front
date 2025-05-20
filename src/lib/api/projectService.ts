import axios from 'axios';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Project {
  admin_id: number;
  technician_id: number;
  id: number;
  name: string;
  description: string;
  job_scope: string;
  scope: string;
  status: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  company_contact_name: string;
  company_contact_email: string;
  company_contact_phone: string;
  tech_name: string;
  tech_email: string;
  tech_phone: string;
  technical_contact_name: string;
  technical_contact_email: string;
  technical_contact_phone: string;
  admin_name: string;
  admin_email: string;
  admin_phone: string;
  admin_contact_name: string;
  admin_contact_email: string;
  admin_contact_phone: string;
  state: string;
  start_date: string;
  end_date: string;
  progress?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProjectData {
  name: string;
  description: string;
  job_scope: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  tech_name: string;
  tech_email: string;
  tech_phone: string;
  admin_name: string;
  admin_email: string;
  admin_phone: string;
  state: string;
  start_date: string;
  end_date: string;
}

// Get all projects
export const getProjects = async (): Promise<Project[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

// Get a single project by ID
export const getProject = async (id: number): Promise<Project> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/projects/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching project with ID ${id}:`, error);
    throw error;
  }
};

// Create a new project
export const createProject = async (projectData: CreateProjectData): Promise<Project> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/projects`, projectData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

// Update an existing project
export const updateProject = async (id: number, projectData: Partial<Project>): Promise<Project> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/projects/${id}`, projectData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating project with ID ${id}:`, error);
    throw error;
  }
};

// Delete a project
export const deleteProject = async (id: number): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/projects/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error(`Error deleting project with ID ${id}:`, error);
    throw error;
  }
};
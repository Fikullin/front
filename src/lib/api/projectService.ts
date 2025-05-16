import axios from 'axios';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Project {
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

// Mock data for development
const mockProjects: Project[] = [
  {
    id: 1,
    name: "Sistem Informasi Akademik",
    description: "Pengembangan sistem informasi untuk manajemen akademik perguruan tinggi",
    job_scope: "Website,Database,API",
    contact_name: "Takayuki",
    contact_email: "takayuki@gmail.com",
    contact_phone: "0899009822",
    tech_name: "Agus Wijaya",
    tech_email: "agus@its.ac.id",
    tech_phone: "081234567890",
    admin_name: "Budi Santoso",
    admin_email: "budi@its.ac.id",
    admin_phone: "081234567891",
    state: "Ongoing",
    start_date: "2023-01-15",
    end_date: "2023-04-30",
    progress: 65,
    created_at: "2023-01-10T00:00:00Z",
    updated_at: "2023-02-15T00:00:00Z",
    scope: "project,invoice",
    status: 'in_progress',
    company_contact_name: 'PT Akademik Indonesia',
    company_contact_email: 'contact@akademik.id',
    company_contact_phone: '081234567890',
    technical_contact_name: 'Agus Wijaya',
    technical_contact_email: 'agus@its.ac.id',
    technical_contact_phone: '081234567890',
    admin_contact_name: 'Budi Santoso',
    admin_contact_email: 'budi@its.ac.id',
    admin_contact_phone: '081234567891'
  }
];

// Get all projects
export const getProjects = async (): Promise<Project[]> => {
  try {
    // For development, return mock data
    return mockProjects;
    
    /* Uncomment when backend is ready
    const response = await axios.get(`${API_URL}/projects`);
    return response.data;
    */
  } catch (error) {
    console.error('Error fetching projects:', error);
    return mockProjects;
  }
};

// Get a single project by ID
export const getProject = async (id: number): Promise<Project> => {
  try {
    // For development, return mock data
    const project = mockProjects.find(p => p.id === id);
    if (project) return project;
    throw new Error('Project not found');
    
    /* Uncomment when backend is ready
    const response = await axios.get(`${API_URL}/projects/${id}`);
    return response.data;
    */
  } catch (error) {
    console.error(`Error fetching project with ID ${id}:`, error);
    // Return first mock project as fallback
    return mockProjects[0];
  }
};

// Create a new project
export const createProject = async (projectData: CreateProjectData): Promise<Project> => {
  try {
    // For development, simulate API call
    console.log('Creating project with data:', projectData);
    const newProject: Project = {
      id: mockProjects.length + 1,
      ...projectData,
      progress: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      scope: "project",
      status: 'not_started',
      company_contact_name: projectData.contact_name,
      company_contact_email: projectData.contact_email,
      company_contact_phone: projectData.contact_phone,
      technical_contact_name: projectData.tech_name,
      technical_contact_email: projectData.tech_email,
      technical_contact_phone: projectData.tech_phone,
      admin_contact_name: projectData.admin_name,
      admin_contact_email: projectData.admin_email,
      admin_contact_phone: projectData.admin_phone
    };
    mockProjects.push(newProject);
    return newProject;
    
    /* Uncomment when backend is ready
    const response = await axios.post(`${API_URL}/projects`, projectData);
    return response.data;
    */
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

// Update an existing project
export const updateProject = async (id: number, projectData: Partial<Project>): Promise<Project> => {
  try {
    // For development, simulate API call
    console.log(`Updating project ${id} with data:`, projectData);
    const projectIndex = mockProjects.findIndex(p => p.id === id);
    if (projectIndex === -1) throw new Error('Project not found');
    
    const updatedProject = {
      ...mockProjects[projectIndex],
      ...projectData,
      updated_at: new Date().toISOString()
    };
    mockProjects[projectIndex] = updatedProject;
    return updatedProject;
    
    /* Uncomment when backend is ready
    const response = await axios.put(`${API_URL}/projects/${id}`, projectData);
    return response.data;
    */
  } catch (error) {
    console.error(`Error updating project with ID ${id}:`, error);
    throw error;
  }
};

// Delete a project
export const deleteProject = async (id: number): Promise<void> => {
  try {
    // For development, simulate API call
    console.log(`Deleting project ${id}`);
    const projectIndex = mockProjects.findIndex(p => p.id === id);
    if (projectIndex === -1) throw new Error('Project not found');
    mockProjects.splice(projectIndex, 1);
    
    /* Uncomment when backend is ready
    await axios.delete(`${API_URL}/projects/${id}`);
    */
  } catch (error) {
    console.error(`Error deleting project with ID ${id}:`, error);
    throw error;
  }
};
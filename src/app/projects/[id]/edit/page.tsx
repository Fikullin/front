'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProject, updateProject, Project } from '@/lib/api/projectService';
import { getUsers, User } from '@/lib/api/userService';
import MainLayout from '@/components/layout/MainLayout';

export default function EditProject() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [techUsers, setTechUsers] = useState<User[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    tech_name: '',
    tech_email: '',
    tech_phone: '',
    admin_name: '',
    admin_email: '',
    admin_phone: '',
    state: 'Proposal',
    start_date: '',
    end_date: '',
    technician_id: '',
    admin_id: ''
  });

  const [jobScopes, setJobScopes] = useState<string[]>([]);
  const [newJobScope, setNewJobScope] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);

        const projectData = await getProject(parseInt(id));

        const users = await getUsers();
        const admins = users.filter((user) => user.role === 'admin');
        const techs = users.filter((user) => user.role === 'technician');

        setAdminUsers(admins);
        setTechUsers(techs);

        setFormData({
          name: projectData.name || '',
          description: projectData.description || '',
          contact_name: projectData.contact_name || '',
          contact_email: projectData.contact_email || '',
          contact_phone: projectData.contact_phone || '',
          technician_id: projectData.technician_id ? projectData.technician_id.toString() : '',
          tech_name: projectData.tech_name || '',
          tech_email: projectData.tech_email || '',
          tech_phone: projectData.tech_phone || '',
          admin_email: projectData.admin_email || '',
          admin_id: projectData.admin_id ? projectData.admin_id.toString() : '',
          admin_name: projectData.admin_name || '',
          admin_phone: projectData.admin_phone || '',
          state: projectData.state || 'Proposal',
          start_date: projectData.start_date || '',
          end_date: projectData.end_date || '',
        });

        if (projectData.job_scope) {
          const scopes = projectData.job_scope.split(',').map(scope => scope.trim()).filter(scope => scope.length > 0);
          setJobScopes(scopes);
        } else {
          setJobScopes([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'technician_id') {
      const selectedTech = techUsers.find((user) => user.id === parseInt(value));
      if (selectedTech) {
        setFormData((prev) => ({
          ...prev,
          technician_id: value,
          tech_name: selectedTech.name,
          tech_email: selectedTech.email,
          tech_phone: selectedTech.phone || '',
        }));
        return;
      }
    }

    if (name === 'admin_id') {
      const selectedAdmin = adminUsers.find((user) => user.id === parseInt(value));
      if (selectedAdmin) {
        setFormData((prev) => ({
          ...prev,
          admin_id: value,
          admin_name: selectedAdmin.name,
          admin_email: selectedAdmin.email,
          admin_phone: selectedAdmin.phone || '',
        }));
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addJobScope = () => {
    const trimmed = newJobScope.trim();
    if (trimmed && !jobScopes.includes(trimmed)) {
      setJobScopes(prev => [...prev, trimmed]);
      setNewJobScope('');
    }
  };

  const removeJobScope = (index: number) => {
    setJobScopes(prev => prev.filter((_, i) => i !== index));
  };

  const handleJobScopeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addJobScope();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);

      await updateProject(parseInt(id), {
        ...formData,
        job_scope: jobScopes.join(', '),
        technician_id: formData.technician_id ? parseInt(formData.technician_id) : undefined,
        admin_id: formData.admin_id ? parseInt(formData.admin_id) : undefined,
      });
      router.push(`/projects/${id}`);
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex-1 ml-64 p-8">
          <div className="text-center">Loading project details...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6">Edit Project</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Project Details Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Project Details</h2>

            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Project Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Project Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter project description"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Scope</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {jobScopes.map((jobscope, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded-full flex items-center"
                  >
                    <span>{jobscope}</span>
                    <button
                      type="button"
                      onClick={() => removeJobScope(index)}
                      className="ml-2 text-white font-bold"
                    >
                      &times;
                    </button>
                    <input type="hidden" name={`categories[${index}]`} value={jobscope} />
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={newJobScope}
                onChange={e => setNewJobScope(e.target.value)}
                onKeyDown={handleJobScopeKeyDown}
                className="w-full p-2 border rounded-lg"
                placeholder="Type a job scope and press Enter"
              />
            </div>
          </div>

          {/* Company Contact Person Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Company Contact Person</h2>

            <div className="mb-4">
              <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                id="contact_name"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter PIC name"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter PIC email"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter PIC phone"
              />
            </div>
          </div>

          {/* ITS Technical Contact Person Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">ITS Technical Contact Person</h2>

            <div className="mb-4">
              <label htmlFor="tech_name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <select
                id="technician_id"
                name="technician_id"
                value={formData.technician_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Technical Contact</option>
                {techUsers.map((user: User) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="tech_email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="tech_email"
                name="tech_email"
                value={formData.tech_email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter technical contact email"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="tech_phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                id="tech_phone"
                name="tech_phone"
                value={formData.tech_phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter technical contact phone"
              />
            </div>
          </div>

          {/* ITS Administration Contact Person Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">ITS Administration Contact Person</h2>

            <div className="mb-4">
              <label htmlFor="admin_name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <select
                id="admin_id"
                name="admin_id"
                value={formData.admin_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Admin Contact</option>
                {adminUsers.map((user: User) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="admin_email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="admin_email"
                name="admin_email"
                value={formData.admin_email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter admin contact email"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="admin_phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                id="admin_phone"
                name="admin_phone"
                value={formData.admin_phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter admin contact phone"
              />
            </div>
          </div>

          {/* Project Schedule Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Project Schedule</h2>

            <div className="mb-4">
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                Project State
              </label>
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="Proposal">Proposal</option>
                <option value="Ongoing">Ongoing Project</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push(`/projects/${params.id}`)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md mr-2"
            >
              Cancel
            </button>
            <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}

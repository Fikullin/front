'use client';

import { Project } from '@/lib/api/projectService';
import { User } from '@/lib/api/userService';
import { UserIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

interface ProjectDetailsProps {
  project: Project;
  users: User[];
}

export default function ProjectDetails({ project, users }: ProjectDetailsProps) {
  console.log('users:', users);
  console.log('project.technician_id:', project.technician_id, 'project.admin_id:', project.admin_id);
  console.log('tech_name:', project.tech_name, 'admin_name:', project.admin_name);

  // Gunakan String() agar pencocokan id tidak masalah tipe
  const adminUser = users.find(user => String(user.id) === String(project.admin_id));
  const technicianUser = users.find(user => String(user.id) === String(project.technician_id));

  const formatContact = (
    user: User | undefined,
    fallbackName?: string,
    fallbackEmail?: string,
    fallbackPhone?: string
  ) => ({
    name: (user?.name && user.name.trim() !== '') ? user.name : (fallbackName && fallbackName.trim() !== '') ? fallbackName : 'Not specified',
    email: (user?.email && user.email.trim() !== '') ? user.email : (fallbackEmail && fallbackEmail.trim() !== '') ? fallbackEmail : 'Not specified',
    phone: (user?.phone && user.phone.trim() !== '') ? user.phone : (fallbackPhone && fallbackPhone.trim() !== '') ? fallbackPhone : 'Not specified',
  });

  const companyContact = {
    name: project.contact_name || 'Not specified',
    email: project.contact_email || 'Not specified',
    phone: project.contact_phone || 'Not specified',
  };

  const technicalContact = formatContact(
    technicianUser,
    project.tech_name,
    project.tech_email,
    project.tech_phone
  );

  const administrationContact = formatContact(
    adminUser,
    project.admin_name,
    project.admin_email,
    project.admin_phone
  );


  // Parse job_scope menjadi array jika perlu
  let jobScopes: string[] = [];
  if (Array.isArray(project.job_scope)) {
    jobScopes = project.job_scope;
  } else if (typeof project.job_scope === 'string' && project.job_scope.trim() !== '') {
    jobScopes = project.job_scope.split(',').map(s => s.trim()).filter(Boolean);
  }

  return (
    <div>
      {/* Status */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">Status:</span>
        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-semibold">
          Ongoing Project
        </span>
      </div>

      {/* Project Information & Job Scope (masing-masing dalam card) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Project Information Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-2">
            <UserIcon className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-lg">Project Information</span>
          </div>

          <div className="mb-2">
            <span className="text-xs text-gray-500">Project Description</span>
            <p className="text-sm">{project.description || 'Not specified'}</p>
          </div>
          <div className="flex items-center gap-8 mt-2">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500">Start Date</span>
              <span className="text-sm">{project.start_date || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500">End Date</span>
              <span className="text-sm">{project.end_date || '-'}</span>
            </div>
          </div>
        </div>
        {/* Job Scope Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Job Scope</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {jobScopes.length > 0 ? (
              jobScopes.map((scope, idx) => (
                <span
                  key={idx}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold"
                >
                  {scope}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-500">No job scope specified</span>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information (masih dalam card) */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <UserIcon className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-lg">Contact Information</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Company Contact Person */}
          <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-blue-600 font-semibold mb-3">Company Contact Person</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Name</span>
              </div>
              <p className="ml-6">{companyContact.name}</p>
              <div className="flex items-center gap-2">
                <EnvelopeIcon className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Email</span>
              </div>
              <p className="ml-6">{companyContact.email}</p>
              <div className="flex items-center gap-2">
                <PhoneIcon className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Phone</span>
              </div>
              <p className="ml-6">{companyContact.phone}</p>
            </div>
          </div>
          {/* ITS Technical Contact */}
          <div className="bg-green-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-green-600 font-semibold mb-3">ITS Technical Contact</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-green-600" />
                <span className="font-medium">Name</span>
              </div>
              <p className="ml-6">{technicalContact.name}</p>
              <div className="flex items-center gap-2">
                <EnvelopeIcon className="w-4 h-4 text-green-600" />
                <span className="font-medium">Email</span>
              </div>
              <p className="ml-6">{technicalContact.email}</p>
              <div className="flex items-center gap-2">
                <PhoneIcon className="w-4 h-4 text-green-600" />
                <span className="font-medium">Phone</span>
              </div>
              <p className="ml-6">{technicalContact.phone}</p>
            </div>
          </div>
          {/* ITS Administration Contact */}
          <div className="bg-purple-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-purple-600 font-semibold mb-3">ITS Administration Contact</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-purple-600" />
                <span className="font-medium">Name</span>
              </div>
              <p className="ml-6">{administrationContact.name}</p>
              <div className="flex items-center gap-2">
                <EnvelopeIcon className="w-4 h-4 text-purple-600" />
                <span className="font-medium">Email</span>
              </div>
              <p className="ml-6">{administrationContact.email}</p>
              <div className="flex items-center gap-2">
                <PhoneIcon className="w-4 h-4 text-purple-600" />
                <span className="font-medium">Phone</span>
              </div>
              <p className="ml-6">{administrationContact.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

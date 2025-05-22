'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/lib/api/taskService';
import { User } from '@/lib/api/userService';

interface TaskFormProps {
  task?: Task;
  projectId: number;
  users: User[];
  onSubmit: (taskData: unknown) => void;
  onCancel: () => void;
  isEditing?: boolean;
  jobScopes?: string[];
}

export default function TaskForm({
  task,
  projectId,
  users,
  onSubmit,
  onCancel,
  isEditing = false,
  jobScopes = ['project', 'task', 'invoice']
}: TaskFormProps) {
  const [formData, setFormData] = useState<{
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
    scope: jobScopes.length > 0 ? jobScopes[0] as "project" | "task" | "invoice" : 'project',
    assigned_to: '',
    status: 'not_started'
  });

  useEffect(() => {
    if (task && isEditing) {
      setFormData({
        action: task.action,
        due_date: task.due_date || '',
        attachments: Array.isArray(task.attachments) 
          ? task.attachments 
          : (typeof task.attachments === 'string' 
              ? (task.attachments as string).split(',') 
              : ['']),
        status_description: task.status_description || '',
        scope: task.scope || (jobScopes.length > 0 ? jobScopes[0] as "project" | "task" | "invoice" : 'project'),
        assigned_to: task.assigned_to ? task.assigned_to.toString() : '',
        status: task.status || 'not_started'
      });
    }
  }, [task, isEditing, jobScopes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAttachmentChange = (index: number, value: string) => {
    const newAttachments = [...formData.attachments];
    newAttachments[index] = value;
    setFormData(prev => ({
      ...prev,
      attachments: newAttachments
    }));
  };

  const addAttachmentField = () => {
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, '']
    }));
  };

  const removeAttachmentField = (index: number) => {
    if (formData.attachments.length > 1) {
      const newAttachments = [...formData.attachments];
      newAttachments.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        attachments: newAttachments
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData = {
      project_id: projectId,
      action: formData.action,
      due_date: formData.due_date ? formData.due_date : null,
      attachment: formData.attachments && formData.attachments.length > 0 ? formData.attachments.join(',') : null,
      status_description: formData.status_description || null,
      assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : undefined,
      status: formData.status || 'not_started',
      completed: formData.status === 'completed',
      title: formData.action || '',
      description: formData.status_description || '',
      priority: 'normal'
    };
    
    onSubmit(taskData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-[var(--card-background)] border border-[var(--card-border)] rounded-lg p-6 shadow-sm">
      <div>
        <label htmlFor="action" className="block text-sm font-medium mb-1">Task Action</label>
        <input
          id="action"
          name="action"
          type="text"
          required
          value={formData.action}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md bg-[var(--input-bg)]"
        />
      </div>

      <div>
        <label htmlFor="due_date" className="block text-sm font-medium mb-1">Due Date</label>
        <input
          id="due_date"
          name="due_date"
          type="date"
          value={formData.due_date}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md bg-[var(--input-bg)]"
        />
      </div>

      <div>
        <label htmlFor="status_description" className="block text-sm font-medium mb-1">Description</label>
        <textarea
          id="status_description"
          name="status_description"
          value={formData.status_description}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md bg-[var(--input-bg)]"
          rows={3}
        />
      </div>

      <div>
        <label htmlFor="scope" className="block text-sm font-medium mb-1">Scope</label>
        <select
          id="scope"
          name="scope"
          value={formData.scope}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md bg-[var(--input-bg)]"
        >
          {jobScopes.map((scope) => (
            <option key={scope} value={scope}>{scope}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="assigned_to" className="block text-sm font-medium mb-1">Assigned To</label>
        <select
          id="assigned_to"
          name="assigned_to"
          value={formData.assigned_to}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md bg-[var(--input-bg)]"
        >
          <option value="">Select User</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium mb-1">Status</label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md bg-[var(--input-bg)]"
        >
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Attachments</label>
        {formData.attachments.map((attachment, index) => (
          <div key={index} className="flex items-center mb-2">
            <input
              type="text"
              value={attachment}
              onChange={(e) => handleAttachmentChange(index, e.target.value)}
              className="flex-1 px-3 py-2 border border-[var(--input-border)] rounded-md bg-[var(--input-bg)]"
              placeholder="Attachment URL"
            />
            <button
              type="button"
              onClick={() => removeAttachmentField(index)}
              className="ml-2 text-red-500"
              disabled={formData.attachments.length <= 1}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addAttachmentField}
          className="text-blue-500 text-sm"
        >
          + Add Attachment
        </button>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-[var(--input-border)] rounded-md text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
        >
          {isEditing ? 'Update Task' : 'Add Task'}
        </button>
      </div>
    </form>
  );
}
  'use client';

import React, { useState, useEffect } from 'react';
import { Task, deleteTask, updateTask, createTask } from '../../lib/api/taskService';

interface User {
  id: number;
  name: string;
}

interface TaskListProps {
  tasks: Task[];
  users: User[];
  jobScopes: string[];
  onEditTask: (taskId: number, updatedTaskData: Partial<Task>) => void;
  onDeleteTask: (taskId: number) => void;
  onAddTask: (newTask: Task) => void;
  projectId: number;
}

export default function TaskList({ tasks, users, jobScopes, onEditTask, onDeleteTask, onAddTask, projectId }: TaskListProps) {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [newTask, setNewTask] = useState<Partial<Task> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Normalize attachment field to array for consistent state
    const normalizedTasks = tasks.map(task => {
      let attachmentsArray: string[] = [];
      if ((task as any).attachment) {
        if (Array.isArray((task as any).attachment)) {
          attachmentsArray = (task as any).attachment;
        } else if (typeof (task as any).attachment === 'string') {
          attachmentsArray = (task as any).attachment.split(',').map((s: string) => s.trim());
        }
      }
      return {
        ...task,
        attachments: attachmentsArray
      };
    });
    setLocalTasks(normalizedTasks);
  }, [tasks]);

  const handleFieldChange = (taskId: number, field: keyof Task, value: any) => {
    // Ensure attachments field is always an array
    if (field === 'attachments' && typeof value === 'string') {
      value = value.split(',').map(s => s.trim());
    }
    setLocalTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, [field]: value } : task
      )
    );
  };

  const handleSave = async (task: Task) => {
    const allowedScopes = ['project', 'task', 'invoice', 'activity', 'member'];
    const allowedStatuses = ['not_started', 'in_progress', 'completed', 'blocked'];

    console.log('handleSave called for task:', task.id, 'due_date:', task.due_date);
    try {
      // Convert attachments array to comma-separated string for backend
      const attachmentString = Array.isArray(task.attachments) ? task.attachments.join(',') : task.attachments || '';

      // Sanitize scope and status values
      const scopeValue = allowedScopes.includes(task.scope || '') ? task.scope : 'project';
      const statusValue = allowedStatuses.includes(task.status || '') ? task.status : 'not_started';

      await updateTask(task.id, {
        assigned_to: typeof task.assigned_to === 'string' ? parseInt(task.assigned_to) : task.assigned_to,
        attachment: attachmentString,
        due_date: task.due_date === '' || task.due_date === null ? undefined : task.due_date,
        scope: scopeValue,
        status: statusValue,
      });
      onEditTask(task.id, { attachments: attachmentString, due_date: task.due_date, scope: scopeValue, status: statusValue });
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleCreateNewTask = async () => {
    if (!newTask) return;
    try {
      const allowedScopes = ['project', 'task', 'invoice', 'activity', 'member'];
      let scopeValue = '';
      if (typeof newTask.scope === 'string') {
        if (newTask.scope.includes(',')) {
          scopeValue = newTask.scope.split(',')[0].trim();
        } else {
          scopeValue = newTask.scope;
        }
      } else {
        scopeValue = jobScopes[0] || '';
      }

      // Validate scopeValue against allowedScopes
      if (!allowedScopes.includes(scopeValue)) {
        scopeValue = 'project';
      }

      if (!newTask.assigned_to || isNaN(Number(newTask.assigned_to))) {
        alert('Please select a member for the task.');
        return;
      }

      const taskToCreate = {
        ...newTask,
        project_id: projectId,
        scope: scopeValue,
        title: typeof newTask.title === 'string' ? newTask.title : '',
        action: newTask.action || '',
        assigned_to: Number(newTask.assigned_to),
        status: newTask.status || '',
        status_description: newTask.status_description || '',
        due_date: newTask.due_date === '' || newTask.due_date === undefined ? null : newTask.due_date,
        attachment: Array.isArray(newTask.attachments) ? newTask.attachments.join(',') : (newTask.attachments || ''),
        description: typeof newTask.description === 'string' ? newTask.description : '',
        priority: typeof newTask.priority === 'string' && newTask.priority !== '' ? newTask.priority : 'normal',
      };

      const createdTask = await createTask(taskToCreate);
      onAddTask(createdTask);
      setNewTask(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleDelete = async (taskId: number) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(taskId);
      onDeleteTask(taskId);
    }
  };

  const handleNewTaskFieldChange = (field: keyof Task, value: any) => {
    setNewTask(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const startCreating = () => {
    setNewTask({
      scope: jobScopes.length > 0 ? jobScopes[0] : '',
    });
    setIsCreating(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Tasks</h2>
        {!isCreating ? (
          <button
            onClick={startCreating}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Task
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleCreateNewTask}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewTask(null);
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded-md text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="p-4 overflow-x-auto rounded-lg border border-gray-200 max-h-[calc(100vh-400px)]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-30">
            <tr>
              <th scope="col" className="px-8 py-3 min-w-[225px] text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope</th>
              <th scope="col" className="px-8 py-3 min-w-[400px] text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
              <th scope="col" className="px-12 py-3 min-w-[300px] text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
              <th scope="col" className="px-8 py-3 min-w-[250px] text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-8 py-3 min-w-[350px] text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Description</th>
              <th scope="col" className="px-8 py-3 min-w-[250px] text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th scope="col" className="px-8 py-3 min-w-[300px] text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Attachment</th>
              <th scope="col" className="px-8 py-3 min-w-[250px] text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 max-h-[calc(100vh-400px)] overflow-y-auto">
            {isCreating && newTask && (
              <tr className="bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap min-w-[225px]">
                  <select
                    value={newTask.scope || (jobScopes[0] || '')}
                    onChange={(e) => handleNewTaskFieldChange('scope', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  >
                    {jobScopes.map(scope => (
                      <option key={scope} value={scope}>{scope}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-4 whitespace-nowrap min-w-[400px]">
                  <input
                    type="text"
                    value={newTask.action || ''}
                    onChange={(e) => handleNewTaskFieldChange('action', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <select
                    value={newTask.assigned_to || ''}
                    onChange={(e) => handleNewTaskFieldChange('assigned_to', Number(e.target.value))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  >
                    <option value="">Select member</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-4 whitespace-nowrap min-w-[250px]">
                  <select
                    value={newTask.status || 'not_started'}
                    onChange={(e) => handleNewTaskFieldChange('status', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </td>
                <td className="px-4 py-4 whitespace-nowrap min-w-[350px]">
                  <textarea
                    value={newTask.status_description || ''}
                    onChange={(e) => handleNewTaskFieldChange('status_description', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md resize-none"
                    rows={2}
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap min-w-[250px]">
                  <input
                    type="date"
                    value={newTask.due_date ? newTask.due_date.split('T')[0] : ''}
                    onChange={(e) => handleNewTaskFieldChange('due_date', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap min-w-[300px]">
                  <input
                    type="text"
                    value={Array.isArray(newTask.attachments) ? newTask.attachments.join(', ') : (newTask.attachments || '')}
                    onChange={(e) => handleNewTaskFieldChange('attachments', e.target.value.split(',').map(s => s.trim()))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap flex space-x-2 min-w-[250px]">
                  <button
                    onClick={handleCreateNewTask}
                    className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-md"
                    title="Save"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setNewTask(null);
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-2 py-1 rounded-md"
                    title="Cancel"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            )}
            {localTasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50">
                <td className="px-12 py-4 whitespace-nowrap min-w-[225px]">
              <select
                value={typeof task.scope === 'string' && task.scope.includes(',')
                  ? task.scope.split(',')[0].trim()
                  : (task.scope && jobScopes.includes(task.scope) ? task.scope : (jobScopes[0] || 'project'))
                }
                onChange={(e) => handleFieldChange(task.id, 'scope', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
              >
                {jobScopes.map(scope => (
                  <option key={scope} value={scope}>{scope}</option>
                ))}
              </select>
                </td>
                <td className="px-12 py-4 whitespace-nowrap min-w-[400px]">
                  <input
                    type="text"
                    value={task.action || ''}
                    onChange={(e) => handleFieldChange(task.id, 'action', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  />
                </td>
                <td className="px-12 py-4 whitespace-nowrap min-w-[300px]">
                  <select
                    value={task.assigned_to || ''}
                    onChange={(e) => handleFieldChange(task.id, 'assigned_to', Number(e.target.value))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  >
                    <option value="">Select member</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-8 py-4 whitespace-nowrap min-w-[250px]">
                  <select
                    value={task.status || 'completed'}
                    onChange={(e) => handleFieldChange(task.id, 'status', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  >
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="not_started">Not Started</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </td>
                <td className="px-8 py-4 whitespace-nowrap min-w-[350px]">
                  <textarea
                    value={task.status_description || ''}
                    onChange={(e) => handleFieldChange(task.id, 'status_description', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md resize-none"
                    rows={2}
                  />
                </td>
                <td className="px-8 py-4 whitespace-nowrap min-w-[250px]">
                  <input
                    type="date"
                    value={task.due_date ? task.due_date.split('T')[0] : ''}
                    onChange={(e) => handleFieldChange(task.id, 'due_date', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  />
                </td>
                <td className="px-8 py-4 whitespace-nowrap min-w-[300px]">
                  <input
                    type="text"
                    value={Array.isArray(task.attachments) ? task.attachments.join(', ') : (task.attachments || '')}
                    onChange={(e) => handleFieldChange(task.id, 'attachments', e.target.value.split(',').map(s => s.trim()))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  />
                </td>
                <td className="px-8 py-4 whitespace-nowrap flex space-x-2 min-w-[250px]">
                  <button
                    onClick={() => handleSave(task)}
                    title="Save"
                    className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-md"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => alert('Notify functionality not implemented')}
                    title="Notify"
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded-md"
                  >
                    !
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    title="Delete"
                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
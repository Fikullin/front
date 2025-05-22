// Fungsi-fungsi pembantu untuk tanggal dan deadline
export const isPastDeadline = (dueDate: string, status: string) => {
  if (!dueDate) return false;
  return status !== 'completed' && new Date(dueDate) < new Date();
};

export const isNearDeadline = (dueDate: string) => {
  if (!dueDate) return false;
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 3; // Within 3 days
};
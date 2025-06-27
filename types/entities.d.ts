export interface Project {
  id: number;
  name: string;
  client?: string;
  type?: string;
  start?: string;
  deadline?: string;
  monthly?: boolean;
  finished?: string;
  amount?: number;
  currency?: string;
  status?: string;
}

export interface Expense {
  id: number;
  projectId: number;
  category?: string;
  date?: string;
  amount: number;
  currency?: string;
}

export interface Task {
  id: number;
  projectId: number;
  name: string;
  description?: string;
  status: string;
  created?: string;
  finished?: string;
}

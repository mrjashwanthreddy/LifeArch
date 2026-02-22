import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// Types matching your Spring Boot DTOs
export interface Task {
    id: string;
    title: string;
    notes?: string;
    priority?: string;
    dueDatetime?: string;
    isCompleted: boolean;
    isStarred: boolean;
    projectId?: string; // <-- Add this
    groupId?: string;   // <-- Add this
}

interface TaskPage {
    content: Task[];
    totalElements: number;
    totalPages: number;
}

// 1. Hook to Fetch Tasks
export const useTasks = (page = 0, size = 20) => {
    return useQuery<TaskPage>({
        queryKey: ['tasks', page, size],
        queryFn: async () => {
            const { data } = await api.get(`/tasks?page=${page}&size=${size}`);
            return data;
        },
    });
};

// 2. Hook to Create a Task
export const useCreateTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newTask: Partial<Task>) => {
            const { data } = await api.post('/tasks', newTask);
            return data;
        },
        onSuccess: () => {
            // Invalidate the cache to automatically trigger a UI refresh
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
};

// 3. Hook to Toggle Completion
export const useToggleTaskCompletion = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (task: Task) => {
            // Send the full task back with the flipped boolean
            const updatedTask = { ...task, isCompleted: !task.isCompleted };
            const { data } = await api.put(`/tasks/${task.id}`, updatedTask);
            return data;
        },
        onSuccess: () => {
            // Refresh tasks
            queryClient.invalidateQueries({ queryKey: ['tasks'] });

            // NEW: Invalidate the points cache so the Total Score badge updates!
            queryClient.invalidateQueries({ queryKey: ['points'] });
        },
    });
};

export interface Subtask { id: string; title: string; isCompleted: boolean; }
export interface Comment { id: string; content: string; createdAt: string; }

export interface TaskDetail extends Task {
    subtasks: Subtask[];
    comments: Comment[];
}

// 1. Fetch details
export const useTaskDetails = (taskId: string | null) => {
    return useQuery<TaskDetail>({
        queryKey: ['task', taskId],
        queryFn: async () => {
            const { data } = await api.get(`/tasks/${taskId}`);
            return data;
        },
        enabled: !!taskId, // Only run if a taskId is provided
    });
};

// 2. Add Subtask
export const useAddSubtask = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (title: string) => {
            const { data } = await api.post(`/tasks/${taskId}/subtasks`, { title });
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task', taskId] }),
    });
};

// 3. Toggle Subtask
export const useToggleSubtask = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (subtaskId: string) => {
            const { data } = await api.put(`/tasks/${taskId}/subtasks/${subtaskId}`);
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task', taskId] }),
    });
};

// 4. Add Comment
export const useAddComment = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (content: string) => {
            const { data } = await api.post(`/tasks/${taskId}/comments`, { content });
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task', taskId] }),
    });
};

export interface CalendarTask {
    occurrenceId: string;
    originalTaskId: string;
    title: string;
    priority?: string;
    dueDatetime: string;
    isCompleted: boolean;
    isRecurring: boolean;
}

// Fetch calendar expanded tasks
export const useCalendarTasks = (from: string, to: string) => {
    return useQuery<CalendarTask[]>({
        queryKey: ['calendarTasks', from, to],
        queryFn: async () => {
            // Safely URL-encode the ISO strings so Spring Boot accepts them
            const safeFrom = encodeURIComponent(from);
            const safeTo = encodeURIComponent(to);
            const { data } = await api.get(`/tasks/calendar?from=${safeFrom}&to=${safeTo}`);
            return data;
        },
        enabled: !!from && !!to,
    });
};

// Hook to Move a Task between Groups
export const useMoveTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ taskId, groupId }: { taskId: string; groupId: string }) => {
            const { data } = await api.put(`/tasks/${taskId}/group/${groupId}`);
            return data;
        },
        onSuccess: () => {
            // Refresh tasks to snap it into the new column
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
};
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

import type { Tag } from './useTags';

// Types matching your Spring Boot DTOs
export interface Task {
    id: string;
    title: string;
    notes?: string;
    priority?: string;
    dueDatetime?: string;
    isCompleted: boolean;
    isStarred: boolean;
    projectId?: string;
    groupId?: string;
    tags?: Tag[];
    rrule?: string;
}

interface TaskPage {
    content: Task[];
    totalElements: number;
    totalPages: number;
}

// 1. Hook to Fetch Tasks
export interface TaskQueryParams {
    page?: number;
    size?: number;
    projectId?: string;
    isInbox?: boolean;
    isCompleted?: boolean;
    priority?: string;
    isStarred?: boolean;
}

export const useTasks = (params: TaskQueryParams = { page: 0, size: 20 }) => {
    return useQuery<TaskPage>({
        queryKey: ['tasks', params],
        queryFn: async () => {
            const queryParams = new URLSearchParams();
            if (params.page !== undefined) queryParams.append('page', params.page.toString());
            if (params.size !== undefined) queryParams.append('size', params.size.toString());
            if (params.projectId) queryParams.append('projectId', params.projectId);
            if (params.isInbox !== undefined) queryParams.append('isInbox', params.isInbox.toString());
            if (params.isCompleted !== undefined) queryParams.append('isCompleted', params.isCompleted.toString());
            if (params.priority !== undefined) queryParams.append('priority', params.priority);
            if (params.isStarred !== undefined) queryParams.append('isStarred', params.isStarred.toString());
            
            const { data } = await api.get(`/tasks?${queryParams.toString()}`);
            return data;
        },
    });
};

// 2. Hook to Create a Task
export const useCreateTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newTask: { title: string; priority?: string; dueDatetime?: string; projectId?: string; groupId?: string; isInbox?: boolean; tags?: string[]; rrule?: string; blockedByIds?: string[] }) => {
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
            const updatedTask = { ...task, isCompleted: !task.isCompleted };
            const { data } = await api.put(`/tasks/${task.id}`, updatedTask);
            return data;
        },
        onSuccess: (_data, task) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['task', task.id] });
        },
    });
};

// 4. Hook to Update a Task (title, priority, due date)
export const useUpdateTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ taskId, updates }: { taskId: string; updates: Omit<Partial<Task>, 'tags'> & { tags?: string[]; blockedByIds?: string[] } }) => {
            const { data } = await api.put(`/tasks/${taskId}`, updates);
            return data;
        },
        onSuccess: (_data, { taskId }) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
        },
    });
};

// 5. Hook to Delete a Task
export const useDeleteTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (taskId: string) => {
            await api.delete(`/tasks/${taskId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
};


export interface TaskDependency { id: string; title: string; isCompleted: boolean; }
export interface Subtask { id: string; title: string; isCompleted: boolean; }
export interface Comment { id: string; content: string; createdAt: string; }
export interface Attachment { id: string; fileName: string; fileType: string; fileSize: number; downloadUrl: string; }

export interface TaskDetail extends Task {
    rrule?: string;
    subtasks: Subtask[];
    comments: Comment[];
    blockedBy: TaskDependency[];
    blocking: TaskDependency[];
    attachments: Attachment[];
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

// 5. Add Attachment
export const useUploadAttachment = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await api.post(`/tasks/${taskId}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task', taskId] }),
    });
};

// 6. Delete Attachment
export const useDeleteAttachment = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (attachmentId: string) => {
            await api.delete(`/attachments/${attachmentId}`);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task', taskId] }),
    });
};
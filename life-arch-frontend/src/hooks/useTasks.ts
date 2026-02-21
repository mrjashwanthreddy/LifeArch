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
    projectId?: string;
    createdAt: string;
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
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
};
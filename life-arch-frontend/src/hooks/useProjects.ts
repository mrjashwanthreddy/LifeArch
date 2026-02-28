import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// --- Types ---
export interface Project {
    id: string;
    name: string;
    description?: string;
    colorHex: string;
    isArchived: boolean;
    createdAt: string;
}

export interface TaskGroup {
    id: string;
    projectId: string;
    name: string;
    sortOrder: number;
    wipLimit?: number | null;
}

// --- Hooks ---

// Fetch all active projects for the sidebar
export const useProjects = () => {
    return useQuery<Project[]>({
        queryKey: ['projects'],
        queryFn: async () => {
            const { data } = await api.get('/projects');
            return data;
        },
    });
};

// Create a new project
export const useCreateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newProject: { name: string; description?: string; colorHex?: string }) => {
            const { data } = await api.post('/projects', newProject);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });
};

// Fetch groups (Kanban columns) for a specific project
export const useProjectGroups = (projectId: string) => {
    return useQuery<TaskGroup[]>({
        queryKey: ['projects', projectId, 'groups'],
        queryFn: async () => {
            const { data } = await api.get(`/projects/${projectId}/groups`);
            return data;
        },
        enabled: !!projectId, // Only fetch if we actually have an ID
    });
};

// Create a new group (Kanban column)
export const useCreateTaskGroup = (projectId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ name, wipLimit }: { name: string; wipLimit?: number | null }) => {
            const { data } = await api.post(`/projects/${projectId}/groups`, { name, wipLimit });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'groups'] });
        },
    });
};

// Update a project
export const useUpdateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ projectId, updates }: { projectId: string; updates: { name?: string; description?: string; colorHex?: string } }) => {
            const { data } = await api.put(`/projects/${projectId}`, updates);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });
};

// Delete a project
export const useDeleteProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (projectId: string) => {
            await api.delete(`/projects/${projectId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });
};

// Update a task group
export const useUpdateTaskGroup = (projectId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ groupId, name, wipLimit }: { groupId: string; name: string; wipLimit?: number | null }) => {
            const { data } = await api.put(`/projects/${projectId}/groups/${groupId}`, { name, wipLimit });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'groups'] });
        },
    });
};

// Delete a task group
export const useDeleteTaskGroup = (projectId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (groupId: string) => {
            await api.delete(`/projects/${projectId}/groups/${groupId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'groups'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] }); // Tasks group mapping updated
        },
    });
};
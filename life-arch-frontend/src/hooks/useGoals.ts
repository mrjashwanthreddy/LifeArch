import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Goal {
    id: string;
    title: string;
    description?: string;
    targetDate?: string;     // ISO date string "YYYY-MM-DD"
    isCompleted: boolean;
    completedAt?: string;
    createdAt: string;
    daysLeft: number;
}

// Fetch all goals for the current user
export const useGoals = () => {
    return useQuery<Goal[]>({
        queryKey: ['goals'],
        queryFn: async () => {
            const { data } = await api.get('/goals');
            return data;
        },
    });
};

// Create a new goal
export const useCreateGoal = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { title: string; description?: string; targetDate?: string }) => {
            const { data } = await api.post('/goals', payload);
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
    });
};

// Mark goal as completed
export const useCompleteGoal = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (goalId: string) => {
            const { data } = await api.patch(`/goals/${goalId}/complete`);
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
    });
};

// Delete a goal
export const useDeleteGoal = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (goalId: string) => {
            await api.delete(`/goals/${goalId}`);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
    });
};

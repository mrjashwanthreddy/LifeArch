import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// --- Types ---
export interface Habit {
    id: string;
    name: string;
    description?: string;
    frequency: string;
    pointsReward: number;
    isArchived: boolean;
    createdAt: string;
    isCompletedToday: boolean;
}

export interface PointTransaction {
    id: string;
    amount: number;
    description: string;
    createdAt: string;
}

// --- Hooks ---

// 1. Fetch all active habits
export const useHabits = () => {
    return useQuery<Habit[]>({
        queryKey: ['habits'],
        queryFn: async () => {
            const { data } = await api.get('/habits');
            return data;
        },
    });
};

// 2. Create a new habit
export const useCreateHabit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newHabit: { name: string; description?: string; frequency: string; pointsReward: number }) => {
            const { data } = await api.post('/habits', newHabit);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['habits'] });
        },
    });
};

// 3. Log a habit for a specific date (Earn points)
export const useLogHabit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
            await api.post(`/habits/${habitId}/log?date=${date}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['habits'] });
            queryClient.invalidateQueries({ queryKey: ['points', 'total'] });
            queryClient.invalidateQueries({ queryKey: ['points', 'history'] });
        },
    });
};

// 4. Undo a habit log (Lose points)
export const useUnlogHabit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
            await api.delete(`/habits/${habitId}/log?date=${date}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['habits'] });
            queryClient.invalidateQueries({ queryKey: ['points', 'total'] });
            queryClient.invalidateQueries({ queryKey: ['points', 'history'] });
        },
    });
};

// 5. Fetch Total Points
export const useTotalPoints = () => {
    return useQuery<{ totalPoints: number }>({
        queryKey: ['points', 'total'],
        queryFn: async () => {
            const { data } = await api.get('/points/total');
            return data;
        },
    });
};

// 6. Fetch Point Ledger History
export const usePointHistory = () => {
    return useQuery<PointTransaction[]>({
        queryKey: ['points', 'history'],
        queryFn: async () => {
            const { data } = await api.get('/points/history');
            return data;
        },
    });
};
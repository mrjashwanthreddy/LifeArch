import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface SavedFilter {
    id: string;
    name: string;
    colorHex: string;
    queryString: string;
}

export const useSavedFilters = () => {
    return useQuery<SavedFilter[]>({
        queryKey: ['saved-filters'],
        queryFn: async () => {
            const { data } = await api.get('/saved-filters');
            return data;
        },
    });
};

export const useCreateSavedFilter = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newFilter: { name: string; colorHex?: string; queryString: string }) => {
            const { data } = await api.post('/saved-filters', newFilter);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saved-filters'] });
        },
    });
};

export const useUpdateSavedFilter = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: { name: string; colorHex?: string; queryString: string } }) => {
            const { data } = await api.put(`/saved-filters/${id}`, updates);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saved-filters'] });
        },
    });
};

export const useDeleteSavedFilter = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/saved-filters/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saved-filters'] });
        },
    });
};

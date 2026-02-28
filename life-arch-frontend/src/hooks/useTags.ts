import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Tag {
    id: string;
    name: string;
    colorHex: string;
}

export const useTags = () => {
    return useQuery<Tag[]>({
        queryKey: ['tags'],
        queryFn: async () => {
            const { data } = await api.get('/tags');
            return data;
        },
    });
};

export const useUpdateTag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, name, colorHex }: { id: string; name?: string; colorHex?: string }) => {
            const { data } = await api.put(`/tags/${id}`, { name, colorHex });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
};

export const useDeleteTag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/tags/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
};

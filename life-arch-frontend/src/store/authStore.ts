import { create } from "zustand";
import { persist } from "zustand/middleware";

interface authState {
    token: string | null;
    email: string | null;
    setAuth: (token: string, email: string) => void;
    logout: () => void;
}

export const useAuthStore = create<authState>() (
    persist(
        (set) => ({
        token: null,
        email: null,
        setAuth: (token, email) => set({ token, email }),
        logout: () => set({ token: null, email: null }),
    }), {
        name: 'life-arch-auth-storage', // key used in localStorage
    })
);

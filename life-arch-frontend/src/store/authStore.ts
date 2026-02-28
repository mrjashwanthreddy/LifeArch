import { create } from "zustand";
import { persist } from "zustand/middleware";

interface authState {
    token: string | null;
    email: string | null;
    fullName: string | null;
    setAuth: (token: string, email: string, fullName: string) => void;
    logout: () => void;
}

export const useAuthStore = create<authState>() (
    persist(
        (set) => ({
        token: null,
        email: null,
        fullName: null,
        setAuth: (token, email, fullName) => set({ token, email, fullName }),
        logout: () => set({ token: null, email: null, fullName: null }),
    }), {
        name: 'life-arch-auth-storage', // key used in localStorage
    })
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
    isDark: boolean;
    toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            isDark: false,
            toggle: () => {
                const next = !get().isDark;
                // Apply or remove the 'dark' class on <html>
                document.documentElement.classList.toggle('dark', next);
                set({ isDark: next });
            },
        }),
        { name: 'lifearch-theme' }
    )
);

// On app load, rehydrate the class from persisted state
const stored = JSON.parse(localStorage.getItem('lifearch-theme') ?? '{}');
if (stored?.state?.isDark) {
    document.documentElement.classList.add('dark');
}

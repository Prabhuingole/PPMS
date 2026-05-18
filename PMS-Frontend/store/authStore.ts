import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { User, AuthState } from '@/types';

interface AuthStore extends AuthState {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setAuth: (user: User, token: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
}

const dummyStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      updateUser: (updatedUser) => set((state) => ({ 
        user: state.user ? { ...state.user, ...updatedUser } : null 
      })),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage;
          }
        } catch (e) {
          console.warn('localStorage is blocked, falling back to dummy storage', e);
        }
        return dummyStorage;
      }),
      partialize: (state) => {
        const { _hasHydrated, setHasHydrated, ...rest } = state;
        return rest;
      },
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('An error happened during hydration', error);
          }
          // Always mark as hydrated — even if state is null (empty localStorage / Edge strict mode)
          if (state) {
            state.setHasHydrated(true);
          } else {
            // State is null when localStorage is empty or blocked; still need to unblock the UI
            useAuthStore.setState({ _hasHydrated: true });
          }
        };
      }
    }
  )
);

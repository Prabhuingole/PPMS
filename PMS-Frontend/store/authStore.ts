import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { User, AuthState } from '@/types';

interface AuthStore extends AuthState {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setAuth: (user: User, token: string) => void;
  setMfaRequired: (email: string) => void;
  clearMfaState: () => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
}

const dummyStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const customStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(name) || window.sessionStorage.getItem(name);
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem('rememberMe') === 'true') {
      window.localStorage.setItem(name, value);
    } else {
      window.sessionStorage.setItem(name, value);
    }
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(name);
    window.sessionStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      mfaEmail: null,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setAuth: (user, token) => {
        if (typeof document !== 'undefined') {
          document.cookie = `auth_token=${token}; path=/; max-age=86400; SameSite=Lax`;
        }
        set({ user, token, isAuthenticated: true, mfaEmail: null });
      },
      setMfaRequired: (email) => set({ mfaEmail: email }),
      clearMfaState: () => set({ mfaEmail: null }),
      updateUser: (updatedUser) => set((state) => ({ 
        user: state.user ? { ...state.user, ...updatedUser } : null 
      })),
      logout: () => {
        if (typeof document !== 'undefined') {
          document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
        set({ user: null, token: null, isAuthenticated: false, mfaEmail: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        try {
          if (typeof window !== 'undefined') {
            return customStorage;
          }
        } catch (e) {
          console.warn('Storage is blocked, falling back to dummy storage', e);
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
            if (typeof document !== 'undefined' && state.token) {
              document.cookie = `auth_token=${state.token}; path=/; max-age=86400; SameSite=Lax`;
            }
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

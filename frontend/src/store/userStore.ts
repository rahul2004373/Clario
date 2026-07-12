import { create } from "zustand";
import { getCurrentUser, updateProfile as apiUpdateProfile, type UpdateProfileRequest } from "@/lib/auth/api";
import type { AuthUser } from "@/lib/auth/types";

interface UserStore {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  fetchCurrentUser: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  clearProfile: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  fetchCurrentUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const { profile } = await getCurrentUser();
      set({ user: profile, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to fetch profile.",
      });
    }
  },

  updateProfile: async (data: UpdateProfileRequest) => {
    const { profile } = await apiUpdateProfile(data);
    set({ user: profile, error: null });
  },

  clearProfile: () => {
    set({ user: null, isLoading: false, error: null });
  },
}));

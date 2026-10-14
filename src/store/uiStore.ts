import { create } from 'zustand';

/** App-wide UI moments that several components wait on. */
export const useUiStore = create<{ revealed: boolean; setRevealed: () => void }>((set) => ({
  /** True once the launch splash has lifted and the app is visible. */
  revealed: false,
  setRevealed: () => set({ revealed: true }),
}));

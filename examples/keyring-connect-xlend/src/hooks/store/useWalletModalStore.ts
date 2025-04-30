import { create } from "zustand";
interface WalletModalState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}
export const useWalletModalStore = create<WalletModalState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

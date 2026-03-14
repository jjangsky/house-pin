import { create } from 'zustand';
import type { AssetInput, HousePinStore } from '@/types';

const initialAssetInput: AssetInput = {
  ownCapital: 0,
  annualIncome: 0,
  existingLoanBalance: 0,
  existingLoanPayment: 0,
  isFirstTimeBuyer: false,
  numberOfHomes: 0,
  isNewlywed: false,
  householdIncome: 0,
  loanTermYears: 30,
  repaymentType: 'equal_payment',
  transactionType: 'buy',
};

export const useHousePinStore = create<HousePinStore>((set) => ({
  currentStep: 1,
  setCurrentStep: (step) => set({ currentStep: step }),

  assetInput: initialAssetInput,
  setAssetInput: (input) =>
    set((state) => ({
      assetInput: { ...state.assetInput, ...input },
    })),

  loanResult: null,
  setLoanResult: (result) => set({ loanResult: result }),

  selectedRegions: [],
  addRegion: (region) =>
    set((state) => {
      const exists = state.selectedRegions.some((r) => r.code === region.code);
      if (exists) return state;
      return { selectedRegions: [...state.selectedRegions, region] };
    }),
  removeRegion: (code) =>
    set((state) => ({
      selectedRegions: state.selectedRegions.filter((r) => r.code !== code),
    })),
  clearRegions: () => set({ selectedRegions: [] }),

  properties: [],
  setProperties: (properties) => set({ properties }),

  reset: () =>
    set({
      currentStep: 1,
      assetInput: initialAssetInput,
      loanResult: null,
      selectedRegions: [],
      properties: [],
    }),
}));

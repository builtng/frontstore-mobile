import { create } from 'zustand';

export type BusinessType =
  | 'physical'
  | 'digital'
  | 'services'
  | 'fashion'
  | 'food'
  | 'beauty'
  | 'electronics'
  | 'creator'
  | 'other';

export type DeliveryOption = 'pickup' | 'delivery' | 'shipping' | 'digital';
export type StoreTheme =
  | 'modern'
  | 'minimal'
  | 'luxury'
  | 'creator'
  | 'fashion'
  | 'restaurant';

interface OnboardingStore {
  // Step tracking
  currentStep: number;
  totalSteps: number;

  // User data
  name: string;
  email: string;
  phone: string;

  // Business
  businessType: BusinessType | null;

  // Store
  storeName: string;
  storeUsername: string;
  storeDescription: string;
  logoUri: string | null;

  // Customization
  selectedTheme: StoreTheme | null;
  deliveryOptions: DeliveryOption[];

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setUserData: (data: Partial<Pick<OnboardingStore, 'name' | 'email' | 'phone'>>) => void;
  setBusinessType: (type: BusinessType) => void;
  setStoreData: (data: Partial<Pick<OnboardingStore, 'storeName' | 'storeUsername' | 'storeDescription'>>) => void;
  setLogoUri: (uri: string | null) => void;
  setTheme: (theme: StoreTheme) => void;
  toggleDeliveryOption: (option: DeliveryOption) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 0,
  totalSteps: 10,
  name: '',
  email: '',
  phone: '',
  businessType: null,
  storeName: '',
  storeUsername: '',
  storeDescription: '',
  logoUri: null,
  selectedTheme: null,
  deliveryOptions: [] as DeliveryOption[],
};

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, s.totalSteps - 1) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),

  setUserData: (data) => set(data),
  setBusinessType: (businessType) => set({ businessType }),
  setStoreData: (data) => set(data),
  setLogoUri: (logoUri) => set({ logoUri }),
  setTheme: (selectedTheme) => set({ selectedTheme }),

  toggleDeliveryOption: (option) => {
    const { deliveryOptions } = get();
    if (deliveryOptions.includes(option)) {
      set({ deliveryOptions: deliveryOptions.filter((o) => o !== option) });
    } else {
      set({ deliveryOptions: [...deliveryOptions, option] });
    }
  },

  reset: () => set(initialState),
}));

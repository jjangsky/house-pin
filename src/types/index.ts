export interface AssetInput {
  ownCapital: number;
  annualIncome: number;
  existingLoanBalance: number;
  existingLoanPayment: number;
  isFirstTimeBuyer: boolean;
  numberOfHomes: number;
  isNewlywed: boolean;
  householdIncome: number;
  loanTermYears: number;
  repaymentType: 'equal_payment' | 'equal_principal';
  transactionType: 'buy' | 'jeonse';
}

export interface BankComparison {
  bankName: string;
  productName: string;
  rateType: 'fixed' | 'variable' | 'mixed';
  minRate: number;
  maxRate: number;
  loanLimit: number;
  monthlyPayment: number;
}

export interface LoanResult {
  ltv: number;
  ltvBasedLimit: number;
  dsrBasedLimit: number;
  finalLoanLimit: number;
  affordablePrice: number;
  jeonseAffordable: number;
  monthlyPayment: number;
  limitingFactor: 'ltv' | 'dsr';
  policyLoans: {
    didimdol: boolean;
    bogeumjari: boolean;
    batimok: boolean;
  };
  bankComparisons: BankComparison[];
}

export interface Region {
  code: string;
  sido: string;
  sigungu: string;
}

export interface Property {
  dealAmount: number;
  buildYear: number;
  dealYear: number;
  dealMonth: number;
  dealDay: number;
  dong: string;
  name: string;
  area: number;
  floor: number;
  jibun: string;
  regionCode: string;
  lat?: number;
  lng?: number;
  propertyType: 'apartment' | 'villa' | 'officetel';
}

export interface HousePinStore {
  currentStep: number;
  setCurrentStep: (step: number) => void;

  assetInput: AssetInput;
  setAssetInput: (input: Partial<AssetInput>) => void;

  loanResult: LoanResult | null;
  setLoanResult: (result: LoanResult) => void;

  selectedRegions: Region[];
  addRegion: (region: Region) => void;
  removeRegion: (code: string) => void;
  clearRegions: () => void;

  properties: Property[];
  setProperties: (properties: Property[]) => void;

  liveListings: import('./listing').LiveListing[];
  setLiveListings: (listings: import('./listing').LiveListing[]) => void;

  reset: () => void;

  _hasHydrated: boolean;
}

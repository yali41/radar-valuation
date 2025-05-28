
export enum Language {
  EN = 'en',
  AR = 'ar',
}

export interface Currency {
  code: string; // e.g., USD, EUR, SAR
  name: string;
  nameAr: string;
  symbol: string;
}

export interface Country {
  code: string;
  name: string;
  nameAr: string;
  defaultCurrencyCode: string; // For suggesting a default currency
}

export interface Sector {
  id: string;
  name: string;
  nameAr: string;
}

export interface ValuationMethod {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  inputs: Array<'revenue' | 'ebitda' | 'netIncome' | 'totalAssets' | 'totalLiabilities' | 'dcfSpecific' | 'benchmarkInputs'>; // To control which inputs show
}

// For DCF specific inputs
export interface DCFSpecificData {
  projectionYears?: number; // e.g., 5
  projectedFCF?: (number | undefined)[]; // Array for FCF for each projection year, allowing undefined for empty inputs
  discountRate?: number; // WACC as a percentage, e.g., 10 for 10%
  terminalGrowthRate?: number; // As a percentage, e.g., 2 for 2%
}

export interface FinancialData {
  revenue?: number;
  ebitda?: number;
  netIncome?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  dcfSpecifics?: DCFSpecificData;

  // User-provided benchmarks (Optional)
  userCountryRiskPremium?: number; // For WACC consideration, as %
  userSectorGrowthRate?: number;   // For FCF projection or terminal growth, as %
  userIndustryPERatio?: number;    // For Comps method
  userIndustryEVEBITDAMultiple?: number; // For Comps method
  userIndustryRevenueMultiple?: number; // For Market Multiples method
}

export interface ValuationFormData {
  companyName: string;
  country: string; // country code
  sector: string; // sector id
  valuationMethod: string; // method id
  currency: string; // currency code
  financials: FinancialData;
}

export interface ValuationResult {
  estimatedValue: number;
  currency: string; // currency code used for the valuation
  summary: string;
  summaryAr: string;
  methodUsed: string; // method id
  calculationExplanation: string; // Detailed step-by-step calculation in English
  calculationExplanationAr: string; // Detailed step-by-step calculation in Arabic
  // Optional: include some key inputs in the result for transparency
  dcfInputsUsed?: {
    projectionYears?: number;
    discountRate?: number;
    terminalGrowthRate?: number;
  }
  benchmarksUsed?: Partial<Pick<FinancialData, 'userCountryRiskPremium' | 'userSectorGrowthRate' | 'userIndustryPERatio' | 'userIndustryEVEBITDAMultiple' | 'userIndustryRevenueMultiple'>>;
}

export interface Translations {
  [key: string]: string | Translations;
}

export interface AllTranslations {
  en: Translations;
  ar: Translations;
}

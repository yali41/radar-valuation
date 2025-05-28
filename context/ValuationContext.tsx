
import React, { createContext, useState, ReactNode } from 'react';
import { ValuationFormData, ValuationResult } from '../types';

interface ValuationContextType {
  formData: ValuationFormData | null;
  setFormData: (data: ValuationFormData | null) => void;
  result: ValuationResult | null;
  setResult: (result: ValuationResult | null) => void;
}

export const ValuationContext = createContext<ValuationContextType>({
  formData: null,
  setFormData: () => {},
  result: null,
  setResult: () => {},
});

interface ValuationProviderProps {
  children: ReactNode;
}

export const ValuationProvider: React.FC<ValuationProviderProps> = ({ children }) => {
  const [formData, setFormData] = useState<ValuationFormData | null>(null);
  const [result, setResult] = useState<ValuationResult | null>(null);

  return (
    <ValuationContext.Provider value={{ formData, setFormData, result, setResult }}>
      {children}
    </ValuationContext.Provider>
  );
};

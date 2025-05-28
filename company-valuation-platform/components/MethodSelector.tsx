
import React from 'react';
import { VALUATION_METHODS } from '../constants';
import { ValuationMethod } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface MethodSelectorProps {
  selectedMethod: string;
  onChange: (methodId: string) => void;
}

export const MethodSelector: React.FC<MethodSelectorProps> = ({ selectedMethod, onChange }) => {
  const { t, language } = useTranslations();

  return (
    <div>
      <label htmlFor="valuationMethod" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
        {t('valuationFormPage.valuationMethod')}
      </label>
      <select
        id="valuationMethod"
        name="valuationMethod"
        value={selectedMethod}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
      >
        <option value="">{t('valuationFormPage.selectMethod')}</option>
        {VALUATION_METHODS.map((method: ValuationMethod) => (
          <option key={method.id} value={method.id}>
            {language === 'ar' ? method.nameAr : method.name}
          </option>
        ))}
      </select>
      {selectedMethod && (
        <p className="mt-2 text-xs text-secondary-500 dark:text-secondary-400">
          {language === 'ar' ? VALUATION_METHODS.find(m=>m.id === selectedMethod)?.descriptionAr : VALUATION_METHODS.find(m=>m.id === selectedMethod)?.description}
        </p>
      )}
    </div>
  );
};

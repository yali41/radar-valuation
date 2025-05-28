
import React from 'react';
import { COUNTRIES } from '../constants';
import { Country } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface CountrySelectorProps {
  selectedCountry: string;
  onChange: (countryCode: string) => void;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({ selectedCountry, onChange }) => {
  const { t, language } = useTranslations();

  return (
    <div>
      <label htmlFor="country" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
        {t('valuationFormPage.country')}
      </label>
      <select
        id="country"
        name="country"
        value={selectedCountry}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
      >
        <option value="">{t('valuationFormPage.selectCountry')}</option>
        {COUNTRIES.map((country: Country) => (
          <option key={country.code} value={country.code}>
            {language === 'ar' ? country.nameAr : country.name}
          </option>
        ))}
      </select>
    </div>
  );
};

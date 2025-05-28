
import React from 'react';
import { SECTORS } from '../constants';
import { Sector } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface SectorSelectorProps {
  selectedSector: string;
  onChange: (sectorId: string) => void;
}

export const SectorSelector: React.FC<SectorSelectorProps> = ({ selectedSector, onChange }) => {
  const { t, language } = useTranslations();

  return (
    <div>
      <label htmlFor="sector" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
        {t('valuationFormPage.sector')}
      </label>
      <select
        id="sector"
        name="sector"
        value={selectedSector}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
      >
        <option value="">{t('valuationFormPage.selectSector')}</option>
        {SECTORS.map((sector: Sector) => (
          <option key={sector.id} value={sector.id}>
            {language === 'ar' ? sector.nameAr : sector.name}
          </option>
        ))}
      </select>
    </div>
  );
};

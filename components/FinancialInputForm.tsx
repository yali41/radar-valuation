
import React from 'react';
import { FinancialData, ValuationMethod, DCFSpecificData, Currency } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { VALUATION_METHODS, CURRENCIES, COUNTRIES } from '../constants';

interface InputFieldProps {
  label: string;
  id: string; 
  value?: string | number;
  onChange: (id: string, value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  tooltip?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, id, value, onChange, placeholder, type = "number", required = false, min, max, step, unit, tooltip }) => {
  const { dir } = useTranslations();
  return (
  <div className="relative group">
    <label htmlFor={id} className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
      {label} {unit && <span className="text-xs">({unit})</span>}
      {tooltip && (
        <span className={`
          ${dir === 'rtl' ? 'mr-2' : 'ml-2'} 
          inline-block cursor-help text-xs text-primary-500 border border-primary-400 rounded-full w-4 h-4 flex items-center justify-center
        `}>
          ?
        </span>
      )}
    </label>
    <div className="relative">
      <input
        type={type}
        name={id}
        id={id}
        value={value === undefined || value === null ? '' : String(value)}
        onChange={(e) => onChange(id, e.target.value)}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        className={`mt-1 block w-full shadow-sm sm:text-sm border-secondary-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md p-2 focus:ring-primary-500 focus:border-primary-500 ${unit ? (type === 'number' ? 'pr-10 rtl:pl-10 rtl:pr-2' : '') : ''}`}
      />
      {unit && type === 'number' && (
         <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0">
           <span className="text-secondary-500 sm:text-sm">
             {unit}
           </span>
         </div>
      )}
    </div>
    {tooltip && (
      <div className={`
        absolute z-10 invisible group-hover:visible 
        bg-secondary-800 text-white text-xs rounded py-1 px-2 
        ${dir === 'rtl' ? 'right-0' : 'left-0'} bottom-full mb-2 min-w-max max-w-xs
        transition-opacity duration-200 opacity-0 group-hover:opacity-100
      `}>
        {tooltip}
      </div>
    )}
  </div>
  );
};


const CurrencySelector: React.FC<{
  selectedCurrency: string;
  onChange: (currencyCode: string) => void;
  label: string;
  selectLabel: string;
}> = ({ selectedCurrency, onChange, label, selectLabel }) => {
  const { language } = useTranslations();
  return (
    <div>
      <label htmlFor="currency" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
        {label}
      </label>
      <select
        id="currency"
        name="currency"
        value={selectedCurrency}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
      >
        <option value="">{selectLabel}</option>
        {CURRENCIES.map((currency: Currency) => (
          <option key={currency.code} value={currency.code}>
            {language === 'ar' ? `${currency.nameAr} (${currency.symbol})` : `${currency.name} (${currency.symbol})`}
          </option>
        ))}
      </select>
    </div>
  );
};

interface FinancialInputFormProps {
  financials: FinancialData;
  selectedMethodId: string;
  selectedCountryCode: string; 
  selectedCurrency: string;
  onFinancialChange: (field: keyof FinancialData | `dcfSpecifics.${keyof DCFSpecificData}` | `dcfSpecifics.projectedFCF.${number}`, value: string) => void;
  onCurrencyChange: (currencyCode: string) => void;
}


export const FinancialInputForm: React.FC<FinancialInputFormProps> = ({ financials, selectedMethodId, selectedCountryCode, selectedCurrency, onFinancialChange, onCurrencyChange }) => {
  const { t, language, dir } = useTranslations();
  const selectedMethod = VALUATION_METHODS.find(m => m.id === selectedMethodId);

  const handleInputChange = (fieldKey: string, value: string) => {
    onFinancialChange(fieldKey as any, value);
  };
  
  const defaultProjectionYears = financials.dcfSpecifics?.projectionYears ?? 3;

  const renderStandardInputs = () => {
    const inputsToShow = selectedMethod?.inputs.filter(input => input !== 'dcfSpecific' && input !== 'benchmarkInputs');
    if (!inputsToShow || inputsToShow.length === 0) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {inputsToShow.includes('revenue') && (
          <InputField
            label={t('valuationFormPage.revenue')}
            id="revenue"
            value={financials.revenue}
            onChange={handleInputChange}
            placeholder={t('valuationFormPage.revenue').split(' (')[1]?.slice(0, -1) || "e.g. 1,000,000"}
            required
          />
        )}
        {inputsToShow.includes('ebitda') && (
          <InputField
            label={t('valuationFormPage.ebitda')}
            id="ebitda"
            value={financials.ebitda}
            onChange={handleInputChange}
            placeholder={t('valuationFormPage.ebitda').split(' (')[1]?.slice(0, -1) || "e.g. 250,000"}
            required={selectedMethod?.inputs.includes('ebitda')}
          />
        )}
        {inputsToShow.includes('netIncome') && (
          <InputField
            label={t('valuationFormPage.netIncome')}
            id="netIncome"
            value={financials.netIncome}
            onChange={handleInputChange}
            placeholder={t('valuationFormPage.netIncome').split(' (')[1]?.slice(0, -1) || "e.g. 100,000"}
            required={selectedMethod?.inputs.includes('netIncome')}
          />
        )}
        {inputsToShow.includes('totalAssets') && (
          <InputField
            label={t('valuationFormPage.totalAssets')}
            id="totalAssets"
            value={financials.totalAssets}
            onChange={handleInputChange}
            placeholder={t('valuationFormPage.totalAssets').split(' (')[1]?.slice(0, -1) || "e.g. 2,000,000"}
            required={selectedMethod?.inputs.includes('totalAssets')}
          />
        )}
        {inputsToShow.includes('totalLiabilities') && (
          <InputField
            label={t('valuationFormPage.totalLiabilities')}
            id="totalLiabilities"
            value={financials.totalLiabilities}
            onChange={handleInputChange}
            placeholder={t('valuationFormPage.totalLiabilities').split(' (')[1]?.slice(0, -1) || "e.g. 500,000"}
            required={selectedMethod?.inputs.includes('totalLiabilities')}
          />
        )}
      </div>
    );
  };

  const renderDCFInputs = () => {
    if (!selectedMethod?.inputs.includes('dcfSpecific')) return null;
    
    return (
      <div className="space-y-6 p-4 border border-primary-200 dark:border-primary-700 rounded-md bg-primary-50 dark:bg-secondary-800">
        <h4 className="text-md font-semibold text-primary-700 dark:text-primary-300">
          {t('valuationFormPage.dcfInputs')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <InputField
            label={t('valuationFormPage.projectionYears')}
            id="dcfSpecifics.projectionYears"
            value={financials.dcfSpecifics?.projectionYears ?? ''}
            onChange={handleInputChange}
            placeholder="3-7"
            type="number"
            min={1}
            max={10}
            step={1}
            required
            unit={t('common.years')}
          />
          <InputField
            label={t('valuationFormPage.discountRate')}
            id="dcfSpecifics.discountRate"
            value={financials.dcfSpecifics?.discountRate ?? ''}
            onChange={handleInputChange}
            placeholder="e.g. 8 or 12.5"
            type="number"
            step={0.1}
            required
            unit={t('common.percentageSymbol')}
            tooltip={t('valuationFormPage.userCountryRiskPremiumTooltip')}
          />
          <InputField
            label={t('valuationFormPage.terminalGrowthRate')}
            id="dcfSpecifics.terminalGrowthRate"
            value={financials.dcfSpecifics?.terminalGrowthRate ?? ''}
            onChange={handleInputChange}
            placeholder="e.g. 2 or 2.5"
            type="number"
            step={0.1}
            required
            unit={t('common.percentageSymbol')}
          />
        </div>
        <div className="space-y-3 mt-4">
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
             {t('valuationFormPage.projectedFCFYear', {year: ''}).replace(' Year ', '')} ({selectedCurrency || 'Selected Currency'})
          </label>
          {Array.from({ length: defaultProjectionYears }, (_, i) => (
            <InputField
              key={`fcf-${i}`}
              label={t('valuationFormPage.projectedFCFYear', { year: i + 1 })}
              id={`dcfSpecifics.projectedFCF.${i}`}
              value={financials.dcfSpecifics?.projectedFCF?.[i] ?? ''}
              onChange={handleInputChange}
              placeholder={t('valuationFormPage.projectedFCFPlaceholder', {year: i + 1})}
              type="number"
              required
            />
          ))}
        </div>
      </div>
    );
  };

  const renderBenchmarkInputs = () => {
    if (!selectedMethod?.inputs.includes('benchmarkInputs')) return null;

    return (
      <div className="mt-6 p-4 border border-amber-300 dark:border-amber-600 rounded-md bg-amber-50 dark:bg-secondary-800 space-y-6">
        <div className="flex items-center">
            <h4 className="text-md font-semibold text-amber-700 dark:text-amber-300">
            {t('valuationFormPage.benchmarkData')}
            </h4>
            <span 
                className={`
                ${dir === 'rtl' ? 'mr-2' : 'ml-2'} 
                inline-block cursor-help text-xs text-amber-600 border border-amber-500 rounded-full w-4 h-4 flex items-center justify-center relative group
                `}
            >
            ?
            <span className={`
                absolute z-10 invisible group-hover:visible 
                bg-secondary-800 text-white text-xs rounded py-1 px-2 
                ${dir === 'rtl' ? 'right-0' : 'left-0'} bottom-full mb-2 min-w-[250px] max-w-xs
                transition-opacity duration-200 opacity-0 group-hover:opacity-100
            `}>
                {t('valuationFormPage.benchmarkInfoTooltip')}
            </span>
            </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* DCF related benchmarks */}
          {selectedMethodId === 'dcf' && (
            <>
              <InputField
                label={t('valuationFormPage.userCountryRiskPremium')}
                id="userCountryRiskPremium"
                value={financials.userCountryRiskPremium ?? ''}
                onChange={handleInputChange}
                placeholder={t('valuationFormPage.userCountryRiskPremiumPlaceholder')}
                unit={t('common.percentageSymbol')}
                tooltip={t('valuationFormPage.userCountryRiskPremiumTooltip')}
              />
              <InputField
                label={t('valuationFormPage.userSectorGrowthRate')}
                id="userSectorGrowthRate"
                value={financials.userSectorGrowthRate ?? ''}
                onChange={handleInputChange}
                placeholder={t('valuationFormPage.userSectorGrowthRatePlaceholder')}
                unit={t('common.percentageSymbol')}
                tooltip={t('valuationFormPage.userSectorGrowthRateTooltip')}
              />
            </>
          )}

          {/* Comps related benchmarks */}
          {selectedMethodId === 'comps' && (
            <>
              <InputField
                label={t('valuationFormPage.userIndustryPERatio')}
                id="userIndustryPERatio"
                value={financials.userIndustryPERatio ?? ''}
                onChange={handleInputChange}
                placeholder={t('valuationFormPage.userIndustryPERatioPlaceholder')}
                tooltip={t('valuationFormPage.userIndustryPERatioTooltip')}
              />
              <InputField
                label={t('valuationFormPage.userIndustryEVEBITDAMultiple')}
                id="userIndustryEVEBITDAMultiple"
                value={financials.userIndustryEVEBITDAMultiple ?? ''}
                onChange={handleInputChange}
                placeholder={t('valuationFormPage.userIndustryEVEBITDAMultiplePlaceholder')}
                tooltip={t('valuationFormPage.userIndustryEVEBITDAMultipleTooltip')}
              />
            </>
          )}

          {/* Market Multiples related benchmarks */}
          {selectedMethodId === 'multiples' && (
            <InputField
              label={t('valuationFormPage.userIndustryRevenueMultiple')}
              id="userIndustryRevenueMultiple"
              value={financials.userIndustryRevenueMultiple ?? ''}
              onChange={handleInputChange}
              placeholder={t('valuationFormPage.userIndustryRevenueMultiplePlaceholder')}
              tooltip={t('valuationFormPage.userIndustryRevenueMultipleTooltip')}
            />
          )}
        </div>
      </div>
    );
  };


  return (
    <div className="space-y-6">
       <CurrencySelector
        selectedCurrency={selectedCurrency}
        onChange={onCurrencyChange}
        label={t('valuationFormPage.currency')}
        selectLabel={t('valuationFormPage.selectCurrency')}
      />
      {renderStandardInputs()}
      {renderDCFInputs()}
      {renderBenchmarkInputs()}
    </div>
  );
};

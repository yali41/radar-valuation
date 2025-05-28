
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/PageContainer';
import { CountrySelector } from '../components/CountrySelector';
import { SectorSelector } from '../components/SectorSelector';
import { MethodSelector } from '../components/MethodSelector';
import { FinancialInputForm } from '../components/FinancialInputForm';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ValuationContext } from '../context/ValuationContext';
import { FinancialData, ValuationFormData, ValuationResult, DCFSpecificData, Language } from '../types';
import { useTranslations, getNestedTranslation } from '../hooks/useTranslations';
import { VALUATION_METHODS, COUNTRIES, CURRENCIES, TRANSLATIONS, SECTORS } from '../constants';

interface DCFCalculationDetails {
  fcfInputs: (number | undefined)[];
  wacc: number;
  terminalGrowth: number;
  projectionYears: number;
  pvProjectedFCFSum: number;
  pvCalcs: string[];
  lastFCF: number;
  terminalValueCalc: number;
  tvFormulaKey: string;
  pvTerminalValueCalc: number;
  enterpriseValue: number;
  liquidityDiscountFactor: number;
  liquidityDiscountPercentage: number;
  discountedEv: number;
  minValApplied: boolean;
  finalVal: number;
  userSectorGrowthRateUsed?: number; 
}

export const ValuationFormPage: React.FC = () => {
  const { t, language: currentGlobalLanguage } = useTranslations(); // Renamed to avoid clash with 'lang' parameter
  const navigate = useNavigate();
  const { setFormData: setGlobalFormData, setResult: setGlobalResult } = useContext(ValuationContext);

  const [companyName, setCompanyName] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [financials, setFinancials] = useState<FinancialData>({ dcfSpecifics: { projectedFCF: [] } });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCountry) {
      const country = COUNTRIES.find(c => c.code === selectedCountry);
      const defaultCurrency = CURRENCIES.find(curr => curr.code === country?.defaultCurrencyCode);
      if (defaultCurrency) {
        setSelectedCurrency(defaultCurrency.code);
      } else if (CURRENCIES.length > 0) {
        setSelectedCurrency(CURRENCIES[0].code); 
      }
    } else {
        setSelectedCurrency(''); 
    }
  }, [selectedCountry]);


  const translateForLanguage = (
    lang: Language, 
    key: string, 
    options?: Record<string, string | number | undefined>
  ): string => {
    const translationsForLang = TRANSLATIONS[lang];
    let rawText = getNestedTranslation(translationsForLang, key);
  
    if (rawText === undefined) {
      console.warn(`Translation key "${key}" not found for language "${lang}". Falling back to EN or key.`);
      // Fallback to English if primary lang translation is missing, then to key
      if (lang !== Language.EN) {
        rawText = getNestedTranslation(TRANSLATIONS[Language.EN], key);
      }
      if (rawText === undefined) {
        rawText = key;
      }
    }
  
    let textToReturn = rawText;
    if (typeof options === 'object' && options !== null && typeof textToReturn === 'string') {
      Object.entries(options).forEach(([placeholder, value]) => {
        if (value !== undefined) {
          textToReturn = textToReturn.replace(new RegExp(`{${placeholder}}`, 'g'), String(value));
        }
      });
    }
    return typeof textToReturn === 'string' ? textToReturn : key;
  };

  const formatNumber = (num: number | undefined, lang: Language, options?: Intl.NumberFormatOptions): string => {
    if (num === undefined) return 'N/A';
    return num.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', options);
  };

  const formatCurrency = (num: number | undefined, currencyCode: string, lang: Language): string => {
    if (num === undefined) return 'N/A';
    const currencyInfo = CURRENCIES.find(c => c.code === currencyCode);
    try {
      return num.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { 
        style: 'currency', 
        currency: currencyCode, 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
      });
    } catch (e) {
      return `${currencyInfo?.symbol || currencyCode} ${formatNumber(num, lang, {minimumFractionDigits:0, maximumFractionDigits:0})}`;
    }
  };


  const handleFinancialChange = (
    field: keyof FinancialData | `dcfSpecifics.${keyof DCFSpecificData}` | `dcfSpecifics.projectedFCF.${number}`, 
    value: string
    ) => {
    
    const val = value === '' ? undefined : parseFloat(value);
    // Allow empty string for temporary clearing, but validate on submit
    // companyName is a string and handled separately, so no need for 'field !== companyName' here.
    if (value !== '' && isNaN(val as number)) { 
        setError(t('valuationFormPage.errorInvalidNumber'));
        return; // Keep the old value or handle as error
    } else {
        setError(null); // Clear error if current input is valid or empty
    }

    setFinancials(prev => {
      const newFinancials = JSON.parse(JSON.stringify(prev)); 

      if (field.startsWith('dcfSpecifics.projectedFCF.')) {
        const index = parseInt(field.split('.').pop() as string, 10);
        if (!newFinancials.dcfSpecifics) newFinancials.dcfSpecifics = {};
        if (!newFinancials.dcfSpecifics.projectedFCF) newFinancials.dcfSpecifics.projectedFCF = [];
        newFinancials.dcfSpecifics.projectedFCF[index] = val;
      } else if (field.startsWith('dcfSpecifics.')) {
        const dcfField = field.substring('dcfSpecifics.'.length) as keyof DCFSpecificData;
        if (!newFinancials.dcfSpecifics) newFinancials.dcfSpecifics = {};
        newFinancials.dcfSpecifics[dcfField] = val;
        if (dcfField === 'projectionYears' && val !== undefined && val > 0) { // ensure val is positive
            const currentFCFs = newFinancials.dcfSpecifics.projectedFCF || [];
            const newFCFs = Array(Math.min(val,10)).fill(undefined); // Limit projection years for UI practicality
            for(let i=0; i < Math.min(currentFCFs.length, newFCFs.length); i++) {
                newFCFs[i] = currentFCFs[i];
            }
            newFinancials.dcfSpecifics.projectedFCF = newFCFs;
        } else if (dcfField === 'projectionYears' && (val === undefined || val <=0) ) {
             newFinancials.dcfSpecifics.projectedFCF = []; // Clear FCFs if years is invalid
        }
      } else {
        newFinancials[field as keyof FinancialData] = val;
      }
      return newFinancials;
    });
  };
  
  const mockCalculateDCF = (dcfData: DCFSpecificData, userBenchmarks: FinancialData): { finalValue: number, details: DCFCalculationDetails} => {
    const { projectedFCF = [], discountRate = 10, projectionYears = 3 } = dcfData;
    let { terminalGrowthRate = 2 } = dcfData; // Make it let
    
    let userSectorGrowthRateUsedForTerminal: number | undefined = undefined;
    if (userBenchmarks.userSectorGrowthRate !== undefined) {
        terminalGrowthRate = userBenchmarks.userSectorGrowthRate; 
        userSectorGrowthRateUsedForTerminal = userBenchmarks.userSectorGrowthRate;
    }

    const waccInput = discountRate || 0;
    const wacc = waccInput / 100;
    const terminalGrowth = (terminalGrowthRate || 0) / 100;


    const pvCalcs: string[] = [];
    let pvProjectedFCFSum = 0;
    const fcfInputs = projectedFCF.map(fcf => fcf || 0);

    for (let i = 0; i < (projectionYears || 0); i++) {
      const fcf = fcfInputs[i] || 0;
      const pv = fcf / Math.pow(1 + wacc, i + 1);
      pvProjectedFCFSum += pv;
      // Actual calculation strings will be generated in buildDcfExplanation with correct language formatting
    }
    
    const lastFCF = fcfInputs[(projectionYears || 1) - 1] || (fcfInputs[0] || 100000) * Math.pow(1.02, (projectionYears || 1)-1) ;
    let terminalValueCalc = 0;
    let tvFormulaKey = 'tvGGM';
    if (wacc > terminalGrowth && (wacc - terminalGrowth !== 0)) {
        terminalValueCalc = (lastFCF * (1 + terminalGrowth)) / (wacc - terminalGrowth);
    } else { 
        terminalValueCalc = lastFCF * 10; // Fallback multiplier
        tvFormulaKey = 'tvFallback';
    }

    const pvTerminalValueCalc = terminalValueCalc / Math.pow(1 + wacc, (projectionYears || 0));
    const enterpriseValue = pvProjectedFCFSum + pvTerminalValueCalc;
    
    const liquidityDiscountFactor = 0.8; 
    const liquidityDiscountPercentage = 20;
    const discountedEv = enterpriseValue * liquidityDiscountFactor;
    
    const minDCFValue = 50000;
    const finalVal = Math.max(minDCFValue, Math.round(discountedEv));
    const minValApplied = finalVal === minDCFValue && discountedEv < minDCFValue;

    return {
        finalValue: finalVal,
        details: {
            fcfInputs: projectedFCF, // Keep undefined for display
            wacc, // This is decimal
            terminalGrowth, // This is decimal
            projectionYears: projectionYears || 0,
            pvProjectedFCFSum,
            pvCalcs, // To be populated by buildDcfExplanation
            lastFCF,
            terminalValueCalc,
            tvFormulaKey,
            pvTerminalValueCalc,
            enterpriseValue,
            liquidityDiscountFactor,
            liquidityDiscountPercentage,
            discountedEv,
            minValApplied,
            finalVal,
            userSectorGrowthRateUsed: userSectorGrowthRateUsedForTerminal
        }
    };
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const currentMethodDetails = VALUATION_METHODS.find(m => m.id === selectedMethod);

    if (!companyName || !selectedCountry || !selectedSector || !selectedMethod || !selectedCurrency) {
      setError(t('valuationFormPage.errorFillFields'));
      return;
    }

    let formIsValid = true;
    if (currentMethodDetails) {
        for (const inputKey of currentMethodDetails.inputs) {
            if (inputKey === 'dcfSpecific') {
                if (!financials.dcfSpecifics?.projectionYears || financials.dcfSpecifics.projectionYears <=0 ||
                    financials.dcfSpecifics?.discountRate === undefined || 
                    financials.dcfSpecifics?.terminalGrowthRate === undefined ||
                    !financials.dcfSpecifics?.projectedFCF?.length ||
                    financials.dcfSpecifics.projectedFCF.length !== financials.dcfSpecifics.projectionYears ||
                    financials.dcfSpecifics.projectedFCF.some(fcf => fcf === undefined || isNaN(fcf))) {
                    setError(t('valuationFormPage.errorFillFields') + ` (DCF Inputs: Ensure all fields are filled, years match FCF entries, and all are valid numbers)`);
                    formIsValid = false; break;
                }
            } else if (inputKey !== 'benchmarkInputs') { 
                if (financials[inputKey] === undefined || isNaN(financials[inputKey] as number)) {
                     setError(t('valuationFormPage.errorFillFields') + ` (${inputKey})`);
                     formIsValid = false; break;
                }
            }
        }
    }
    if (!formIsValid) return;
    
    setIsLoading(true);

    const formData: ValuationFormData = {
      companyName,
      country: selectedCountry,
      sector: selectedSector,
      valuationMethod: selectedMethod,
      currency: selectedCurrency,
      financials,
    };
    setGlobalFormData(formData);

    await new Promise(resolve => setTimeout(resolve, 1500));

    let estimatedValue = 0;
    let calcExplanationEn = "";
    let calcExplanationAr = "";
    const methodDetails = VALUATION_METHODS.find(m => m.id === selectedMethod);
    const currencyInfo = CURRENCIES.find(c => c.code === selectedCurrency);
    
    const getMethodNameForLang = (lang: Language) => translateForLanguage(lang, methodDetails?.id ? `valuationMethods.${methodDetails.id}.name` : selectedMethod);
    
    const commonIntro = (lang: Language) => translateForLanguage(lang, 'resultsPage.calculationDetails.introduction', { methodName: lang === Language.AR ? methodDetails?.nameAr : methodDetails?.name });
    const dataSourceNote = (lang: Language) => translateForLanguage(lang, 'resultsPage.calculationDetails.dataSourceNote');


    const benchmarksUsed: ValuationResult['benchmarksUsed'] = {};
    if (financials.userCountryRiskPremium !== undefined) benchmarksUsed.userCountryRiskPremium = financials.userCountryRiskPremium;
    if (financials.userSectorGrowthRate !== undefined) benchmarksUsed.userSectorGrowthRate = financials.userSectorGrowthRate;
    if (financials.userIndustryPERatio !== undefined) benchmarksUsed.userIndustryPERatio = financials.userIndustryPERatio;
    if (financials.userIndustryEVEBITDAMultiple !== undefined) benchmarksUsed.userIndustryEVEBITDAMultiple = financials.userIndustryEVEBITDAMultiple;
    if (financials.userIndustryRevenueMultiple !== undefined) benchmarksUsed.userIndustryRevenueMultiple = financials.userIndustryRevenueMultiple;


    if (selectedMethod === 'dcf' && financials.dcfSpecifics) {
        const dcfResult = mockCalculateDCF(financials.dcfSpecifics, financials); 
        estimatedValue = dcfResult.finalValue;
        const d = dcfResult.details;

        const buildDcfExplanation = (lang: Language): string => {
            let exp = `${commonIntro(lang)}\n${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.intro')}\n\n`;
            
            exp += `**${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.waccExplanationTitle')}**\n`;
            exp += `${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.waccExplanation')}\n`;
            if (financials.userCountryRiskPremium !== undefined) {
                 exp += `(${translateForLanguage(lang,'resultsPage.benchmarksUsedTitle')} ${translateForLanguage(lang,'valuationFormPage.userCountryRiskPremium')}: ${formatNumber(financials.userCountryRiskPremium, lang)}%)\n`;
            }
            exp += `\n`;

            exp += `**${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.fcfExplanationTitle')}**\n`;
            exp += `${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.fcfExplanation')}\n\n`;

            exp += `**${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.inputsHeader')}**\n`;
            exp += `- ${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.projectionPeriod', { value: formatNumber(d.projectionYears, lang) })}\n`;
            exp += `- ${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.wacc', { value: formatNumber(financials.dcfSpecifics?.discountRate, lang) })}\n`;
            exp += `- ${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.terminalGrowth', { value: formatNumber(d.terminalGrowth * 100, lang) })}\n`;
            if (d.userSectorGrowthRateUsed !== undefined) {
                exp += `  (${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.userSectorGrowthRateUsed', {value: formatNumber(d.userSectorGrowthRateUsed, lang)})})\n`;
            }
            exp += `${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.fcfList')}\n`;
            (d.fcfInputs as (number | undefined)[]).forEach((fcf, i) => {
                exp += `  - ${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.fcfYear', { year: i + 1, value: formatCurrency(fcf, selectedCurrency, lang) })}\n`;
            });

            exp += `\n**${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.step1Header')}**\n`;
            exp += `${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.step1Desc', { pvSum: formatCurrency(d.pvProjectedFCFSum, selectedCurrency, lang) })}\n`;
            (d.fcfInputs as (number|undefined)[]).forEach((fcfVal, i) => {
                 const pvFcf = (fcfVal || 0) / Math.pow(1 + d.wacc, i + 1);
                 exp += `  - ${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.pvFcfCalc', { year: i + 1, fcf: formatCurrency(fcfVal,selectedCurrency, lang), waccDecimal: d.wacc.toFixed(4), pvFcf: formatCurrency(pvFcf,selectedCurrency, lang) })}\n`;
            });

            exp += `\n**${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.step2Header')}**\n`;
            exp += `${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.step2Desc', { lastFcf: formatCurrency(d.lastFCF, selectedCurrency, lang) })}\n`;
            const tvKey = d.tvFormulaKey === 'tvGGM' ? 'resultsPage.calculationDetails.dcf.tvGGM' : 'resultsPage.calculationDetails.dcf.tvFallback';
            exp += `  - ${translateForLanguage(lang, tvKey, { lastFcf: formatCurrency(d.lastFCF,selectedCurrency, lang), terminalGrowthDecimal: d.terminalGrowth.toFixed(4), waccDecimal: d.wacc.toFixed(4), tv: formatCurrency(d.terminalValueCalc,selectedCurrency, lang) })}\n`;
            
            exp += `\n**${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.step3Header')}**\n`;
            exp += `${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.step3Desc', { tv: formatCurrency(d.terminalValueCalc, selectedCurrency, lang), waccDecimal: d.wacc.toFixed(4), projectionYears: d.projectionYears, pvTv: formatCurrency(d.pvTerminalValueCalc,selectedCurrency, lang) })}\n`;

            exp += `\n**${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.step4Header')}**\n`;
            exp += `${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.step4Desc', { pvSum: formatCurrency(d.pvProjectedFCFSum, selectedCurrency, lang), pvTv: formatCurrency(d.pvTerminalValueCalc,selectedCurrency, lang), ev: formatCurrency(d.enterpriseValue,selectedCurrency, lang) })}\n`;

            exp += `\n**${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.step5Header')}**\n`;
            exp += `${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.step5Desc', { discountPercentage: d.liquidityDiscountPercentage, discountFactor: d.liquidityDiscountFactor, discountedEv: formatCurrency(d.discountedEv,selectedCurrency, lang) })}\n`;
            
            exp += `\n**${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.step6Header')}**\n`;
            exp += `${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.step6Desc', { finalValue: formatCurrency(d.finalVal, selectedCurrency, lang) })}\n`;
            if (d.minValApplied) exp += `(${translateForLanguage(lang,'resultsPage.calculationDetails.dcf.minValNote')})\n`;
            return exp + dataSourceNote(lang);
        };
        calcExplanationEn = buildDcfExplanation(Language.EN);
        calcExplanationAr = buildDcfExplanation(Language.AR);

    } else if (selectedMethod === 'book') {
        const assets = financials.totalAssets || 0;
        const liabilities = financials.totalLiabilities || 0;
        const bookVal = assets - liabilities;
        const minBookValue = 1000;
        estimatedValue = Math.max(minBookValue, bookVal);
        const minValApplied = estimatedValue === minBookValue && bookVal < minBookValue;

        const buildBookValExplanation = (lang: Language): string => {
            let exp = `${commonIntro(lang)}\n${translateForLanguage(lang,'resultsPage.calculationDetails.book.intro')}\n\n`;
            exp += `**${translateForLanguage(lang,'resultsPage.calculationDetails.book.inputsHeader')}**\n`;
            exp += `- ${translateForLanguage(lang,'resultsPage.calculationDetails.book.totalAssets', { value: formatCurrency(assets, selectedCurrency, lang) })}\n`;
            exp += `- ${translateForLanguage(lang,'resultsPage.calculationDetails.book.totalLiabilities', { value: formatCurrency(liabilities, selectedCurrency, lang) })}\n`;
            exp += `\n**${translateForLanguage(lang,'resultsPage.calculationDetails.book.step1Header')}**\n`;
            exp += `${translateForLanguage(lang,'resultsPage.calculationDetails.book.step1Desc', { totalAssets: formatCurrency(assets,selectedCurrency, lang), totalLiabilities: formatCurrency(liabilities,selectedCurrency, lang), bookValue: formatCurrency(bookVal,selectedCurrency, lang) })}\n`;
            exp += `\n**${translateForLanguage(lang,'resultsPage.calculationDetails.book.step2Header')}**\n`;
            exp += `${translateForLanguage(lang,'resultsPage.calculationDetails.book.step2Desc', { finalValue: formatCurrency(estimatedValue, selectedCurrency, lang) })}\n`;
            if (minValApplied) exp += `(${translateForLanguage(lang,'resultsPage.calculationDetails.book.minValNote')})\n`;
            return exp + dataSourceNote(lang);
        };
        calcExplanationEn = buildBookValExplanation(Language.EN);
        calcExplanationAr = buildBookValExplanation(Language.AR);

    } else { 
        const revenue = financials.revenue || 0;
        const ebitda = financials.ebitda || 0;
        const netIncome = financials.netIncome || 0;
        const { userIndustryPERatio, userIndustryEVEBITDAMultiple, userIndustryRevenueMultiple } = financials;

        let baseMetricValue = 0;
        let appliedMultiplier = 1; 
        let step1DescKey = 'resultsPage.calculationDetails.other.step1DescGeneric';
        let step2DescKey = 'resultsPage.calculationDetails.other.step2DescGeneric';
        
        if (selectedMethod === 'comps') {
            if (userIndustryPERatio !== undefined && netIncome > 0) {
                baseMetricValue = netIncome;
                appliedMultiplier = userIndustryPERatio;
                step1DescKey = 'resultsPage.calculationDetails.other.step1DescCompsPE';
                step2DescKey = 'resultsPage.calculationDetails.other.step2DescCompsPE';
            } else if (userIndustryEVEBITDAMultiple !== undefined && ebitda > 0) {
                baseMetricValue = ebitda;
                appliedMultiplier = userIndustryEVEBITDAMultiple;
                step1DescKey = 'resultsPage.calculationDetails.other.step1DescCompsEVEBITDA';
                step2DescKey = 'resultsPage.calculationDetails.other.step2DescCompsEVEBITDA';
            } else { 
                baseMetricValue = (revenue * 0.2) + ebitda - (financials.totalLiabilities || 0); 
                appliedMultiplier = 1.1; 
            }
        } else if (selectedMethod === 'multiples') {
            if (userIndustryRevenueMultiple !== undefined && revenue > 0) {
                baseMetricValue = revenue;
                appliedMultiplier = userIndustryRevenueMultiple;
                step1DescKey = 'resultsPage.calculationDetails.other.step1DescMultiplesRevenue';
                step2DescKey = 'resultsPage.calculationDetails.other.step2DescMultiplesRevenue';
            } else { 
                baseMetricValue = revenue;
                appliedMultiplier = 0.8; 
            }
        }
        
        const calculatedValue = baseMetricValue * appliedMultiplier;
        const minOtherValue = 10000;
        estimatedValue = Math.max(minOtherValue, Math.round(calculatedValue));
        const minValApplied = estimatedValue === minOtherValue && calculatedValue < minOtherValue;
        
        const buildOtherExplanation = (lang: Language): string => {
            let exp = `${commonIntro(lang)}\n${translateForLanguage(lang, 'resultsPage.calculationDetails.other.intro')}\n\n`;
            exp += `**${translateForLanguage(lang,'resultsPage.calculationDetails.other.inputsHeader')}**\n`;
            if (financials.revenue !== undefined) exp += `- ${translateForLanguage(lang,'valuationFormPage.revenue')}: ${formatCurrency(financials.revenue, selectedCurrency, lang)}\n`;
            if (financials.ebitda !== undefined) exp += `- ${translateForLanguage(lang,'valuationFormPage.ebitda')}: ${formatCurrency(financials.ebitda, selectedCurrency, lang)}\n`;
            if (financials.netIncome !== undefined) exp += `- ${translateForLanguage(lang,'valuationFormPage.netIncome')}: ${formatCurrency(financials.netIncome, selectedCurrency, lang)}\n`;
            
            if (userIndustryPERatio !== undefined) exp += `- ${translateForLanguage(lang,'valuationFormPage.userIndustryPERatio')}: ${formatNumber(userIndustryPERatio, lang)}\n`;
            if (userIndustryEVEBITDAMultiple !== undefined) exp += `- ${translateForLanguage(lang,'valuationFormPage.userIndustryEVEBITDAMultiple')}: ${formatNumber(userIndustryEVEBITDAMultiple, lang)}\n`;
            if (userIndustryRevenueMultiple !== undefined) exp += `- ${translateForLanguage(lang,'valuationFormPage.userIndustryRevenueMultiple')}: ${formatNumber(userIndustryRevenueMultiple, lang)}\n`;

            exp += `\n**${translateForLanguage(lang,'resultsPage.calculationDetails.other.step1Header')}**\n`;
            
            let currentLangStep1Params: any = {};
            if (step1DescKey === 'resultsPage.calculationDetails.other.step1DescCompsPE') {
                currentLangStep1Params = { netIncome: formatCurrency(netIncome, selectedCurrency, lang), peRatio: formatNumber(userIndustryPERatio, lang) };
            } else if (step1DescKey === 'resultsPage.calculationDetails.other.step1DescCompsEVEBITDA') {
                currentLangStep1Params = { ebitda: formatCurrency(ebitda, selectedCurrency, lang), evEbitdaMultiple: formatNumber(userIndustryEVEBITDAMultiple, lang) };
            } else if (step1DescKey === 'resultsPage.calculationDetails.other.step1DescMultiplesRevenue') {
                currentLangStep1Params = { revenue: formatCurrency(revenue, selectedCurrency, lang), revMultiple: formatNumber(userIndustryRevenueMultiple, lang) };
            } else { // Generic
                currentLangStep1Params = { baseValue: formatCurrency(baseMetricValue, selectedCurrency, lang), multiplier: formatNumber(appliedMultiplier, lang, {minimumFractionDigits:1}) };
            }
            exp += `${translateForLanguage(lang, step1DescKey, currentLangStep1Params)}\n`;
            
            exp += `\n**${translateForLanguage(lang,'resultsPage.calculationDetails.other.step2Header')}**\n`;
            const currentLangStep2Params = {...currentLangStep1Params, estimatedValue: formatCurrency(calculatedValue, selectedCurrency, lang) };
            exp += `${translateForLanguage(lang, step2DescKey, currentLangStep2Params)}\n`;
            
            exp += `\n**${translateForLanguage(lang,'resultsPage.calculationDetails.other.step3Header')}**\n`;
            exp += `${translateForLanguage(lang,'resultsPage.calculationDetails.other.step3Desc', { finalValue: formatCurrency(estimatedValue, selectedCurrency, lang) })}\n`;
            if (minValApplied) exp += `(${translateForLanguage(lang,'resultsPage.calculationDetails.other.minValNote')})\n`;
            return exp + dataSourceNote(lang);
        };
        calcExplanationEn = buildOtherExplanation(Language.EN);
        calcExplanationAr = buildOtherExplanation(Language.AR);
    }
    
    const result: ValuationResult = {
      estimatedValue: estimatedValue,
      currency: selectedCurrency,
      summary: `Based on the ${methodDetails?.name || 'selected method'}, the estimated valuation for ${companyName} is approximately ${currencyInfo?.symbol || ''}${formatNumber(estimatedValue, Language.EN)} ${selectedCurrency}. This considers key financial figures and assumptions (including any user-provided benchmarks) for the ${SECTORS.find(s=>s.id === selectedSector)?.name || selectedSector} sector in ${COUNTRIES.find(c=>c.code === selectedCountry)?.name || selectedCountry}. Please review the IFRS compliance notes and consult a professional.`,
      summaryAr: `بناءً على ${methodDetails?.nameAr || 'الطريقة المختارة'}، فإن التقييم المقدر لـ ${companyName} هو حوالي ${currencyInfo?.symbol || ''}${formatNumber(estimatedValue, Language.AR)} ${selectedCurrency}. يأخذ هذا في الاعتبار الأرقام المالية الرئيسية والافتراضات (بما في ذلك أي معايير مقدمة من المستخدم) لقطاع ${SECTORS.find(s=>s.id === selectedSector)?.nameAr || selectedSector} في ${COUNTRIES.find(c=>c.code === selectedCountry)?.nameAr || selectedCountry}. يرجى مراجعة ملاحظات التوافق مع المعايير الدولية واستشارة متخصص.`,
      methodUsed: selectedMethod,
      calculationExplanation: calcExplanationEn,
      calculationExplanationAr: calcExplanationAr,
      benchmarksUsed: Object.keys(benchmarksUsed).length > 0 ? benchmarksUsed : undefined,
    };

    if (selectedMethod === 'dcf' && financials.dcfSpecifics) {
        result.dcfInputsUsed = {
            projectionYears: financials.dcfSpecifics.projectionYears,
            discountRate: financials.dcfSpecifics.discountRate,
            terminalGrowthRate: financials.dcfSpecifics.terminalGrowthRate, 
        };
    }

    setGlobalResult(result);
    setIsLoading(false);
    navigate('/results');
  };

  return (
    <PageContainer title={t('valuationFormPage.title')}>
      <form onSubmit={handleSubmit} className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-secondary-800 dark:text-secondary-100 mb-4 border-b pb-2 border-secondary-300 dark:border-secondary-700">
            {t('valuationFormPage.companyDetails')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                {t('valuationFormPage.companyName')}
              </label>
              <input
                type="text"
                name="companyName"
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={t('valuationFormPage.companyNamePlaceholder')}
                required
                className="mt-1 block w-full shadow-sm sm:text-sm border-secondary-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md p-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
             <CountrySelector selectedCountry={selectedCountry} onChange={setSelectedCountry} />
            <SectorSelector selectedSector={selectedSector} onChange={setSelectedSector} />
            <MethodSelector selectedMethod={selectedMethod} onChange={setSelectedMethod} />
          </div>
        </section>

        <section>
           <h2 className="text-xl font-semibold text-secondary-800 dark:text-secondary-100 mb-4 border-b pb-2 border-secondary-300 dark:border-secondary-700">
            {t('valuationFormPage.financialData')}
          </h2>
          <FinancialInputForm 
            financials={financials} 
            selectedMethodId={selectedMethod}
            selectedCountryCode={selectedCountry}
            selectedCurrency={selectedCurrency}
            onFinancialChange={handleFinancialChange}
            onCurrencyChange={setSelectedCurrency}
          />
        </section>
        
        {error && <p className="text-red-500 text-sm text-center p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded-md">{error}</p>}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isLoading || !selectedMethod} 
            className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-md transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading && <LoadingSpinner size="sm" />}
            <span className={isLoading ? (currentGlobalLanguage === 'ar' ? 'mr-2' : 'ml-2') : ''}>
              {isLoading ? t('valuationFormPage.calculating') : t('valuationFormPage.submit')}
            </span>
          </button>
        </div>
      </form>
    </PageContainer>
  );
};
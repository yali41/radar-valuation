import React, { useState, useRef } from 'react';
import { ValuationResult, ValuationFormData, Language } from '../types';
import { useTranslations, getNestedTranslation } from '../hooks/useTranslations';
import { COUNTRIES, SECTORS, VALUATION_METHODS, CURRENCIES, TRANSLATIONS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LegendProps } from 'recharts';
import html2canvas from 'html2canvas';
import { LoadingSpinner } from './LoadingSpinner';

// Import pdfMake. Note: This assumes pdfmake/build/pdfmake.js and pdfmake/build/vfs_fonts.js are correctly imported via importmap
import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';

if (pdfMake && pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
  // Explicitly define fonts to ensure only Roboto (from vfs_fonts) is used
  // This prevents pdfMake from trying to find other fonts like 'Amiri'.
  pdfMake.fonts = {
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf', // Standard vfs_fonts uses Medium for bold
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf'
    }
  };
}


interface ResultSummaryProps {
  result: ValuationResult;
  formData: ValuationFormData;
}

interface ChartDataItem {
  name: string;
  value: number;
  fill: string;
}

// Custom Legend Content Component
const CustomLegendContent: React.FC<LegendProps & { chartData: ChartDataItem[] }> = (props) => {
  const { chartData } = props; 
  if (!chartData ) return null;
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
      {chartData.map((entry, index) => (
        <li key={`legend-item-${index}`} style={{ display: 'flex', alignItems: 'center', marginRight: '15px', marginBottom: '5px' }}>
          <span style={{ width: '12px', height: '12px', backgroundColor: entry.fill, marginRight: '8px', display: 'inline-block', borderRadius: '2px' }}></span>
          <span style={{color: 'var(--color-secondary-700, #4a5568)'}} className="dark:text-secondary-300 text-sm">{entry.name}</span>
        </li>
      ))}
    </ul>
  );
};

const ExplanationRenderer: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n');
    return (
        <>
            {lines.map((line, index) => {
                if (line.startsWith('**') && line.endsWith('**')) {
                    return <strong key={index} className="block font-semibold mt-2 mb-1 text-secondary-800 dark:text-secondary-100">{line.substring(2, line.length - 2)}</strong>;
                }
                if (line.startsWith('  - ')) {
                     return <p key={index} className="ml-8 rtl:mr-8 text-xs">{line.substring(4)}</p>;
                }
                if (line.startsWith('- ')) {
                     return <p key={index} className="ml-4 rtl:mr-4 text-sm">{line.substring(2)}</p>;
                }
                return <p key={index} className="text-sm my-0.5">{line}</p>;
            })}
        </>
    );
};


export const ResultSummary: React.FC<ResultSummaryProps> = ({ result, formData }) => {
  const { t, language, dir } = useTranslations();
  const [isDownloading, setIsDownloading] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const selectedCountry = COUNTRIES.find(c => c.code === formData.country);
  const selectedSector = SECTORS.find(s => s.id === formData.sector);
  const selectedMethod = VALUATION_METHODS.find(m => m.id === formData.valuationMethod);
  const selectedCurrencyInfo = CURRENCIES.find(c => c.code === result.currency);

  const formatDisplayCurrency = (value: number) => {
    if (!selectedCurrencyInfo) return `${value.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} ${result.currency}`;
    try {
        return value.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { 
        style: 'currency', 
        currency: result.currency, 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
        });
    } catch (e) { 
        return `${selectedCurrencyInfo.symbol} ${value.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', {minimumFractionDigits:0, maximumFractionDigits:0})}`;
    }
  }

  const formatNumber = (num: number | undefined, options?: Intl.NumberFormatOptions): string => {
    if (num === undefined) return 'N/A';
    return num.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', options);
  };
  
  const formatNumberForAxis = (value: number) => {
    if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  }

  let chartDataUI: ChartDataItem[] = []; // Renamed to avoid conflict if 'chartData' is used for PDF
  if (formData.valuationMethod === 'dcf' && formData.financials.dcfSpecifics?.projectedFCF?.length) {
    chartDataUI = formData.financials.dcfSpecifics.projectedFCF.map((fcf, index) => ({
        name: t('valuationFormPage.projectedFCFYear', {year: index + 1}),
        value: fcf || 0,
        fill: `hsl(${200 + index * 20}, 70%, 60%)` 
    }));
    chartDataUI.push({ name: t('resultsPage.estimatedValue'), value: result.estimatedValue, fill: '#3b82f6' });
  } else {
     chartDataUI = [
        { name: t('valuationFormPage.revenue'), value: formData.financials.revenue || 0, fill: '#8884d8' },
        { name: t('valuationFormPage.ebitda'), value: formData.financials.ebitda || 0, fill: '#82ca9d'  },
        { name: t('resultsPage.estimatedValue'), value: result.estimatedValue, fill: '#3b82f6' },
    ];
  }

  const handleDownloadReport = async () => {
    if (!pdfMake) {
        console.error("pdfMake is not loaded!");
        alert("PDF generation library is not loaded. Please check console.");
        return;
    }
    setIsDownloading(true);

    const getPdfTranslation = (key: string, options?: Record<string, string | number | undefined> | string): string => {
        let rawText = getNestedTranslation(TRANSLATIONS[language], key);
        let textToReturn: string;
        if (rawText === undefined) {
            if (typeof options === 'string') textToReturn = options; else textToReturn = key;
        } else { textToReturn = rawText; }
        if (typeof options === 'object' && options !== null) {
            Object.entries(options).forEach(([p, v]) => {
                if (v !== undefined) textToReturn = textToReturn.replace(new RegExp(`{${p}}`, 'g'), String(v));
            });
        }
        return textToReturn;
    };
    const formatPdfNumber = (num: number | undefined, numberOptions?: Intl.NumberFormatOptions): string => {
        if (num === undefined) return 'N/A';
        return num.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', numberOptions);
    };
    const formatPdfCurrency = (val: number): string => {
        if (!selectedCurrencyInfo) return `${formatPdfNumber(val)} ${result.currency}`;
        try {
            return val.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { 
            style: 'currency', currency: result.currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
        } catch (e) { 
            return `${selectedCurrencyInfo.symbol || result.currency} ${formatPdfNumber(val, {minimumFractionDigits:0, maximumFractionDigits:0})}`;
        }
    };

    const primaryColor = '#2563eb'; 
    const secondaryColor = '#1e293b'; 
    const lightBgColor = '#eff6ff'; 
    const grayColor = '#475569';
    const headerTextColor = '#FFFFFF';

    const currentFont = 'Roboto'; // Ensure this matches the key in pdfMake.fonts

    const content: any[] = [];
    const isArabic = language === 'ar';

    // Title
    content.push({ text: getPdfTranslation('resultsPage.title'), style: 'header', alignment: 'center', color: primaryColor, margin: [0, 0, 0, 20] });

    // Company Details Section Title
    content.push({
        canvas: [{ type: 'rect', x: 0, y: 0, w: 515, h: 20, color: primaryColor }],
        margin: [0, 0, 0, 5]
    });
    content.push({ text: getPdfTranslation('valuationFormPage.companyDetails'), style: 'sectionTitle', color: headerTextColor, relativePosition: {x: isArabic ? 500 : 15, y: -18}, alignment: isArabic ? 'right' : 'left' });

    const detailsTableBody = [
        [{ text: getPdfTranslation('resultsPage.companyName'), style: 'boldText', alignment: isArabic ? 'right' : 'left'}, {text: formData.companyName, alignment: isArabic ? 'right' : 'left'}],
        [{ text: getPdfTranslation('resultsPage.country'), style: 'boldText', alignment: isArabic ? 'right' : 'left'}, {text: selectedCountry ? (isArabic ? selectedCountry.nameAr : selectedCountry.name) : formData.country, alignment: isArabic ? 'right' : 'left'}],
        [{ text: getPdfTranslation('resultsPage.sector'), style: 'boldText', alignment: isArabic ? 'right' : 'left'}, {text: selectedSector ? (isArabic ? selectedSector.nameAr : selectedSector.name) : formData.sector, alignment: isArabic ? 'right' : 'left'}],
        [{ text: getPdfTranslation('resultsPage.valuationMethod'), style: 'boldText', alignment: isArabic ? 'right' : 'left'}, {text: selectedMethod ? (isArabic ? selectedMethod.nameAr : selectedMethod.name) : formData.valuationMethod, alignment: isArabic ? 'right' : 'left'}],
        [{ text: getPdfTranslation('resultsPage.currency'), style: 'boldText', alignment: isArabic ? 'right' : 'left'}, {text: selectedCurrencyInfo ? (isArabic ? `${selectedCurrencyInfo.nameAr} (${selectedCurrencyInfo.symbol})` : `${selectedCurrencyInfo.name} (${selectedCurrencyInfo.symbol})`) : result.currency, alignment: isArabic ? 'right' : 'left'}]
    ];
    content.push({
        table: { body: isArabic ? detailsTableBody.map(row => row.reverse()) : detailsTableBody },
        layout: 'noBorders',
        margin: [0, 5, 0, 15]
    });

    // Estimated Value
    content.push({
        canvas: [{ type: 'rect', x: 0, y: 0, w: 515, h: 60, r: 5, color: lightBgColor }],
        margin: [0, 0, 0, 10]
    });
    content.push({ text: getPdfTranslation('resultsPage.estimatedValue'), style: 'subheader', color: primaryColor, relativePosition: {x: isArabic ? 450 : 20, y: -55}, alignment: isArabic ? 'right' : 'left' });
    content.push({ text: formatPdfCurrency(result.estimatedValue), style: 'h1Style', color: primaryColor, relativePosition: {x: isArabic ? 450 : 20, y: -50}, alignment: isArabic ? 'right' : 'left', margin: [0,0,0,15] });
    
    // DCF Inputs
    if (result.methodUsed === 'dcf' && result.dcfInputsUsed) {
        content.push({ text: getPdfTranslation('resultsPage.dcfInputsTitle'), style: 'sectionTitleSmall', color: primaryColor, margin: [0,10,0,5], alignment: isArabic ? 'right' : 'left'});
        const dcfText = [
          `${getPdfTranslation('resultsPage.dcfProjectionYears')} ${result.dcfInputsUsed.projectionYears} ${getPdfTranslation('common.years')}`,
          `${getPdfTranslation('resultsPage.dcfDiscountRate')} ${formatPdfNumber(result.dcfInputsUsed.discountRate, {minimumFractionDigits:1, maximumFractionDigits:1})}${getPdfTranslation('common.percentageSymbol')}`,
          `${getPdfTranslation('resultsPage.dcfTerminalGrowthRate')} ${formatPdfNumber(result.dcfInputsUsed.terminalGrowthRate, {minimumFractionDigits:1, maximumFractionDigits:1})}${getPdfTranslation('common.percentageSymbol')}`
        ].join('\n');
        content.push({ text: dcfText, style: 'body', color: grayColor, alignment: isArabic ? 'right' : 'left', margin: [0,0,0,10] });
    }

    // Benchmarks Used
    if (result.benchmarksUsed && Object.keys(result.benchmarksUsed).length > 0) {
        content.push({ text: getPdfTranslation('resultsPage.benchmarksUsedTitle'), style: 'sectionTitleSmall', color: primaryColor, margin: [0,10,0,5], alignment: isArabic ? 'right' : 'left'});
        let benchmarksTextItems: any[] = [];
        if(result.benchmarksUsed.userCountryRiskPremium !== undefined) benchmarksTextItems.push({ text: `${getPdfTranslation('valuationFormPage.userCountryRiskPremium')}: ${formatPdfNumber(result.benchmarksUsed.userCountryRiskPremium, {minimumFractionDigits:1, maximumFractionDigits:2})}${getPdfTranslation('common.percentageSymbol')}`});
        if(result.benchmarksUsed.userSectorGrowthRate !== undefined) benchmarksTextItems.push({ text: `${getPdfTranslation('valuationFormPage.userSectorGrowthRate')}: ${formatPdfNumber(result.benchmarksUsed.userSectorGrowthRate, {minimumFractionDigits:1, maximumFractionDigits:2})}${getPdfTranslation('common.percentageSymbol')}`});
        if(result.benchmarksUsed.userIndustryPERatio !== undefined) benchmarksTextItems.push({ text: `${getPdfTranslation('valuationFormPage.userIndustryPERatio')}: ${formatPdfNumber(result.benchmarksUsed.userIndustryPERatio)}`});
        if(result.benchmarksUsed.userIndustryEVEBITDAMultiple !== undefined) benchmarksTextItems.push({ text: `${getPdfTranslation('valuationFormPage.userIndustryEVEBITDAMultiple')}: ${formatPdfNumber(result.benchmarksUsed.userIndustryEVEBITDAMultiple)}`});
        if(result.benchmarksUsed.userIndustryRevenueMultiple !== undefined) benchmarksTextItems.push({ text: `${getPdfTranslation('valuationFormPage.userIndustryRevenueMultiple')}: ${formatPdfNumber(result.benchmarksUsed.userIndustryRevenueMultiple)}`});
        
        content.push({ ul: benchmarksTextItems, style: 'body', color: grayColor, alignment: isArabic ? 'right' : 'left', margin: [0,0,0,10] });
    }

    // Summary
    content.push({ text: getPdfTranslation('resultsPage.summary'), style: 'sectionTitleSmall', color: primaryColor, margin: [0,10,0,5], alignment: isArabic ? 'right' : 'left'});
    content.push({ text: isArabic ? result.summaryAr : result.summary, style: 'body', alignment: isArabic ? 'right' : 'left', margin: [0,0,0,15] });

    // Chart
    if (chartRef.current) {
        try {
            const canvas = await html2canvas(chartRef.current, { backgroundColor: '#ffffff', scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            content.push({ text: getPdfTranslation('common.details') + " " + getPdfTranslation('nav.chart', 'Chart'), style: 'sectionTitleSmall', color: primaryColor, margin: [0,10,0,5], alignment: isArabic ? 'right' : 'left'});
            content.push({ image: imgData, width: 500, alignment: 'center', margin: [0,0,0,15] });
        } catch (err) {
            console.error("Error generating chart image for PDF:", err);
            content.push({text: "Chart could not be rendered in PDF.", style: 'smallText', color: 'red', margin: [0,0,0,10], alignment: isArabic ? 'right' : 'left'});
        }
    }
    
    // Calculation Breakdown
    content.push({ text: getPdfTranslation('resultsPage.calculationDetails.title'), style: 'sectionTitleSmall', color: primaryColor, margin: [0,10,0,5], alignment: isArabic ? 'right' : 'left'});
    const explanationText = isArabic ? result.calculationExplanationAr : result.calculationExplanation;
    
    const explanationContent = explanationText.split('\n').map(line => {
        let styleName = 'smallText'; // pdfMake uses style names
        let text = line;
        if (line.startsWith('**') && line.endsWith('**')) {
            styleName = 'smallBoldText';
            text = line.substring(2, line.length - 2);
        } else if (line.startsWith('  - ')) {
            text = `  • ${line.substring(4)}`;
        } else if (line.startsWith('- ')) {
            text = `• ${line.substring(2)}`;
        }
        return { text: text, style: styleName, alignment: isArabic ? 'right' : 'left', margin: [0,0,0,2]};
    });
    content.push(...explanationContent, {text: ' ', margin: [0,0,0,15]}); // Add some space after

    // Disclaimer
    content.push({ text: getPdfTranslation('resultsPage.ifrsComplianceNote'), style: 'disclaimer', color: grayColor, alignment: isArabic ? 'right' : 'left', margin: [0,10,0,5] });

    if (isArabic) {
        content.push({
            text: "ملاحظة هامة: لعرض النص العربي بشكل صحيح في هذا الملف، يتم استخدام خط قياسي (Roboto). قد يؤثر هذا على المظهر المثالي للنص العربي حيث أن تضمين خطوط عربية مخصصة بالكامل مقيد في هذه البيئة. لا يزال النص قابلاً للقراءة، ولكن قد لا يتمتع بالخصائص الجمالية لخط عربي متخصص.",
            style: 'disclaimer',
            color: 'red', 
            alignment: 'right',
            margin: [0, 5, 0, 0]
        });
    }
    
    const docDefinition = {
      content: content,
      defaultStyle: {
        font: currentFont,
        fontSize: 10,
        lineHeight: 1.3,
        color: secondaryColor,
        alignment: isArabic ? 'right' : 'left', 
      },
      styles: {
        header: { font: currentFont, fontSize: 22, bold: true, alignment: 'center' },
        sectionTitle: { font: currentFont, fontSize: 12, bold: true,  margin: [0,0,0,2]}, 
        sectionTitleSmall: { font: currentFont, fontSize: 12, bold: true, margin: [0, 5, 0, 3] },
        subheader: { font: currentFont, fontSize: 14, bold: true, margin: [0, 10, 0, 5] }, 
        h1Style: { font: currentFont, fontSize: 20, bold: true}, 
        body: { font: currentFont, fontSize: 10 },
        smallText: { font: currentFont, fontSize: 9 },
        smallBoldText: { font: currentFont, fontSize: 9, bold: true },
        boldText: { font: currentFont, bold: true },
        disclaimer: { font: currentFont, fontSize: 8, italics: true },
      },
      pageMargins: [40, 40, 40, 40], 
    };

    try {
        // @ts-ignore
        pdfMake.createPdf(docDefinition).download(`ValuationReport-${formData.companyName.replace(/\s+/g, '_') || 'Company'}.pdf`);
    } catch (e) {
        console.error("Error creating PDF with pdfMake:", e);
        alert("Failed to generate PDF. Check console for details.");
    }
    setIsDownloading(false);
  };


  return (
    <div className="space-y-6" id="print-area">
      <div>
        <h2 className="text-2xl font-semibold text-primary-600 dark:text-primary-400">
          {t('resultsPage.title')}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border border-secondary-200 dark:border-secondary-700 rounded-lg">
        <div>
          <h3 className="text-lg font-medium text-secondary-900 dark:text-white">{t('valuationFormPage.companyDetails')}</h3>
          <p><span className="font-semibold">{t('resultsPage.companyName')}</span> {formData.companyName}</p>
          <p><span className="font-semibold">{t('resultsPage.country')}</span> {selectedCountry ? (language === 'ar' ? selectedCountry.nameAr : selectedCountry.name) : formData.country}</p>
          <p><span className="font-semibold">{t('resultsPage.sector')}</span> {selectedSector ? (language === 'ar' ? selectedSector.nameAr : selectedSector.name) : formData.sector}</p>
          <p><span className="font-semibold">{t('resultsPage.valuationMethod')}</span> {selectedMethod ? (language === 'ar' ? selectedMethod.nameAr : selectedMethod.name) : formData.valuationMethod}</p>
          <p><span className="font-semibold">{t('resultsPage.currency')}</span> {selectedCurrencyInfo ? (language === 'ar' ? `${selectedCurrencyInfo.nameAr} (${selectedCurrencyInfo.symbol})` : `${selectedCurrencyInfo.name} (${selectedCurrencyInfo.symbol})` ) : result.currency}</p>
        </div>
        <div className={`text-center ${dir === 'rtl' ? 'md:text-right' : 'md:text-left'} rtl:md:text-left bg-primary-50 dark:bg-secondary-800 p-6 rounded-lg flex flex-col justify-center items-center md:items-end rtl:md:items-start`}>
          <p className="text-lg text-secondary-700 dark:text-secondary-300">{t('resultsPage.estimatedValue')}</p>
          <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">
            {formatDisplayCurrency(result.estimatedValue)}
          </p>
        </div>
      </div>

      {result.methodUsed === 'dcf' && result.dcfInputsUsed && (
        <div className="p-6 border border-secondary-200 dark:border-secondary-700 rounded-lg">
          <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">{t('resultsPage.dcfInputsTitle')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
            <p><span className="font-semibold">{t('resultsPage.dcfProjectionYears')}</span> {result.dcfInputsUsed.projectionYears} {t('common.years')}</p>
            <p><span className="font-semibold">{t('resultsPage.dcfDiscountRate')}</span> {result.dcfInputsUsed.discountRate?.toFixed(1)}{t('common.percentageSymbol')}</p>
            <p><span className="font-semibold">{t('resultsPage.dcfTerminalGrowthRate')}</span> {result.dcfInputsUsed.terminalGrowthRate?.toFixed(1)}{t('common.percentageSymbol')}</p>
          </div>
        </div>
      )}

      {result.benchmarksUsed && Object.keys(result.benchmarksUsed).length > 0 && (
         <div className="p-6 border border-secondary-200 dark:border-secondary-700 rounded-lg">
            <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">{t('resultsPage.benchmarksUsedTitle')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {result.benchmarksUsed.userCountryRiskPremium !== undefined && <p><span className="font-semibold">{t('valuationFormPage.userCountryRiskPremium')}:</span> {formatNumber(result.benchmarksUsed.userCountryRiskPremium, {minimumFractionDigits:1, maximumFractionDigits:2})}{t('common.percentageSymbol')}</p>}
                {result.benchmarksUsed.userSectorGrowthRate !== undefined && <p><span className="font-semibold">{t('valuationFormPage.userSectorGrowthRate')}:</span> {formatNumber(result.benchmarksUsed.userSectorGrowthRate, {minimumFractionDigits:1, maximumFractionDigits:2})}{t('common.percentageSymbol')}</p>}
                {result.benchmarksUsed.userIndustryPERatio !== undefined && <p><span className="font-semibold">{t('valuationFormPage.userIndustryPERatio')}:</span> {formatNumber(result.benchmarksUsed.userIndustryPERatio)}</p>}
                {result.benchmarksUsed.userIndustryEVEBITDAMultiple !== undefined && <p><span className="font-semibold">{t('valuationFormPage.userIndustryEVEBITDAMultiple')}:</span> {formatNumber(result.benchmarksUsed.userIndustryEVEBITDAMultiple)}</p>}
                {result.benchmarksUsed.userIndustryRevenueMultiple !== undefined && <p><span className="font-semibold">{t('valuationFormPage.userIndustryRevenueMultiple')}:</span> {formatNumber(result.benchmarksUsed.userIndustryRevenueMultiple)}</p>}
            </div>
         </div>
      )}

      <div className="p-6 border border-secondary-200 dark:border-secondary-700 rounded-lg">
        <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">{t('resultsPage.summary')}</h3>
        <p className="text-secondary-600 dark:text-secondary-400 whitespace-pre-line">
          {language === 'ar' ? result.summaryAr : result.summary}
        </p>
      </div>
      
      <div ref={chartRef} className="p-6 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800">
        <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-4">{t('common.details')} {t('nav.chart')}</h3>
        <ResponsiveContainer width="100%" height={formData.valuationMethod === 'dcf' ? 400 : 300}>
          <BarChart 
            data={chartDataUI} 
            layout={dir === 'rtl' && formData.valuationMethod !== 'dcf' ? 'vertical' : 'horizontal'} 
            margin={{ top: 5, right: dir === 'rtl' ? (language === 'ar' ? 120 : 80) : 20, left: dir === 'rtl' ? 10 : (language === 'ar' ? 120 : 80), bottom: formData.valuationMethod === 'dcf' ? 80 : 20 }}
            barGap={dir === 'rtl' && formData.valuationMethod !== 'dcf' ? 10 : undefined}
            barCategoryGap={dir === 'rtl' && formData.valuationMethod !== 'dcf' ? "20%" : (formData.valuationMethod === 'dcf' ? "10%" : "20%")}
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
            {dir === 'rtl' && formData.valuationMethod !== 'dcf' ? (
              <>
                <XAxis type="number" tickFormatter={formatNumberForAxis} axisLine={false} tickLine={false} domain={['dataMin', 'dataMax']} />
                <YAxis dataKey="name" type="category" width={language === 'ar' ? 150 : 120} axisLine={false} tickLine={false} interval={0} />
              </>
            ) : (
               <>
                <XAxis dataKey="name" interval={0} angle={formData.valuationMethod === 'dcf' ? -30 : 0} textAnchor={formData.valuationMethod === 'dcf' ? "end" : "middle"} height={formData.valuationMethod === 'dcf' ? 100 : 50} 
                  tick={({ x, y, payload }) => (
                    <text x={x} y={y} dy={16} textAnchor={formData.valuationMethod === 'dcf' ? "end" : "middle"} fill="var(--color-secondary-600, #718096)" className="dark:fill-secondary-400 text-xs">
                      {payload.value}
                    </text>
                  )}
                />
                <YAxis tickFormatter={formatNumberForAxis} axisLine={false} tickLine={false} domain={['auto', 'auto']}/>
              </>
            )}
            <Tooltip
              cursor={{fill: 'rgba(128,128,128,0.1)'}}
              contentStyle={{backgroundColor: 'rgba(255,255,255,0.9)', darkBackgroundColor: 'rgba(30,41,59,0.9)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'}}
              formatter={(value: number, name: string, props: { payload: ChartDataItem }) => {
                return [formatDisplayCurrency(props.payload.value), props.payload.name];
              }}
            />
            <Legend content={<CustomLegendContent chartData={chartDataUI} />} wrapperStyle={{paddingTop: '20px', paddingBottom: formData.valuationMethod === 'dcf' ? '10px' : '0'}} />
            <Bar dataKey="value" radius={dir === 'rtl' && formData.valuationMethod !== 'dcf' ? [0, 4, 4, 0] : [4, 4, 0, 0]} barSize={dir === 'rtl' && formData.valuationMethod !== 'dcf' ? undefined : (formData.valuationMethod === 'dcf' ? 25 : 40)}>
                {chartDataUI.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="p-6 border border-secondary-200 dark:border-secondary-700 rounded-lg">
        <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-3">
          {t('resultsPage.calculationDetails.title')}
        </h3>
        <div className="text-secondary-700 dark:text-secondary-300 leading-relaxed">
           <ExplanationRenderer text={language === 'ar' ? result.calculationExplanationAr : result.calculationExplanation} />
        </div>
         <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-4">
          {t('resultsPage.ifrsComplianceNote')}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-end mt-8 print-hide">
        <button
          type="button"
          onClick={handleDownloadReport}
          disabled={isDownloading}
          className="w-full sm:w-auto px-6 py-2.5 bg-green-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-green-700 hover:shadow-lg focus:bg-green-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-green-800 active:shadow-lg transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isDownloading ? (
            <>
              <LoadingSpinner size="sm" />
              <span className={language === 'ar' ? 'mr-2' : 'ml-2'}>{t('common.loading', 'Processing...')}</span>
            </>
          ) : (
            t('resultsPage.downloadReport') 
          )}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="w-full sm:w-auto px-6 py-2.5 bg-secondary-500 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-secondary-600 hover:shadow-lg focus:bg-secondary-600 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-secondary-700 active:shadow-lg transition duration-150 ease-in-out"
        >
          {t('resultsPage.printReport')}
        </button>
      </div>
    </div>
  );
};
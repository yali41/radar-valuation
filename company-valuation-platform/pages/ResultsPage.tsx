
import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/PageContainer';
import { ResultSummary } from '../components/ResultSummary';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ValuationContext } from '../context/ValuationContext';
import { useTranslations } from '../hooks/useTranslations';

export const ResultsPage: React.FC = () => {
  const { t } = useTranslations();
  const navigate = useNavigate();
  const { formData, result } = useContext(ValuationContext);

  useEffect(() => {
    if (!formData || !result) {
      // Optional: redirect if no data, or show a message
      // For now, let the conditional rendering below handle it.
    }
  }, [formData, result, navigate]);

  if (!formData || !result) {
    return (
      <PageContainer title={t('resultsPage.title')}>
        <div className="text-center">
          <p className="text-xl text-secondary-700 dark:text-secondary-300 mb-6">{t('resultsPage.noResults')}</p>
          <button
            onClick={() => navigate('/valuation')}
            className="px-6 py-2.5 bg-primary-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-primary-700 hover:shadow-lg focus:bg-primary-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-primary-800 active:shadow-lg transition duration-150 ease-in-out"
          >
            {t('resultsPage.backToForm')}
          </button>
        </div>
      </PageContainer>
    );
  }
  
  // If data is being loaded (e.g. from an API in a real app)
  // This is mostly for show in this mock version as data is set synchronously.
  // if (isLoading) { 
  //   return <PageContainer title={t('resultsPage.title')}><LoadingSpinner text={t('common.loading')} /></PageContainer>;
  // }

  return (
    <PageContainer>
      <ResultSummary formData={formData} result={result} />
    </PageContainer>
  );
};

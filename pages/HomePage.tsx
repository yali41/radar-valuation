import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslations } from '../hooks/useTranslations';
import { PageContainer } from '../components/PageContainer';

const FeatureCard: React.FC<{ title: string, description: string, icon: React.ReactNode }> = ({ title, description, icon }) => (
  <div className="flex flex-col items-center p-6 bg-primary-50 dark:bg-primary-900 rounded-lg shadow-lg text-center h-full">
    <div className="text-primary-500 dark:text-primary-400 mb-4">{icon}</div>
    <h3 className="mb-2 text-xl font-semibold text-secondary-800 dark:text-white">{title}</h3>
    <p className="text-secondary-600 dark:text-secondary-300 flex-grow">{description}</p>
  </div>
);

export const HomePage: React.FC = () => {
  const { t } = useTranslations();

  return (
    <PageContainer>
      <div className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary-600 dark:text-primary-400">
          {t('homePage.title')}
        </h1>
        <p className="mt-4 text-lg md:text-xl text-secondary-600 dark:text-secondary-300 max-w-2xl mx-auto">
          {t('homePage.subtitle')}
        </p>
        <Link
          to="/valuation"
          className="mt-8 inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
        >
          {t('homePage.ctaButton')}
        </Link>
      </div>

      <div className="py-12 grid md:grid-cols-3 gap-8">
        <FeatureCard 
          title={t('homePage.feature1Title')} 
          description={t('homePage.feature1Desc')} 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>} 
        />
        <FeatureCard 
          title={t('homePage.feature2Title')} 
          description={t('homePage.feature2Desc')} 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" /></svg>}
        />
        <FeatureCard 
          title={t('homePage.feature3Title')} 
          description={t('homePage.feature3Desc')} 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>}
        />
      </div>
      <div className="my-8 p-4 bg-red-50 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-400 rounded">
        <h4 className="font-bold text-red-800 dark:text-red-200">{t('common.error', 'Important Notice')}</h4>
        <p className="text-red-700 dark:text-red-300 text-sm">{t('homePage.importantNotice')}</p>
      </div>
      <div className="text-center py-8">
        <img src="https://picsum.photos/800/300?random=1" alt="Placeholder Business" className="mx-auto rounded-lg shadow-md"/>
      </div>
    </PageContainer>
  );
};
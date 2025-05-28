
import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { useTranslations } from '../hooks/useTranslations';
import { VALUATION_METHODS } from '../constants';

export const AboutPage: React.FC = () => {
  const { t, language, dir } = useTranslations();

  return (
    <PageContainer title={t('aboutPage.title')}>
      <div className="space-y-6 text-secondary-700 dark:text-secondary-300 leading-relaxed">
        <p>{t('aboutPage.p1')}</p>
        <p>{t('aboutPage.p2')}</p>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-primary-600 dark:text-primary-400 mb-3">
            {t('aboutPage.ifrsTitle')}
          </h2>
          <p>{t('aboutPage.ifrsDesc')}</p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-primary-600 dark:text-primary-400 mb-3">
            {t('aboutPage.methodsTitle')}
          </h2>
          <p>{t('aboutPage.methodsDesc')}</p>
          <ul className={`list-disc ${dir === 'rtl' ? 'list-inside pr-5' : 'list-inside pl-5'} space-y-2 mt-4`}>
            {VALUATION_METHODS.map(method => (
              <li key={method.id}>
                <span className="font-semibold">{language === 'ar' ? method.nameAr : method.name}:</span>{' '}
                {language === 'ar' ? method.descriptionAr : method.description}
              </li>
            ))}
          </ul>
        </section>
        
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-primary-600 dark:text-primary-400 mb-3">
            {t('aboutPage.benchmarkingTitle')}
          </h2>
          <div className="whitespace-pre-line">{t('aboutPage.benchmarkingDesc')}</div>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-primary-600 dark:text-primary-400 mb-3">
            {t('aboutPage.dataSensitivity')}
          </h2>
          <p>{t('aboutPage.dataSensitivityDesc')}</p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-primary-600 dark:text-primary-400 mb-3">
            {t('aboutPage.professionalAdvice')}
          </h2>
          <p>{t('aboutPage.professionalAdviceDesc')}</p>
        </section>

        <div className="mt-10 text-center">
             <img src="https://picsum.photos/700/250?random=2" alt={t('aboutPage.title')} className="mx-auto rounded-lg shadow-lg" />
        </div>
      </div>
    </PageContainer>
  );
};


import React from 'react';
import { useTranslations } from '../hooks/useTranslations';

export const Footer: React.FC = () => {
  const { t } = useTranslations();
  // Raw values for href attributes, as they are not language-dependent for functionality
  const rawMobile = "+966591715184";
  const rawEmail = "y_ali41@hotmail.com";

  return (
    <footer className="bg-white dark:bg-secondary-800 text-center py-6 shadow-top">
      <p className="text-sm text-secondary-600 dark:text-secondary-400">
        {t('footer.copyright')}
      </p>
      <div className="mt-4 text-xs text-secondary-500 dark:text-secondary-400 space-y-1 px-4">
        <p>{t('footer.contactName')}</p>
        <p>
          <a 
            href={`tel:${rawMobile}`} 
            className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-200"
          >
            {t('footer.contactMobile')}
          </a>
        </p>
        <p>
          <a 
            href={`mailto:${rawEmail}`} 
            className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-200"
          >
            {t('footer.contactEmail')}
          </a>
        </p>
        <p>
          <a 
            href={t('footer.contactLinkedInUrl')} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-200"
          >
            {t('footer.contactLinkedIn')}
          </a>
        </p>
      </div>
    </footer>
  );
};

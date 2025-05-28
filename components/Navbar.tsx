
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslations } from '../hooks/useTranslations';
import { LanguageContext } from '../context/LanguageContext';
import { Language } from '../types';
import { APP_NAME } from '../constants';

export const Navbar: React.FC = () => {
  const { t, language, dir } = useTranslations();
  const { setLanguage } = React.useContext(LanguageContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      isActive
        ? 'bg-primary-700 text-white'
        : 'text-secondary-700 dark:text-secondary-300 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-600'
    } ${dir === 'rtl' ? 'ml-4' : 'mr-4'}`;

  const toggleLanguage = () => {
    setLanguage(language === Language.EN ? Language.AR : Language.EN);
  };

  return (
    <nav className="bg-white dark:bg-secondary-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <NavLink to="/" className="flex-shrink-0 text-2xl font-bold text-primary-600 dark:text-primary-400">
              {APP_NAME}
            </NavLink>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center">
              <NavLink to="/" className={navLinkClasses}>
                {t('nav.home')}
              </NavLink>
              <NavLink to="/valuation" className={navLinkClasses}>
                {t('nav.valuationForm')}
              </NavLink>
              <NavLink to="/about" className={navLinkClasses}>
                {t('nav.about')}
              </NavLink>
              <NavLink to="/help" className={navLinkClasses}>
                {t('nav.help')}
              </NavLink>
              <button
                onClick={toggleLanguage}
                className={`px-3 py-2 rounded-md text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-600 ${dir === 'rtl' ? 'mr-auto' : 'ml-4'}`}
              >
                {language === Language.EN ? t('nav.arabic') : t('nav.english')}
              </button>
            </div>
          </div>
          <div className="md:hidden flex items-center">
             <button
                onClick={toggleLanguage}
                className={`px-3 py-2 rounded-md text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-600 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`}
              >
                {language === Language.EN ? 'ع' : 'En'}
              </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-secondary-400 hover:text-white hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon for menu open/close */}
              {!mobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state. */}
      {mobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className={`px-2 pt-2 pb-3 space-y-1 sm:px-3 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
            <NavLink to="/" className={({isActive}) => `block ${navLinkClasses({isActive})}`} onClick={() => setMobileMenuOpen(false)}>{t('nav.home')}</NavLink>
            <NavLink to="/valuation" className={({isActive}) => `block ${navLinkClasses({isActive})}`} onClick={() => setMobileMenuOpen(false)}>{t('nav.valuationForm')}</NavLink>
            <NavLink to="/about" className={({isActive}) => `block ${navLinkClasses({isActive})}`} onClick={() => setMobileMenuOpen(false)}>{t('nav.about')}</NavLink>
            <NavLink to="/help" className={({isActive}) => `block ${navLinkClasses({isActive})}`} onClick={() => setMobileMenuOpen(false)}>{t('nav.help')}</NavLink>
          </div>
        </div>
      )}
    </nav>
  );
};

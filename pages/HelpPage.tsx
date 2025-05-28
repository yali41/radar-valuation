
import React, { useState } from 'react';
import { PageContainer } from '../components/PageContainer';
import { useTranslations } from '../hooks/useTranslations';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { dir } = useTranslations();

  return (
    <div className="border-b border-secondary-200 dark:border-secondary-700 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-lg font-medium text-secondary-800 dark:text-secondary-100 focus:outline-none text-left rtl:text-right"
      >
        <span className={dir === 'rtl' ? 'text-right' : 'text-left'}>{question}</span>
        <span>{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className={`mt-3 text-secondary-600 dark:text-secondary-300 leading-relaxed ${dir === 'rtl' ? 'pr-2' : 'pl-2'} whitespace-pre-line`}>
          {answer}
        </div>
      )}
    </div>
  );
};

export const HelpPage: React.FC = () => {
  const { t } = useTranslations();

  const faqs = [
    { qKey: 'helpPage.q1_q', aKey: 'helpPage.q1_a' },
    { qKey: 'helpPage.q2_q', aKey: 'helpPage.q2_a' },
    { qKey: 'helpPage.q3_q', aKey: 'helpPage.q3_a' },
    { qKey: 'helpPage.q6_q', aKey: 'helpPage.q6_a' }, // DCF Assumptions
    { qKey: 'helpPage.q7_q', aKey: 'helpPage.q7_a' }, // Finding Benchmarks
    { qKey: 'helpPage.q8_q', aKey: 'helpPage.q8_a' }, // How Benchmarks are Used
    { qKey: 'helpPage.q4_q', aKey: 'helpPage.q4_a' },
    { qKey: 'helpPage.q5_q', aKey: 'helpPage.q5_a' },
  ];

  return (
    <PageContainer title={t('helpPage.title')}>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <FAQItem key={index} question={t(faq.qKey)} answer={t(faq.aKey)} />
        ))}
      </div>
       <div className="mt-10 text-center">
            <img src="https://picsum.photos/700/250?random=3" alt={t('helpPage.title')} className="mx-auto rounded-lg shadow-lg" />
        </div>
    </PageContainer>
  );
};

import React, { createContext, useState, useEffect } from 'react';
import i18n from '../i18n';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('appLanguage') || 'es';
  });

  const getLanguageId = () => {
    return language === 'en' ? 1 : 3;
  };

  useEffect(() => {
    i18n.changeLanguage(language);
    localStorage.setItem('appLanguage', language);
    console.log('Idioma cambiado a:', language, 'ID:', getLanguageId());
    
    document.title = language === 'es' ? 'RAM - Español' : 'RAM - English';
  }, [language]);

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      languageId: getLanguageId()
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
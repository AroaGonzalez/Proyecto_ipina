import React, { useState, useEffect } from 'react';
import '../styles/languageSelector.css';

const LanguageSelector = () => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('appLanguage') || 'es';
  });

  useEffect(() => {
    localStorage.setItem('appLanguage', language);
  }, [language]);

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  return (
    <div className="language-selector">
      <select value={language} onChange={handleLanguageChange}>
        <option value="es">Español</option>
        <option value="en">English</option>
      </select>
    </div>
  );
};

export default LanguageSelector;
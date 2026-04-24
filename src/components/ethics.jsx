import React, { useState, useEffect } from 'react';
import './css/constitution.css';

const Ethics = ({ data }) => {
  const [lang, setLang] = useState('ky'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [openSection, setOpenSection] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // 1. Издөө жана чыпкалоо (сенин 'section' жана 'clauses' талааларыңа ылайыкталды)
  const filteredSections = (data || []).map(item => {
    const matched = (item.clauses || []).filter(clause => {
      const titleText = clause.title?.[lang] || "";
      const contentText = clause.content?.[lang] || "";
      return (
        titleText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contentText.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    return { ...item, clauses: matched };
  }).filter(item => item.clauses.length > 0);

  // 2. Маалымат келгенде биринчи пунктту автоматтык түрдө көрсөтүү
  useEffect(() => {
    if (!selectedArticle && data && data.length > 0) {
      if (data[0].clauses && data[0].clauses.length > 0) {
        setSelectedArticle(data[0].clauses[0]);
      }
    }
  }, [data, selectedArticle]);

  if (!data || data.length === 0) {
    return <div className="loader" style={{color: 'white', padding: '20px'}}>Этика кодекси жүктөлүүдө...</div>;
  }

  return (
    <div className="constitution-wrapper">
      <div className="article-sidebar">
        
        {/* Тил алмаштыргыч */}
        <div className="language-switcher">
          <button 
            className={lang === 'ky' ? 'active-lang' : ''} 
            onClick={() => setLang('ky')}
          >KG</button>
          <button 
            className={lang === 'ru' ? 'active-lang' : ''} 
            onClick={() => setLang('ru')}
          >RU</button>
        </div>

        {/* Издөө кутучасы */}
        <div className="search-box-container">
          <input
            className="search-input"
            type="text"
            placeholder={lang === 'ky' ? "Кодекстен издөө..." : "Поиск по кодексу..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Бөлүмдөрдүн тизмеси */}
        <div className="article-list">
          {filteredSections.map((item, sIndex) => (
            <div key={item.id || sIndex} className="accordion-group">
              <div 
                className={`accordion-title ${openSection === sIndex ? 'active' : ''}`}
                onClick={() => setOpenSection(openSection === sIndex ? null : sIndex)}
              >
                {/* Сүрөттө 'section' деп турат, ошону алдык */}
                <span>{item.section?.[lang]}</span>
                <span className="arrow">{openSection === sIndex ? '−' : '+'}</span>
              </div>
              
              <div className={`accordion-content ${openSection === sIndex ? 'show' : ''}`}>
                {/* Сүрөттө 'clauses' деп турат */}
                {item.clauses.map((clause) => (
                  <div 
                    key={clause.id} 
                    className={`sub-article-item ${selectedArticle?.id === clause.id ? 'selected' : ''}`}
                    onClick={() => setSelectedArticle(clause)}
                  >
                    {clause.title?.[lang]}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Негизги текст талаасы */}
      <div className="article-content">
        {selectedArticle ? (
          <div className="content-card">
            <h1 className="active-title-name">{selectedArticle.title?.[lang]}</h1>
            <div className="accent-line"></div>
            <p className="content-text" style={{ whiteSpace: 'pre-line' }}>
              {selectedArticle.content?.[lang]}
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '50px', color: '#999' }}>
            {lang === 'ky' ? "Пунктту тандаңыз" : "Выберите пункт"}
          </div>
        )}
      </div>
    </div>
  );
};

export default Ethics;
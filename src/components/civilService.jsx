import React, { useState, useEffect } from 'react';
import './css/constitution.css'; 

const CivilService = ({ data }) => {
  const [lang, setLang] = useState('ky'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [openSection, setOpenSection] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // 1. Издөө логикасы (Сиздин скриншоттогу 'articles' талаасына ылайыкталды)
  const filteredSections = (data || []).map(item => {
    const matched = (item.articles || []).filter(article => {
      const titleText = article.title?.[lang] || "";
      const contentText = article.content?.[lang] || "";
      return (
        titleText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contentText.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    return { ...item, articles: matched };
  }).filter(item => item.articles.length > 0);

  // 2. Биринчи маалыматты автоматтык түрдө тандап көрсөтүү
  useEffect(() => {
    if (!selectedArticle && data && data.length > 0) {
      if (data[0].articles && data[0].articles.length > 0) {
        setSelectedArticle(data[0].articles[0]);
      }
    }
  }, [data, selectedArticle]);

  if (!data || data.length === 0) {
    return <div className="loader" style={{color: 'black', padding: '20px'}}>Жүктөлүүдө...</div>;
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

        {/* Издөө */}
        <div className="search-box-container">
          <input
            className="search-input"
            type="text"
            placeholder={lang === 'ky' ? "Мыйзамдан издөө..." : "Поиск по закону..."}
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
                <span>{item.section?.[lang]}</span>
                <span className="arrow">{openSection === sIndex ? '−' : '+'}</span>
              </div>
              
              <div className={`accordion-content ${openSection === sIndex ? 'show' : ''}`}>
                {/* Бул жерде 'articles' колдонулат */}
                {item.articles.map((article) => (
                  <div 
                    key={article.id} 
                    className={`sub-article-item ${selectedArticle?.id === article.id ? 'selected' : ''}`}
                    onClick={() => setSelectedArticle(article)}
                  >
                    {article.title?.[lang]}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Негизги мазмун */}
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
            {lang === 'ky' ? "Беренени тандаңыз" : "Выберите статью"}
          </div>
        )}
      </div>
    </div>
  );
};

export default CivilService;
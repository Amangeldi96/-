import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './css/constitution.css';

const Constitution = ({ data }) => {
  const [lang, setLang] = useState('ky'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [openSection, setOpenSection] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  
  const location = useLocation();

  // 1. Издөө жана чыпкалоо логикасы
  const filteredSections = (data || []).map(item => {
    const list = item.articles || item.clauses || [];
    const matched = list.filter(art => {
      const titleText = art.title?.[lang] || "";
      const contentText = art.content?.[lang] || "";
      return (
        titleText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contentText.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    return { ...item, displayList: matched };
  }).filter(item => item.displayList.length > 0);

  // 2. БЕРЕНЕНИ ТАНДОО ЖАНА АККОРДЕОНДУ БАШКАРУУ
  useEffect(() => {
    if (!data || data.length === 0) return;

    const queryParams = new URLSearchParams(location.search);
    const articleIdFromUrl = queryParams.get('article');

    // А) Эгер Күндүн беренеси аркылуу ID менен келсе
    if (articleIdFromUrl) {
      let foundArt = null;
      let foundSIndex = null;

      data.forEach((section, sIndex) => {
        const list = section.articles || section.clauses || [];
        const art = list.find(a => String(a.id) === String(articleIdFromUrl));
        if (art) {
          foundArt = art;
          foundSIndex = sIndex;
        }
      });

      if (foundArt) {
        setSelectedArticle(foundArt);
        setOpenSection(foundSIndex); // Тандалган берененин бөлүмүн ачабыз
        return; 
      }
    }

    // Б) Эгер жөн эле менюдан кирсе (URL'де ID жок болсо)
    if (!selectedArticle) {
      const firstList = data[0].articles || data[0].clauses || [];
      if (firstList.length > 0) {
        setSelectedArticle(firstList[0]); // 1-беренени мазмунга чыгарабыз
        setOpenSection(null); // БИРОК аккордеондорду жабык кармайбыз
      }
    }
  }, [data, location.search]);

  if (!data || data.length === 0) {
    return <div className="loader">Маалымат жүктөлүүдө...</div>;
  }

  return (
    <div className="constitution-wrapper">
      <div className="article-sidebar">
        
        {/* Тил которгуч */}
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
            placeholder={lang === 'ky' ? "Издөө..." : "Поиск..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Сол жактагы тизме (Аккордеон) */}
        <div className="article-list">
          {filteredSections.map((item, sIndex) => (
            <div key={item.id || sIndex} className="accordion-group">
              <div 
                className={`accordion-title ${openSection === sIndex ? 'active' : ''}`}
                onClick={() => setOpenSection(openSection === sIndex ? null : sIndex)}
              >
                <span>{item.title?.[lang] || item.section?.[lang]}</span>
                <span className="arrow">{openSection === sIndex ? '−' : '+'}</span>
              </div>
              
              <div className={`accordion-content ${openSection === sIndex ? 'show' : ''}`}>
                {item.displayList.map((art) => (
                  <div 
                    key={art.id} 
                    className={`sub-article-item ${selectedArticle?.id === art.id ? 'selected' : ''}`}
                    onClick={() => setSelectedArticle(art)}
                  >
                    {art.title?.[lang]}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Оң жактагы мазмун терезеси */}
      <div className="article-content">
        {selectedArticle ? (
          <div className="content-card">
            <h1 className="active-title-name">{selectedArticle.title?.[lang]}</h1>
            <div className="accent-line"></div>
            <p className="content-text" style={{ whiteSpace: 'pre-wrap' }}>
              {selectedArticle.content?.[lang]}
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '50px', color: '#999' }}>
            {lang === 'ky' ? "Тандаңыз..." : "Выберите..."}
          </div>
        )}
      </div>
    </div>
  );
};

export default Constitution;
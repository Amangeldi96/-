import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase'; // Firebase импорттору
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const mixedTest = ({ data = [], titleKy, titleRu }) => {
  const [lang, setLang] = useState('ky');
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [showResult, setShowResult] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Сактоо индикатору

  // 1. Маалыматты форматтоо жана аралаштыруу
  const quizData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const formatted = data.map(item => {
      const getIndices = (lKey) => {
        const options = item.options[lKey];
        const correct = item.correctAnswer[lKey];
        const correctArr = Array.isArray(correct) ? correct : [correct];
        return correctArr.map(val => options.indexOf(val)).filter(idx => idx !== -1);
      };
      return {
        ...item,
        question_ky: item.question.ky,
        question_ru: item.question.ru,
        options_ky: item.options.ky,
        options_ru: item.options.ru,
        correctIndices: getIndices('ky')
      };
    });
    return [...formatted].sort(() => 0.5 - Math.random()).slice(0, 30);
  }, [data]);

  // 2. Статистиканы эсептөө жана Firebase'ге сактоо
  const calculateStats = () => {
    let correct = 0, wrong = 0, unanswered = 0;
    quizData.forEach((q, idx) => {
      const ans = userAnswers[idx];
      if (!ans || ans.length === 0) { unanswered++; } 
      else {
        const isCorrect = ans.length === q.correctIndices.length && ans.every(v => q.correctIndices.includes(v));
        isCorrect ? correct++ : wrong++;
      }
    });

    // Канча убакыт коротулганын эсептөө
    const timeSpentSeconds = (30 * 60) - timeLeft;
    const mins = Math.floor(timeSpentSeconds / 60);
    const secs = timeSpentSeconds % 60;
    const timeTaken = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    return { correct, wrong, unanswered, timeTaken, percentage: Math.round((correct / quizData.length) * 100) };
  };

  const saveToFirebase = async (stats) => {
    const user = auth.currentUser;
    if (!user) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, "test_history"), {
        userId: user.uid,
        testTitle: titleKy,
        correct: stats.correct,
        wrong: stats.wrong + stats.unanswered, // Жоопсуз калгандар да катага кирет
        timeTaken: stats.timeTaken,
        percentage: stats.percentage,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Firebase save error:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinish = () => {
    const stats = calculateStats();
    setShowResult(true);
    saveToFirebase(stats);
  };

  // 3. Таймер эффекти
  useEffect(() => {
    let timer;
    if (isStarted && timeLeft > 0 && !showResult) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && !showResult) {
      handleFinish();
    }
    return () => clearInterval(timer);
  }, [isStarted, timeLeft, showResult]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const t = {
    ky: { 
      start: "Тестти баштоо", next: "Кийинки", prev: "Артка", finish: "Жыйынтыктоо", 
      time: "Убакыт", correct: "Туура", wrong: "Ката", noAns: "Жоопсуз", 
      review: "Каталар менен иштөө", trueAns: "Туура жооп:",
      testOver: "Тест аяктады!", restart: "Кайра баштоо", loading: "Жүктөлүүдө...",
      timeLabel: "Коротулган убакыт:"
    },
    ru: { 
      start: "Начать тест", next: "Далее", prev: "Назад", finish: "Завершить", 
      time: "Время", correct: "Правильно", wrong: "Неправильно", noAns: "Без ответа", 
      review: "Работа над ошибками", trueAns: "Правильный ответ:",
      testOver: "Тест завершен!", restart: "Начать заново", loading: "Загрузка...",
      timeLabel: "Затраченное время:"
    }
  }[lang];

  const handleOptionClick = (index) => {
    const question = quizData[currentQuestion];
    let currentSelected = userAnswers[currentQuestion] || [];
    if (question.type === 'radio') {
      currentSelected = [index];
    } else {
      currentSelected = currentSelected.includes(index)
        ? currentSelected.filter(i => i !== index)
        : [...currentSelected, index];
    }
    setUserAnswers({ ...userAnswers, [currentQuestion]: currentSelected });
  };

  const LangSwitcher = () => (
    <div className="lang-switcher-container" style={{ display: 'flex', gap: '10px' }}>
      <button className={`lang-btn ${lang === 'ky' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setLang('ky'); }}>
        KG
      </button>
      <span className="divider">|</span>
      <button className={`lang-btn ${lang === 'ru' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setLang('ru'); }}>
        RU
      </button>
    </div>
  );

  if (quizData.length === 0) return <div className="quiz-main-container"><div className="loader">{t.loading}</div></div>;

  // 1. СТАРТ ЭКРАНЫ
  if (!isStarted) {
    return (
      <div className="quiz-main-container result-centered">
        <div className="quiz-card result-box">
          <LangSwitcher />
          <h1 className="active-title-name" style={{fontSize: '24px', margin: '20px 0'}}>{lang === 'ky' ? titleKy : titleRu}</h1>
          <p className="score-text" style={{margin: '0 0 30px'}}>30 {lang === 'ky' ? 'суроо' : 'вопросов'} • 30 {lang === 'ky' ? 'мүнөт' : 'минут'}</p>
          <button className="next-btn active" onClick={() => setIsStarted(true)}>{t.start}</button>
        </div>
      </div>
    );
  }

  // 2. ЖЫЙЫНТЫК ЭКРАНЫ
  if (showResult) {
    const stats = calculateStats();
    return (
      <div className="quiz-main-container">
        <div className="quiz-card result-box review-mode">
          <h1 className="active-title-name">{t.testOver}</h1>
          <div className="stat-grid">
            <div className="stat-item correct">{t.correct}: {stats.correct}</div>
            <div className="stat-item wrong">{t.wrong}: {stats.wrong}</div>
            <div className="stat-item time" style={{color: '#3b82f6'}}>{t.time}: {stats.timeTaken}</div>
          </div>
          <div className="score-summary">
            <p className="score-text">{lang === 'ky' ? 'Пайыз' : 'Процент'}: <span>{stats.percentage}%</span></p>
          </div>
          <div className="review-list">
            <h3 className="review-title">{t.review}</h3>
            {quizData.map((q, idx) => {
              const ans = userAnswers[idx] || [];
              const isCorrect = ans.length === q.correctIndices.length && ans.every(v => q.correctIndices.includes(v));
              if (isCorrect) return null;
              return (
                <div key={idx} className="review-item">
                  <p className="review-question">{idx + 1}. {lang === 'ky' ? q.question_ky : q.question_ru}</p>
                  <p className="correct-ans">{t.trueAns} {q.correctIndices.map(i => (lang === 'ky' ? q.options_ky[i] : q.options_ru[i])).join(', ')}</p>
                </div>
              );
            })}
          </div>
          <button className="next-btn active restart-btn" onClick={() => window.location.reload()}>{t.restart}</button>
        </div>
      </div>
    );
  }

  // 3. ТЕСТ ЭКРАНЫ
  const currentQ = quizData[currentQuestion];
  const isSelected = (index) => (userAnswers[currentQuestion] || []).includes(index);

  return (
<div className="quiz-main-container">
  <div className="quiz-card">
    <div className="quiz-header">
      
      <div className="quiz-header-left" style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
        <div className="timer-badge">
          <span className="timer">⏱ {formatTime(timeLeft)}</span>
        </div>
      </div>
      <div className="lang-mini-switcher">
        <button 
          onClick={() => setLang('ky')} 
          className={lang === 'ky' ? 'active-lang' : ''}
        >
          KG
        </button>

        <span className="divider">|</span>

        <button 
          onClick={() => setLang('ru')} 
          className={lang === 'ru' ? 'active-lang' : ''}
        >
          RU
        </button>
      </div>

    </div>

    <div className="quiz-progress-bar">
      <div 
        className="progress-fill" 
        style={{ width: `${((currentQuestion + 1) / quizData.length) * 100}%` }}
      ></div>
    </div>

    <div className="quiz-counter">
      {currentQuestion + 1} / {quizData.length}
    </div>

    <h2 className="question-text">
      {lang === 'ky' ? currentQ.question_ky : currentQ.question_ru}
    </h2>

    <div className="options-grid">
      {(lang === 'ky' ? currentQ.options_ky : currentQ.options_ru).map((opt, i) => (
        <div 
          key={i} 
          className={`option-card ${isSelected(i) ? 'selected' : ''}`} 
          onClick={() => handleOptionClick(i)}
        >
          <div className={`check-indicator ${currentQ.type}`}>
            {isSelected(i) && <div className="check-dot" />}
          </div>
          <span className="option-label">{opt}</span>
        </div>
      ))}
    </div>

    <div className="nav-btns" style={{display: 'flex', justifyContent: 'space-between', marginTop: '30px'}}>
      
      <button 
        className="next-btn prev-btn"
        disabled={currentQuestion === 0}
        onClick={() => setCurrentQuestion(prev => prev - 1)}
        style={{margin: 0, width: '48%', background: '#f1f3f5', color: '#4a4a4a'}}
      >
        {t.prev}
      </button>

      <button 
        className={`next-btn ${(!userAnswers[currentQuestion] || userAnswers[currentQuestion].length === 0) ? 'disabled' : 'active'}`}
        style={{margin: 0, width: '48%'}}
        disabled={!userAnswers[currentQuestion] || userAnswers[currentQuestion].length === 0}
        onClick={() => currentQuestion === quizData.length - 1 
          ? handleFinish() 
          : setCurrentQuestion(prev => prev + 1)
        }
      >
        {currentQuestion === quizData.length - 1 ? t.finish : t.next}
      </button>

    </div>
  </div>
</div>
  );
};

export default mixedTest;
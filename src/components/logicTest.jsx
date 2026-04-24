import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const LogicTest = ({ data = [], titleKy, titleRu }) => {
  const [lang, setLang] = useState('ky');
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [showResult, setShowResult] = useState(false);

  /* ================= DATA ================= */
  const quizData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const formatted = data.map((item, index) => {
      const getCorrect = (lKey) => {
        const val = item.correctAnswer?.[lKey] || item.correctAnswer;
        return Array.isArray(val) ? val.map(String) : [String(val)];
      };

      return {
        ...item,
        id: item.id || index,
        question_ky: item.question?.ky || "",
        question_ru: item.question?.ru || "",
        options_ky: item.options?.ky || [],
        options_ru: item.options?.ru || [],
        correct_ky: getCorrect('ky'),
        correct_ru: getCorrect('ru'),
        type: item.type === 'checkbox' || Array.isArray(item.correctAnswer?.ky) ? 'checkbox' : 'radio'
      };
    });

    return [...formatted].sort(() => 0.5 - Math.random()).slice(0, 30);
  }, [data]);

  /* ================= SELECT ================= */
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

  const isSelected = (index) => (userAnswers[currentQuestion] || []).includes(index);

  /* ================= STATS ================= */
  const calculateStats = () => {
    let correct = 0, wrong = 0, unanswered = 0;

    quizData.forEach((q, idx) => {
      const ans = userAnswers[idx];

      if (!ans || ans.length === 0) {
        unanswered++;
      } else {
        const correctIndexes = (lang === 'ky' ? q.correct_ky : q.correct_ru)
          .map(val => (lang === 'ky' ? q.options_ky : q.options_ru).indexOf(val));

        const isCorrect =
          ans.length === correctIndexes.length &&
          ans.every(v => correctIndexes.includes(v));

        isCorrect ? correct++ : wrong++;
      }
    });

    const timeSpent = (30 * 60) - timeLeft;
    const mins = Math.floor(timeSpent / 60);
    const secs = timeSpent % 60;

    return {
      correct,
      wrong,
      unanswered,
      timeTaken: `${mins}:${secs < 10 ? '0' : ''}${secs}`,
      percentage: Math.round((correct / quizData.length) * 100)
    };
  };

  const handleFinish = async () => {
    const stats = calculateStats();
    setShowResult(true);

    const user = auth.currentUser;
    if (user) {
      try {
        await addDoc(collection(db, "test_history"), {
          userId: user.uid,
          testTitle: titleKy,
          correct: stats.correct,
          wrong: stats.wrong + stats.unanswered,
          timeTaken: stats.timeTaken,
          percentage: stats.percentage,
          createdAt: serverTimestamp()
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  /* ================= TIMER ================= */
  useEffect(() => {
    let timer;
    if (isStarted && timeLeft > 0 && !showResult) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && !showResult) {
      handleFinish();
    }
    return () => clearInterval(timer);
  }, [isStarted, timeLeft, showResult]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const t = {
    ky: { start: "Баштоо", next: "Кийинки", prev: "Артка", finish: "Аяктоо", restart: "Кайра баштоо" },
    ru: { start: "Начать", next: "Далее", prev: "Назад", finish: "Завершить", restart: "Заново" }
  }[lang];

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

  if (quizData.length === 0) return <div className="loader">Жүктөлүүдө...</div>;

  /* ================= START ================= */
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

  /* ================= RESULT ================= */
  if (showResult) {
    const stats = calculateStats();

    return (
      <div className="quiz-main-container">
        <div className="quiz-card result-box">
          <h1 className="score-text">
            <span>{stats.percentage}%</span>
          </h1>

          <div className="stat-grid">
            <div className="stat-item correct">{stats.correct}</div>
            <div className="stat-item wrong">{stats.wrong}</div>
            <div className="stat-item empty">{stats.unanswered}</div>
          </div>

          <button className="next-btn active restart-btn" onClick={() => window.location.reload()}>
            {t.restart}
          </button>
        </div>
      </div>
    );
  }

  /* ================= TEST ================= */
  const currentQ = quizData[currentQuestion];

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

export default LogicTest;
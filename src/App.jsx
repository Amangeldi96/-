import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Компоненттер
import AuthForm from './components/authForm';
import Header from './components/header';
import Home from './components/home';
import Constitution from './components/constitution';
import Ethics from './components/ethics';
import CivilService from './components/civilService';
import History from './components/history';
import Settings from './components/settings';
import Messages from './components/messages';


// Тест компоненттери 
import Test from './components/normalTest';
import LogicTest from './components/logicTest';
import MixedTest from './components/mixedTest';

// Маалыматтар
import { constitutionData } from './data/constitutionData';
import { ethicsCodeData } from './data/ethicsData';
import { civilServiceData } from './data/civilServiceData';
import { normalTestData } from './data/normalTestData';
import { logicTestData } from './data/logicTestData';

// Стилдер
import './components/css/style.css';
import './components/css/menu.css';
import './components/css/test.css';
import './components/css/constitution.css';
import './components/css/toast.css';

// 🔒 Корголгон маршрут компоненти
const ProtectedRoute = ({ user, children }) => {
  return user ? children : <Navigate to="/login" replace />;
};

const mixedTestData = [
  ...(normalTestData || []),
  ...(logicTestData || [])
].map((item, index) => ({
  ...item,
  id: index + 1
}));

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Firebase авторизациясын текшерүү
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Жүктөлүү учурунда көрсөтүлүүчү экран
    if (loading) {
    return (
      <div className="skeleton-wrapper" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header скелети (Логотип жана Меню) */}
        <div className="skeleton-header-nav" style={{ marginBottom: '30px' }}>
          <div className="sk-logo"></div>
          <div className="sk-nav-items">
            <div className="sk-nav-item"></div>
            <div className="sk-nav-item"></div>
            <div className="sk-nav-item"></div>
          </div>
        </div>

        {/* Баннердин ордуна чоң блок */}
        <div className="hero-banner skeleton-banner" style={{ minHeight: '200px', marginBottom: '40px' }}>
          <div className="sk-title" style={{ margin: '0 auto 20px auto' }}></div>
          <div className="sk-subtitle" style={{ margin: '0 auto' }}></div>
        </div>

        {/* Күндүн беренеси же негизги контенттин скелети */}
        <div className="daily-article-card sk-daily-card" style={{ marginBottom: '40px' }}>
          <div className="sk-tag"></div>
          <div className="sk-line large"></div>
          <div className="sk-line full"></div>
          <div className="sk-line full"></div>
        </div>

        {/* Карточкалардын скелети */}
        <div className="main-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="feature-card sk-card">
              <div className="sk-icon"></div>
              <div className="sk-line small center"></div>
              <div className="sk-btn"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }


  return (
    <Router>
      <div className="main-wrapper">
        {user && <Header user={user} />}

        <div className="content-area">
          <Routes>
            {/* Авторизация */}
            <Route
              path="/login"
              element={!user ? <AuthForm /> : <Navigate to="/" replace />}
            />

            {/* Негизги барактар */}
            <Route
              path="/"
              element={
                <ProtectedRoute user={user}>
                  <Home constitutionData={constitutionData || []} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/constitution"
              element={
                <ProtectedRoute user={user}>
                  <Constitution data={constitutionData || []} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ethics"
              element={
                <ProtectedRoute user={user}>
                  <Ethics data={ethicsCodeData || []} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/service"
              element={
                <ProtectedRoute user={user}>
                  <CivilService data={civilServiceData || []} />
                </ProtectedRoute>
              }
            />

           {/* 📝 Жалпы тест */}
<Route
  path="/quiz/normal"
  element={
    <ProtectedRoute user={user}>
      <Test
        data={normalTestData || []}
        titleKy="Кадимки тест"   
        titleRu="Обычный тест"   
      />
    </ProtectedRoute>
  }
/>

{/* 🧠 Логикалык тест */}
<Route
  path="/quiz/logic"
  element={
    <ProtectedRoute user={user}>
      <LogicTest
        data={logicTestData || []} 
        titleKy="Логикалык тест" 
        titleRu="Логика и мышление"
      />
    </ProtectedRoute>
  }
/>

{/* 🌀 Аралаш тест (Mixed) */}
<Route
  path="/quiz/mixed"
  element={
    <ProtectedRoute user={user}>
      <MixedTest 
        data={mixedTestData || []} 
        titleKy="Аралаш тест"    // 👈 Бул жерге да titleKy кошуңуз
        titleRu="Смешанный тест"
      />
    </ProtectedRoute>
  }
/>

            {/* Белгисиз маршруттар үчүн */}
            <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
          <Route path="/messages" element={<Messages />} />
          </Routes>
          
        </div>
      </div>
    </Router>
  );
}

export default App;

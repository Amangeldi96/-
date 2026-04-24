import React, { useState } from 'react';
import { auth, db } from '../firebase'; // 'db' кошулду
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'; 
const AuthForm = () => {
  // Панелдерди которуу үчүн абал (state)
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  
  // Маалыматтарды сактоо
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  // Кирүү функциясы
  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
    } catch (err) {
      alert("Ката: " + err.message);
    }
  };

  // Катталуу функциясы
const handleSignUp = async (e) => {
  e.preventDefault();

  try {
    // 1. Аккаунт түзүү
    const res = await createUserWithEmailAndPassword(
      auth,
      formData.email,
      formData.password
    );

    // 2. Auth профилине атты жазуу
    await updateProfile(res.user, {
      displayName: formData.name
    });

    // 3. Firestore "users" коллекциясына сактоо
    await setDoc(doc(db, "users", res.user.uid), {
      uid: res.user.uid,
      displayName: formData.name,
      email: formData.email,
      createdAt: serverTimestamp(),
      photoURL: ""
    });

    // 4. "presences" коллекциясына да кошуу
    await setDoc(doc(db, "presences", res.user.uid), {
      isOnline: true,
      lastSeen: serverTimestamp()
    });

    await auth.currentUser.reload();
    alert("Катталуу ийгиликтүү болду!");

  } catch (err) {
    console.error("Ката кетти:", err);
    alert("Катталууда ката: " + err.message);
  }
};

  return (
    <div className={`container ${isSignUpMode ? 'sign-up-mode' : ''}`}>
      <div className="forms-container">
        <div className="signin-signup">

          
          {/* КИРҮҮ ФОРМАСЫ */}
          <form action="#" className="sign-in-form" onSubmit={handleSignIn}>
                   <div className="header-box">
  {/* Декорация */}
  <div className="circle-deco"></div>

  {/* Заголовок */}
  <h3 className="header-title">
    Виктаринага кош келиңиз! 🚀
  </h3>
  
  {/* Текст */}
  <p className="header-desc">
    Квалификациялык тесттерге даярдануунун эң натыйжалуу жолу. 
    Биз менен бирге билим алыңыз.
  </p>

  {/* Инфо-белги */}
  <div className="header-badge">
    Суроолор жана расмий мыйзамдар
  </div>
</div>
            <h2 className="title">Кирүү</h2>
            <div className="input-field">
              <i className="fas fa-user"></i>
              <input 
                type="email" 
                placeholder="Email жазыңыз" 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                required 
              />
            </div>
            <div className="input-field">
              <i className="fas fa-lock"></i>
              <input 
                type="password" 
                placeholder="Пароль жазыңыз" 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                required 
              />
            </div>
            <input type="submit" value="Кирүү" className="btn solid" />
          </form>

          {/* КАТТАЛУУ ФОРМАСЫ */}
          <form action="#" className="sign-up-form" onSubmit={handleSignUp}>
            <h2 className="title">Катталуу</h2>
            <div className="input-field">
              <i className="fas fa-user"></i>
              <input 
                type="text" 
                placeholder="Атыңызды жазыңыз" 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
              />
            </div>
            <div className="input-field">
              <i className="fas fa-envelope"></i>
              <input 
                type="email" 
                placeholder="Email жазыңыз" 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                required 
              />
            </div>
            <div className="input-field">
              <i className="fas fa-lock"></i>
              <input 
                type="password" 
                placeholder="Пароль жазыңыз" 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                required 
              />
            </div>
            <input type="submit" className="btn" value="Катталуу" />
          </form>

        </div>
      </div>

      <div className="panels-container">
        {/* СОЛ ПАНЕЛЬ (Кирүүдө турганда көрүнөт) */}
        <div className="panel left-panel">
          <div className="content">
            <h3>Жаңы аккаунт түзүү</h3>
            <p>
              сизде аккаунт жокпу? Төмөндөгү баскычты басып, катталыңыз
            </p>
            <button 
              className="btn transparent" 
              id="sign-up-btn" 
              onClick={() => setIsSignUpMode(true)}
            >
              Катталуу
            </button>
          </div>
          <img src="/img/log.svg" className="image" alt="" />
        </div>

        {/* ОҢ ПАНЕЛЬ (Катталууда турганда көрүнөт) */}
        <div className="panel right-panel">
          <div className="content">
            <h3>Кирүү</h3>
            <p>
              аккаунт барбы? Төмөндөгү баскычты басып, кирүүңиз
            </p>
            <button 
              className="btn transparent" 
              id="sign-in-btn" 
              onClick={() => setIsSignUpMode(false)}
            >
              Кирүү
            </button>
          </div>
          <img src="/img/register.svg" className="image" alt="" />
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
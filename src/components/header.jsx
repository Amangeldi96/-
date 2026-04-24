import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { 
  CheckCircle, XCircle, X, LogOut, Settings as SettingsIcon, 
  History as HistoryIcon, Home, Scale, ChevronDown, BookOpen, MessageCircle 
} from 'lucide-react';

const Header = ({ user }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dropdown, setDropdown] = useState(null);
  const [mobileSubMenu, setMobileSubMenu] = useState(null);
  const [hasNewMessages, setHasNewMessages] = useState(false); // Билдирүү индикатору үчүн статус

  const navigate = useNavigate();
  const location = useLocation();
  
  const [toast, setToast] = useState({ show: false, type: '', text: '' });
  const [modal, setModal] = useState({ show: false });

  const userName = user?.displayName || user?.email?.split('@')[0] || "Колдонуучу";
  const initial = userName.trim().charAt(0).toUpperCase() || "U";

  // Жаңы билдирүүлөрдү базадан текшерүү (Realtime)
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "messages"), 
      where("receiverId", "==", user.uid), 
      where("isRead", "==", false)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHasNewMessages(!snapshot.empty);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = () => {
      setProfileOpen(false);
      setDropdown(null);
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const showToast = (type, text) => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast({ show: false, type: '', text: '' }), 3000);
  };

  const handleLogoutClick = (e) => {
    e.stopPropagation();
    setModal({ show: true });
    setProfileOpen(false);
    setMobileMenuOpen(false);
  };

  const executeLogout = async () => {
    try {
      await signOut(auth);
      showToast('success', 'Ийгиликтүү чыктыңыз!');
      navigate('/login');
    } catch (error) {
      showToast('error', 'Чыгууда ката кетти.');
    } finally {
      setModal({ show: false });
    }
  };

  const toggleMobileSub = (menu) => {
    setMobileSubMenu(prev => (prev === menu ? null : menu));
  };

  return (
    <>
      {/* --- TOAST БИЛДИРҮҮ --- */}
      <div className={`toast-container ${toast.show ? 'show' : ''}`}>
        <div className={`toast-box ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          <span>{toast.text}</span>
        </div>
      </div>

      {/* --- MODAL --- */}
      {modal.show && (
        <div className="modal-overlay" onClick={() => setModal({ show: false })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Чыгуу</h3>
              {/* X белгиси эми бурчта эмес, ушул жерде гана болот */}
              <button className="modal-close-btn" onClick={() => setModal({ show: false })}>
                <X size={20} />
              </button>
            </div>
            <p className="modal-text">Чын эле аккаунттан чыккыңыз келеби?</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setModal({ show: false })}>Жок</button>
              <button className="btn-confirm" onClick={executeLogout}>Ооба, чыгуу</button>
            </div>
          </div>
        </div>
      )}

      <header className="main-header" onClick={(e) => e.stopPropagation()}>
        <div className="header-container">
          <div className="header-left">
            <Link to="/" className="header-logo">Тестке Даярдык</Link>
          </div>

          <nav className="desktop-nav">
            <ul className="nav-list">
              <li className="nav-item">
                <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Башкы</Link>
              </li>
              <li className="nav-item dropdown-trigger" 
                  onMouseEnter={() => setDropdown('law')} 
                  onMouseLeave={() => setDropdown(null)}>
                <span className="nav-link">Мыйзамдар <ChevronDown size={14} className="chev" /></span>
                <div className={`dropdown-panel ${dropdown === 'law' ? 'show' : ''}`}>
                  <Link to="/constitution">Конституция</Link>
                  <Link to="/ethics">Этика кодекси</Link>
                  <Link to="/service">Мамлекеттик кызмат</Link>
                </div>
              </li>
              <li className="nav-item dropdown-trigger" 
                  onMouseEnter={() => setDropdown('test')} 
                  onMouseLeave={() => setDropdown(null)}>
                <span className="nav-link">Тесттер <ChevronDown size={14} className="chev" /></span>
                <div className={`dropdown-panel ${dropdown === 'test' ? 'show' : ''}`}>
                  <Link to="/quiz/normal">Кадимки</Link>
                  <Link to="/quiz/logic">Логика</Link>
                  <Link to="/quiz/mixed">Аралаш</Link>
                </div>
              </li>
            </ul>
          </nav>

          <div className="header-right">
            <div className="pc-profile-wrapper">
              <button className="user-pill" onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); }}>
                <span className="user-pill-name">{userName}</span>
                <div style={{ position: 'relative' }}>
                  <div className="user-avatar">{initial}</div>
                  {/* PC Индикатор */}
                  {hasNewMessages && <div className="unread-dot"></div>}
                </div>
              </button>
              {profileOpen && (
                <div className="profile-dropdown-modal show">
                  <div className="p-modal-header">
                    <strong>{userName}</strong>
                    <span style={{fontSize: '12px', color: '#ffffff', display: 'block'}}>{user?.email}</span>
                  </div>
                  <hr />
                  <Link to="/messages" className="p-modal-item">
                    <MessageCircle size={18} /> Билдирүүлөр 
                    {hasNewMessages && <span className="new-badge">Жаңы</span>}
                  </Link>
                  <Link to="/history" className="p-modal-item"><HistoryIcon size={18} /> Менин тарыхым</Link>
                  <Link to="/settings" className="p-modal-item"><SettingsIcon size={18} /> Настройка</Link>
                  <hr />
                  <button className="p-modal-item logout" onClick={handleLogoutClick}>
                    <LogOut size={18} /> Чыгуу
                  </button>
                </div>
              )}
            </div>

            <button className="mobile-burger-btn" onClick={() => setMobileMenuOpen(true)}>
              <div style={{ position: 'relative' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
                {/* Mobile Индикатор */}
                {hasNewMessages && <div className="unread-dot-mobile"></div>}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* --- МОБИЛДИК СИДЕБАР --- */}
      <div className={`mobile-sidebar ${mobileMenuOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="user-info-card">
            <div className="user-avatar-lg">{initial}</div>
            <div className="user-text">
              <h4>{userName}</h4>
              <p>{user?.email}</p>
            </div>
          </div>
          <button className="close-sidebar" onClick={() => setMobileMenuOpen(false)}>✕</button>
        </div>
        <div className="sidebar-body">
          <div className="sidebar-section">
            <label>Меню</label>
            <Link to="/" className="sidebar-link" onClick={() => setMobileMenuOpen(false)}>
              <div className="link-content"><Home size={20} /> Башкы бет</div>
            </Link>

            {/* Билдирүүлөр мобилдик менюда */}
            <Link to="/messages" className="sidebar-link" onClick={() => setMobileMenuOpen(false)}>
              <div className="link-content">
                <MessageCircle size={20} /> Билдирүүлөр 
                {hasNewMessages && <span className="side-msg-dot"></span>}
              </div>
            </Link>
            
            <div className={`mobile-collapsible ${mobileSubMenu === 'law' ? 'open' : ''}`}>
              <button className="sidebar-link" onClick={() => toggleMobileSub('law')}>
                <div className="link-content"><Scale size={20} /> Мыйзамдар</div>
                <ChevronDown size={18} className="chev-icon" />
              </button>
              <div className="mobile-sub-links">
                <Link to="/constitution" onClick={() => setMobileMenuOpen(false)}>Конституция</Link>
                <Link to="/ethics" onClick={() => setMobileMenuOpen(false)}>Этика кодекси</Link>
                <Link to="/service" onClick={() => setMobileMenuOpen(false)}>Мамлекеттик кызмат</Link>
              </div>
            </div>

            <div className={`mobile-collapsible ${mobileSubMenu === 'test' ? 'open' : ''}`}>
              <button className="sidebar-link" onClick={() => toggleMobileSub('test')}>
                <div className="link-content"><BookOpen size={20} /> Тесттер</div>
                <ChevronDown size={18} className="chev-icon" />
              </button>
              <div className="mobile-sub-links">
                <Link to="/quiz/normal" onClick={() => setMobileMenuOpen(false)}>Кадимки</Link>
                <Link to="/quiz/logic" onClick={() => setMobileMenuOpen(false)}>Логика</Link>
                <Link to="/quiz/mixed" onClick={() => setMobileMenuOpen(false)}>Аралаш</Link>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <label>Профиль</label>
            <Link to="/history" className="sidebar-link" onClick={() => setMobileMenuOpen(false)}>
              <div className="link-content"><HistoryIcon size={20} /> Менин тарыхым</div>
            </Link>
            <Link to="/settings" className="sidebar-link" onClick={() => setMobileMenuOpen(false)}>
              <div className="link-content"><SettingsIcon size={20} /> Настройка</div>
            </Link>
            <button className="sidebar-link logout-btn" onClick={handleLogoutClick}>
              <div className="link-content"><LogOut size={20} /> Чыгуу</div>
            </button>
          </div>
        </div>
      </div>
      {mobileMenuOpen && <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)}></div>}

      <style>{`
        .nav-link, .user-pill-name, .header-logo { color: white !important; text-decoration: none; font-weight: 500; }
        .dropdown-panel a { color: #1e293b !important; padding: 10px 15px; display: block; text-decoration: none; }
        .dropdown-panel a:hover { background: #f1f5f9; }
        .chev { transition: transform 0.3s; margin-left: 5px; stroke: white; }
        .nav-item:hover .chev { transform: rotate(180deg); }

        .toast-container { position: fixed; top: 20px; right: 20px; z-index: 10000; transform: translateX(120%); transition: transform 0.4s; }
        .toast-container.show { transform: translateX(0); }
        .toast-box { background: white; padding: 12px 20px; border-radius: 12px; display: flex; align-items: center; gap: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-left: 5px solid #6366f1; }
        .toast-box.success { border-left-color: #2ecc71; color: #2ecc71; }
        .toast-box.error { border-left-color: #e74c3c; color: #e74c3c; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100000; }
        .modal-content { background: white; padding: 25px; border-radius: 24px; width: 90%; max-width: 350px; position: relative; }
        .modal-header h3 { margin: 0; font-size: 20px; color: #1e293b; }
        .modal-text { margin: 15px 0 20px; color: #64748b; }
        
        .modal-close-btn { position: absolute; top: 20px; right: 20px; background: none; border: none; cursor: pointer; color: #94a3b8; padding: 0; display: flex; align-items: center; justify-content: center; }
        .modal-close-btn:hover { color: #1e293b; }

        .modal-actions { display: flex; gap: 10px; }
        .btn-cancel { flex: 1; padding: 12px; border: 1px solid #e2e8f0; border-radius: 12px; cursor: pointer; font-weight: 500; background: white; }
        .btn-confirm { flex: 1; padding: 12px; background: #ef4444; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 500; }
        
        /* Индикаторлор */
        .unread-dot { position: absolute; top: -2px; right: -2px; width: 12px; height: 12px; background: #2ecc71; border: 2px solid #1e293b; border-radius: 50%; }
        .unread-dot-mobile { position: absolute; top: -2px; right: -2px; width: 10px; height: 10px; background: #2ecc71; border: 2px solid #6366f1; border-radius: 50%; }
        .new-badge { background: #2ecc71; color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px; margin-left: auto; }
        .side-msg-dot { width: 8px; height: 8px; background: #2ecc71; border-radius: 50%; display: inline-block; margin-left: 8px; }

        .mobile-sidebar { position: fixed; top: 0; right: -100%; width: 280px; height: 100%; background: white; z-index: 110000; transition: 0.3s; display: flex; flex-direction: column; }
        .mobile-sidebar.active { right: 0; }
        .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 105000; }
        .sidebar-header { padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; }
        .sidebar-body { padding: 15px; overflow-y: auto; }
        .sidebar-link { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 12px 10px; color: #333; text-decoration: none; border: none; background: none; font-size: 15px; cursor: pointer; }
        .link-content { display: flex; align-items: center; gap: 10px; }
        .mobile-sub-links { max-height: 0; overflow: hidden; transition: 0.3s; padding-left: 40px; }
        .mobile-collapsible.open .mobile-sub-links { max-height: 200px; }
        .mobile-collapsible.open .chev-icon { transform: rotate(180deg); }
        .mobile-sub-links a { display: block; padding: 8px 0; color: #666; text-decoration: none; font-size: 14px; }
        .sidebar-section label { display: block; font-size: 11px; color: #999; margin: 15px 0 5px 10px; text-transform: uppercase; }
        .logout-btn { color: #ef4444 !important; }
      `}</style>
    </>
  );
};

export default Header;
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { updateProfile, updatePassword, deleteUser } from 'firebase/auth';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Trash2, History, ChevronRight, AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react';

const Settings = () => {
  const user = auth.currentUser;
  const navigate = useNavigate();

  const [name, setName] = useState(user?.displayName || "");
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [toast, setToast] = useState({ show: false, type: '', text: '' });
  const [modal, setModal] = useState({ show: false, title: '', text: '', onConfirm: null });

  const showToast = (type, text) => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  const askConfirmation = (title, text, confirmAction) => {
    setModal({ show: true, title, text, onConfirm: confirmAction });
  };

  const closeModal = () => setModal({ ...modal, show: false });

  const handleUpdateName = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await updateProfile(user, { displayName: name });
      showToast('success', 'Атыңыз ийгиликтүү жаңыртылды!');
    } catch (err) {
      showToast('error', 'Ката кетти: ' + err.message);
    }
    setLoading(false);
  };

  const handleUpdatePassword = async () => {
    if (newPass.length < 6) return showToast('error', 'Пароль 6 символдон аз болбосун!');
    setLoading(true);
    try {
      await updatePassword(user, newPass);
      showToast('success', 'Пароль жаңыланды!');
      setNewPass("");
    } catch (err) {
      showToast('error', 'Кайрадан кирип (Login) анан аракет кылыңыз.');
    }
    setLoading(false);
  };

  const executeClearHistory = async () => {
    setLoading(true);
    closeModal();
    try {
      const q = query(collection(db, "test_history"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "test_history", d.id)));
      await Promise.all(deletePromises);
      showToast('success', 'Тарых ийгиликтүү тазаланды!');
    } catch (err) {
      showToast('error', 'Тазалоодо ката кетти.');
    }
    setLoading(false);
  };

  const executeDeleteAccount = async () => {
    setLoading(true);
    closeModal();
    try {
      await deleteUser(user);
      navigate('/login');
    } catch (err) {
      showToast('error', 'Коопсуздук үчүн кайрадан кирип, анан өчүрүп көрүңүз.');
    }
    setLoading(false);
  };

  return (
    <div className="settings-page">
      
      {/* TOAST */}
      <div className={`toast-container ${toast.show ? 'show' : ''}`}>
        <div className={`toast-box ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          <span>{toast.text}</span>
        </div>
      </div>

      {/* MODAL */}
      {modal.show && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal.title}</h3>
              <X size={20} onClick={closeModal} className="close-icon" />
            </div>
            <p className="modal-text">{modal.text}</p>
            <div className="modal-actions">
              <button onClick={closeModal} className="btn-secondary">Жок</button>
              <button onClick={modal.onConfirm} className="btn-confirm">Ооба</button>
            </div>
          </div>
        </div>
      )}

      <div className="settings-container">
        <h1 className="settings-title">Орнотуулар</h1>

        <div className="settings-grid">
          
          <div className="settings-card">
            <div className="card-header"><User size={20} color="#6366f1"/> <span>Жеке маалымат</span></div>
            <div className="card-body">
              <label>Аты-жөнүңүз</label>
              <div className="input-group">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Атыңыз" />
                <button onClick={handleUpdateName} disabled={loading} className="btn-save blue">Сактоо</button>
              </div>
            </div>
          </div>

          <div className="settings-card">
            <div className="card-header"><Lock size={20} color="#10b981"/> <span>Коопсуздук</span></div>
            <div className="card-body">
              <label>Жаңы пароль</label>
              <div className="input-group">
                <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="******" />
                <button onClick={handleUpdatePassword} disabled={loading} className="btn-save green">Жаңыртуу</button>
              </div>
            </div>
          </div>

          <div className="settings-card">
            <div className="card-header"><History size={20} color="#f59e0b"/> <span>Башкаруу</span></div>
            <div className="card-body">
              <div className="list-option" onClick={() => askConfirmation("Тазалоо", "Тарыхты өчүрөсүзбү?", executeClearHistory)}>
                <div className="list-info">
                  <Trash2 size={18} /> <span>Тарыхты тазалоо</span>
                </div>
                <ChevronRight size={18} color="#94a3b8" />
              </div>
            </div>
          </div>

          <div className="settings-card danger-card">
            <div className="card-header"><AlertTriangle size={20} color="#ef4444"/> <span style={{color: '#ef4444'}}>Кооптуу зона</span></div>
            <button onClick={() => askConfirmation("Өчүрүү", "Аккаунтту биротоло өчүрөсүзбү?", executeDeleteAccount)} className="btn-danger-full" disabled={loading}>Аккаунтту өчүрүү</button>
          </div>

        </div>
      </div>

      <style>{`
        .settings-page { background: #f8fafc; min-height: 100vh; padding: 20px 15px; font-family: 'Inter', sans-serif; }
        .settings-container { max-width: 500px; margin: 0 auto; padding-top: 20px; }
        .settings-title { font-size: 24px; font-weight: 800; color: #1e293b; margin-bottom: 25px; text-align: center; }
        .settings-grid { display: grid; gap: 16px; }
        
        .settings-card { background: #fff; padding: 20px; borderRadius: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; border-radius: 20px; }
        .danger-card { border: 1px solid #fee2e2; }
        
        .card-header { display: flex; align-items: center; gap: 12px; font-size: 16px; fontWeight: 700; color: #1e293b; font-weight: bold; margin-bottom: 15px; }
        .card-body label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 8px; font-weight: 600; }
        
        /* Инпуттар жана баскычтар мобилдикте астына түшөт */
        .input-group { display: flex; gap: 10px; }
        .input-group input { flex: 1; padding: 12px 15px; border-radius: 12px; border: 1.5px solid #e2e8f0; outline: none; font-size: 14px; width: 100%; }
        
        .btn-save { padding: 0 20px; border-radius: 12px; border: none; color: white; font-weight: 600; cursor: pointer; font-size: 14px; white-space: nowrap; }
        .btn-save.blue { background: #6366f1; }
        .btn-save.green { background: #10b981; }

        .list-option { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; cursor: pointer; }
        .list-info { display: flex; align-items: center; gap: 12px; color: #475569; font-size: 14px; }
        
        .btn-danger-full { width: 100%; padding: 14px; background: white; color: #ef4444; border: 1.5px solid #fee2e2; border-radius: 12px; fontWeight: 700; font-size: 14px; cursor: pointer; margin-top: 10px; font-weight: bold; }

        /* Мобилдик адаптация */
        @media (max-width: 480px) {
          .input-group { flex-direction: column; }
          .btn-save { padding: 12px; width: 100%; }
          .settings-title { font-size: 20px; }
        }

        /* TOAST СТИЛИ */
        .toast-container { position: fixed; top: 20px; right: 20px; z-index: 9999; transform: translateX(150%); transition: 0.4s ease; }
        .toast-container.show { transform: translateX(0); }
        .toast-box { background: white; padding: 15px 20px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 10px; border-left: 5px solid #6366f1; }
        .toast-box.success { border-left-color: #2ecc71; color: #2ecc71; }
        .toast-box.error { border-left-color: #ef4444; color: #ef4444; }

        /* MODAL СТИЛИ */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px; }
        .modal-content { background: white; padding: 25px; border-radius: 20px; width: 100%; max-width: 350px; animation: slideUp 0.3s ease; }
        .modal-header { display: flex; justify-content: space-between; margin-bottom: 15px; }
        .modal-text { color: #64748b; font-size: 14px; line-height: 1.5; margin-bottom: 20px; }
        .modal-actions { display: flex; gap: 10px; }
        .btn-secondary, .btn-confirm { flex: 1; padding: 12px; border-radius: 10px; border: none; font-weight: bold; cursor: pointer; }
        .btn-secondary { background: #f1f5f9; color: #64748b; }
        .btn-confirm { background: #ef4444; color: white; }

        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Settings;
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, query, getDocs, orderBy, doc, updateDoc, onSnapshot, where, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MessageSquare } from 'lucide-react'; 
import './css/home.css';

const Home = ({ constitutionData }) => {
  const navigate = useNavigate();
  const [randomArticle, setRandomArticle] = useState(null);
  const [globalChartData, setGlobalChartData] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const user = auth.currentUser;

  // 1. ОНЛАЙН СТАТУСТУ ЖАҢЫРТУУ (Бузбай сакталды)
  useEffect(() => {
    if (!user) return;

    const toggleOnlineStatus = async (status) => {
      try {
        const q = query(collection(db, "test_history"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((document) => {
          updateDoc(doc(db, "test_history", document.id), { isOnline: status });
        });
        // Ошондой эле users коллекциясындагы статусту да жаңыртабыз
        await updateDoc(doc(db, "users", user.uid), { isOnline: status }).catch(() => {});
      } catch (e) {
        console.error("Статус жаңылоодо ката:", e);
      }
    };

    toggleOnlineStatus(true);

    const handleVisibilityChange = () => {
      toggleOnlineStatus(document.visibilityState === 'visible');
    };

    window.addEventListener('beforeunload', () => toggleOnlineStatus(false));
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      toggleOnlineStatus(false);
      window.removeEventListener('beforeunload', () => toggleOnlineStatus(false));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // 2. КҮНДҮН БЕРЕНЕСИ
  const allArticles = useMemo(() => {
    if (!constitutionData || constitutionData.length === 0) return [];
    return constitutionData.flatMap(section => section.articles || []);
  }, [constitutionData]);

  useEffect(() => {
    if (allArticles.length > 0) {
      const random = allArticles[Math.floor(Math.random() * allArticles.length)];
      setRandomArticle(random);
    }
  }, [allArticles]);

  // 3. МААЛЫМАТТАРДЫ ЖАНА АТТАРДЫ ТУУРА АЛУУ
  useEffect(() => {
    const fetchFullData = async () => {
      // Алгач бардык колдонуучулардын аттарын Map-ка алып алабыз
      const usersSnap = await getDocs(collection(db, "users"));
      const usersMap = {};
      usersSnap.forEach(d => {
        usersMap[d.id] = d.data().displayName;
      });

      const q = query(collection(db, "test_history"), orderBy("correct", "desc"));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userBestScores = new Map();

        querySnapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          const userId = data.userId;
          
          if (!userBestScores.has(userId)) {
            const dateObj = data.createdAt?.toDate() || new Date();
            userBestScores.set(userId, {
              ...data,
              userId: userId,
              userName: usersMap[userId] || data.userName || (userId === user?.uid ? "Мен" : "Колдонуучу"),
              score: data.correct || 0,
              isOnline: data.isOnline || false,
              fullDate: dateObj.toLocaleDateString('ky-KG', { day: 'numeric', month: 'short' }),
            });
          }
        });

        const finalData = Array.from(userBestScores.values()).slice(0, 10);
        setGlobalChartData(finalData);
        
        if (finalData.length > 0 && !selectedUserId) {
          setSelectedUserId(finalData[0].userId);
        }
        setLoadingStats(false);
      });

      return unsubscribe;
    };

    fetchFullData();
  }, [user, selectedUserId]);

  // 4. ЧАТТЫ БАШТОО
const handleStartChat = async (targetUser) => {
  if (!user || !targetUser?.userId) return; // targetUser ичинде ID бар экенин текшеребиз
  if (user.uid === targetUser.userId) return;

  const chatId = user.uid > targetUser.userId 
    ? `${user.uid}_${targetUser.userId}` 
    : `${targetUser.userId}_${user.uid}`;

  const chatRef = doc(db, "conversations", chatId);
  
  try {
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      // 1. Өзүңүздүн атыңызды базадан алуу
      const myDoc = await getDoc(doc(db, "users", user.uid));
      const myName = myDoc.exists() ? myDoc.data().displayName : (user.displayName || "Колдонуучу");

      // 2. Каршы тараптын атын базадан алуу (эң ишенимдүү жол)
      const targetDoc = await getDoc(doc(db, "users", targetUser.userId));
      const targetName = targetDoc.exists() ? targetDoc.data().displayName : (targetUser.userName || "Колдонуучу");

      await setDoc(chatRef, {
        id: chatId,
        participants: [user.uid, targetUser.userId],
        // БУЛ ЖЕРДЕ ЭМИ ID ЭМЕС, АТТАР САКТАЛАТ:
        participantNames: [myName, targetName], 
        lastMessage: "Чат башталды",
        lastMessageAt: serverTimestamp()
      });
      
      console.log("Жаңы чат түзүлдү:", myName, "жана", targetName);
    }
    
    // Чат мурун бар болсо же жаңы түзүлсө да, билдирүүлөргө өтөбүз
    navigate('/messages'); 

  } catch (error) {
    console.error("Чатты баштоодо ката кетти:", error);
    alert("Чатты баштоого мүмкүн болгон жок");
  }
};

  const selectedUser = globalChartData.find(u => u.userId === selectedUserId);

  return (
    <div className="home-container">
      <div className="hero-banner">
        <h1>Салам, {user?.displayName || 'Досум'}! 👋</h1>
        <p>Бүгүн билимиңизди тереңдетүүгө даярсызбы?</p>
      </div>

      {randomArticle && (
        <div className="daily-article-card" onClick={() => navigate(`/constitution?article=${randomArticle.id}`)}>
          <div className="daily-tag">Күндүн беренеси</div>
          <h3>{randomArticle.title?.ky}</h3>
          <p>{randomArticle.content?.ky?.substring(0, 120)}...</p>
          <span className="read-more">Толук окуу →</span>
        </div>
      )}

      <div className="main-grid">
        <div className="feature-card" onClick={() => navigate('/constitution')}>
          <div className="icon-box">📖</div>
          <h3>Конституция</h3>
          <p>Мыйзамдар</p>
        </div>
        <div className="feature-card quiz-card" onClick={() => navigate('/quiz/normal')}>
          <div className="icon-box">📝</div>
          <h3>Тест</h3>
          <p>Текшерүү</p>
        </div>
        <div className="feature-card info-card" onClick={() => navigate('/history')}>
          <div className="icon-box">📊</div>
          <h3>Тарых</h3>
          <p>Жыйынтыктар</p>
        </div>
      </div>

      <div className="premium-stats-card">
        <div className="stats-content-wrapper">
          <div className="chart-main-box">
            <div className="chart-header">
              <span className="chart-label">Рейтинг фокусу</span>
              <h2 className="chart-main-title">{selectedUser?.userName || "Лидерлер"}</h2>
            </div>
            
            <div className="responsive-chart-container">
              {!loadingStats ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={globalChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="userName" hide />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{display: 'none'}} /> 
                    <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={25}>
                      {globalChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.userId === selectedUserId ? '#2563eb' : '#e2e8f0'} 
                          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                          onClick={() => setSelectedUserId(entry.userId)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="loading-placeholder">Жүктөлүүдө...</div>
              )}
            </div>
          </div>

          <div className="users-list-side">
            <h4 className="list-section-title">Колдонуучулар</h4>
            <div className="scroll-container">
              {globalChartData.map((item, index) => (
                <div 
                  key={index} 
                  className={`user-mini-row ${item.userId === selectedUserId ? 'active-row' : ''}`}
                  onClick={() => setSelectedUserId(item.userId)}
                >
                  <div className="user-info-brief">
                    <div className="avatar-wrapper">
                      <div className={`avatar-mini ${item.userId === selectedUserId ? 'is-active-avatar' : ''}`}>
                        {item.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className={`status-indicator ${item.isOnline ? 'online' : 'offline'}`}></div>
                    </div>
                    <div className="user-details">
                      <span className="u-name">{item.userName}</span>
                      <span className="u-date">{item.fullDate}</span>
                    </div>
                  </div>

                  <div className="user-actions">
                    <button className="chat-icon-btn" onClick={(e) => {
                      e.stopPropagation();
                      handleStartChat(item);
                    }}>
                      <MessageSquare size={18} />
                    </button>
                    <div className="u-score">{item.score}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
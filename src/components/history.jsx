import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend
} from 'recharts';

// --- SKELETON COMPONENT ---
const SkeletonLoader = () => (
  <div className="skeleton-wrapper" style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
    <div className="skeleton-title" style={{ height: '30px', width: '250px', background: '#e2e8f0', margin: '0 auto 40px', borderRadius: '8px' }}></div>
    <div className="skeleton-chart" style={{ height: '350px', width: '100%', background: '#e2e8f0', borderRadius: '24px', marginBottom: '40px', animation: 'pulse 1.5s infinite' }}></div>
    {[1, 2, 3].map(i => (
      <div key={i} style={{ height: '100px', width: '100%', background: '#e2e8f0', borderRadius: '20px', marginBottom: '15px', animation: 'pulse 1.5s infinite' }}></div>
    ))}
    <style>{` @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } } `}</style>
  </div>
);

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, "test_history"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => {
          const item = doc.data();
          const correct = item.correct || 0;
          const wrong = item.wrong || 0;
          return {
            id: doc.id,
            ...item,
            correct,
            wrong,
            total: correct + wrong,
            rawDate: item.createdAt?.toDate() || new Date(0),
            pieData: [
              { name: 'Туура', value: correct, color: '#10b981' },
              { name: 'Ката', value: wrong, color: '#ef4444' }
            ]
          };
        });
        setHistory(data.sort((a, b) => b.rawDate - a.rawDate));
      } catch (e) {
        console.error(e);
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };
    fetchHistory();
  }, [user]);

  if (loading) return <SkeletonLoader />;

  const chartData = [...history].reverse().slice(-7).map(item => ({
    ...item,
    dateLabel: item.rawDate.toLocaleDateString('ky-KG', { day: '2-digit', month: 'short' }),
    correctCount: item.correct,
    wrongCount: item.wrong
  }));

  return (
    <div className="history-page" style={{ background: '#f8fafc', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: '#1e293b', fontWeight: '800', fontSize: '28px' }}>Менин жетишкендиктерим</h1>
          <p style={{ color: '#64748b' }}>Өзүнчө мамычалар менен жыйынтыктардын анализи</p>
        </header>

        {history.length > 0 ? (
          <>
            {/* --- ӨЗҮНЧӨ МАМЫЧАЛУУ ДИАГРАММА --- */}
            <div style={{ background: '#fff', padding: '25px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', marginBottom: '40px' }}>
              <h3 style={{ fontSize: '16px', color: '#64748b', marginBottom: '20px' }}>📈 Туура жана Ката жооптордун саны</h3>
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  {/* barGap: 8 мамычалардын ортосундагы аралык */}
                  <BarChart data={chartData} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip 
                      cursor={{fill: '#f1f5f9'}} 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)'}} 
                    />
                    <Legend verticalAlign="top" align="right" iconType="circle" height={40}/>
                    
                    {/* Туура жооп мамычасы - Жашыл */}
                    <Bar name="Туура" dataKey="correctCount" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25} />
                    
                    {/* Ката жооп мамычасы - Кызыл */}
                    <Bar name="Ката" dataKey="wrongCount" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={25} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* --- ТИЗМЕ --- */}
            <div style={{ display: 'grid', gap: '15px' }}>
              {history.map((item) => (
                <div key={item.id} style={{
                  background: '#fff', borderRadius: '20px', padding: '15px 25px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '50px', height: '50px' }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={item.pieData} innerRadius={14} outerRadius={22} dataKey="value">
                            {item.pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: '#1e293b' }}>{item.testTitle}</h4>
                      <small style={{ color: '#94a3b8' }}>{item.rawDate.toLocaleDateString('ky-KG')} • {item.timeTaken}</small>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ color: '#10b981', fontWeight: '700', fontSize: '18px' }}>{item.correct}</span>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>ТУУРА</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ color: '#ef4444', fontWeight: '700', fontSize: '18px' }}>{item.wrong}</span>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>КАТА</div>
                    </div>
                    <div style={{ 
                      background: item.percentage >= 70 ? '#f0fdf4' : '#fff1f2',
                      padding: '8px 12px', borderRadius: '10px', minWidth: '60px', textAlign: 'center'
                    }}>
                      <span style={{ color: item.percentage >= 70 ? '#16a34a' : '#e11d48', fontWeight: '800' }}>{item.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '100px', background: '#fff', borderRadius: '30px' }}>
            <p style={{ color: '#64748b' }}>Азырынча тарых бош...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  orderBy
} from 'firebase/firestore';

import {
  Search,
  Edit3,
  Paperclip,
  Smile,
  Send,
  ChevronLeft,
  MoreHorizontal,
  MessageSquare
} from 'lucide-react';

import './css/messages.css';
import { MessageCircle } from "lucide-react";

const Messages = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

const markAsRead = async (chat) => {
    if (!user) return;

    await updateDoc(doc(db, "conversations", chat.id), {
      [`lastSeen.${user.uid}`]: serverTimestamp()
    });
  }; 
  const user = auth.currentUser;
  const scrollRef = useRef(null);

  const emojis = [
  "😀","😁","😂","🤣","😊","😍","😘","😎",
  "😭","😡","👍","👎","🙏","🔥","❤️","🎉"
];


  // =========================
  // 🔹 ИНДИКАТОР
  // =========================
const getTime = (t) => {
  if (!t) return 0;
  if (t?.toMillis) return t.toMillis();
  if (t?.seconds) return t.seconds * 1000;
  return 0;
};

const hasUnread = (chat) => {
  if (!chat?.lastMessageAt) return false;

  const uid = user?.uid;

  const msgTime = chat.lastMessageAt?.toMillis?.()
    ? chat.lastMessageAt.toMillis()
    : 0;

  const seen = chat?.lastSeen?.[uid];

  const seenTime =
    seen?.toMillis?.()
      ? seen.toMillis()
      : 0;

  return msgTime > seenTime;
};
  // =========================
  // 🔹 ЧАТТАР
  // =========================
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let chatData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 🔥 SAFE SORT
      chatData.sort((a, b) => {
        const aTime = a.lastMessageAt?.toMillis?.() || 0;
        const bTime = b.lastMessageAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setChats(chatData);
    });

    return () => unsubscribe();
  }, [user]);

  // =========================
  // 🔹 МЕССЕЖДЕР
  // =========================
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }

    const qMsg = query(
  collection(db, "messages"),
  where("chatId", "==", selectedChat.id),
  orderBy("createdAt", "asc")
);

   const unsub = onSnapshot(qMsg, (snapshot) => {
  let msgData = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));



  setMessages(msgData);

  setTimeout(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, 100);
});

    return () => unsub();
  }, [selectedChat]);

  // =========================
  // 🔹 SEND MESSAGE
  // =========================
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !user) return;

    const text = newMessage;
    setNewMessage("");

    try {
      await addDoc(collection(db, "messages"), {
        chatId: selectedChat.id,
        text,
        senderId: user.uid,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, "conversations", selectedChat.id), {
        lastMessage: text,
        lastMessageAt: serverTimestamp()
      });

    } catch (err) {
      console.error(err);
    }
  };



  // =========================
  // 🔥 DELETE CHAT
  // =========================
const deleteChat = async () => {
  try {
    if (!selectedChat?.id || !user) return;

    const chatId = selectedChat.id;

    // messages өчүрүү
    const q = query(
      collection(db, "messages"),
      where("chatId", "==", chatId)
    );

    const snapshot = await getDocs(q);

    await Promise.all(
      snapshot.docs.map((d) =>
        deleteDoc(doc(db, "messages", d.id))
      )
    );

    // conversation өчүрүү
    await deleteDoc(doc(db, "conversations", chatId));

    setSelectedChat(null);
    setMenuOpen(false);

    showToast("Чат толугу менен өчүрүлдү", "success");

  } catch (err) {
    console.error(err);
    showToast("Ката кетти", "error");
  }
};
  // =========================
  // 🔹 Account
  // =========================
const getOtherName = (chat) => {
  if (!chat || !chat.participants || !chat.participantNames) return "Колдонуучу";

  // Башка колдонуучунун ID-син табабыз
  const otherIdIndex = chat.participants.findIndex(id => id !== user?.uid);

  // Ошол эле индекс менен атын кайтарабыз
  if (otherIdIndex !== -1 && chat.participantNames[otherIdIndex]) {
    return chat.participantNames[otherIdIndex];
  }

  return "Колдонуучу";
};




  // =========================
  // 🔹 UI
  // =========================
  return (
      <>
    {/* TOAST */}
{confirmOpen && (
  <div className="modal-overlay">
    <div className="modal">
      <h3>Чыгуу</h3>
      <p>Чатты жана бардык билдирүүлөрдү өчүрөсүзбү?</p>

      <div className="modal-actions">
        <button onClick={() => setConfirmOpen(false)}>
          Жок
        </button>

        <button
          className="danger"
          onClick={() => {
            deleteChat();
            setConfirmOpen(false);
          }}
        >
          Ооба, өчүрүү
        </button>
      </div>
    </div>
  </div>
)}



   <div className="messenger-container">
      <div className="messenger-card">

        {/* SIDEBAR */}
        <div className={`sidebar ${selectedChat ? 'mobile-hide' : ''}`}>
          <div className="sidebar-header">
            <div className="search-wrapper">
              <Search size={18} />
              <input
                placeholder="Издөө..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="chats-list">
           {chats
  .filter(c =>
    getOtherName(c).toLowerCase().includes(searchTerm.toLowerCase())
  )
.map(chat => {

  return (
    <div
      key={chat.id}
      className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
   onClick={() => {
  setSelectedChat(chat);
  setTimeout(() => markAsRead(chat), 500);
}}
    >
        <div className="avatar">
          {getOtherName(chat).charAt(0)}
        </div>

        <div className="chat-info">
       <div className="chat-top">
  <div className="chat-left">
    <span className="chat-name">{getOtherName(chat)}</span>
    {hasUnread(chat) && <span className="unread-dot" />}
  </div>



            <span className="chat-time">
              {chat.lastMessageAt?.toDate?.()
                ? chat.lastMessageAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : ''}
            </span>
          </div>

          <p className="chat-preview">
            {chat.lastMessage || "Жаңы чат..."}
          </p>
        </div>
      </div>
    );
  })
}
          </div>
        </div>

        {/* CHAT WINDOW */}
        <div className={`chat-window ${!selectedChat ? 'mobile-hide' : ''}`}>
          {selectedChat ? (
            <>
              <div className="chat-header">
                {/* Класс кошулду: input-icon */}
                <button className="input-icon" onClick={() => setSelectedChat(null)}>
                  <ChevronLeft />
                </button>

                <span className="header-name">
                  {getOtherName(selectedChat)}
                </span>

                <div style={{ marginLeft: 'auto', position: 'relative' }}>
                  <button className="input-icon" onClick={() => setMenuOpen(!menuOpen)}>
                    <MoreHorizontal />
                  </button>

                  {menuOpen && (
                    <div className="chat-menu">
                      <div onClick={() => setConfirmOpen(true)}>Чатты өчүрүү</div>
                    </div>
                  )}
                </div>
              </div>

             <div className="chat-messages">
  {messages.filter(m => m?.text?.trim()).length > 0 ? (
    messages
      .filter(m => m?.text?.trim())
      .map(m => (
        <div
          key={m.id}
          className={`message-row ${m.senderId === user.uid ? 'me' : 'them'}`}
        >
          <div className="message-bubble">{m.text}</div>
        </div>
      ))
  ) : (
    <div className="empty-chat-info">
      <div className="empty-icon">
        <MessageCircle size={28} strokeWidth={1.8} />
      </div>
      <h4>Билдирүү жок</h4>
    </div>
  )}

  <div ref={scrollRef} />
</div>

              {/* INPUT AREA - Оңдолгон класстар менен */}
              <form className="chat-input-area" onSubmit={sendMessage}>

                <input
                  placeholder="Билдирүү жазуу..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />

             <button
  type="button"
  className="input-icon"
  onClick={() => setShowEmoji(!showEmoji)}
>
  <Smile size={20} />
</button>
 {/* ✅ EMOJI PANEL */}
  {showEmoji && (
    <div className="emoji-picker">
      {emojis.map((e, i) => (
        <span
          key={i}
          onClick={() => {
            setNewMessage(prev => prev + e);
            setShowEmoji(false);
          }}
          style={{ cursor: "pointer", fontSize: "20px" }}
        >
          {e}
        </span>
      ))}
    </div>
  )}

                <button 
                  type="submit" 
                  className={`send-btn ${newMessage.trim() ? 'active' : ''}`}
                >
                  <Send size={20} />
                </button>
              </form>
            </>
          ) : (
<div className="empty-chat-info">
  <div className="empty-icon">
    <MessageSquare size={28} strokeWidth={1.8} />
  </div>
  <h4>Чатты тандаңыз</h4>
</div>
          )}
        </div>

      </div>
    </div>
      </>
  );
};

export default Messages;
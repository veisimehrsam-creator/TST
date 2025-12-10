import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Send, Menu, Image, MessageCircle, Check, CheckCheck, Database } from 'lucide-react';

// Supabase Configuration
const SUPABASE_URL = 'https://tflmnbnasrzfoefwhhhv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbG1uYm5hc3J6Zm9lZndoaGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzODI4NTksImV4cCI6MjA4MDk1ODg1OX0.hBkCjM7lxgEK1IIaWJQ2Nhdyq7R6QVF19u25jeuysx0';

// Supabase Client Setup
class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
    this.headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    };
  }

  async from(table) {
    return {
      select: async (columns = '*') => {
        const response = await fetch(`${this.url}/rest/v1/${table}?select=${columns}`, {
          headers: this.headers
        });
        return { data: await response.json(), error: null };
      },
      insert: async (data) => {
        const response = await fetch(`${this.url}/rest/v1/${table}`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(data)
        });
        return { data: await response.json(), error: null };
      },
      update: async (data) => {
        return { eq: async (column, value) => {
          const response = await fetch(`${this.url}/rest/v1/${table}?${column}=eq.${value}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify(data)
          });
          return { data: await response.json(), error: null };
        }};
      }
    };
  }
}

export default function ArsamMessenger() {
  const [supabase] = useState(new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY));
  const [isConfigured, setIsConfigured] = useState(true);
  const [supabaseUrl, setSupabaseUrl] = useState(SUPABASE_URL);
  const [supabaseKey, setSupabaseKey] = useState(SUPABASE_ANON_KEY);
  
  const [currentUser] = useState({ 
    id: 'current-user-id',
    phone: '09101234567', 
    name: 'کاربر فعلی',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Current'
  });
  
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock data برای حالت بدون Supabase
  const mockUsers = [
    { id: '1', phone: '09123456789', name: 'علی احمدی', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ali', registered: true },
    { id: '2', phone: '09387654321', name: 'سارا محمدی', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara', registered: true },
    { id: '3', phone: '09121112233', name: 'رضا کریمی', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Reza', registered: true },
  ];

  useEffect(() => {
    // بارگذاری اولیه
    loadInitialData();
  }, [isConfigured]);

  const handleSupabaseSetup = () => {
    if (!supabaseUrl || !supabaseKey) {
      showNotification('لطفاً URL و API Key را وارد کنید');
      return;
    }
    
    const client = new SupabaseClient(supabaseUrl, supabaseKey);
    setSupabase(client);
    setIsConfigured(true);
    showNotification('✓ اتصال به Supabase برقرار شد');
  };

  const loadInitialData = async () => {
    if (isConfigured && supabase) {
      // بارگذاری از Supabase
      try {
        const { data: users } = await supabase.from('users').select('*');
        const { data: userContacts } = await supabase.from('contacts').select('*');
        
        setContacts(users || []);
      } catch (error) {
        showNotification('خطا در بارگذاری اطلاعات');
      }
    } else {
      // استفاده از mock data
      setContacts(mockUsers);
      setMessages({
        '1': [
          { id: '1', sender: '1', text: 'سلام! چطوری؟', time: '10:30', status: 'read' },
          { id: '2', sender: 'current-user-id', text: 'سلام، خوبم ممنون', time: '10:32', status: 'read' },
        ],
        '2': [
          { id: '1', sender: '2', text: 'جلسه امروز ساعت چنده؟', time: '09:15', status: 'delivered' },
        ]
      });
    }
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const checkUserInSupabase = async (phone) => {
    if (isConfigured && supabase) {
      try {
        const { data } = await supabase.from('users').select('*');
        return data.find(u => u.phone === phone);
      } catch (error) {
        return null;
      }
    } else {
      return mockUsers.find(u => u.phone === phone);
    }
  };

  const handleAddContact = async () => {
    if (!phoneNumber.trim()) {
      showNotification('لطفاً شماره تلفن را وارد کنید');
      return;
    }

    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      showNotification('فرمت شماره تلفن صحیح نیست');
      return;
    }

    setLoading(true);
    const user = await checkUserInSupabase(phoneNumber);
    setLoading(false);
    
    if (!user) {
      showNotification('⚠️ این کاربر در آرسام ثبت‌نام نکرده است');
      return;
    }

    if (contacts.find(c => c.id === user.id)) {
      showNotification('این مخاطب قبلاً اضافه شده است');
      return;
    }

    if (isConfigured && supabase) {
      try {
        await supabase.from('contacts').insert({
          user_id: currentUser.id,
          contact_id: user.id
        });
      } catch (error) {
        console.error('Error adding contact:', error);
      }
    }

    setContacts([...contacts, user]);
    showNotification(`✓ ${user.name} به مخاطبین شما اضافه شد`);
    setPhoneNumber('');
    setShowAddContact(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;

    const newMsg = {
      id: Date.now().toString(),
      sender: currentUser.id,
      receiver: selectedContact.id,
      text: newMessage,
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      created_at: new Date().toISOString()
    };

    if (isConfigured && supabase) {
      try {
        await supabase.from('messages').insert(newMsg);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }

    setMessages({
      ...messages,
      [selectedContact.id]: [...(messages[selectedContact.id] || []), newMsg]
    });
    setNewMessage('');

    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [selectedContact.id]: prev[selectedContact.id].map(m => 
          m.id === newMsg.id ? { ...m, status: 'delivered' } : m
        )
      }));
    }, 1000);
  };

  const filteredContacts = contacts.filter(c => 
    c.name.includes(searchQuery) || c.phone.includes(searchQuery)
  );

  const getLastMessage = (contactId) => {
    const msgs = messages[contactId] || [];
    return msgs[msgs.length - 1];
  };

  // Setup Screen
  if (!isConfigured) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-800" dir="rtl">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
          <div className="text-center mb-6">
            <Database size={48} className="mx-auto mb-3 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">تنظیمات Supabase</h2>
            <p className="text-gray-600 text-sm">اطلاعات اتصال به دیتابیس را وارد کنید</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supabase URL
              </label>
              <input
                type="text"
                placeholder="https://your-project.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supabase Anon Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleSupabaseSetup}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition"
            >
              اتصال به Supabase
            </button>

            <button
              onClick={() => {
                setIsConfigured(true);
                showNotification('حالت دمو فعال شد');
              }}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium transition"
            >
              ادامه بدون Supabase (حالت دمو)
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
            <p className="font-semibold mb-2">⚙️ راهنمای نصب:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>وارد پنل Supabase خود شوید</li>
              <li>از بخش Settings → API اطلاعات را کپی کنید</li>
              <li>جداول زیر را ایجاد کنید:
                <ul className="list-disc list-inside mr-4 mt-1">
                  <li>users (id, phone, name, avatar)</li>
                  <li>contacts (user_id, contact_id)</li>
                  <li>messages (sender, receiver, text, created_at)</li>
                </ul>
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Main Messenger Interface
  return (
    <div className="flex h-screen bg-gray-100" dir="rtl">
      {/* Sidebar */}
      <div className="w-96 bg-white border-l flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src={currentUser.avatar} alt="avatar" className="w-10 h-10 rounded-full bg-white p-1" />
              <div>
                <h2 className="font-bold text-lg">آرسام</h2>
                <p className="text-xs text-blue-100">
                  {isConfigured && supabase ? '🟢 متصل به Supabase' : '🟡 حالت دمو'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowAddContact(true)}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition"
            >
              <UserPlus size={20} />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute right-3 top-2.5 text-blue-300" size={18} />
            <input
              type="text"
              placeholder="جستجوی مخاطبین..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 rounded-full bg-white/20 text-white placeholder-blue-200 focus:bg-white/30 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <MessageCircle size={48} className="mb-3" />
              <p>هنوز مخاطبی ندارید</p>
              <p className="text-sm mt-1">با دکمه + مخاطب اضافه کنید</p>
            </div>
          ) : (
            filteredContacts.map(contact => {
              const lastMsg = getLastMessage(contact.id);
              return (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition border-b ${
                    selectedContact?.id === contact.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold text-gray-800">{contact.name}</h3>
                      {lastMsg && <span className="text-xs text-gray-500">{lastMsg.time}</span>}
                    </div>
                    {lastMsg && (
                      <p className="text-sm text-gray-600 truncate">
                        {lastMsg.sender === currentUser.id ? 'شما: ' : ''}{lastMsg.text}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            <div className="bg-white border-b p-4 flex items-center gap-3 shadow-sm">
              <img src={selectedContact.avatar} alt={selectedContact.name} className="w-10 h-10 rounded-full" />
              <div>
                <h3 className="font-semibold text-gray-800">{selectedContact.name}</h3>
                <p className="text-xs text-green-600">آنلاین</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-gray-100">
              {(messages[selectedContact.id] || []).map(msg => (
                <div
                  key={msg.id}
                  className={`flex mb-4 ${msg.sender === currentUser.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md px-4 py-2 rounded-2xl ${
                      msg.sender === currentUser.id
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white text-gray-800 rounded-bl-none shadow'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className={`text-xs ${msg.sender === currentUser.id ? 'text-blue-100' : 'text-gray-500'}`}>
                        {msg.time}
                      </span>
                      {msg.sender === currentUser.id && (
                        msg.status === 'read' ? <CheckCheck size={14} className="text-blue-200" /> :
                        msg.status === 'delivered' ? <CheckCheck size={14} className="text-blue-300" /> :
                        <Check size={14} className="text-blue-300" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white border-t p-4">
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-full transition">
                  <Image size={20} className="text-gray-600" />
                </button>
                <input
                  type="text"
                  placeholder="پیام خود را بنویسید..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100">
            <MessageCircle size={64} className="mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">به آرسام خوش آمدید</h3>
            <p>یک مخاطب را انتخاب کنید تا شروع به گفتگو کنید</p>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">افزودن مخاطب جدید</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                شماره تلفن (09xxxxxxxxx)
              </label>
              <input
                type="tel"
                placeholder="09123456789"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={11}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddContact}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {loading ? 'در حال بررسی...' : 'افزودن'}
              </button>
              <button
                onClick={() => {
                  setShowAddContact(false);
                  setPhoneNumber('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {notification}
        </div>
      )}
    </div>
  );
    }

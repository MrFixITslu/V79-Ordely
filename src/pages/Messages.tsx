import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuthStore } from '../store';
import { MessageSquare, Send, Store, User, Check, CheckCheck, Clock, Search } from 'lucide-react';

export function Messages() {
  const currentUser = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId');

  const [conversations, setConversations] = useState<any[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<number | null>(
    targetUserId ? Number(targetUserId) : null
  );
  const [activePartner, setActivePartner] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);

      // If no active partner is selected yet, pick the first conversation partner
      if (!activePartnerId && !targetUserId && data.length > 0) {
        setActivePartnerId(data[0].partner.user_id);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChat = async (partnerId: number) => {
    try {
      const data = await api.getMessagesWithUser(partnerId);
      setActivePartner(data.partner);
      setMessages(data.messages);
      // Refresh conversations list to clear unread badge
      fetchConversations();
    } catch (err) {
      console.error('Error fetching chat:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (targetUserId) {
      const id = Number(targetUserId);
      setActivePartnerId(id);
    }
  }, [targetUserId]);

  useEffect(() => {
    if (activePartnerId) {
      fetchChat(activePartnerId);

      // Setup auto-polling every 4 seconds for fresh messages
      const interval = setInterval(() => {
        fetchChat(activePartnerId);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [activePartnerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePartnerId || !newMessageText.trim() || sending) return;

    setSending(true);
    try {
      const msg = await api.sendMessage({
        receiver_id: activePartnerId,
        message: newMessageText.trim(),
      });
      setMessages((prev) => [...prev, msg]);
      setNewMessageText('');
      fetchConversations();
      scrollToBottom();
    } catch (err: any) {
      alert(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const name = c.partner.business_name || c.partner.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return <div className="text-center py-20 text-slate-500 font-medium">Loading messages...</div>;
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden h-[calc(100vh-160px)] min-h-[550px] flex flex-col md:flex-row">
      {/* Sidebar / Conversation List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-slate-100 flex flex-col bg-slate-50/50 ${activePartnerId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-600" />
              <span>Messages</span>
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {conversations.length} Threads
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50"
            />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto divide-y divide-slate-100">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.partner.user_id === activePartnerId;
              const displayName = conv.partner.business_name || conv.partner.name;
              const logo = conv.partner.logo_url;

              return (
                <button
                  key={conv.partner.user_id}
                  onClick={() => {
                    setActivePartnerId(conv.partner.user_id);
                    setSearchParams({ userId: String(conv.partner.user_id) });
                  }}
                  className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                    isSelected ? 'bg-teal-50/80 border-l-4 border-teal-600' : 'hover:bg-white'
                  }`}
                >
                  <div className="relative shrink-0">
                    {logo ? (
                      <img src={logo} alt={displayName} className="w-11 h-11 object-cover rounded-xl border border-slate-100" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-base">
                        {displayName ? displayName.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                    {conv.partner.role === 'vendor' && (
                      <span className="absolute -bottom-1 -right-1 p-1 bg-teal-600 text-white rounded-full text-[9px]" title="Vendor">
                        <Store className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{displayName}</h3>
                      {conv.last_message && (
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 truncate max-w-[180px]">
                        {conv.last_message ? conv.last_message.message : 'Click to open conversation'}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="bg-teal-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-grow flex flex-col bg-white ${!activePartnerId ? 'hidden md:flex' : 'flex'}`}>
        {activePartner ? (
          <>
            {/* Chat Top Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActivePartnerId(null)}
                  className="md:hidden text-xs text-teal-600 font-bold p-1 hover:bg-slate-100 rounded-lg"
                >
                  ← Back
                </button>

                {activePartner.logo_url ? (
                  <img src={activePartner.logo_url} alt={activePartner.business_name || activePartner.name} className="w-10 h-10 object-cover rounded-xl border border-slate-100" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-teal-500 text-white font-bold flex items-center justify-center text-sm">
                    {(activePartner.business_name || activePartner.name || '?').charAt(0).toUpperCase()}
                  </div>
                )}

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {activePartner.business_name || activePartner.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      {activePartner.role === 'vendor' ? <Store className="w-3 h-3 text-teal-600" /> : <User className="w-3 h-3 text-slate-400" />}
                      {activePartner.role === 'vendor' ? 'Verified Business' : 'Customer Account'}
                    </span>
                    {activePartner.vendor_id && (
                      <Link to={`/vendor/${activePartner.vendor_id}`} className="text-xs text-teal-600 font-semibold hover:underline">
                        Visit Store Page
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Encrypted Direct Chat</span>
              </div>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-grow p-4 md:p-6 overflow-y-auto space-y-4 bg-slate-50/30">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-12">
                  <MessageSquare className="w-10 h-10 text-slate-300" />
                  <p className="text-sm font-medium">No messages yet. Send a greeting to start chatting!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === currentUser?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[80%] md:max-w-[65%] rounded-2xl px-4 py-3 text-sm shadow-xs ${
                          isMine
                            ? 'bg-teal-600 text-white rounded-br-none'
                            : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-slate-400">
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMine && (
                          msg.is_read ? (
                            <CheckCheck className="w-3 h-3 text-teal-600" title="Read" />
                          ) : (
                            <Check className="w-3 h-3 text-slate-400" title="Sent" />
                          )
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
              <input
                type="text"
                placeholder="Type your message..."
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                className="flex-grow px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none text-sm bg-slate-50/50"
              />
              <button
                type="submit"
                disabled={!newMessageText.trim() || sending}
                className="bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-2xl transition-colors disabled:opacity-50 shrink-0 shadow-sm"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
            <MessageSquare className="w-12 h-12 text-slate-300" />
            <h3 className="text-lg font-bold text-slate-700">Select a Conversation</h3>
            <p className="text-xs max-w-sm text-slate-500">
              Choose a message thread from the list on the left or contact a vendor directly from their store page or orders.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Bot, Sparkles, HelpCircle } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  unmatched?: boolean;
  originalQuestion?: string;
}

export default function SupportChat() {
  const { isOpen, setIsOpen, inputText, setInputText, productContext, setProductContext } = useChat();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'welcome-01',
        sender: 'bot',
        text: 'Hi there! I am the Belvia AI 3D Printing Assistant. 🤖 Slicing, filaments, pre-order tracking, custom orders—ask me anything, I am here to help you!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  // Scroll to bottom on updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleToggle = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      setUnreadCount(0);
    } else {
      setProductContext(null);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setProductContext(null);
    setIsTyping(true);

    try {
      // Fetch from Gemini backend
      const response = await fetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, history: messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'model', text: m.text })) }),
      });

      const data = await response.json();
      setIsTyping(false);

      if (data.success && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `m-bot-${Date.now()}`,
            sender: 'bot',
            text: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unmatched: data.unmatched,
            originalQuestion: textToSend,
          },
        ]);
      } else {
        throw new Error('Local fallback required');
      }
    } catch (e) {
      // Local fallback in case Gemini key is missing or server fails
      setTimeout(() => {
        setIsTyping(false);
        const fallbackReply = getFallbackReply(textToSend);
        setMessages((prev) => [
          ...prev,
          {
            id: `m-bot-${Date.now()}`,
            sender: 'bot',
            text: fallbackReply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }, 900);
    }
  };

  // Automated quick query selections
  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const getFallbackReply = (prompt: string): string => {
    const text = prompt.toLowerCase();
    if (text.includes('track') || text.includes('order') || text.includes('ship')) {
      return "To track your physical print order, navigate to our [Track Order] tab in the main header navigation menu. Paste your Tracking Code (e.g. `BLV-SHIP-99120` or your customized code received on layout checkout) to view real-time nozzle temperatures, cargo timeline status, and flight plans!";
    }
    if (text.includes('pre-order') || text.includes('preorder') || text.includes('import') || text.includes('goods')) {
      return "Imported goods (specialty carbon beds, automatic material systems, and co-extruded dual silk reels) are labeled as [Pre-order Only]. We collect a custom partial deposit (25% - 50%) to reserve your production batch. Once the air freight arrives, we will dispatch them straight to your doorstep!";
    }
    if (text.includes('wishlist') || text.includes('save') || text.includes('favorite')) {
      return "You can save any 3D model in your browser by clicking the red 'Heart' icon on product catalogs. To view your saved models, simply click the floating heart envelope in the top header. You can add them straight to the print queue with a single click!";
    }
    if (text.includes('filament') || text.includes('material') || text.includes('pla') || text.includes('petg') || text.includes('tpu') || text.includes('abs')) {
      return "We offer premium graded filaments: \n• PLA (Matte & Silk Pearl) – Rapid printing, vibrant colors, beautiful details.\n• PETG (Durable & Waterproof) – Best for containers like outdoor self-watering pots.\n• TPU (Rubber-flexible) – Flexible, shockproof items.\n• ABS – High-temperature impact resistant block parts.";
    }
    if (text.includes('custom') || text.includes('stl') || text.includes('upload')) {
      return "Want to print your own downloaded STL modeling file? Head to the [STL Print Studio] tab. Drag-and-drop your .stl CAD file, select infill density, polymer raw materials, and instantly receive a computed manufacturing price estimate before dispatching to the 3D printer hub!";
    }
    if (text.includes('hi') || text.includes('hello') || text.includes('hey')) {
      return "Hello! Hope your day is printing smoothly. Let me know if you want to track a package, understand imported pre-orders, look at our customer review stories, or upgrade your extruder setups!";
    }
    return "That's an interesting 3D printing query! Our custom-slicing print farm is loaded with certified Bambu Lab equipment. Let me know if this involves a custom STL quote, imported pre-orders, or tracking your dispatch deliveries, and I will guide you!";
  };

  return (
    <div id="support-chat-wrapper" className="fixed bottom-20 right-6 sm:bottom-6 sm:right-6 font-sans text-left" style={{ zIndex: 60 }}>
      {/* 1. FLOATING TOGGLE TRIGGER */}
      {!isOpen && (
        <button
          id="btn-chat-trigger"
          onClick={handleToggle}
          className="relative group p-4.5 rounded-full bg-accent-secondary text-white hover:bg-accent-hover hover:scale-105 active:scale-95 shadow-xl shadow-accent-secondary/20 hover:shadow-accent-secondary/35 transition-all duration-300 cursor-pointer flex items-center justify-center border border-white/10"
        >
          <MessageSquare className="w-6.5 h-6.5 group-hover:rotate-12 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5.5 h-5.5 rounded-full bg-red-500 text-white text-[10px] font-mono font-bold flex items-center justify-center animate-bounce border-2 border-[#040710]">
              {unreadCount}
            </span>
          )}
          <span className="absolute right-15 scale-0 group-hover:scale-100 transition-all duration-200 px-3 py-1 rounded bg-bg-surface text-xs font-mono font-bold select-none border border-bg-elevated text-gray-200 whitespace-nowrap shadow-xl">
            [CHAT SUPPORT]
          </span>
        </button>
      )}

      {/* 2. DYNAMIC SLIDE-UP DESK WINDOW */}
      {isOpen && (
        <div
          id="support-chat-window"
          className="w-[calc(100vw-2rem)] sm:w-96 max-w-sm h-[480px] bg-bg-base border border-bg-elevated rounded-2xl flex flex-col justify-between shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200"
        >
          {/* Window Header */}
          <div className="bg-bg-elevated px-4 py-3.5 border-b border-border-premium flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <h4 className="text-sm font-bold text-text-primary flex items-center">
                  Belvia AI Care Desk
                  <Sparkles className="w-3.5 h-3.5 text-accent ml-1.5 animate-pulse" />
                </h4>
                <p className="text-[10px] text-gray-500 font-mono">BAYS ACTIVE: 74 // BOT SLICES ACTIVE</p>
              </div>
            </div>
            <button
              id="btn-chat-close"
              onClick={handleToggle}
              className="p-1 px-2.5 bg-bg-base hover:bg-bg-surface border border-border-premium text-text-secondary hover:text-text-primary rounded-lg text-xs font-mono cursor-pointer transition"
            >
              [X]
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-base/45 scrollbar-thin scrollbar-thumb-gray-900 scrollbar-track-transparent">
            {messages.map((m) => {
              const isBot = m.sender === 'bot';
              return (
                <div key={m.id} className={`flex ${isBot ? 'justify-start' : 'justify-end'} text-xs`}>
                  <div className={`flex items-start space-x-2 max-w-[85%] ${isBot ? '' : 'flex-row-reverse space-x-reverse'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-inner ${
                      isBot ? 'bg-accent-secondary/15 border-accent-secondary/30 text-accent' : 'bg-bg-elevated border-border-premium text-text-secondary'
                    }`}>
                      {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className="space-y-1">
                      <div className={`p-3 rounded-2xl leading-relaxed font-sans whitespace-pre-wrap ${
                        isBot 
                          ? 'bg-bg-elevated text-text-secondary border border-border-premium rounded-tl-none' 
                          : 'bg-accent-secondary text-text-on-accent rounded-tr-none shadow-md shadow-accent-secondary/10'
                      }`}>
                        {m.text}

                        {isBot && m.unmatched && m.originalQuestion && (
                          <div className="mt-3 pt-2 border-t border-border-premium/50">
                            <a
                              href={`https://wa.me/8801607062907?text=${encodeURIComponent(m.originalQuestion)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-2 px-3 py-1.5 bg-bg-surface hover:bg-bg-elevated border border-green-500/20 hover:border-green-500/40 text-green-400 hover:text-green-300 rounded-lg text-[10px] font-mono font-bold transition shadow-sm hover:shadow-[0_0_8px_rgba(34,197,94,0.08)] cursor-pointer select-none"
                            >
                              <svg className="w-3.5 h-3.5 fill-current text-green-400" viewBox="0 0 24 24">
                                <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.233-1.372a9.948 9.948 0 0 0 4.777 1.22h.005c5.505 0 9.988-4.478 9.989-9.985a9.966 9.966 0 0 0-2.926-7.062A9.97 9.97 0 0 0 12.012 2zm5.727 14.13c-.25.706-1.443 1.282-1.996 1.37-.51.082-1.18.15-3.41-.774-2.85-1.18-4.683-4.08-4.825-4.27-.14-.19-1.146-1.524-1.146-2.907 0-1.383.722-2.062 1.002-2.344.28-.28.61-.35.81-.35h.583c.18 0 .43.01.62.46.21.51.72 1.76.78 1.88.06.12.1.26.02.43-.08.17-.18.28-.3.43-.12.15-.26.3-.37.45-.11.12-.24.26-.1.5.14.24.63 1.04 1.36 1.69.93.83 1.72 1.09 1.96 1.21.24.12.38.1.52-.06.14-.17.62-.72.79-.97.17-.25.34-.21.57-.12.24.09 1.5.71 1.76.84.26.13.43.19.5.3.06.12.06.69-.19 1.4z" />
                              </svg>
                              <span>CHAT ON WHATSAPP</span>
                            </a>
                          </div>
                        )}
                      </div>
                      <span className={`block text-[8px] font-mono text-text-muted ${isBot ? 'text-left' : 'text-right'}`}>
                        {m.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex justify-start text-xs">
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 rounded-full bg-accent-secondary/15 border border-accent-secondary/30 text-accent flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 animate-bounce" />
                  </div>
                  <div className="p-3.5 bg-bg-elevated border border-border-premium rounded-2xl rounded-tl-none flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-accent animate-bounce" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick help button tags */}
          {messages.length < 5 && (
            <div className="p-3 pb-1 border-t border-border-premium bg-bg-surface/40 text-left">
              <span className="text-[9px] font-mono text-text-muted uppercase font-bold tracking-wider block mb-1.5">Quick Inquiry Guides:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleQuickQuestion("Inquire about custom prints")}
                  className="px-2 py-1 rounded bg-bg-base border border-border-premium hover:border-accent text-text-secondary hover:text-text-primary text-[10px] font-medium cursor-pointer transition text-left"
                >
                  ⚙️ STL Print Studio
                </button>
                <button
                  onClick={() => handleQuickQuestion("Track my order updates")}
                  className="px-2 py-1 rounded bg-bg-base border border-border-premium hover:border-accent text-text-secondary hover:text-text-primary text-[10px] font-medium cursor-pointer transition text-left"
                >
                  📦 Track Order Status
                </button>
                <button
                  onClick={() => handleQuickQuestion("What are the pre-order conditions?")}
                  className="px-2 py-1 rounded bg-bg-base border border-border-premium hover:border-accent text-text-secondary hover:text-text-primary text-[10px] font-medium cursor-pointer transition text-left"
                >
                  🌍 Pre-order Import Goods
                </button>
                <button
                  onClick={() => handleQuickQuestion("Which filament material is best for water containers?")}
                  className="px-2 py-1 rounded bg-bg-base border border-border-premium hover:border-accent text-text-secondary hover:text-text-primary text-[10px] font-medium cursor-pointer transition text-left"
                >
                  🧬 Filaments Spec Guide
                </button>
              </div>
            </div>
          )}

          {/* Product context card visual */}
          {productContext && (
            <div className="mx-3 mb-2 p-2 rounded-xl bg-bg-surface border border-accent/20 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-200 text-left">
              <div className="flex items-center space-x-2">
                <img 
                  src={productContext.images[0] || '/images/placeholder.png'} 
                  alt={productContext.title} 
                  className="w-10 h-10 object-cover rounded-lg border border-border-premium"
                  onError={(e) => {
                    e.currentTarget.src = '/images/placeholder.png';
                  }}
                />
                <div className="text-left">
                  <span className="text-[9px] font-mono text-accent uppercase block">{productContext.category}</span>
                  <span className="text-xs font-bold text-text-primary block line-clamp-1">{productContext.title}</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setProductContext(null)} 
                className="p-1 rounded bg-bg-elevated hover:bg-bg-surface text-text-secondary hover:text-text-primary border border-border-premium cursor-pointer transition text-xs font-mono"
              >
                [X]
              </button>
            </div>
          )}

          {/* Textbox typing area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="p-3 bg-bg-surface border-t border-border-premium flex items-center space-x-2"
          >
            <input
              id="chat-user-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about materials, tracking number..."
              className="flex-grow bg-bg-base text-text-primary text-xs px-3.5 py-2.5 rounded-xl border border-border-premium focus:border-accent focus:outline-none"
            />
            <button
              id="chat-send-btn"
              type="submit"
              className="p-2.5 rounded-xl bg-accent-secondary hover:bg-accent-hover text-white cursor-pointer transition flex items-center justify-center shrink-0 active:scale-95 disabled:opacity-40"
              disabled={!inputText.trim()}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

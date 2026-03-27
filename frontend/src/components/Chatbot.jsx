import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Mic, MicOff } from 'lucide-react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const TypingEffect = ({ text, speed = 45, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  useEffect(() => {
    // Dispatch a custom event to notify parent about text changes for auto-scroll
    window.dispatchEvent(new CustomEvent('chatbot-typing'));
  }, [displayedText]);

  return <span>{displayedText}</span>;
};

const Chatbot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleTyping = () => scrollToBottom();
    window.addEventListener('chatbot-typing', handleTyping);
    return () => window.removeEventListener('chatbot-typing', handleTyping);
  }, []);

  // Sync user from localStorage whenever the route changes (common after login/logout)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    
    // Only update if the user state has actually changed to avoid unnecessary re-renders
    if (JSON.stringify(parsedUser) !== JSON.stringify(user)) {
      setUser(parsedUser);
      const isUserAdmin = parsedUser?.role === 'admin';
      setIsAdmin(isUserAdmin);
      
      // Refresh the chat history when user changes
      if (parsedUser) {
        const greeting = isUserAdmin 
          ? `Hello Admin ${parsedUser.full_name || parsedUser.username}! System status is optimal. How can I assist with your management tasks today?`
          : `Hello ${parsedUser.full_name || parsedUser.username}! What should we do today?`;
        
        setMessages([
          { text: greeting, sender: 'bot', isNew: true }
        ]);
      } else {
        setMessages([
          { text: "Hello! I'm STOXIE. Please log in to ask me about stock prices or analyze your portfolio!", sender: 'bot', isNew: true }
        ]);
      }
    }
  }, [location, user]); // Depend on location to re-check on navigation

  const toggleChat = () => setIsOpen(!isOpen);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser does not support speech recognition. Please try Chrome.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setInputValue((prev) => prev + (prev ? ' ' : '') + finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    // Stop any ongoing bot typing effects when user starts a new interaction
    const newMessages = messages.map(msg => ({ ...msg, isNew: false }));
    setMessages([...newMessages, { text: userMessage, sender: 'user' }]);
    setInputValue('');

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/stocks/chatbot/', {
        message: userMessage,
        user_id: user?.id || null
      });

      setMessages(prev => [...prev, { 
        text: response.data.response, 
        sender: 'bot',
        isNew: true, // Mark as new to trigger typing effect
        showRegister: response.data.show_register,
        showPortfolioLink: response.data.show_portfolio_link,
        showCreatePortfolio: response.data.show_create_portfolio,
        showCollectionsLink: response.data.show_collections_link,
        showStocksLink: response.data.show_stocks_link,
        showPurchasesLink: response.data.show_purchases_link,
        isAdmin: response.data.is_admin
      }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, { 
        text: "I'm having trouble connecting to my brain right now. Please try again later!", 
        sender: 'bot',
        isNew: true
      }]);
    }
  };

  const handleTypingComplete = (index) => {
    setMessages((prev) =>
      prev.map((m, i) => (i === index ? { ...m, isNew: false } : m))
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat window */}
      {isOpen && (
        <div className={`w-80 mb-4 overflow-hidden border border-purple-300 shadow-2xl bg-gradient-to-br from-[#F3E8FF] via-[#E9D5FF] to-[#C084FC] rounded-[24px] animate-in fade-in slide-in-from-bottom-4`}>
          {/* Header */}
          <div className="bg-[#9333EA] text-white p-4 flex justify-between items-center border-b border-purple-200">
            <div className="flex items-center">
              <Bot size={24} className="mr-2 text-purple-100" />
              <span className="font-black tracking-wider text-sm uppercase">Stoxie AI</span>
            </div>
            <button onClick={toggleChat} className="hover:bg-white/20 p-1.5 rounded-xl transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 flex flex-col space-y-4 bg-transparent custom-scrollbar">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`max-w-[85%] p-3 rounded-2xl text-xs font-bold leading-relaxed flex flex-col shadow-sm transition-all ${
                  msg.sender === 'user' 
                    ? "bg-[#581C87] text-white self-end rounded-br-none" 
                    : "bg-white border border-purple-200 text-[#4C1D95] self-start rounded-bl-none"
                }`}
              >
                <div className="flex flex-col whitespace-pre-line">
                  {msg.sender === 'bot' && msg.isNew ? (
                    <TypingEffect text={msg.text} onComplete={() => handleTypingComplete(index)} />
                  ) : (
                    msg.text
                  )}
                </div>
                {msg.showRegister && (
                  <button
                    onClick={() => navigate('/register')}
                    className="mt-3 bg-light-accent hover:bg-white hover:text-secondary-dark text-white font-black py-2 px-4 rounded-xl transition-all duration-300 uppercase tracking-widest text-[10px] shadow-lg shadow-light-accent/20"
                  >
                    Register Now
                  </button>
                 )}
                 {msg.showPortfolioLink && (
                   <button
                     onClick={() => navigate('/customer-welcome/portfolio')}
                     className="mt-3 bg-medium-tone hover:bg-white hover:text-secondary-dark text-white font-black py-2 px-4 rounded-xl transition-all duration-300 uppercase tracking-widest text-[10px] shadow-lg shadow-medium-tone/20"
                   >
                     Go to Portfolio
                   </button>
                 )}
                 {msg.showCreatePortfolio && (
                    <button
                      onClick={() => navigate('/customer-welcome', { state: { highlightCreatePortfolio: true } })}
                      className="mt-3 bg-cyan-500 hover:bg-white hover:text-secondary-dark text-white font-black py-2 px-4 rounded-xl transition-all duration-300 uppercase tracking-widest text-[10px] shadow-lg shadow-cyan-500/20"
                    >
                      Create Portfolio
                    </button>
                  )}
                  {msg.showCollectionsLink && (
                    <button
                      onClick={() => navigate('/customer-welcome/collections')}
                      className="mt-3 bg-indigo-500 hover:bg-white hover:text-secondary-dark text-white font-black py-2 px-4 rounded-xl transition-all duration-300 uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20"
                    >
                      My Collections
                    </button>
                  )}
                  {msg.showStocksLink && (
                    <button
                      onClick={() => navigate('/customer-welcome/stock')}
                      className="mt-3 bg-emerald-500 hover:bg-white hover:text-secondary-dark text-white font-black py-2 px-4 rounded-xl transition-all duration-300 uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20"
                    >
                      Explore Stocks
                    </button>
                  )}
                  {msg.showPurchasesLink && (
                    <button
                      onClick={() => navigate('/customer-welcome/purchases')}
                      className="mt-3 bg-fuchsia-500 hover:bg-white hover:text-secondary-dark text-white font-black py-2 px-4 rounded-xl transition-all duration-300 uppercase tracking-widest text-[10px] shadow-lg shadow-fuchsia-500/20"
                    >
                      My Purchases
                    </button>
                  )}
                </div>
              ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-purple-200 flex items-center bg-white/50">
            <button 
              type="button"
              onClick={toggleListening}
              className={`mr-2 p-2 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'}`}
              title={isListening ? "Stop Listening" : "Start Listening"}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                // If user starts typing, stop existing bot animations
                if (e.target.value.length > 0) {
                  setMessages(prev => prev.map(m => ({ ...m, isNew: false })));
                }
              }}
              placeholder={isListening ? "Listening..." : "Ask Stoxie anything..."}
              className="flex-1 px-4 py-2.5 text-xs rounded-xl focus:ring-2 focus:ring-purple-500/50 bg-white border border-purple-200 placeholder:text-purple-300 text-purple-900 outline-none"
            />
            <button type="submit" className="ml-2 bg-[#9333EA] hover:bg-[#7E22CE] text-white p-2.5 rounded-xl transition-all shadow-md active:scale-95">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={toggleChat}
        className={`bg-[#9333EA] hover:bg-[#7E22CE] border border-white/20 text-white p-4 rounded-full shadow-[0_10px_25px_rgba(147,51,234,0.3)] transition-all transform ${isOpen ? 'rotate-90 shadow-none' : 'hover:scale-110'}`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};

export default Chatbot;

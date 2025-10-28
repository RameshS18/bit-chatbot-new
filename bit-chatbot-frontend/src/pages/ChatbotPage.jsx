import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Loader } from 'lucide-react';

const botIconUrl = '/images/new image.jpg';

const ChatbotPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [typingText, setTypingText] = useState('');
  const [fullResponse, setFullResponse] = useState('');
  const [followUpActions, setFollowUpActions] = useState([]);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingIntervalRef = useRef(null);

  // Handle viewport height changes for mobile keyboard
  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };

    const handleFocus = () => {
      setTimeout(() => {
        setViewportHeight(window.innerHeight);
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 300);
    };

    window.addEventListener('resize', handleResize);
    if (inputRef.current) {
      inputRef.current.addEventListener('focus', handleFocus);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (inputRef.current) {
        inputRef.current.removeEventListener('focus', handleFocus);
      }
    };
  }, []);

  // Load user data from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('bitChatbotUser');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    } else {
      setUserData({
        name: 'Test',
        email: 'student@bit.edu',
        phone: '1234567890',
        userType: 'student'
      });
    }
  }, []);

  // Send login request when user data loads
  useEffect(() => {
    if (userData) {
      const loginUser = async () => {
        try {
          const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: userData.name,
              email: userData.email,
              phone: userData.phone
            })
          });
          console.log('User login/session registered.');
        } catch (error) {
          console.error('Error registering user session:', error);
        }
      };
      loginUser();

      setMessages([{
        type: 'bot',
        text: `Hi ${userData.name}! 👋\n\nI'm BIT-Bot, your virtual assistant for Bannari Amman Institute of Technology. I can help you with:\n\n• Admissions & Eligibility\n• Course Information\n• Campus Facilities\n• Placements & Internships\n• Hostel & Accommodation\n\nWhat would you like to know?`,
        timestamp: new Date()
      }]);
    }
  }, [userData]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, typingText]);

  // Typing animation effect
  useEffect(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    if (fullResponse && isLoading) {
      let index = 0;
      setTypingText('');
      
      typingIntervalRef.current = setInterval(() => {
        if (index < fullResponse.length) {
          setTypingText(fullResponse.substring(0, index + 1));
          index++;
        } else {
          clearInterval(typingIntervalRef.current);
          setMessages(prev => [...prev, { 
            type: 'bot',
            text: fullResponse,
            isHtml: true,
            timestamp: new Date()
          }]);
          setIsLoading(false);
          setTypingText('');
          setFullResponse('');
          if (inputRef.current) {
            inputRef.current.focus();
          }
          setFollowUpActions([
            "Tell me more about placements",
            "Tell me about campus life",
            "Tell me detail about CSE department"
          ]);
        }
      }, 5);
    }

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [fullResponse, isLoading]);

  // Format bot messages
  const formatBotMessage = (text) => {
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-purple-900">$1</strong>');
    formatted = formatted.replace(/^\* /gm, '• ');
    formatted = formatted.replace(/\n\* /g, '\n• ');
    formatted = formatted.replace(/\n/g, '<br />');
    formatted = formatted.replace(/•/g, '<span class="text-purple-600">•</span>');
    
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-purple-600 font-semibold underline hover:text-purple-800 transition-colors break-all">${text}</a>`;
      }
      return match;
    });
    
    return formatted;
  };

  // Adjust textarea height dynamically
  const adjustTextareaHeight = () => {
    if (!inputRef.current) return;
    const textarea = inputRef.current;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 128);
    textarea.style.height = newHeight + 'px';
    textarea.style.overflowY = (textarea.scrollHeight > 128) ? 'auto' : 'hidden';
  };

  // Handle sending message
  const handleSendMessage = async (messageText = inputMessage) => {
    const trimmedInput = messageText.trim();
    if (!trimmedInput || isLoading || !userData) return;

    const userMessage = {
      type: 'user',
      text: trimmedInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setFollowUpActions([]);
    
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.overflowY = 'hidden';
    }

    setIsLoading(true);
    setTypingText('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmedInput,
          user_name: userData.name,
          email: userData.email,
          phone_number: userData.phone
        })
      });

      const data = await response.json();

      if (response.ok && data.answer) {
        const formattedResponse = formatBotMessage(data.answer);
        setFullResponse(formattedResponse);
      } else {
        setFullResponse("Sorry, something went wrong. Please try again.");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setFullResponse("I'm having trouble connecting right now. Please try again later.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    if (e.target.value.length <= 500) {
      setInputMessage(e.target.value);
      setTimeout(() => adjustTextareaHeight(), 0);
    }
  };

  const handleQuickAction = (question) => {
    handleSendMessage(question);
  };

  const quickActions = [
    "Tell me about Life at BIT",
    "What courses are offered?",
    "Campus facilities",
    "Placement details"
  ];

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-purple-50 to-white font-sans" style={{ height: `${viewportHeight}px` }}>
      
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 shadow-lg">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg overflow-hidden">
                <img src={botIconUrl} alt="BIT Bot Icon" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-purple-900 rounded-full"></div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">BITRA</h1>
              <p className="text-xs text-purple-200 leading-tight flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse flex-shrink-0"></span>
                <span>Online now</span>
              </p>
            </div>
          </div>
          {userData && (
            <div className="hidden sm:block text-right">
              <p className="text-sm text-purple-200">
                <span className="font-semibold text-white">{userData.name}</span>
              </p>
              <p className="text-xs text-purple-300 capitalize">{userData.userType}</p>
            </div>
          )}
        </div>
      </header>

      {/* User Info Bar - Mobile (Fixed below header) */}
      {userData && (
        <div className="sm:hidden fixed top-[60px] left-0 right-0 z-40 bg-white border-b px-4 py-2">
          <p className="text-sm text-gray-600">
            Welcome, <span className="font-semibold text-gray-800">{userData.name}</span>
            <span className="mx-2">•</span>
            <span className="capitalize">{userData.userType}</span>
          </p>
        </div>
      )}

      {/* Messages Area - Scrollable with proper spacing */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4 custom-scrollbar"
        style={{ 
          marginTop: 'calc(60px + 44px)', // Header + user info bar on mobile
          marginBottom: '80px', // Input area height
          WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
        }}
      >
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-4 pb-4">
          
          {messages.map((message, index) => (
            <div 
              key={index}
              className={`flex items-end gap-2 sm:gap-3 animate-slideUp ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full shadow-md ${
                message.type === 'bot' 
                  ? 'bg-white overflow-hidden' 
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold'
              }`}>
                {message.type === 'bot' ? (
                  <img src={botIconUrl} alt="Bot" className="w-full h-full object-cover" />
                ) : (
                  userData?.name.charAt(0).toUpperCase() || 'U'
                )}
              </div>

              <div className={`flex flex-col max-w-[75%] sm:max-w-[70%] ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-2xl shadow-md ${
                  message.type === 'user'
                    ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-br-md'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md'
                }`}>
                  <div className="text-[15px] leading-relaxed break-words overflow-wrap-anywhere">
                    {message.isHtml ? (
                      <div dangerouslySetInnerHTML={{ __html: message.text }} />
                    ) : (
                      <div className="whitespace-pre-wrap">{message.text}</div>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400 mt-1 px-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {/* Quick actions on first load */}
          {messages.length === 1 && !isLoading && (
            <div className="flex flex-col gap-3 my-2 animate-slideUp">
              <p className="text-sm text-gray-500 font-medium px-1">Quick actions:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickActions.map((action, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleQuickAction(action)} 
                    className="px-4 py-3 bg-white border-2 border-purple-200 rounded-xl text-sm font-medium text-purple-700 hover:border-purple-400 hover:bg-purple-50 active:scale-95 transition-all text-left shadow-sm"
                  >
                    <span className="mr-2 text-base leading-none">💬</span>
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-end gap-2 sm:gap-3 animate-slideUp">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white shadow-md overflow-hidden">
                <img src={botIconUrl} alt="Bot" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col items-start max-w-[75%] sm:max-w-[70%]">
                {typingText ? (
                  <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-md">
                    <div className="text-[15px] leading-relaxed text-gray-800 break-words overflow-wrap-anywhere">
                      <div dangerouslySetInnerHTML={{ __html: typingText }} />
                      <span className="inline-block w-0.5 h-4 bg-purple-600 ml-1 animate-blink"></span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-100 px-5 py-3.5 rounded-2xl rounded-bl-md shadow-md">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce1"></span>
                      <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce2"></span>
                      <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce3"></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Follow-up actions */}
          {!isLoading && followUpActions.length > 0 && (
            <div className="w-full animate-slideUp pt-2">
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar-horizontal">
                {followUpActions.map((action, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleQuickAction(action)} 
                    className="flex-shrink-0 px-4 py-2 bg-purple-100 border border-purple-200 rounded-full text-sm font-medium text-purple-800 hover:bg-purple-200 active:scale-95 transition-all shadow-sm"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input Area at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-2xl safe-area-bottom">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                rows="1"
                className="w-full border-2 border-gray-200 px-4 py-2.5 pr-3 rounded-2xl bg-gray-50 text-gray-800 text-base outline-none transition-all focus:border-purple-500 focus:bg-white focus:shadow-lg resize-none leading-6"
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                maxLength={500}
                style={{ minHeight: '44px', maxHeight: '128px', overflowY: 'hidden' }}
              />
            </div>
            
            <button 
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading} 
              className="flex-shrink-0 w-11 h-11 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Send size={20} className="text-white" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1.5 text-center">
            Press Enter to send • Shift + Enter for new line
          </p>
        </div>
      </div>

      <style>{`
        /* Safe area for notched devices */
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }

        /* Ensure full height on mobile */
        html, body, #root {
          height: 100%;
          overflow: hidden;
          position: fixed;
          width: 100%;
        }

        /* Fix for Safari/Brave mobile browsers */
        @supports (-webkit-touch-callout: none) {
          .custom-scrollbar {
            -webkit-overflow-scrolling: touch;
          }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .animate-blink {
          animation: blink 1s infinite;
        }
        .animate-bounce1 {
          animation: bounce 1.4s infinite ease-in-out;
          animation-delay: -0.32s;
        }
        .animate-bounce2 {
          animation: bounce 1.4s infinite ease-in-out;
          animation-delay: -0.16s;
        }
        .animate-bounce3 {
          animation: bounce 1.4s infinite ease-in-out;
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
        
        .custom-scrollbar-horizontal::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar-horizontal::-webkit-scrollbar-thumb { background: #d8b4fe; border-radius: 10px; }
        .custom-scrollbar-horizontal { scrollbar-width: thin; scrollbar-color: #d8b4fe transparent; }

        .overflow-wrap-anywhere { overflow-wrap: anywhere; }
        textarea::-webkit-scrollbar { width: 4px; }
        textarea::-webkit-scrollbar-track { background: transparent; }
        textarea::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        textarea { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
      `}</style>
    </div>
  );
};

export default ChatbotPage;
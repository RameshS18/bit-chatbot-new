import React, { useState, useRef, useEffect } from 'react';
import { Send, LogOut } from 'lucide-react'; 
import DOMPurify from 'dompurify';

const botIconUrl = '/images/new svg.svg';

const ChatbotPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [typingText, setTypingText] = useState('');
  const [fullResponse, setFullResponse] = useState('');
  const [followUpActions, setFollowUpActions] = useState([]);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isSendingRef = useRef(false);
  const initialLoadRef = useRef(true);
  const sendTimeoutRef = useRef(null);
  
  // --- Security Refs ---
  const lastActivityRef = useRef(Date.now()); 
  const lastMessageTimeRef = useRef(0);       

  const allFollowUpActions = [
    "Tell me more about placements",
    "Tell me about campus life",
    "Tell me detail about CSE department",
    "What are the hostel facilities?",
    "Tell me about admission process",
    "What courses are available?",
    "Tell me about faculty",
    "What about scholarships?"
  ];

  // --- SECURITY 1: Smart Session Validation (Time-Based) ---
  useEffect(() => {
    try {
      // 1. Get User Data
      const storedUser = localStorage.getItem('bitChatbotUser');
      const storedTime = localStorage.getItem('bitChatbotLastActive');

      if (!storedUser) {
        window.location.href = '/';
        return;
      }

      // 2. Check Time Expiry (10 Minutes)
      const tenMinutes = 10 * 60 * 1000; 
      const now = Date.now();
      
      // If time exists and is older than 10 mins, FORCE LOGOUT
      if (storedTime && (now - parseInt(storedTime) > tenMinutes)) {
        console.warn("Session expired due to inactivity.");
        handleLogout();
        return;
      }

      // 3. Parse Data
      const parsedUser = JSON.parse(storedUser);
      if (!parsedUser || !parsedUser.name || !parsedUser.email || !parsedUser.phone) {
        throw new Error("Corrupted or incomplete session data");
      }
      
      // 4. Update Time (Refresh Session) and Set Data
      localStorage.setItem('bitChatbotLastActive', now.toString());
      setUserData(parsedUser);

    } catch (error) {
      console.error('Security Check Failed:', error);
      handleLogout();
    }
  }, []);

  // --- SECURITY 2: Active Monitoring & Auto-Logout ---
  useEffect(() => {
    // Function to update the "Last Active" time in local storage
    const updateActivity = () => {
      const now = Date.now();
      lastActivityRef.current = now;
      // We update localStorage so if they open a new tab or refresh, it knows they are active
      localStorage.setItem('bitChatbotLastActive', now.toString());
    };

    // Listen for any user interaction
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    // Check every 30 seconds if we need to logout
    const inactivityInterval = setInterval(() => {
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000; 

      if (now - lastActivityRef.current > tenMinutes) {
        handleLogout();
      }
    }, 30000); 

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      clearInterval(inactivityInterval);
    };
  }, []);

  // Send login request to backend when user data is ready
  useEffect(() => {
    if (userData && initialLoadRef.current) {
      initialLoadRef.current = false;
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
          if (!response.ok) {
            console.error('Session registration failed on backend');
          }
        } catch (error) {
          console.error('Network error during session registration');
        }
      };
      loginUser();

      setMessages([{
        type: 'bot',
        text: `Hi ${userData.name}! 👋\n\nI'm BIT AI Assistant, your virtual assistant for Bannari Amman Institute of Technology. I can help you with:\n\n• Admissions & Eligibility\n• Course Information\n• Campus Facilities\n• Placements & Internships\n• Hostel & Accommodation\n\nWhat would you like to know?`,
        timestamp: new Date()
      }]);
    }
  }, [userData]);

  // --- SCROLL HANDLING ---
  
  // 1. Scroll to bottom when new messages arrive (Smooth)
  useEffect(() => {
    if (messagesEndRef.current) {
        setTimeout(() => {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
    }
  }, [messages, followUpActions]);

  // 2. Scroll while typing (Instant/Auto to prevent lag)
  useEffect(() => {
    if (typingText && messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        const scrollHeight = container.scrollHeight;
        const scrollTop = container.scrollTop;
        const clientHeight = container.clientHeight;

        const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

        if (isNearBottom) {
            container.scrollTop = scrollHeight;
        }
    }
  }, [typingText]);


  const getRandomFollowUpActions = () => {
    const shuffled = [...allFollowUpActions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
  };

  // --- Time-Based Typing Animation ---
  useEffect(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    if (fullResponse && isLoading) {
      const startTime = Date.now();
      const typingSpeed = 3; 
      
      setTypingText('');
      
      typingIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const charIndex = Math.floor(elapsed / typingSpeed);
        
        if (charIndex < fullResponse.length) {
          setTypingText(fullResponse.substring(0, charIndex + 1));
        } else {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
          
          setMessages(prev => [...prev, { 
            type: 'bot',
            text: fullResponse,
            isHtml: true,
            timestamp: new Date()
          }]);
          setIsLoading(false);
          setTypingText('');
          setFullResponse('');
          setFollowUpActions(getRandomFollowUpActions());
        }
      }, 10); 
    }

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, [fullResponse, isLoading]);

  useEffect(() => {
    return () => {
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current);
      }
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const formatBotMessage = (text) => {
    const preSanitized = DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });

    let formatted = preSanitized
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-purple-900">$1</strong>')
      .replace(/^\* /gm, '• ')
      .replace(/\n\* /g, '\n• ')
      .replace(/\n/g, '<br />')
      .replace(/•/g, '<span class="text-purple-600">•</span>');
    
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
      if (urlPattern.test(url)) {
        const safeUrl = encodeURI(url);
        const safeText = DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-purple-600 font-semibold underline hover:text-purple-800 transition-colors break-all">${safeText}</a>`;
      }
      return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    });
    
    const sanitized = DOMPurify.sanitize(formatted, {
      ALLOWED_TAGS: ['strong', 'br', 'span', 'a'],
      ALLOWED_ATTR: ['class', 'href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
      ALLOWED_URI_REGEXP: /^https?:\/\//
    });
    
    return sanitized;
  };

  const adjustTextareaHeight = () => {
    if (!inputRef.current) return;
    const textarea = inputRef.current;
    
    textarea.style.height = '44px'; // Base height
    
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 120; // Limit height on mobile
    const newHeight = Math.min(Math.max(scrollHeight, 44), maxHeight);
    
    textarea.style.height = newHeight + 'px';
    textarea.style.overflowY = (scrollHeight > maxHeight) ? 'auto' : 'hidden';
  };

  const handleSendMessage = async (messageText = inputMessage) => {
    const trimmedInput = messageText.trim();
    if (!trimmedInput || isLoading || !userData) return;

    // --- SECURITY 3: Anti-Spam ---
    const now = Date.now();
    if (now - lastMessageTimeRef.current < 1000) {
        return; 
    }
    lastMessageTimeRef.current = now;

    if (isSendingRef.current) return;
    isSendingRef.current = true;

    lastActivityRef.current = Date.now();
    localStorage.setItem('bitChatbotLastActive', Date.now().toString()); // Update time on send

    const userMessage = {
      type: 'user',
      text: trimmedInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setFollowUpActions([]);
    
    if (inputRef.current) {
      inputRef.current.style.height = '44px';
      inputRef.current.style.overflowY = 'hidden';
      inputRef.current.focus(); 
    }

    setIsLoading(true);
    setTypingText('');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmedInput,
          user_name: userData.name,
          email: userData.email,
          phone_number: userData.phone
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok && data.answer) {
        const formattedResponse = formatBotMessage(data.answer);
        setFullResponse(formattedResponse);
      } else {
        setFullResponse("Sorry, something went wrong. Please try again.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.name === 'AbortError') {
        setFullResponse("Request timed out. Please try again.");
      } else {
        setFullResponse("I'm having trouble connecting right now. Please try again later.");
      }
      setIsLoading(false);
    } finally {
      sendTimeoutRef.current = setTimeout(() => {
        isSendingRef.current = false;
      }, 300);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    lastActivityRef.current = Date.now(); 
    if (e.target.value.length <= 500) {
      setInputMessage(e.target.value);
      requestAnimationFrame(() => adjustTextareaHeight());
    }
  };

  const handleQuickAction = (question) => {
    if (!isLoading && !isSendingRef.current) {
      handleSendMessage(question);
    }
  };

  const handleInputFocus = () => {
    lastActivityRef.current = Date.now();
    localStorage.setItem('bitChatbotLastActive', Date.now().toString());
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 300);
  };

  const handleLogout = () => {
    try {
      // CLEAR ALL LOCAL STORAGE CACHE
      localStorage.removeItem('bitChatbotUser');
      localStorage.removeItem('bitChatbotLastActive');
    } catch (error) {
      console.error('Error removing user data:', error);
    }
    window.location.href = '/';
  };

  const quickActions = [
    "Tell me about Life at BIT",
    "What courses are offered?",
    "Campus facilities",
    "Placement details"
  ];

  if (!userData) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-purple-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chatbot-container">
      
      {/* Fixed Header */}
      <header className="chatbot-header">
        <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center shadow-lg overflow-hidden">
                <img 
                  src={botIconUrl} 
                  alt="BIT Bot Icon" 
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-green-400 border-2 border-purple-900 rounded-full"></div>
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight truncate">BIT AI Assistant</h1>
              <p className="text-xs text-purple-200 leading-tight flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse flex-shrink-0"></span>
                <span>Online now</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {userData && (
              <div className="hidden md:block text-right mr-3">
                <p className="text-sm text-purple-200">
                  <span className="font-semibold text-white">{userData.name}</span>
                </p>
                <p className="text-xs text-purple-300 capitalize">{userData.userType}</p>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              className="p-2 sm:p-2.5 rounded-lg bg-purple-700 hover:bg-purple-600 transition-colors touch-button active:scale-95"
              type="button"
              aria-label="Logout"
            >
              <LogOut size={20} className="text-white sm:w-[22px] sm:h-[22px]" />
            </button>
          </div>
        </div>
      </header>

      {/* User Info Bar - Mobile Only */}
      {userData && (
        <div className="chatbot-mobile-user-bar">
          <p className="text-xs sm:text-sm text-gray-600 truncate">
            Hi, <span className="font-semibold text-gray-800">{userData.name}</span>
          </p>
        </div>
      )}

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="chatbot-messages-container"
      >
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-4 px-3 sm:px-6 py-4 pb-32"> 
          
          {messages.map((message, index) => (
            <div 
              key={`${message.type}-${index}-${message.timestamp.getTime()}`}
              className={`flex items-end gap-2 sm:gap-3 animate-slideUp ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full shadow-md ${
                message.type === 'bot' 
                  ? 'bg-white overflow-hidden' 
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold'
              }`}>
                {message.type === 'bot' ? (
                  <img 
                    src={botIconUrl} 
                    alt="Bot" 
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  userData?.name.charAt(0).toUpperCase() || 'U'
                )}
              </div>

              <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl shadow-md ${
                  message.type === 'user'
                    ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-br-md'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md'
                }`}>
                  <div className="text-[15px] leading-relaxed break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {message.isHtml ? (
                      <div dangerouslySetInnerHTML={{ __html: message.text }} />
                    ) : (
                      <div className="whitespace-pre-wrap">{message.text}</div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs text-gray-400 mt-1 px-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {/* Quick actions on first load */}
          {messages.length === 1 && !isLoading && (
            <div className="flex flex-col gap-3 my-2 animate-slideUp px-1">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Suggestion:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {quickActions.map((action, idx) => (
                  <button 
                    key={`quick-${idx}`} 
                    onClick={() => handleQuickAction(action)} 
                    className="px-4 py-3 bg-white border-2 border-purple-100 rounded-xl text-sm font-medium text-purple-700 hover:border-purple-400 hover:bg-purple-50 active:bg-purple-100 active:scale-[0.98] transition-all text-left shadow-sm touch-button"
                    disabled={isLoading}
                    type="button"
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
              <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white shadow-md overflow-hidden">
                <img 
                  src={botIconUrl} 
                  alt="Bot" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="flex flex-col items-start max-w-[85%] sm:max-w-[75%]">
                {typingText ? (
                  <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-md">
                    <div className="text-[15px] leading-relaxed text-gray-800 break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      <div dangerouslySetInnerHTML={{ __html: typingText }} />
                      <span className="inline-block w-0.5 h-4 bg-purple-600 ml-1 animate-blink"></span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-md">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-medium text-purple-700 animate-pulse-text">AI is thinking</span>
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-thinking1"></span>
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-thinking2"></span>
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-thinking3"></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Follow-up actions */}
          {!isLoading && followUpActions.length > 0 && (
            <div className="w-full animate-slideUp pl-10 sm:pl-12">
              <div className="flex flex-wrap gap-2">
                {followUpActions.map((action, idx) => (
                  <button 
                    key={`followup-${idx}-${action}`} 
                    onClick={() => handleQuickAction(action)} 
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-50 border border-purple-200 rounded-full text-xs sm:text-sm font-medium text-purple-800 hover:bg-purple-100 active:bg-purple-200 active:scale-[0.98] transition-all shadow-sm touch-button"
                    disabled={isLoading}
                    type="button"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} style={{ height: '1px' }} aria-hidden="true" />
        </div>
      </div>

      {/* FLOATING Input Area */}
      <div className="chatbot-input-wrapper">
        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          <div className="bg-white/95 backdrop-blur-md rounded-[20px] sm:rounded-[2rem] shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.1)] border border-gray-200 p-2 pl-3 sm:pl-4 flex items-end gap-2">
            <div className="flex-1 relative py-2">
              <textarea
                ref={inputRef}
                rows="1"
                className="chatbot-input"
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                onFocus={handleInputFocus}
                placeholder={isLoading ? "AI is typing..." : "Message..."}
                disabled={isLoading}
                maxLength={500}
                aria-label="Type your message"
                autoComplete="off"
                autoCorrect="on"
                autoCapitalize="sentences"
                spellCheck="true"
                enterKeyHint="send" 
              />
            </div>
            
            <button 
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading} 
              className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 mb-1 mr-0.5 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-button"
              type="button"
              aria-label="Send message"
            >
              <Send size={18} className="text-white ml-0.5 sm:w-5 sm:h-5" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center font-medium opacity-70">
            AI can make mistakes. Verify important info.
          </p>
        </div>
      </div>

      <style>{`
        /* Base container with mobile height fix */
        .chatbot-container {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          height: 100%; /* Fallback */
          height: 100dvh; /* Mobile Viewport Height */
          background: linear-gradient(to bottom, #f3e8ff, #ffffff) !important;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          overflow: hidden;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          color-scheme: light !important;
        }

        /* Header */
        .chatbot-header {
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          padding: 8px 12px;
          background: linear-gradient(to right, rgb(88, 28, 135), rgb(107, 33, 168), rgb(88, 28, 135));
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
        }

        @media (min-width: 640px) {
          .chatbot-header {
            padding: 12px 24px;
          }
        }

        /* Mobile user bar */
        .chatbot-mobile-user-bar {
          position: sticky;
          top: 56px;
          z-index: 40;
          background: white;
          border-bottom: 1px solid rgb(229, 231, 235);
          padding: 6px 12px;
          flex-shrink: 0;
        }

        @media (min-width: 768px) {
          .chatbot-mobile-user-bar {
            display: none;
          }
        }

        /* Messages container */
        .chatbot-messages-container {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: contain;
          overscroll-behavior-x: none;
          position: relative;
          min-height: 0;
          background: transparent !important;
        }

        /* Input Wrapper */
        .chatbot-input-wrapper {
          position: absolute; /* Floating */
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 45;
          /* Critical for mobile: padding for home bar */
          padding-bottom: max(16px, env(safe-area-inset-bottom, 16px));
          background: linear-gradient(to top, rgba(255,255,255,1) 40%, rgba(255,255,255,0));
          pointer-events: none;
        }

        .chatbot-input-wrapper > div {
          pointer-events: auto;
        }

        /* Input field - Force 16px to prevent iOS zoom */
        .chatbot-input {
          width: 100%;
          border: 0;
          padding: 0;
          background: transparent;
          color: rgb(31, 41, 55);
          font-size: 16px !important; /* Vital for iOS */
          outline: none;
          resize: none;
          line-height: 1.5;
          min-height: 24px;
          max-height: 120px;
          overflow-y: hidden;
          font-family: inherit;
        }

        .chatbot-input::placeholder {
          color: #9ca3af;
        }

        /* Enhanced touch targets */
        .touch-button {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          -webkit-user-select: none;
          cursor: pointer;
        }

        /* Animations */
        @keyframes slideUp {
          from { opacity: 0; transform: translate3d(0, 10px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        @keyframes thinking {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes pulseText {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        .animate-slideUp { animation: slideUp 0.3s ease-out; will-change: transform, opacity; }
        .animate-blink { animation: blink 1s infinite; }
        .animate-thinking1 { animation: thinking 1.4s infinite ease-in-out; animation-delay: 0s; }
        .animate-thinking2 { animation: thinking 1.4s infinite ease-in-out; animation-delay: 0.2s; }
        .animate-thinking3 { animation: thinking 1.4s infinite ease-in-out; animation-delay: 0.4s; }
        .animate-pulse-text { animation: pulseText 2s ease-in-out infinite; }

        /* Scrollbars */
        .chatbot-messages-container::-webkit-scrollbar { width: 5px; }
        .chatbot-messages-container::-webkit-scrollbar-track { background: transparent; }
        .chatbot-messages-container::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        
        button:active:not(:disabled) { transform: scale(0.96); }
        
        /* Link styles */
        .chatbot-messages-container a { word-break: break-all; overflow-wrap: anywhere; }

        /* Loading spinner */
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }

        @media print { .chatbot-input-wrapper, .chatbot-header button { display: none; } }
      `}</style>
    </div>
  );
};

export default ChatbotPage;
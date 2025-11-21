import React, { useState, useRef, useEffect } from 'react';
import { Send, Home, LogOut } from 'lucide-react';
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
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);


  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isSendingRef = useRef(false);
  const initialLoadRef = useRef(true);
  const sendTimeoutRef = useRef(null);
  

  // All available follow-up actions
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

  // Check authentication and load user data with error handling
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('bitChatbotUser');
      if (!storedUser) {
        window.location.href = '/';
        return;
      }
      const parsedUser = JSON.parse(storedUser);
      if (!parsedUser || !parsedUser.name || !parsedUser.email) {
        localStorage.removeItem('bitChatbotUser');
        window.location.href = '/';
        return;
      }
      setUserData(parsedUser);
    } catch (error) {
      console.error('Error loading user data:', error);
      localStorage.removeItem('bitChatbotUser');
      window.location.href = '/';
    }
  }, []);

  // Send login request when user data loads
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
            console.error('Login request failed:', response.status);
          }
        } catch (error) {
          console.error('Error registering user session:', error);
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
// Simple Perplexity-style auto-scroll control - FIXED VERSION
useEffect(() => {
  const container = messagesContainerRef.current;
  if (!container) return;

  let lastScrollTop = container.scrollTop;
  let scrollTimeout = null;

  const handleScroll = () => {
    // Ignore scroll events caused by typing animation
    if (isLoading && typingText) {
      return; // Skip detection during typing animation
    }

    // Clear any pending timeout
    if (scrollTimeout) clearTimeout(scrollTimeout);

    // Debounce to avoid rapid-fire scroll events
    scrollTimeout = setTimeout(() => {
      const currentScrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const isAtBottom = scrollHeight - currentScrollTop - clientHeight < 50;

      // If user scrolled UP (even 1px), disable auto-scroll immediately
      if (currentScrollTop < lastScrollTop) {
        setAutoScrollEnabled(false);
      }
      // If user is at bottom, enable auto-scroll
      else if (isAtBottom) {
        setAutoScrollEnabled(true);
      }

      lastScrollTop = currentScrollTop;
    }, 50); // 50ms debounce
  };

  container.addEventListener('scroll', handleScroll, { passive: true });
  return () => {
    container.removeEventListener('scroll', handleScroll);
    if (scrollTimeout) clearTimeout(scrollTimeout);
  };
}, [isLoading, typingText]); // Add dependencies to track typing state

// Auto-scroll effect - only runs if enabled
useEffect(() => {
  if (!autoScrollEnabled) return;

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end',
        inline: 'nearest'
      });
    }
  };

  const rafId = requestAnimationFrame(scrollToBottom);
  return () => cancelAnimationFrame(rafId);
}, [messages, typingText, autoScrollEnabled]);


  // Get random follow-up actions
  const getRandomFollowUpActions = () => {
    const shuffled = [...allFollowUpActions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
  };

  // Typing animation effect with proper cleanup and optimized speed
  useEffect(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
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
      }, 1); // Reduced delay for faster typing
    }

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, [fullResponse, isLoading]);

  // Cleanup on unmount
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

  // Format and sanitize bot messages with enhanced security
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

  // Improved textarea height adjustment with cross-browser support
  const adjustTextareaHeight = () => {
    if (!inputRef.current) return;
    const textarea = inputRef.current;
    
    textarea.style.height = '44px';
    
    const computed = window.getComputedStyle(textarea);
    const paddingTop = parseFloat(computed.paddingTop);
    const paddingBottom = parseFloat(computed.paddingBottom);
    const borderTop = parseFloat(computed.borderTopWidth);
    const borderBottom = parseFloat(computed.borderBottomWidth);
    const extraHeight = paddingTop + paddingBottom + borderTop + borderBottom;
    
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 128;
    const newHeight = Math.min(Math.max(scrollHeight, 44), maxHeight);
    
    textarea.style.height = newHeight + 'px';
    textarea.style.overflowY = (scrollHeight > maxHeight) ? 'auto' : 'hidden';
  };

  // Handle sending message with proper race condition prevention
  const handleSendMessage = async (messageText = inputMessage) => {
    const trimmedInput = messageText.trim();
    if (!trimmedInput || isLoading || !userData) return;

    if (isSendingRef.current) return;
    isSendingRef.current = true;

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
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 200);
  };

  const handleHomeClick = () => {
    window.location.href = '/';
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('bitChatbotUser');
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
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chatbot-container">
      
      {/* Fixed Header */}
      <header className="chatbot-header">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg overflow-hidden">
                <img 
                  src={botIconUrl} 
                  alt="BIT Bot Icon" 
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-purple-900 rounded-full"></div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">BIT AI Assistant</h1>
              <p className="text-xs text-purple-200 leading-tight flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse flex-shrink-0"></span>
                <span>Online now</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {userData && (
              <div className="hidden sm:block text-right mr-3">
                <p className="text-sm text-purple-200">
                  <span className="font-semibold text-white">{userData.name}</span>
                </p>
                <p className="text-xs text-purple-300 capitalize">{userData.userType}</p>
              </div>
            )}
            <button
              onClick={handleHomeClick}
              className="p-2.5 rounded-lg bg-purple-700 hover:bg-purple-600 transition-colors touch-button"
              type="button"
              aria-label="Go to home"
            >
              <Home size={22} className="text-white" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-lg bg-purple-700 hover:bg-purple-600 transition-colors touch-button"
              type="button"
              aria-label="Logout"
            >
              <LogOut size={22} className="text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* User Info Bar - Mobile */}
      {userData && (
        <div className="chatbot-mobile-user-bar">
          <p className="text-sm text-gray-600">
            Welcome, <span className="font-semibold text-gray-800">{userData.name}</span>
            <span className="mx-2">•</span>
            <span className="capitalize">{userData.userType}</span>
          </p>
        </div>
      )}

      {/* Messages Area - Scrollable Container */}
      <div 
        ref={messagesContainerRef}
        className="chatbot-messages-container"
      >
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-4 px-4 sm:px-6 py-4 pb-6">
          
          {messages.map((message, index) => (
            <div 
              key={`${message.type}-${index}-${message.timestamp.getTime()}`}
              className={`flex items-end gap-2 sm:gap-3 animate-slideUp ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`flex-shrink-0 w-9 h-9 rounded-full shadow-md ${
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

              <div className={`flex flex-col max-w-[80%] sm:max-w-[75%] ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-2xl shadow-md ${
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
                    key={`quick-${idx}`} 
                    onClick={() => handleQuickAction(action)} 
                    className="px-4 py-3 bg-white border-2 border-purple-200 rounded-xl text-sm font-medium text-purple-700 hover:border-purple-400 hover:bg-purple-50 active:scale-[0.98] transition-all text-left shadow-sm touch-button"
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
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white shadow-md overflow-hidden">
                <img 
                  src={botIconUrl} 
                  alt="Bot" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="flex flex-col items-start max-w-[80%] sm:max-w-[75%]">
                {typingText ? (
                  <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-md">
                    <div className="text-[15px] leading-relaxed text-gray-800 break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      <div dangerouslySetInnerHTML={{ __html: typingText }} />
                      <span className="inline-block w-0.5 h-4 bg-purple-600 ml-1 animate-blink"></span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-100 px-5 py-3.5 rounded-2xl rounded-bl-md shadow-md">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-purple-700 animate-pulse-text">BIT AI Assistant is thinking</span>
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
            <div className="w-full animate-slideUp">
              <div className="flex flex-wrap gap-2">
                {followUpActions.map((action, idx) => (
                  <button 
                    key={`followup-${idx}-${action}`} 
                    onClick={() => handleQuickAction(action)} 
                    className="px-4 py-2 bg-purple-100 border border-purple-200 rounded-full text-sm font-medium text-purple-800 hover:bg-purple-200 active:scale-[0.98] transition-all shadow-sm touch-button"
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

      {/* Input Area */}
      <div className="chatbot-input-wrapper">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-200 p-3">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  rows="1"
                  className="chatbot-input"
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  onFocus={handleInputFocus}
                  placeholder={isLoading ? "BIT AI Assistant is typing..." : "Type your message..."}
                  disabled={isLoading}
                  maxLength={500}
                  aria-label="Type your message"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="sentences"
                  spellCheck="true"
                />
              </div>
              
              <button 
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading} 
                className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-button"
                type="button"
                aria-label="Send message"
              >
                <Send size={22} className="text-white" />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send • Shift + Enter for new line
          </p>
        </div>
      </div>

      <style>{`
        /* Base container - FORCED LIGHT MODE */
        .chatbot-container {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          height: 100dvh;
          background: linear-gradient(to bottom, #faf5ff, #ffffff) !important;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          overflow: hidden;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          color-scheme: light !important;
        }

        /* Fallback for browsers without dvh support */
        @supports not (height: 100dvh) {
          .chatbot-container {
            height: 100vh;
            height: -webkit-fill-available;
          }
        }

        /* Header */
        .chatbot-header {
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          padding: 12px 16px;
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
          top: 60px;
          z-index: 40;
          background: white;
          border-bottom: 1px solid rgb(229, 231, 235);
          padding: 8px 16px;
          flex-shrink: 0;
        }

        @media (min-width: 640px) {
          .chatbot-mobile-user-bar {
            display: none;
          }
        }

        /* Messages container - FORCED LIGHT BACKGROUND */
        .chatbot-messages-container {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: contain;
          overscroll-behavior-x: none;
          position: relative;
          min-height: 0;
          background: linear-gradient(to bottom, #faf5ff, #ffffff) !important;
        }

        .chatbot-input-wrapper {
  position: relative;
  z-index: 45;
  flex-shrink: 0;
  background: #ffffff !important;
  padding-top: 12px;
  padding-bottom: max(16px, env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);  /* Subtle shadow for depth */
}


        /* Fallback for older browsers */
        @supports not (padding: max(0px)) {
          .chatbot-input-wrapper {
            padding-bottom: 16px;
          }
        }

        /* Input field */
        .chatbot-input {
          width: 100%;
          border: 0;
          padding: 12px 16px;
          border-radius: 16px;
          background: rgb(249, 250, 251);
          color: rgb(31, 41, 55);
          font-size: 16px;
          outline: none;
          transition: background-color 0.15s ease;
          resize: none;
          line-height: 1.5;
          min-height: 44px;
          max-height: 128px;
          overflow-y: hidden;
          font-family: inherit;
          -webkit-appearance: none;
          appearance: none;
          box-sizing: border-box;
        }

        .chatbot-input:focus {
          background: rgb(243, 244, 246);
        }

        .chatbot-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Enhanced touch targets for mobile */
        .touch-button {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          min-width: 44px;
          min-height: 44px;
          user-select: none;
          -webkit-user-select: none;
        }

        /* Prevent double-tap zoom */
        button {
          touch-action: manipulation;
        }

        /* Animations */
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translate3d(0, 10px, 0);
          }
          to { 
            opacity: 1; 
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        @keyframes thinking {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% { 
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes pulseText {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
          will-change: transform, opacity;
        }

        .animate-blink {
          animation: blink 1s infinite;
        }

        .animate-thinking1 {
          animation: thinking 1.4s infinite ease-in-out;
          animation-delay: 0s;
        }

        .animate-thinking2 {
          animation: thinking 1.4s infinite ease-in-out;
          animation-delay: 0.2s;
        }

        .animate-thinking3 {
          animation: thinking 1.4s infinite ease-in-out;
          animation-delay: 0.4s;
        }

        .animate-pulse-text {
          animation: pulseText 2s ease-in-out infinite;
        }

        /* Custom scrollbars - Webkit */
        .chatbot-messages-container::-webkit-scrollbar {
          width: 6px;
        }

        .chatbot-messages-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .chatbot-messages-container::-webkit-scrollbar-thumb {
          background: rgb(203, 213, 225);
          border-radius: 10px;
        }

        .chatbot-messages-container::-webkit-scrollbar-thumb:hover {
          background: rgb(148, 163, 184);
        }

        /* Firefox scrollbar */
        .chatbot-messages-container {
          scrollbar-width: thin;
          scrollbar-color: rgb(203, 213, 225) transparent;
        }

        /* Input scrollbar - Webkit */
        .chatbot-input::-webkit-scrollbar {
          width: 4px;
        }

        .chatbot-input::-webkit-scrollbar-track {
          background: transparent;
        }

        .chatbot-input::-webkit-scrollbar-thumb {
          background: rgb(203, 213, 225);
          border-radius: 10px;
        }

        /* Input scrollbar - Firefox */
        .chatbot-input {
          scrollbar-width: thin;
          scrollbar-color: rgb(203, 213, 225) transparent;
        }

        /* Active state */
        button:active:not(:disabled) {
          transform: scale(0.98);
        }

        /* Link styles */
        .chatbot-messages-container a {
          word-break: break-all;
          overflow-wrap: anywhere;
        }

        /* Loading spinner */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        /* iOS specific fixes */
        @supports (-webkit-touch-callout: none) {
          .chatbot-messages-container {
            -webkit-overflow-scrolling: touch;
            overscroll-behavior-y: none;
          }

          .chatbot-input {
            text-size-adjust: 100%;
            -webkit-text-size-adjust: 100%;
          }
        }

        /* Prevent selection on mobile */
        .touch-button, 
        .chatbot-header,
        .chatbot-mobile-user-bar {
          -webkit-user-select: none;
          user-select: none;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .chatbot-input {
            border: 1px solid currentColor;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* REMOVED DARK MODE - Force light mode always */
        /* No dark mode styles applied */

        /* Print styles */
        @media print {
          .chatbot-input-wrapper,
          .chatbot-header button {
            display: none;
          }
        }

        /* Landscape mobile optimization */
        @media (max-height: 500px) and (orientation: landscape) {
          .chatbot-header {
            padding: 8px 16px;
          }

          .chatbot-mobile-user-bar {
            padding: 4px 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatbotPage;

import React, { useEffect, useRef, useState } from 'react';
import { Send, X, MessageSquare, Maximize2, Minimize2 } from 'lucide-react';
import { ChatMessage, Role } from '../types';
import { MathRenderer } from './MathRenderer';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isProcessing,
  isOpen,
  setIsOpen
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false); // For desktop expand

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
        scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    onSendMessage(inputText);
    setInputText('');
  };

  // If chat is closed, show a small pill button to open it
  if (!isOpen) {
    return (
      <div className="absolute bottom-6 right-6 z-30 pointer-events-auto">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
        >
          <MessageSquare size={24} />
          <span className="font-medium hidden md:inline">Ask Tutor</span>
          {messages.length > 0 && (
             <span className="bg-red-500 text-xs rounded-full h-5 w-5 flex items-center justify-center -ml-1 -mt-4 border-2 border-indigo-600">
               {messages.length}
             </span>
          )}
        </button>
      </div>
    );
  }

  // Main Chat Container
  return (
    <div 
        className={`
            absolute transition-all duration-500 ease-in-out z-30 bg-gray-900/95 backdrop-blur-md border-t border-gray-700 shadow-2xl flex flex-col
            ${isExpanded ? 'inset-0' : 'bottom-0 left-0 right-0 h-[60vh] md:h-[500px] md:w-[400px] md:right-6 md:left-auto md:bottom-6 md:rounded-2xl md:border'}
        `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50 rounded-t-2xl">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <h3 className="text-white font-semibold">MathLens Tutor</h3>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:bg-gray-700 rounded-md text-gray-400 hover:text-white transition-colors hidden md:block"
            >
                {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-gray-700 rounded-md text-gray-400 hover:text-white transition-colors"
            >
                <X size={20} />
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide bg-gradient-to-b from-gray-900 to-black/50">
        {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-4 opacity-70">
                <MessageSquare size={48} className="text-gray-700" />
                <p>Snap a photo of a math problem<br/>to get started!</p>
            </div>
        ) : (
            messages.map((msg) => (
            <div 
                key={msg.id} 
                className={`flex flex-col max-w-[90%] ${msg.role === Role.USER ? 'self-end items-end' : 'self-start items-start'}`}
            >
                <div 
                    className={`
                        rounded-2xl px-4 py-3 shadow-sm relative
                        ${msg.role === Role.USER 
                            ? 'bg-indigo-600 text-white rounded-tr-sm' 
                            : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700'}
                    `}
                >
                    {/* Show image thumbnail if user sent one */}
                    {msg.image && (
                        <div className="mb-2 rounded-lg overflow-hidden border border-white/20 w-32 h-32 relative group">
                             <img src={msg.image} alt="Problem" className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all"></div>
                        </div>
                    )}
                    
                    {msg.role === Role.MODEL && msg.isLoading ? (
                        <div className="flex space-x-2 items-center py-2 px-1">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    ) : (
                        <MathRenderer content={msg.text} />
                    )}
                </div>
                <span className="text-[10px] text-gray-500 mt-1 px-1">
                    {msg.role === Role.USER ? 'You' : 'Tutor'}
                </span>
            </div>
            ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-900 border-t border-gray-800 rounded-b-2xl">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={messages.length === 0 ? "Snap a photo first..." : "Ask a follow-up question..."}
            disabled={isProcessing}
            className="flex-1 bg-gray-800 border-none rounded-full px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className="p-3 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

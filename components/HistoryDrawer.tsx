import React from 'react';
import { X, MessageSquare, Trash2, Plus, Calendar, ChevronRight } from 'lucide-react';
import { ConversationMetadata } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ConversationMetadata[];
  currentId: string;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onNewChat: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  conversations,
  currentId,
  onSelectConversation,
  onDeleteConversation,
  onNewChat
}) => {
  // Format date helper
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 0) return 'Today ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'long' });
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div 
        className={`
          fixed top-0 left-0 bottom-0 w-80 bg-gray-900/95 border-r border-gray-800 z-50 transform transition-transform duration-300 ease-out shadow-2xl flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar size={20} className="text-indigo-400" />
                History
            </h2>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
            <button
                onClick={() => {
                    onNewChat();
                    onClose(); // Optional: close drawer on new chat
                }}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
            >
                <Plus size={20} />
                New Problem
            </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4 scrollbar-hide">
            {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-sm mt-10">
                    <MessageSquare size={32} className="mb-3 opacity-20" />
                    <p>No history yet.</p>
                    <p className="text-xs opacity-60">Calculations will appear here.</p>
                </div>
            ) : (
                conversations.map((conv) => (
                    <div 
                        key={conv.id}
                        onClick={() => onSelectConversation(conv.id)}
                        className={`
                            group relative p-3 rounded-lg cursor-pointer transition-all border border-transparent
                            ${conv.id === currentId 
                                ? 'bg-gray-800 border-gray-700 shadow-sm' 
                                : 'hover:bg-gray-800/50 hover:border-gray-700/50'}
                        `}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <h3 className={`font-medium text-sm truncate pr-6 ${conv.id === currentId ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                {conv.title}
                            </h3>
                        </div>
                        
                        <p className="text-xs text-gray-500 mb-2 truncate">{conv.preview}</p>
                        
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-600 font-mono">
                                {formatDate(conv.timestamp)}
                            </span>
                        </div>

                        {/* Hover Actions */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pl-4 bg-gradient-to-l from-gray-800 via-gray-800 to-transparent">
                            <button
                                onClick={(e) => onDeleteConversation(conv.id, e)}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                                title="Delete"
                            >
                                <Trash2 size={14} />
                            </button>
                            <ChevronRight size={16} className="text-gray-500" />
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </>
  );
};
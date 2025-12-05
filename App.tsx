import React, { useState, useEffect, useCallback } from 'react';
import { CameraView } from './components/CameraView';
import { ChatInterface } from './components/ChatInterface';
import { InstructionsOverlay } from './components/InstructionsOverlay';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ChatMessage, Role, ConversationMetadata } from './types';
import { sendMessageToTutor } from './services/geminiService';
import { storageService } from './services/storageService';
import { Loader2, History } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // History State
  const [currentConversationId, setCurrentConversationId] = useState<string>(() => storageService.createId());
  const [conversations, setConversations] = useState<ConversationMetadata[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // --- Effects ---

  // Load history list on mount
  useEffect(() => {
    const list = storageService.getConversationList();
    setConversations(list);
    
    // If we have history, maybe we don't auto-load the last one? 
    // For now, start fresh (empty id generated in state init), unless user selects one.
  }, []);

  // Auto-save when messages change
  useEffect(() => {
    if (messages.length > 0) {
      storageService.saveConversation(currentConversationId, messages);
      // Refresh the list to update titles/timestamps
      setConversations(storageService.getConversationList());
    }
  }, [messages, currentConversationId]);

  // --- Handlers ---

  const handleNewChat = useCallback(() => {
    const newId = storageService.createId();
    setCurrentConversationId(newId);
    setMessages([]);
    setIsChatOpen(false); // Close chat to let user take a photo
    setIsHistoryOpen(false);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    const loadedMessages = storageService.loadConversation(id);
    setCurrentConversationId(id);
    setMessages(loadedMessages);
    setIsHistoryOpen(false);
    setIsChatOpen(true); // Open chat view to see history
  }, []);

  const handleDeleteConversation = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedList = storageService.deleteConversation(id);
    setConversations(updatedList);
    
    // If deleting current, start new
    if (id === currentConversationId) {
      handleNewChat();
    }
  }, [currentConversationId, handleNewChat]);

  const handleCapture = async (imageData: string) => {
    setIsChatOpen(true);
    setIsProcessing(true);

    // If we are in an empty "fresh" state, that's fine.
    // If we are deep in a previous conversation, do we want a new chat?
    // Usually, snapping a photo means "Solve THIS".
    // I will append to current conversation for now, allowing multi-step context.
    // If the user wanted a fresh slate, they would hit "New Problem".

    const userMsgId = Date.now().toString();
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: Role.USER,
      text: "Can you help me solve this math problem?",
      image: imageData
    };
    
    const updatedHistory = [...messages, newUserMsg];
    setMessages(updatedHistory);

    const loadingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
        id: loadingId,
        role: Role.MODEL,
        text: "",
        isLoading: true
    }]);

    const responseText = await sendMessageToTutor(messages, newUserMsg.text, imageData);

    setMessages(prev => prev.map(msg => 
        msg.id === loadingId 
            ? { ...msg, text: responseText, isLoading: false }
            : msg
    ));
    
    setIsProcessing(false);
  };

  const handleTextMessage = async (text: string) => {
    setIsProcessing(true);
    
    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: Role.USER,
        text: text
    };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);

    const loadingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
        id: loadingId,
        role: Role.MODEL,
        text: "",
        isLoading: true
    }]);

    // Send history BEFORE this new text message was added to state, but service needs full context?
    // Wait, sendMessageToTutor takes `currentHistory` and `newMessageText`.
    // It appends the new text to the history internally for the API call.
    // So passing `messages` (which is the state BEFORE userMsg) is actually correct for the 'history' param of the service?
    // Let's check service: `const fullHistory = [...currentHistory, userMessage];`
    // Yes, passing `messages` (the previous state) works perfectly.

    const responseText = await sendMessageToTutor(messages, text);

    setMessages(prev => prev.map(msg => 
        msg.id === loadingId 
            ? { ...msg, text: responseText, isLoading: false }
            : msg
    ));

    setIsProcessing(false);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Background Camera Layer */}
      <div className="absolute inset-0 z-0">
        <CameraView onCapture={handleCapture} isProcessing={isProcessing} />
      </div>

      {/* Top Overlay UI */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 bg-gradient-to-b from-black/80 to-transparent pointer-events-none flex justify-between items-start">
        {/* Logo */}
        <div className="flex items-center gap-2 pointer-events-auto">
            <button 
                onClick={() => setIsHistoryOpen(true)}
                className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all active:scale-95 border border-white/10"
                aria-label="History"
            >
                <History size={20} />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-wider flex items-center gap-2 ml-2 shadow-sm">
               <span className="text-indigo-400 text-3xl">∑</span> MathLens
            </h1>
        </div>

        {/* Status Indicator */}
        {isProcessing && (
            <div className="flex items-center gap-2 bg-indigo-600/80 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg animate-in fade-in slide-in-from-top-4">
                <Loader2 className="animate-spin w-3 h-3" />
                <span>Thinking...</span>
            </div>
        )}
      </div>

      {/* History Sidebar */}
      <HistoryDrawer 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        conversations={conversations}
        currentId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onNewChat={handleNewChat}
      />

      {/* Instructions Overlay - Hidden when chat is open to avoid clutter */}
      {!isChatOpen && !isHistoryOpen && <InstructionsOverlay />}

      {/* Chat / Interaction Layer */}
      <ChatInterface 
        messages={messages} 
        onSendMessage={handleTextMessage} 
        isProcessing={isProcessing}
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
      />
    </div>
  );
};

export default App;
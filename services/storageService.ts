import { ChatMessage, ConversationMetadata, Role } from "../types";

const STORAGE_PREFIX = 'mathlens_';
const INDEX_KEY = `${STORAGE_PREFIX}index`;

/**
 * Manages local storage for chat history.
 * We separate the 'Index' (list of IDs and metadata) from the 'Data' (actual messages)
 * to prevent performance issues when listing history (avoiding loading all base64 images).
 */

export const storageService = {
  // Get list of all conversation metadata (for the sidebar)
  getConversationList: (): ConversationMetadata[] => {
    try {
      const indexJson = localStorage.getItem(INDEX_KEY);
      if (!indexJson) return [];
      const index = JSON.parse(indexJson) as ConversationMetadata[];
      // Sort by newest first
      return index.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      console.error("Failed to load conversation list", e);
      return [];
    }
  },

  // Load a specific conversation's messages
  loadConversation: (id: string): ChatMessage[] => {
    try {
      const dataJson = localStorage.getItem(`${STORAGE_PREFIX}data_${id}`);
      return dataJson ? JSON.parse(dataJson) : [];
    } catch (e) {
      console.error(`Failed to load conversation ${id}`, e);
      return [];
    }
  },

  // Save the current conversation
  saveConversation: (id: string, messages: ChatMessage[]) => {
    if (messages.length === 0) return;

    try {
      // 1. Save the messages content
      // Note: In a production app, we would compress images or use IndexedDB.
      // localStorage has a 5MB limit. If we hit it, we might need to trim history.
      try {
        localStorage.setItem(`${STORAGE_PREFIX}data_${id}`, JSON.stringify(messages));
      } catch (quotaError) {
        console.warn("Storage quota exceeded. Could not save full history.");
        // Optional: Implement logic to delete old chats here
        return; 
      }

      // 2. Generate Metadata
      // Find first user message for title
      const firstUserMsg = messages.find(m => m.role === Role.USER);
      let title = "New Calculation";
      let preview = "No messages yet";

      if (firstUserMsg) {
        // If it was just an image, say "Math Problem"
        if (firstUserMsg.text && firstUserMsg.text !== "Can you help me solve this math problem?") {
            title = firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '');
        } else if (firstUserMsg.image) {
            title = "Math Problem Snapshot";
        }
        preview = firstUserMsg.text || "Image";
      }

      const metadata: ConversationMetadata = {
        id,
        title,
        timestamp: Date.now(),
        preview
      };

      // 3. Update Index
      const currentIndex = storageService.getConversationList();
      const existingIndex = currentIndex.findIndex(c => c.id === id);
      
      let newIndex;
      if (existingIndex >= 0) {
        // Update existing entry
        newIndex = [...currentIndex];
        newIndex[existingIndex] = metadata;
      } else {
        // Add new entry
        newIndex = [metadata, ...currentIndex];
      }

      localStorage.setItem(INDEX_KEY, JSON.stringify(newIndex));

    } catch (e) {
      console.error("Failed to save conversation", e);
    }
  },

  // Delete a conversation
  deleteConversation: (id: string) => {
    try {
      // Remove data
      localStorage.removeItem(`${STORAGE_PREFIX}data_${id}`);

      // Remove from index
      const currentIndex = storageService.getConversationList();
      const newIndex = currentIndex.filter(c => c.id !== id);
      localStorage.setItem(INDEX_KEY, JSON.stringify(newIndex));
      
      return newIndex;
    } catch (e) {
      console.error("Failed to delete conversation", e);
      return [];
    }
  },

  // Create a new ID
  createId: () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
};
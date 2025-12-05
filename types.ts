export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  image?: string; // Base64 string
  isLoading?: boolean;
}

export interface MathSolution {
  steps: string[];
  finalAnswer: string;
}

export interface CameraState {
  hasPermission: boolean;
  stream: MediaStream | null;
  error: string | null;
}

export interface ConversationMetadata {
  id: string;
  title: string;
  timestamp: number;
  preview: string;
}
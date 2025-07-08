export interface Contact {
  id: string;
  displayName: string;
  photoURL?: string;
  isOnline?: boolean;
  agentHubId?: string;
  type?: 'direct' | 'group';
  lastMessageTimestamp?: number | { seconds: number; nanoseconds: number };
  isUnread?: boolean;
  pinned?: boolean;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: number | { seconds: number; nanoseconds: number };
  deletedForEveryone?: boolean;
  edited?: boolean;
  deletedFor?: string[];
  forwarded?: boolean;
  senderName?: string;
  senderPhotoURL?: string;
}

export interface ChatRequest {
    id: string;
    from: string;
    fromDisplayName: string;
    fromPhotoURL: string;
    fromAgentHubId: string;
    to: string;
    toDisplayName: string;
    toPhotoURL: string;
    toAgentHubId: string;
    status: 'pending' | 'accepted' | 'denied';
}

export interface BlockedUser {
    id: string;
    displayName: string;
} 
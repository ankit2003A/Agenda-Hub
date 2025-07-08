import React, { useRef, useEffect } from 'react';
import { CardContent } from "@/components/ui/card";
import { Message as MessageComponent } from './Message';
import { Message as MessageType, Contact } from './types';
import { useAuth } from '@/contexts/AuthContext';

interface ChatViewProps {
  messages: MessageType[];
  contacts: Contact[];
  onEditMessage: (message: MessageType) => void;
  onDeleteForMe: (message: MessageType) => void;
  onDeleteForEveryone: (message: MessageType) => void;
  onForwardMessage: (message: MessageType) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ messages = [], contacts = [], onEditMessage, onDeleteForMe, onDeleteForEveryone, onForwardMessage }) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="space-y-4">
      {(messages || []).filter(msg => !msg.deletedFor?.includes(user?.uid || '')).map((msg) => (
        <MessageComponent
          key={msg.id}
          message={msg}
          contacts={contacts}
          onEdit={onEditMessage}
          onDeleteForMe={onDeleteForMe}
          onDeleteForEveryone={onDeleteForEveryone}
          onForward={onForwardMessage}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}; 
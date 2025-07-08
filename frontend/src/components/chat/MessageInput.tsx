import React, { useState, forwardRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
}

export const MessageInput = forwardRef<HTMLInputElement, MessageInputProps>(
  ({ onSendMessage, disabled }, ref) => {
    const [newMessage, setNewMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim()) return;
      onSendMessage(newMessage);
      setNewMessage('');
    };

    return (
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 glass rounded-2xl px-4 py-2 shadow-lg">
          <input
            type="text"
            name="message"
            placeholder="Type a message..."
            className="flex-1 bg-transparent outline-none border-none text-white placeholder:text-white/60 px-2 py-2"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={disabled}
            autoComplete="off"
            ref={ref}
          />
          <Button type="submit" size="icon" className="rounded-full bg-green-500 hover:bg-green-600 text-white shadow-md" disabled={!newMessage.trim() || disabled}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    );
  }
); 
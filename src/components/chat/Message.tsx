import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, Share2 } from 'lucide-react';
import { Message as MessageType, Contact } from './types';
import { useAuth } from '@/contexts/AuthContext';

interface MessageProps {
  message: MessageType;
  contacts: Contact[];
  onEdit: (message: MessageType) => void;
  onDeleteForMe: (message: MessageType) => void;
  onDeleteForEveryone: (message: MessageType) => void;
  onForward: (message: MessageType) => void;
}

export const Message: React.FC<MessageProps> = ({ message, contacts, onEdit, onDeleteForMe, onDeleteForEveryone, onForward }) => {
  const { user } = useAuth();

  if (!user) return null;

  const isSender = message.senderId === user.uid;

  if (message.deletedFor?.includes(user.uid)) {
    return null;
  }

  // Improved avatar logic
  let avatarUrl: string | undefined;
  let displayName: string;

  if (isSender) {
    avatarUrl = user.photoURL || undefined;
    displayName = user.displayName || 'Me';
  } else {
    const sender = contacts.find(c => c.id === message.senderId);
    avatarUrl = sender?.photoURL || message.senderPhotoURL || undefined;
    displayName = sender?.displayName || message.senderName || 'User';
  }

  return (
    <div className="w-full flex">
      <div className={`group flex items-end gap-2 ${isSender ? 'ml-auto' : ''}`}>
        {!isSender && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{displayName[0]}</AvatarFallback>
          </Avatar>
        )}
        <div className={`rounded-2xl px-4 py-2 max-w-xs lg:max-w-md break-words relative glass shadow-md ${isSender ? 'ml-auto bg-white/20 text-white' : 'bg-white/10 text-white'}`}>
          {!message.deletedForEveryone && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className='h-4 w-4'/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onForward(message)}>
                  <Share2 className='h-4 w-4 mr-2' />Forward
                </DropdownMenuItem>
                {isSender && (
                  <>
                    <DropdownMenuItem onClick={() => onEdit(message)}>
                      <Edit className='h-4 w-4 mr-2'/>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDeleteForMe(message)} className="text-amber-600">
                      <Trash2 className='h-4 w-4 mr-2' />Delete for Me
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDeleteForEveryone(message)} className="text-red-600">
                      <Trash2 className='h-4 w-4 mr-2' />Delete for Everyone
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {message.deletedForEveryone ? (
            <span className='italic'>This message was deleted</span>
          ) : (
            <>
              {message.forwarded && <div className="text-xs font-bold opacity-70 mb-1">Forwarded</div>}
              {message.text}
            </>
          )}
          {message.edited && <span className="text-xs text-muted-foreground/70 ml-2">(edited)</span>}
        </div>
        {isSender && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{displayName[0]}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}; 
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Ban, UserMinus, Users } from 'lucide-react';
import { Contact, BlockedUser } from './types';

interface ChatHeaderProps {
  selectedChat: Contact;
  blockedUsers: BlockedUser[];
  isBlockedByOther: boolean;
  onBlockUser: () => void;
  onDeleteContact: () => void;
  onClearChat: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  selectedChat,
  blockedUsers,
  isBlockedByOther,
  onBlockUser,
  onDeleteContact,
  onClearChat,
}) => {
  const isBlockedByMe = (blockedUsers || []).some(bu => bu.id === selectedChat.id);

  return (
    <CardHeader className="flex flex-row items-center justify-between border-b">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={selectedChat.photoURL || undefined} alt={selectedChat.displayName} />
          <AvatarFallback>{selectedChat.type === 'group' ? <Users/> : selectedChat.displayName[0]}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle>{selectedChat.displayName}</CardTitle>
          <CardDescription>
            {selectedChat.type === 'group'
                ? 'Group Chat'
                : (isBlockedByMe ? "You've blocked this user" : (isBlockedByOther ? "You are blocked" : "Online"))
            }
          </CardDescription>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {selectedChat.type !== 'group' && (
            <DropdownMenuItem onClick={onBlockUser}>
              <Ban className="mr-2 h-4 w-4" />
              {isBlockedByMe ? 'Unblock User' : 'Block User'}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onClearChat} className="text-red-500">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M9 6v12a2 2 0 002 2h2a2 2 0 002-2V6m-6 0V4a2 2 0 012-2h2a2 2 0 012 2v2" /></svg>
            Clear Chat
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDeleteContact} className="text-red-500">
            <UserMinus className="mr-2 h-4 w-4" />
            {selectedChat.type === 'group' ? 'Leave Group' : 'Delete Contact'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardHeader>
  );
}; 
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, UserPlus, Mail, Check, X } from 'lucide-react';
import { Contact, ChatRequest } from './types';

interface ContactListProps {
  contacts: Contact[];
  incomingRequests: ChatRequest[];
  selectedChat: Contact | null;
  onSelectChat: (contact: Contact) => void;
  onSendRequest: (id: string) => Promise<void>;
  onAcceptRequest: (request: ChatRequest) => void;
  onDenyRequest: (requestId: string) => void;
  onCreateGroup: () => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts = [],
  incomingRequests = [],
  selectedChat,
  onSelectChat,
  onSendRequest,
  onAcceptRequest,
  onDenyRequest,
  onCreateGroup,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [addId, setAddId] = useState('');
  const [addError, setAddError] = useState('');

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await onSendRequest(addId);
        setAddId('');
        setAddError('');
    } catch(err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setAddError(errorMessage);
    }
  };
  
  const filteredContacts = (contacts || []).filter(c => 
      c.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="p-4 border-b space-y-4">
        <div className="flex justify-between items-center">
          <CardTitle>Contacts</CardTitle>
          <Button variant="outline" size="icon" onClick={onCreateGroup} title="Create Group">
            <Users className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleSendRequest} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              placeholder="Agent Hub ID..."
              value={addId}
              onChange={e => setAddId(e.target.value)}
              className="text-xs font-mono"
            />
            <Button type="submit" size="icon" variant="outline" title="Send Request">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
          {addError && <span className="text-xs text-red-500">{addError}</span>}
        </form>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      {((incomingRequests || []).length > 0) && (
        <div className="p-4 border-b">
          <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
            <Mail className="h-4 w-4" /> Incoming Requests
          </h3>
          <div className="space-y-2">
            {(incomingRequests || []).map(req => (
              <div key={req.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                <span>{req.fromDisplayName || 'A user'}</span>
                <div className="flex gap-2">
                  <Button onClick={() => onAcceptRequest(req)} size="icon" variant="ghost" className="h-7 w-7">
                    <Check className="h-4 w-4 text-green-500" />
                  </Button>
                  <Button onClick={() => onDenyRequest(req.id)} size="icon" variant="ghost" className="h-7 w-7">
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <CardContent className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          {(filteredContacts || []).map((contact) => (
            <div
              key={contact.id}
              className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-150 border border-transparent ${
                selectedChat?.id === contact.id ? 'bg-primary/10 border-primary shadow-md' : 'hover:bg-muted/70'
              }`}
              onClick={() => onSelectChat(contact)}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={contact.photoURL || undefined} alt={contact.displayName} />
                <AvatarFallback>{contact.type === 'group' ? <Users /> : (contact.displayName?.[0] || 'U')}</AvatarFallback>
              </Avatar>
              <div className='flex-grow truncate'>
                <div className="font-semibold flex items-center gap-2">
                  {contact.displayName}
                  {contact.isUnread && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                </div>
                <div className="text-xs text-muted-foreground">
                  {contact.type === 'group' ? 'Group Chat' : contact.agentHubId}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Search, Send, MessageSquare, UserPlus, Mail, Check, X, Users, MoreVertical, Edit, Trash2, Share2, Ban, UserMinus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import {
  collection, query, where, getDocs, doc, setDoc,
  onSnapshot, addDoc, serverTimestamp, orderBy, deleteDoc, updateDoc, writeBatch, increment, getDoc, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { toast } from 'sonner';
import { CreateGroupDialog } from '@/components/CreateGroupDialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Contact, Message, ChatRequest, BlockedUser } from '@/components/chat/types';
import { ContactList } from '@/components/chat/ContactList';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatView } from '@/components/chat/ChatView';
import { MessageInput } from '@/components/chat/MessageInput';
import { sendZoomLinkToChat } from '@/lib/zoomUtils';

export default function ChatPage() {
  const { user, getAgentHubId } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedChat, setSelectedChat] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isBlockedByOther, setIsBlockedByOther] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState<ChatRequest[]>([]);
  const [addId, setAddId] = useState('');
  const [addError, setAddError] = useState('');
  const [isCreateGroupOpen, setCreateGroupOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  interface ChatMetadata {
    lastMessageTimestamp?: { seconds: number; nanoseconds: number };
    unreadCount?: { [key: string]: number };
  }
  
  const [chatMetadata, setChatMetadata] = useState<{ [key: string]: ChatMetadata }>({});
  
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editText, setEditText] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);

  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [forwardSearch, setForwardSearch] = useState("");

  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearing, setClearing] = useState(false);

  const messageInputRef = useRef<HTMLInputElement | null>(null);

  const sortedContacts = useMemo(() => {
    if (!user) return [];
    return (contacts || [])
      .map(contact => {
        const chatId = contact.type === 'group' ? contact.id : [user.uid, contact.id].sort().join('_');
        const metadata = chatMetadata[chatId] || {};
        return {
          ...contact,
          lastMessageTimestamp: metadata.lastMessageTimestamp,
          isUnread: (metadata.unreadCount || 0) > 0,
        };
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        const a_ts = a.lastMessageTimestamp?.seconds || 0;
        const b_ts = b.lastMessageTimestamp?.seconds || 0;
        return b_ts - a_ts;
      });
  }, [contacts, chatMetadata, user]);

  const filteredForwardContacts = useMemo(() => {
    if (!forwardSearch.trim()) return contacts || [];
    const search = forwardSearch.trim().toLowerCase();
    return (contacts || []).filter(contact =>
      contact.displayName.toLowerCase().includes(search) ||
      (contact.agentHubId && contact.agentHubId.toLowerCase().includes(search))
    );
  }, [contacts, forwardSearch]);

  const isAllRecipientsSelected = useMemo(() => {
      const filteredIds = filteredForwardContacts.map(c => c.id);
      return filteredIds.length > 0 && filteredIds.every(id => selectedRecipients.includes(id));
  }, [filteredForwardContacts, selectedRecipients]);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, `users/${user.uid}/contacts`);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contactList = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Contact)
      );
      setContacts(contactList);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newChatMetadata: { [key: string]: ChatMetadata } = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        newChatMetadata[doc.id] = {
          lastMessageTimestamp: data.lastMessage?.timestamp,
          unreadCount: data.unreadCount?.[user.uid] || 0
        };
      });
      setChatMetadata(newChatMetadata);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
      if (!user) return;
      const q = query(collection(db, "chatRequests"), where("to", "==", user.uid), where("status", "==", "pending"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
          const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatRequest));
          setIncomingRequests(requestsData);
      });
      return () => unsubscribe();
  }, [user]);

   useEffect(() => {
       if (!user) return;
       const q = query(collection(db, "chatRequests"), where("from", "==", user.uid), where("status", "==", "accepted"));
       const unsubscribe = onSnapshot(q, (snapshot) => {
           snapshot.docs.forEach(async (requestDoc) => {
               const request = requestDoc.data() as ChatRequest;
               const newContactData = {
                   id: request.to,
                   displayName: request.toDisplayName,
                   photoURL: request.toPhotoURL,
                   agentHubId: request.toAgentHubId,
                   type: 'direct' as const,
               };
               await setDoc(doc(db, `users/${user.uid}/contacts`, request.to), newContactData);
               await deleteDoc(doc(db, "chatRequests", requestDoc.id));
           });
       });
       return () => unsubscribe();
   }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      const blockedIds = doc.data()?.blockedUsers || [];
      setBlockedUsers(blockedIds.map((id: string) => ({ id, displayName: 'Blocked User' })));

      if (selectedChat && selectedChat.type !== 'group') {
        setIsBlockedByOther(blockedIds.includes(selectedChat.id));
      }
    });
    return unsubscribe;
  }, [user, selectedChat]);

  useEffect(() => {
    const checkBlockedBy = async () => {
      if (!user || !selectedChat || selectedChat.type === 'group') {
        setIsBlockedByOther(false);
        return;
      }
      const otherUserDoc = await getDoc(doc(db, 'users', selectedChat.id));
      const blockedIds = otherUserDoc.data()?.blockedUsers || [];
      setIsBlockedByOther(blockedIds.includes(user.uid));
    };
    checkBlockedBy();
  }, [user, selectedChat]);

  useEffect(() => {
    if (!user || !selectedChat) {
      setMessages([]);
      return;
    }
    
    const chatId = selectedChat.type === 'group' ? selectedChat.id : [user.uid, selectedChat.id].sort().join('_');
    const messagesCol = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesCol, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Message))
        .filter(msg => !msg.deletedFor || !msg.deletedFor.includes(user.uid));
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [user, selectedChat]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectChat = async (chat: Contact) => {
    setSelectedChat(chat);
    if (!user) return;

    const chatId = chat.type === 'group' ? chat.id : [user.uid, chat.id].sort().join('_');
    const chatDocRef = doc(db, 'chats', chatId);

    try {
        await updateDoc(chatDocRef, {
            [`unreadCount.${user.uid}`]: 0
        });
    } catch (error) {
        // Can fail if chat doc doesn't exist yet, safe to ignore.
    }
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || !user || !selectedChat) return;

    const isBlockedByMe = (blockedUsers || []).some(bu => bu.id === selectedChat.id);
    if(isBlockedByMe) {
        toast.error("You have blocked this user.");
        return;
    }
    if(isBlockedByOther) {
        toast.error("You have been blocked by this user.");
        return;
    }

    const chatId = selectedChat.type === 'group' ? selectedChat.id : [user.uid, selectedChat.id].sort().join('_');
    
    if (selectedChat.type !== 'group') {
        const chatDocRef = doc(db, 'chats', chatId);
        const chatDocSnap = await getDoc(chatDocRef);
        if (!chatDocSnap.exists()) {
            await setDoc(chatDocRef, {
                participants: [user.uid, selectedChat.id],
                type: 'direct',
            });
        }
    }
    
    const messagesCol = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesCol, {
      text: messageText,
      senderId: user.uid,
      senderName: user.displayName,
      senderPhotoURL: user.photoURL,
      timestamp: serverTimestamp(),
    });

    const chatRef = doc(db, 'chats', chatId);
    const chatDoc = await getDoc(chatRef);
    if(chatDoc.exists()) {
        const participants = chatDoc.data().participants || [];
        const unreadUpdates: { [key: string]: ReturnType<typeof increment> } = {};
        participants.forEach((pId: string) => {
            if(pId !== user.uid) {
                unreadUpdates[`unreadCount.${pId}`] = increment(1);
            }
        });
        await updateDoc(chatRef, {
            lastMessage: { text: messageText, timestamp: serverTimestamp() },
            ...unreadUpdates,
        });
    }
  };

  const handleCreateGroup = async (groupName: string, memberIds: string[]) => {
      if (!user) return;
      const participants = [user.uid, ...memberIds];
      
      try {
          const groupChatRef = await addDoc(collection(db, 'chats'), {
              groupName,
              participants,
              createdBy: user.uid,
              createdAt: serverTimestamp(),
              type: 'group',
              unreadCount: participants.reduce((acc, pId) => ({...acc, [pId]: 0}), {}),
          });
          
          const batch = writeBatch(db);
          const groupContact: Contact = {
              id: groupChatRef.id,
              displayName: groupName,
              type: 'group',
              photoURL: '', // or a default group avatar
          };

          participants.forEach(participantId => {
              const contactRef = doc(db, `users/${participantId}/contacts`, groupChatRef.id);
              batch.set(contactRef, groupContact);
          });

          await batch.commit();

          toast.success(`Group "${groupName}" created!`);
          setCreateGroupOpen(false);
          setSelectedChat(groupContact);

      } catch (error) {
          console.error("Error creating group: ", error);
          toast.error("Failed to create group.");
      }
  };

  const handleSendRequest = async (addId: string) => {
    if (!user) {
        throw new Error("You must be logged in.");
    }
    if (!addId.startsWith("AGENDA-")) {
        throw new Error("Invalid ID format.");
    }
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("agentHubId", "==", addId));
    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            throw new Error("User not found.");
        }
        const foundUser = querySnapshot.docs[0].data();
        if (foundUser.uid === user.uid) {
            throw new Error("You can't add yourself.");
        }
        await addDoc(collection(db, "chatRequests"), {
            from: user.uid,
            fromDisplayName: user.displayName || 'A User',
            fromPhotoURL: user.photoURL || '',
            fromAgentHubId: getAgentHubId(user.uid),
            to: foundUser.uid,
            toDisplayName: foundUser.displayName,
            toPhotoURL: foundUser.photoURL,
            toAgentHubId: foundUser.agentHubId,
            status: "pending"
        });
        toast.success("Chat request sent!");
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to send request.";
        toast.error(errorMessage);
        throw error;
    }
  };
    
  const handleAcceptRequest = async (request: ChatRequest) => {
    if (!user) return;
    await setDoc(doc(db, `users/${user.uid}/contacts`, request.from), {
        displayName: request.fromDisplayName,
        photoURL: request.fromPhotoURL,
        agentHubId: request.fromAgentHubId,
        type: 'direct',
    });
    await updateDoc(doc(db, "chatRequests", request.id), { status: "accepted" });
    toast.success("Request accepted!");
  };

  const handleDenyRequest = async (requestId: string) => {
      await deleteDoc(doc(db, "chatRequests", requestId));
      toast.error("Request denied.");
  };

  const getChatId = () => {
    if(!user || !selectedChat) return null;
    return selectedChat.type === 'group' ? selectedChat.id : [user.uid, selectedChat.id].sort().join('_');
  }

  const handleEditMessage = (msg: Message) => {
    setEditingMessage(msg);
    setEditText(msg.text);
    setShowEditDialog(true);
  };
  
  const handleSaveEdit = async () => {
    const chatId = getChatId();
    if (!chatId || !editingMessage) return;
    const msgRef = doc(db, 'chats', chatId, 'messages', editingMessage.id);
    await updateDoc(msgRef, {
        text: editText,
        edited: true,
    });
    toast.success("Message updated");
    setShowEditDialog(false);
    setEditingMessage(null);
  };

  const handleDeleteForMe = async (msg: Message) => {
    const chatId = getChatId();
    if (!chatId || !user) return;
    const msgRef = doc(db, 'chats', chatId, 'messages', msg.id);
    await updateDoc(msgRef, {
        deletedFor: arrayUnion(user.uid)
    });
    toast.success("Message deleted for you");
  };

  const handleDeleteForEveryone = async (msg: Message) => {
    const chatId = getChatId();
    if (!chatId) return;
    const msgRef = doc(db, 'chats', chatId, 'messages', msg.id);
    await updateDoc(msgRef, {
        text: "This message was deleted",
        deletedForEveryone: true
    });
    toast.success("Message deleted for everyone.");
  };

  const handleForwardMessage = (msg: Message) => {
      setForwardMessage(msg);
      setShowForwardDialog(true);
  };
  
  const handleSendForward = async () => {
    if (!forwardMessage || !user || selectedRecipients.length === 0) return;
    
    for (const recipientId of selectedRecipients) {
        const contact = contacts.find(c => c.id === recipientId);
        if (!contact) continue;
        
        const fwdChatId = contact.type === 'group' ? contact.id : [user.uid, recipientId].sort().join('_');
        
        if (contact.type !== 'group') {
            const chatDocRef = doc(db, 'chats', fwdChatId);
            const chatDocSnap = await getDoc(chatDocRef);
            if (!chatDocSnap.exists()) {
                await setDoc(chatDocRef, { participants: [user.uid, recipientId], type: 'direct' });
            }
        }

        const messagesCol = collection(db, 'chats', fwdChatId, 'messages');
        await addDoc(messagesCol, {
            ...forwardMessage,
            timestamp: serverTimestamp(),
            forwarded: true,
            senderId: user.uid, 
            senderName: user.displayName,
            senderPhotoURL: user.photoURL,
        });
    }

    toast.success(`Message forwarded to ${selectedRecipients.length} chat(s)`);
    setShowForwardDialog(false);
    setForwardMessage(null);
    setSelectedRecipients([]);
    setForwardSearch('');
  };
  
  const handleToggleRecipient = (id: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };
  
  const handleToggleAllRecipients = () => {
    if (isAllRecipientsSelected) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(filteredForwardContacts.map(c => c.id));
    }
  };
  
  const handleDeleteContact = async () => {
      if(!user || !selectedChat) return;
      await deleteDoc(doc(db, `users/${user.uid}/contacts`, selectedChat.id));
      toast.success("Contact deleted");
      setSelectedChat(null);
  }

  const handleClearChat = async () => {
    const chatId = getChatId();
    if (!chatId || !user) return;
    setClearing(true);
    try {
      // Get all messages in this chat
      const messagesCol = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesCol);
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.forEach(docSnap => {
        batch.update(docSnap.ref, { deletedFor: arrayUnion(user.uid) });
      });
      await batch.commit();
      setMessages([]); // Immediately clear UI
      toast.success('All chat messages cleared for you.');
    } catch (err) {
      console.error('Failed to clear chat:', err);
      toast.error('Failed to clear chat.');
    } finally {
      setShowClearDialog(false);
      setClearing(false);
      setTimeout(() => {
        window.location.reload();
      }, 300);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex w-full max-w-6xl h-[80vh] items-stretch gap-6 px-4">
        {/* Contacts Panel */}
        <div className="w-1/3 min-w-[260px] max-w-sm h-full glass rounded-3xl p-0 flex flex-col shadow-xl border border-white/20">
          <ContactList
            contacts={contacts}
            incomingRequests={incomingRequests}
            selectedChat={selectedChat}
            onSelectChat={handleSelectChat}
            onSendRequest={handleSendRequest}
            onAcceptRequest={handleAcceptRequest}
            onDenyRequest={handleDenyRequest}
            onCreateGroup={() => setCreateGroupOpen(true)}
          />
        </div>
        {/* Chat Area */}
        <div className="flex-1 h-full glass rounded-3xl flex flex-col shadow-xl border border-white/20">
          {contacts.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="glass rounded-2xl p-10 flex flex-col items-center shadow-xl">
                <h2 className="text-2xl font-bold mb-2">Welcome to Chat!</h2>
                <p className="mb-4 text-center text-white/80">You have no contacts yet. Add a contact or create a group to start chatting.</p>
                <div className="flex gap-4">
                  <button className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-lg shadow" onClick={() => setCreateGroupOpen(true)}>Create Group</button>
                </div>
              </div>
            </div>
          ) : selectedChat ? (
            <>
              <ChatHeader 
                selectedChat={selectedChat}
                blockedUsers={blockedUsers}
                isBlockedByOther={isBlockedByOther}
                onBlockUser={() => {}}
                onDeleteContact={handleDeleteContact} 
                onClearChat={() => setShowClearDialog(true)}
              />
              <div className="flex-1 overflow-y-auto px-10 py-8 flex flex-col gap-4">
                <ChatView
                  messages={messages}
                  contacts={contacts}
                  onEditMessage={handleEditMessage}
                  onDeleteForMe={handleDeleteForMe}
                  onDeleteForEveryone={handleDeleteForEveryone}
                  onForwardMessage={handleForwardMessage}
                />
              </div>
              <div className="px-10 pb-8 pt-2 bg-transparent">
                <MessageInput ref={messageInputRef} onSendMessage={handleSendMessage} disabled={isBlockedByOther} />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-2xl text-white/70">Select a chat to start messaging</div>
          )}
        </div>
      </div>
      <CreateGroupDialog 
        open={isCreateGroupOpen} 
        onOpenChange={setCreateGroupOpen} 
        contacts={contacts}
        onCreateGroup={handleCreateGroup}
      />
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="glass">
              <DialogHeader><DialogTitle>Edit Message</DialogTitle></DialogHeader>
              <Input value={editText} onChange={e => setEditText(e.target.value)} />
              <DialogFooter>
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                  <Button onClick={handleSaveEdit}>Save</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      <Dialog open={showForwardDialog} onOpenChange={setShowForwardDialog}>
          <DialogContent className="glass">
              <DialogHeader><DialogTitle>Forward Message</DialogTitle></DialogHeader>
              <Input placeholder="Search contacts..." value={forwardSearch} onChange={(e) => setForwardSearch(e.target.value)} className='mb-2' />
              <label className='flex items-center gap-2 cursor-pointer'><Checkbox checked={isAllRecipientsSelected} onCheckedChange={handleToggleAllRecipients} /> Select All</label>
              <div className='max-h-60 overflow-y-auto space-y-2 my-4'>
                  {filteredForwardContacts.map(contact => (
                      <label key={contact.id} className='flex items-center gap-2 cursor-pointer'>
                          <Checkbox checked={selectedRecipients.includes(contact.id)} onCheckedChange={() => handleToggleRecipient(contact.id)} />
                          {contact.displayName}
                      </label>
                  ))}
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setShowForwardDialog(false)}>Cancel</Button>
                  <Button onClick={handleSendForward} disabled={selectedRecipients.length === 0}>Send</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>Clear Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all chats? <b>Note:</b> Once cleared, they cannot be retrieved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)} disabled={clearing}>Cancel</Button>
            <Button variant="destructive" onClick={handleClearChat} disabled={clearing}>
              {clearing ? 'Clearing...' : 'Clear All'}
            </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
} 
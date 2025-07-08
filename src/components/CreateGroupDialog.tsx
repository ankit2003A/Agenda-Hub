import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Contact {
  id: string;
  displayName: string;
  photoURL?: string;
  agentHubId?: string;
}

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
  onCreateGroup: (groupName: string, memberIds: string[]) => void;
}

export function CreateGroupDialog({ open, onOpenChange, contacts, onCreateGroup }: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const handleToggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const filteredContacts = (contacts || []).filter(contact => 
    contact.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = () => {
    if (groupName.trim() && selectedMembers.length > 0) {
      onCreateGroup(groupName.trim(), selectedMembers);
      onOpenChange(false);
      setGroupName("");
      setSelectedMembers([]);
      setSearchTerm("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Group</DialogTitle>
          <DialogDescription>
            Select members to create a group chat.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <Input
                placeholder="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
            />
            <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredContacts.map(contact => (
                <label key={contact.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer">
                    <Checkbox
                        checked={selectedMembers.includes(contact.id)}
                        onCheckedChange={() => handleToggleMember(contact.id)}
                    />
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={contact.photoURL} alt={contact.displayName} />
                        <AvatarFallback>{contact.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <span>{contact.displayName}</span>
                </label>
                ))}
            </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!groupName.trim() || selectedMembers.length === 0}>
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
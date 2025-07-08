import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface MeetingData {
  title: string;
  platform: string;
  time: string;
  participants: string;
  agenda: string;
  recurrence: string;
  date: Date;
  scheduledAt: string;
  zoomJoinUrl?: string;
}

interface ScheduleNewMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMeetingScheduled?: (meetingData: MeetingData) => void;
}

export function ScheduleNewMeetingModal({ open, onOpenChange, onMeetingScheduled }: ScheduleNewMeetingModalProps) {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [formData, setFormData] = useState({
    title: '',
    platform: '',
    time: '',
    participants: '',
    agenda: '',
    recurrence: 'none'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Meeting title is required');
      return;
    }
    
    if (!formData.platform) {
      toast.error('Please select a platform');
      return;
    }
    
    if (!date) {
      toast.error('Please select a date');
      return;
    }
    
    if (!formData.time) {
      toast.error('Please select a time');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let zoomJoinUrl = '';
      if (formData.platform === 'zoom') {
        // Call backend to create Zoom meeting
        const res = await fetch('https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/zoom-create-meeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.uid,
            topic: formData.title,
            start_time: date?.toISOString(),
            duration: 30 // or from form
          })
        });
        if (res.ok) {
          const data = await res.json();
          zoomJoinUrl = data.join_url;
        } else {
          toast.error('Failed to create Zoom meeting.');
          setIsSubmitting(false);
          return;
        }
      }
      const meetingData = {
        ...formData,
        date: date,
        scheduledAt: new Date().toISOString(),
        zoomJoinUrl: zoomJoinUrl || undefined
      };
      
      // Here you would typically save to your database
      console.log('Scheduling meeting:', meetingData);
      
      // Call the callback if provided
      if (onMeetingScheduled) {
        onMeetingScheduled(meetingData);
      }
      
      toast.success('Meeting scheduled successfully!');
      
      // Reset form and date only after submit
      setFormData({
        title: '',
        platform: '',
        time: '',
        participants: '',
        agenda: '',
        recurrence: 'none'
      });
      setDate(new Date());
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      toast.error('Failed to schedule meeting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      platform: '',
      time: '',
      participants: '',
      agenda: '',
      recurrence: 'none'
    });
    setDate(new Date());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Schedule New Meeting</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Meeting Title *</Label>
              <Input 
                id="title" 
                placeholder="Enter meeting title" 
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                  <Label htmlFor="platform">Platform *</Label>
                  <Select value={formData.platform} onValueChange={(value) => handleInputChange('platform', value)}>
                      <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="zoom">Zoom</SelectItem>
                          <SelectItem value="google-meet">Google Meet</SelectItem>
                          <SelectItem value="teams">Microsoft Teams</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date ? date.toISOString().split('T')[0] : ''}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setDate(e.target.value ? new Date(e.target.value) : undefined)}
                    required
                  />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Time *</Label>
              <Input 
                id="time" 
                type="time" 
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="participants">Participants</Label>
              <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="participants" 
                    placeholder="Enter email addresses separated by commas" 
                    className="pl-10"
                    value={formData.participants}
                    onChange={(e) => handleInputChange('participants', e.target.value)}
                  />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agenda">Agenda</Label>
              <Textarea 
                id="agenda" 
                placeholder="Meeting agenda or description"
                value={formData.agenda}
                onChange={(e) => handleInputChange('agenda', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
                  <Label htmlFor="recurrence">Recurrence</Label>
                  <Select value={formData.recurrence} onValueChange={(value) => handleInputChange('recurrence', value)}>
                      <SelectTrigger>
                          <SelectValue placeholder="No recurrence" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="none">No recurrence</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Scheduling...' : 'Schedule Meeting'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Calendar as CalendarIcon, Clock, Users, Video } from "lucide-react";
import React, { useState, useEffect } from "react";
import { ScheduleNewMeetingModal } from "@/components/ScheduleNewMeetingModal";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { format, isToday, isSameDay, parseISO } from "date-fns";
import { sendZoomLinkToChat } from '@/lib/zoomUtils';

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  platform: string;
  participants: string[];
  agenda?: string;
  zoomJoinUrl?: string;
}

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

const mockMeetings: Meeting[] = [
    { 
      id: '1',
      time: '10:00 AM', 
      title: 'Daily Standup', 
      duration: '15 min',
      date: new Date().toISOString(),
      platform: 'Zoom',
      participants: ['team@example.com']
    },
    { 
      id: '2',
      time: '11:00 AM', 
      title: 'Design Review', 
      duration: '1 hour',
      date: new Date().toISOString(),
      platform: 'Google Meet',
      participants: ['design@example.com', 'dev@example.com']
    },
    { 
      id: '3',
      time: '2:00 PM', 
      title: 'Client Call - Project Phoenix', 
      duration: '45 min',
      date: new Date().toISOString(),
      platform: 'Teams',
      participants: ['client@example.com']
    },
];

export default function CalendarPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings);
    const { user } = useAuth();

    const getMeetingsForDate = (date: Date) => {
        return meetings.filter(meeting => 
            isSameDay(parseISO(meeting.date), date)
        );
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    const handleMeetingScheduled = (meetingData: MeetingData) => {
        const newMeeting: Meeting = {
            id: Date.now().toString(),
            title: meetingData.title,
            date: meetingData.date.toISOString(),
            time: meetingData.time,
            duration: '30 min', // Default duration
            platform: meetingData.platform,
            participants: meetingData.participants ? meetingData.participants.split(',').map((p: string) => p.trim()) : [],
            agenda: meetingData.agenda,
            zoomJoinUrl: meetingData.zoomJoinUrl // Save the Zoom link if present
        };
        setMeetings(prev => [...prev, newMeeting]);
        // Send Zoom link to chat if present
        if (meetingData.zoomJoinUrl && newMeeting.participants.length > 0 && user?.uid) {
          sendZoomLinkToChat(newMeeting.participants, meetingData.zoomJoinUrl, meetingData.title, user.uid);
        }
    };

    const todayMeetings = getMeetingsForDate(new Date());

    return (
        <div className="space-y-6">
            <ScheduleNewMeetingModal 
                open={isModalOpen} 
                onOpenChange={setIsModalOpen}
                onMeetingScheduled={handleMeetingScheduled}
            />
            
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Calendar</h1>
                    <p className="text-muted-foreground">
                        {getGreeting()}{user?.displayName && `, ${user.displayName}`}! Here's your schedule.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Meeting
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Calendar View */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            Calendar View
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Calendar component removed. Using native date input instead */}
                    </CardContent>
                </Card>

                {/* Selected Date Meetings */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle>
                            {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
                        </CardTitle>
                        <CardContent className="p-0">
                            {selectedDate && getMeetingsForDate(selectedDate).length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No meetings scheduled for this date</p>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="mt-2"
                                        onClick={() => setIsModalOpen(true)}
                                    >
                                        Schedule a meeting
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selectedDate && getMeetingsForDate(selectedDate).map((meeting) => (
                                        <div key={meeting.id} className="flex items-center justify-between p-3 rounded-lg border">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-full bg-primary/10">
                                                    <Video className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium">{meeting.title}</h4>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{meeting.time} • {meeting.duration}</span>
                                                    </div>
                                                    {meeting.zoomJoinUrl && (
                                                        <Button
                                                            asChild
                                                            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                                                            size="sm"
                                                        >
                                                            <a href={meeting.zoomJoinUrl} target="_blank" rel="noopener noreferrer">
                                                                Join Zoom Meeting
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary">{meeting.platform}</Badge>
                                                {meeting.participants.length > 0 && (
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <Users className="h-3 w-3" />
                                                        <span>{meeting.participants.length}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </CardHeader>
                </Card>
            </div>

            {/* Today's Agenda */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Today's Agenda</CardTitle>
                </CardHeader>
                <CardContent>
                    {todayMeetings.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No meetings scheduled for today</p>
                            <Button 
                                variant="outline" 
                                className="mt-2"
                                onClick={() => setIsModalOpen(true)}
                            >
                                Schedule your first meeting
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {todayMeetings.map((meeting, index) => (
                                <div key={meeting.id} className="grid grid-cols-[100px_1fr_100px] items-center gap-4 p-3 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50">
                                    <div className="font-medium text-gray-900 dark:text-gray-50">{meeting.time}</div>
                                    <div>
                                        <div className="font-semibold">{meeting.title}</div>
                                        <div className="text-sm text-muted-foreground">{meeting.platform}</div>
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 text-right">{meeting.duration}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
} 
import { useState, useEffect } from 'react';
import axios from 'axios';

interface Meeting {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  participants: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function MeetingList() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/meetings');
      setMeetings(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:3001/api/meetings/${id}`);
      setMeetings(meetings.filter(meeting => meeting.id !== id));
    } catch (error) {
      console.error('Error deleting meeting:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {meetings.map((meeting) => (
        <div
          key={meeting.id}
          className="border rounded-lg p-4 hover:bg-gray-50"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{meeting.title}</h3>
              <p className="text-gray-600 mt-1">{meeting.description}</p>
              <div className="mt-2">
                <span className="text-sm text-gray-500">
                  {new Date(meeting.startTime).toLocaleString()} - {new Date(meeting.endTime).toLocaleString()}
                </span>
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-500">Participants: {meeting.participants.join(', ')}</span>
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-500">Created by: {meeting.createdBy}</span>
              </div>
            </div>
            <button
              onClick={() => handleDelete(meeting.id)}
              className="ml-4 bg-red-500 text-white px-2 py-1 rounded-md text-sm hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

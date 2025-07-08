import { useState } from 'react';
import MeetingForm from './components/MeetingForm';
import MeetingList from './components/MeetingList';
import axios from 'axios';

function App() {
  const [showForm, setShowForm] = useState(false);

  const handleCreateMeeting = async (meeting: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    participants: string[];
  }) => {
    try {
      await axios.post('http://localhost:3001/api/meetings', {
        ...meeting,
        createdBy: 'user@example.com' // In a real app, this would come from auth
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating meeting:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Agenda Hub</h1>
        
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            {showForm ? 'Close Form' : 'Create New Meeting'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <MeetingForm onSubmit={handleCreateMeeting} />
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Meetings</h2>
          <MeetingList />
        </div>
      </div>
    </div>
  );
}

export default App;

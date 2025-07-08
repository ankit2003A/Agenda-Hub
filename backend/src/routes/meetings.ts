import express from 'express';
import { db } from '../firebase';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all meetings
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('meetings').get();
    const meetings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Get a single meeting
router.get('/:id', async (req, res) => {
  try {
    const docRef = db.collection('meetings').doc(req.params.id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    res.json({ id: docSnap.id, ...docSnap.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meeting' });
  }
});

// Create a new meeting
router.post('/', async (req, res) => {
  try {
    const meetingData = req.body;
    meetingData.createdAt = new Date();
    meetingData.updatedAt = new Date();
    const docRef = await db.collection('meetings').add(meetingData);
    const newMeeting = await docRef.get();
    res.status(201).json({ id: docRef.id, ...newMeeting.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// Update a meeting
router.put('/:id', async (req, res) => {
  try {
    const docRef = db.collection('meetings').doc(req.params.id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    await docRef.update({ ...req.body, updatedAt: new Date() });
    const updatedMeeting = await docRef.get();
    res.json({ id: docRef.id, ...updatedMeeting.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update meeting' });
  }
});

// Delete a meeting
router.delete('/:id', async (req, res) => {
  try {
    const docRef = db.collection('meetings').doc(req.params.id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    await docRef.delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

// Search meetings
router.get('/search', async (req, res) => {
  try {
    const { query, startDate, endDate, participant } = req.query;
    let meetingsRef = db.collection('meetings');
    let queryRef = meetingsRef as any;

    if (participant) {
      queryRef = queryRef.where('participants', 'array-contains', participant);
    }
    if (startDate) {
      queryRef = queryRef.where('startTime', '>=', startDate);
    }
    if (endDate) {
      queryRef = queryRef.where('endTime', '<=', endDate);
    }
    const snapshot = await queryRef.get();
    let meetings = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    if (query) {
      const q = (query as string).toLowerCase();
      meetings = meetings.filter((m: any) =>
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.description && m.description.toLowerCase().includes(q))
      );
    }
    meetings.sort((a: any, b: any) => {
      if (!a.startTime || !b.startTime) return 0;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search meetings' });
  }
});

// Get upcoming meetings
router.get('/upcoming', async (req, res) => {
  try {
    const now = new Date().toISOString();
    const snapshot = await db.collection('meetings').where('startTime', '>', now).orderBy('startTime').get();
    const meetings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch upcoming meetings' });
  }
});

// Get user's meetings
router.get('/user/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const createdBySnap = await db.collection('meetings').where('createdBy', '==', email).get();
    const participantSnap = await db.collection('meetings').where('participants', 'array-contains', email).get();
    const meetings = [
      ...createdBySnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })),
      ...participantSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
    ];
    // Remove duplicates
    const uniqueMeetings = Array.from(new Map(meetings.map((m: any) => [m.id, m])).values());
    uniqueMeetings.sort((a: any, b: any) => {
      if (!a.startTime || !b.startTime) return 0;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
    res.json(uniqueMeetings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user meetings' });
  }
});

// Add participant to meeting
router.post('/:id/participants', async (req, res) => {
  try {
    const docRef = db.collection('meetings').doc(req.params.id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    const { participant } = req.body;
    if (!participant) {
      return res.status(400).json({ error: 'Participant email is required' });
    }
    const data = docSnap.data();
    const participants = (data && data.participants) ? data.participants : [];
    if (!participants.includes(participant)) {
      participants.push(participant);
      await docRef.update({ participants });
    }
    const updated = await docRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add participant' });
  }
});

// Remove participant from meeting
router.delete('/:id/participants/:participant', async (req, res) => {
  try {
    const docRef = db.collection('meetings').doc(req.params.id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    const data = docSnap.data();
    const participants = (data && data.participants) ? data.participants.filter((p: string) => p !== req.params.participant) : [];
    await docRef.update({ participants });
    const updated = await docRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove participant' });
  }
});

// Update meeting status
router.patch('/:id/status', async (req, res) => {
  try {
    const docRef = db.collection('meetings').doc(req.params.id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    const { status } = req.body;
    if (!['scheduled', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    await docRef.update({ status });
    const updated = await docRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update meeting status' });
  }
});

export const meetingsRouter = router;

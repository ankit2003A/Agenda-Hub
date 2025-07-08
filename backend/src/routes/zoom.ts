import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { db } from '../firebase'; // adjust import to your Firestore setup

dotenv.config();

const router = express.Router();

const {
  ZOOM_CLIENT_ID,
  ZOOM_CLIENT_SECRET,
  ZOOM_REDIRECT_URI
} = process.env;

// 1. Start OAuth flow
router.get('/auth', (req, res) => {
  const zoomAuthUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${ZOOM_CLIENT_ID}&redirect_uri=${encodeURIComponent(ZOOM_REDIRECT_URI!)}`;
  res.redirect(zoomAuthUrl);
});

// 2. Handle OAuth callback
// TODO: This route should be protected by authentication middleware to ensure req.user is available
router.get('/callback', async (req: any, res) => {
  const { code } = req.query;
  try {
    const tokenRes = await axios.post('https://zoom.us/oauth/token', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: ZOOM_REDIRECT_URI
      },
      auth: {
        username: ZOOM_CLIENT_ID!,
        password: ZOOM_CLIENT_SECRET!
      }
    });

    const { access_token, refresh_token } = (tokenRes.data as any);

    // Use req.user for user identification (ensure authentication middleware is used)
    const userId = req.user?._id?.toString() || 'demo-user'; // Replace with your user auth
    await db.collection('zoomTokens').doc(userId).set({ access_token, refresh_token });

    res.send('Zoom account connected! You can close this window.');
  } catch (err) {
    res.status(500).send('Zoom OAuth failed');
  }
});

// 3. Create a Zoom meeting
router.post('/create-meeting', async (req, res) => {
  const { userId, topic, start_time, duration } = req.body;
  try {
    // Get user's Zoom access token from Firestore
    const tokenDoc = await db.collection('zoomTokens').doc(userId).get();
    if (!tokenDoc.exists) return res.status(401).send('Zoom not connected');

    const { access_token } = tokenDoc.data() as any;

    // Get Zoom userId (email or "me")
    const userRes = await axios.get('https://api.zoom.us/v2/users/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const zoomUserId = (userRes.data as any).id;

    // Create meeting
    const meetingRes = await axios.post(
      `https://api.zoom.us/v2/users/${zoomUserId}/meetings`,
      {
        topic,
        type: 2, // Scheduled meeting
        start_time,
        duration,
        timezone: 'UTC'
      },
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    res.json({ join_url: (meetingRes.data as any).join_url, meetingId: (meetingRes.data as any).id });
  } catch (err) {
    res.status(500).send('Failed to create Zoom meeting');
  }
});

export default router; 
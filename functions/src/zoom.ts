import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Environment variables (set via Firebase config or .env)
const ZOOM_CLIENT_ID = functions.config().zoom?.client_id || process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = functions.config().zoom?.client_secret || process.env.ZOOM_CLIENT_SECRET;
const ZOOM_REDIRECT_URI = functions.config().zoom?.redirect_uri || process.env.ZOOM_REDIRECT_URI;

import * as express from 'express';
const app = express();
app.use(express.json());

// 1. Start OAuth flow
app.get('/zoom/auth', (req, res) => {
  const zoomAuthUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${ZOOM_CLIENT_ID}&redirect_uri=${encodeURIComponent(ZOOM_REDIRECT_URI!)}`;
  res.redirect(zoomAuthUrl);
});

// 2. Handle OAuth callback
app.get('/zoom/callback', async (req, res) => {
  const { code, state } = req.query;
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
    const { access_token, refresh_token } = tokenRes.data as any;
    // You should identify the user via state or session (for demo, use state or a placeholder)
    const userId = state || 'demo-user';
    await db.collection('zoomTokens').doc(userId).set({ access_token, refresh_token });
    res.send('Zoom account connected! You can close this window.');
  } catch (err) {
    res.status(500).send('Zoom OAuth failed');
  }
});

// 3. Create a Zoom meeting
app.post('/zoom/create-meeting', async (req, res) => {
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
    const zoomUserId = userRes.data.id;
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
    res.json({ join_url: meetingRes.data.join_url, meetingId: meetingRes.data.id });
  } catch (err) {
    res.status(500).send('Failed to create Zoom meeting');
  }
});

// Export the Express app as a single HTTPS function
export const api = functions.https.onRequest(app); 
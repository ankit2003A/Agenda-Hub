const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Google OAuth2 setup
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// 1. Start Google OAuth
app.get('/api/auth/google', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];
  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
  res.redirect(url);
});

// 2. Handle Google OAuth callback
app.get('/api/auth/google/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code');
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    // You should store tokens in your DB associated with the user
    // For demo, just return them
    res.json(tokens);
  } catch (err) {
    res.status(500).send('OAuth error: ' + err.message);
  }
});

// 3. Create Google Meet event
app.post('/api/meetings/create-google-meet', async (req, res) => {
  const { access_token, refresh_token, summary, description, start, end, attendees } = req.body;
  if (!access_token) return res.status(400).send('Missing access_token');
  oAuth2Client.setCredentials({ access_token, refresh_token });
  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
  try {
    const event = {
      summary,
      description,
      start: { dateTime: start },
      end: { dateTime: end },
      attendees,
      conferenceData: {
        createRequest: { requestId: Math.random().toString(36).substring(2) },
      },
    };
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all',
    });
    res.json({ meetLink: response.data.hangoutLink, event: response.data });
  } catch (err) {
    res.status(500).send('Failed to create event: ' + err.message);
  }
});

module.exports = app; 
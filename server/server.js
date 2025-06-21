// Load required modules
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { google } from 'googleapis'

// Create an instance of an Express app
const app = express()
dotenv.config()

// Enable CORS (allows frontend to talk to backend)
app.use(cors())

// Allow parsing JSON bodies in requests
app.use(express.json())

// Define a basic route
app.get('/', (req, res) => {
  res.send('Backend is running')
})


// Start the server on port 3000
const PORT = 3000
app.listen(PORT, () => {
  console.log(`🚀 Server listening at http://localhost:${PORT}`)
})

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

// Step 1: Redirect to Google OAuth
app.get('/auth', (req, res) => {
    const scopes = ['https://www.googleapis.com/auth/gmail.readonly']
  
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    })
  
    res.redirect(url)
  })

  // Step 2: Handle OAuth callback
app.get('/auth/callback', async (req, res) => {
    const code = req.query.code
    try {
      const { tokens } = await oauth2Client.getToken(code)
      oauth2Client.setCredentials(tokens)
      res.send('Gmail connected successfully.')
    } catch (err) {
      console.error('❌ Error getting tokens:', err)
      res.status(500).send('Authentication failed.')
    }
  })
// Step 3: Fetch Gmail inbox metadata (last 100 emails)
app.get('/gmail/headers', async (req, res) => {
    try {
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
  
      // List messages (just metadata)
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 100,
      })
  
      const messageIds = response.data.messages || []
  
      const metadataPromises = messageIds.map((msg) =>
        gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From', 'Date'],
        })
      )
  
      const messages = await Promise.all(metadataPromises)
  
      const headers = messages.map((msg) => ({
        id: msg.data.id,
        headers: msg.data.payload.headers,
      }))
  
      res.json({ count: headers.length, data: headers })
    } catch (err) {
      console.error('❌ Error fetching Gmail headers:', err)
      res.status(500).json({ error: 'Failed to fetch inbox metadata' })
    }
  })

  import { categorizeEmails } from './services/gemini.service.js'

  app.post('/gmail/categorize', async (req, res) => {
    const { data } = req.body;
  
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid headers input' });
    }
  
    try {
      const result = await categorizeEmails(data);
      res.json(result);
    } catch (err) {
      console.error('Gemini categorization error:', err);
      res.status(500).json({ error: 'Gemini failed to process headers' });
    }
  });
  
  
  
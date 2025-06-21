import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'
dotenv.config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export const categorizeEmails = async (emailHeaders) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `
Here are 100 recent email headers (From, Subject). Based on these, identify which services or accounts this user is connected to. Group them by category:

Categories: Social, Shopping, Finance, Work, Newsletters, Travel, Health, Education, Other

Only use From and Subject fields. Format result like:

{
  "Social": [ "Instagram", "Reddit", "LinkedIn" ],
  "Shopping": [ "Amazon", "Walmart" ],
  "Finance": [ "Chase", "PayPal" ],
  ...
}

Email headers:
${emailHeaders.map(h => {
    const subject = h.headers.find(h => h.name === 'Subject')?.value || ''
    const from = h.headers.find(h => h.name === 'From')?.value || ''
    return `From: ${from} | Subject: ${subject}`
  }).join('\n')}
`

  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()

  // ✅ Remove markdown formatting like ```json ... ```
  const cleanedText = text
    .replace(/```json|```/g, '')
    .trim()

  try {
    const jsonStart = cleanedText.indexOf('{')
    const json = JSON.parse(cleanedText.slice(jsonStart))
    return json
  } catch (err) {
    console.error('Gemini response error:', text)
    throw new Error('Failed to parse Gemini response')
  }
}

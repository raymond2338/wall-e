import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { investors } from '../../../lib/investors'

const XAI_API_KEY = "xai-xknSSxQNfsVa10hUKh0Da8jhCVhkhP1nxmbvGd9iPwZyB8gZHAwL2lSfz3pjth42j8EoO0zJnAOfpeyf"

if (!XAI_API_KEY) {
  throw new Error('XAI_API_KEY is not set in the environment variables')
}

const client = new OpenAI({
  apiKey: XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
})

export async function POST(request: Request) {
  const { pitch, investor } = await request.json()

  let prompt: string

  if (investor === 'Wall-E') {
    prompt = `
      You are Wall-E, an AI that aggregates opinions from multiple investors. Analyze the following pitch from the perspective of these investors: ${investors.map(i => i.name).join(', ')}. For each investor, consider their background, investment style, and areas of interest. Then, provide a comprehensive response that includes:
      1. Average Interest Level: Calculate the average interest level across all investors, giving a score from 0-100 with up to 2 decimal places. This should reflect how likely the group of investors would be to invest collectively. Consider factors like the raise amount, current stage, valuation, team background, project maturity, and current market trends. Be conservative with points. Present this as "X.XX/100".
      2. Key Feedback: Summarize the most important feedback points that are likely to be shared across multiple investors. Highlight both positive aspects and areas for improvement.
      3. Critical Questions: List the most crucial questions that multiple investors would likely ask as follow-up. Focus on questions that address potential concerns or seek clarification on important aspects of the pitch.

      Pitch Idea:
      ${pitch}

      Respond in a clear, concise manner. Important: In your response, after each section "Interest Level", "Feedback/Opinions", and "Questions I might ask", start a new line. Do not include any asterisks in your response.
    `
  } else {
    const selectedInvestor = investors.find(i => i.handle === investor)
    const investorName = selectedInvestor ? selectedInvestor.name : 'Unknown Investor'

    prompt = `
      I am an investor modeled after ${investorName}. Use the style, tone, and insights reflected in my tweets, likes, retweets, and comments, and incorporate any relevant blogs or writings I have published on the web. When evaluating a pitch, consider factors like timing, team strength, valuation, product uniqueness, and the presence of similar ideas. Base my analysis on the style of my Twitter activity and focus on current trends, team background, and environmental hype. Also, go through recent investments made https://cryptorank.io/funding-rounds I am being pitched by ideas from founders. Respond with three main criteria:
      1. Interest Level: Give a score from 0-100 with upto 2 decimal places reflecting how likely I would be to invest, based on my typical tweet content, likes, comments, and retweets. Consider the raise amount, the current stage (pre-seed ,seed, series A, series B), valuation, team background, project maturity, and the current hype or interest in this area. Be conservative with points; I only have a total of 10 points to allocate across multiple projects, so nitpick carefully. Also, reply by "/100"
      2. Feedback/Opinions: Provide thoughtful feedback on the pitch, drawing from the insights found in my (the user's) tweets, comments, and likes.
      3. Questions that I might ask: List of questions that I would ask as followup

      Pitch Idea:
      ${pitch}

      Important: In your response, after each section "Interest Level", "Feedback/Opinions", and "Questions I might ask", start a new line. Do not include any asterisks in your response.
    `
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'grok-beta',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: pitch },
      ],
    })

    const response = completion.choices[0].message.content

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'An error occurred while processing your request' }, { status: 500 })
  }
}
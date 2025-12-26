import { IpcMain } from 'electron'
import { prisma } from '../lib/prisma'
import http from 'http'

// --- Tool Definitions ---
const TOOLS = [
  {
    name: 'get_recent_notes',
    description: 'Get the most recent notes created by the user.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of notes to retrieve (default 5)' }
      }
    }
  },
  {
    name: 'search_notes',
    description: "Search through the user's notes by keyword.",
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search keyword' }
      },
      required: ['query']
    }
  },
  {
    name: 'get_pokemon_stats',
    description: "Get statistics about the user's Pokemon card collection.",
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'search_pokemon',
    description: "Search for Pokemon cards in the user's collection.",
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the Pokemon to search for' }
      },
      required: ['name']
    }
  }
]

const SYSTEM_PROMPT = `
You are a helpful assistant inside a SuperApp.
You have access to the following tools to help answer user questions.

TOOLS:
${JSON.stringify(TOOLS, null, 2)}

INSTRUCTIONS:
1. If you need information from the database, output a JSON object with the "tool" name and "args".
   Example: { "tool": "search_notes", "args": { "query": "meeting" } }
2. If you have enough information, just answer the user directly.
3. Do NOT output the tool JSON if you are just answering.
4. Only use the tools provided.
`

async function callOllama(prompt: string, model: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: model || 'gpt-oss:20b',
      prompt: prompt,
      stream: false
    })

    const req = http.request(
      {
        hostname: 'localhost',
        port: 11434,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            resolve(json.response)
          } catch (e) {
            reject('Failed to parse AI response')
          }
        })
      }
    )

    req.on('error', (e) => {
      console.error('Ollama request failed:', e)
      reject('Ollama is likely not running. Please start Ollama.')
    })

    req.write(postData)
    req.end()
  })
}

async function executeTool(toolName: string, args: any = {}) {
  console.log(`Executing tool: ${toolName} with args:`, args)
  switch (toolName) {
    case 'get_recent_notes':
      const notes = await prisma.note.findMany({
        take: args?.limit || 5,
        orderBy: { createdAt: 'desc' }
      })
      return JSON.stringify(notes)

    case 'search_notes':
      const searchResults = await prisma.note.findMany({
        where: {
          OR: [
            { title: { contains: args?.query || '' } },
            { content: { contains: args?.query || '' } }
          ]
        },
        take: 5
      })
      return JSON.stringify(searchResults)

    case 'get_pokemon_stats':
      const count = await prisma.pokemonCard.count({ where: { isOwned: true } })
      return JSON.stringify({ totalCards: count })

    case 'search_pokemon':
      const cards = await prisma.pokemonCard.findMany({
        where: {
          isOwned: true,
          name: { contains: args?.name || '' }
        },
        take: 10
      })
      return JSON.stringify(cards)

    default:
      return 'Tool not found.'
  }
}

export function registerAiHandlers(ipcMain: IpcMain) {
  // 1. Chat History Management
  ipcMain.handle('get-chat-sessions', async () => {
    return await prisma.chatSession.findMany({
      orderBy: { createdAt: 'desc' },
      include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } }
    })
  })

  ipcMain.handle('create-chat-session', async (_event, title) => {
    return await prisma.chatSession.create({
      data: { title: title || 'New Chat' }
    })
  })

  ipcMain.handle('delete-chat-session', async (_event, id) => {
    return await prisma.chatSession.delete({ where: { id } })
  })

  ipcMain.handle('get-chat-messages', async (_event, sessionId) => {
    return await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' }
    })
  })

  // 2. Ask AI with Tool Calling
  ipcMain.handle('ask-ai', async (_event, { prompt, model, sessionId }) => {
    try {
      // Save User Message
      if (sessionId) {
        await prisma.chatMessage.create({
          data: { role: 'user', content: prompt, sessionId }
        })
      }

      // Retrieve recent chat history for context
      const history = sessionId
        ? await prisma.chatMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'asc' },
            take: 10 // Limit context window
          })
        : []

      let conversation = `${SYSTEM_PROMPT}\n\n`

      // Add history to conversation
      history.forEach((msg) => {
        conversation += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`
      })

      // If the last message in history wasn't the user's prompt (e.g. new session or history limit), add it.
      // But since we just saved it, it SHOULD be in history.
      // However, to be safe and ensure the prompt ends with "Assistant:", we just append that.
      conversation += `Assistant:`

      console.log('Sending Prompt to AI:', conversation)

      // --- Turn 1: Initial Call ---
      let aiResponse = await callOllama(conversation, model)
      console.log('AI Raw Response:', aiResponse)

      // Check for Tool Call
      // Improved Regex to catch JSON even inside Markdown blocks
      // We look for a JSON object that contains "tool". "args" is optional.
      // Strategy: Find the first '{' and the last '}' and try to parse it.
      const firstBrace = aiResponse.indexOf('{')
      const lastBrace = aiResponse.lastIndexOf('}')

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const potentialJson = aiResponse.substring(firstBrace, lastBrace + 1)
        try {
          const toolCall = JSON.parse(potentialJson)

          if (toolCall.tool) {
            console.log('Tool Call Detected:', toolCall)
            const toolResult = await executeTool(toolCall.tool, toolCall.args)

            // Append tool result to conversation
            conversation += `${aiResponse}\n\n[System: Tool "${toolCall.tool}" returned: ${toolResult}]\n\nAssistant:`

            // --- Turn 2: Final Answer with Tool Data ---
            aiResponse = await callOllama(conversation, model)
          }
        } catch (e) {
          console.log('Failed to parse potential JSON tool call, ignoring.', e)
        }
      }

      // Save AI Response
      if (sessionId) {
        await prisma.chatMessage.create({
          data: { role: 'assistant', content: aiResponse, sessionId }
        })
      }

      return aiResponse
    } catch (error) {
      console.error('AI Error:', error)
      return "I'm sorry, I encountered an error processing your request."
    }
  })
}

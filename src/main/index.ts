import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { PrismaClient } from '@prisma/client'
import os from 'os'
import http from 'http'

const dbPath = is.dev
  ? join(__dirname, '../../prisma/dev.db')
  : join(process.resourcesPath, 'prisma/dev.db')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`
    }
  }
})

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // --- API: SYSTEM SPECS ---
  ipcMain.handle('get-system-specs', () => {
    const cpus = os.cpus()
    const totalMem = os.totalmem()
    const freeMem = os.freemem()

    return {
      cpuModel: cpus[0].model,
      cpuCores: cpus.length,
      totalMem: Math.round(totalMem / (1024 * 1024 * 1024)), // GB
      freeMem: Math.round(freeMem / (1024 * 1024 * 1024)), // GB
      platform: os.platform(),
      release: os.release(),
      hostname: os.hostname()
    }
  })

  // --- API: AI ---

  // 1. Chat History Management
  ipcMain.handle('get-chat-sessions', async () => {
    return await prisma.chatSession.findMany({
      orderBy: { createdAt: 'desc' },
      include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } } // Preview last message
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

  // 2. Ask AI
  ipcMain.handle('ask-ai', async (_event, { prompt, model, sessionId }) => {
    try {
      // 1. Gather Context
      const notes = await prisma.note.findMany({ take: 10, orderBy: { createdAt: 'desc' } })
      const pokemonCount = await prisma.pokemonCard.count({ where: { isOwned: true } })
      const recentPokemon = await prisma.pokemonCard.findMany({
        where: { isOwned: true },
        take: 5,
        orderBy: { id: 'desc' }
      })

      // Format Context as "Tables" for better AI readability
      const notesTable = notes
        .map((n) => `| ${n.id} | ${n.title} | ${n.content.substring(0, 50)}... |`)
        .join('\n')
      const pokemonTable = recentPokemon
        .map((p) => `| ${p.name} | ${p.rarity || 'Common'} | ${p.setId} |`)
        .join('\n')

      const contextString = `
      You are a helpful assistant inside a SuperApp.
      
      === DATABASE CONTEXT ===
      
      [USER STATS]
      - Total Pokemon Cards Owned: ${pokemonCount}
      
      [RECENT POKEMON CARDS]
      | Name | Rarity | Set |
      |---|---|---|
      ${pokemonTable}
      
      [RECENT NOTES]
      | ID | Title | Preview |
      |---|---|---|
      ${notesTable}
      
      === END CONTEXT ===

      Please answer the following question using this context if relevant.
      User Question: ${prompt}
      `

      // 2. Save User Message
      if (sessionId) {
        await prisma.chatMessage.create({
          data: { role: 'user', content: prompt, sessionId }
        })
      }

      // 3. Call Ollama
      const aiResponse: string = await new Promise((resolve, reject) => {
        const postData = JSON.stringify({
          model: model || 'gpt-oss:20b',
          prompt: contextString,
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

      // 4. Save AI Response
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

  // --- API: NOTES ---

  // 1. Get all notes
  ipcMain.handle('get-notes', async () => {
    try {
      return await prisma.note.findMany({
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      console.error('Error getting notes:', error)
      return []
    }
  })

  // 2. Create a note
  ipcMain.handle('create-note', async (_event, data) => {
    try {
      return await prisma.note.create({
        data: {
          title: data.title,
          content: data.content
        }
      })
    } catch (error) {
      console.error('Error creating note:', error)
      throw error
    }
  })

  // 3. Update a note
  ipcMain.handle('update-note', async (_event, note) => {
    try {
      return await prisma.note.update({
        where: { id: note.id },
        data: {
          title: note.title,
          content: note.content
        }
      })
    } catch (error) {
      console.error('Error updating note:', error)
      throw error
    }
  })

  // 4. Delete a note
  ipcMain.handle('delete-note', async (_event, id) => {
    try {
      return await prisma.note.delete({
        where: { id }
      })
    } catch (error) {
      console.error('Error deleting note:', error)
      throw error
    }
  })

  // --- API: POKEMON ---

  // 1. Get All Series (Level 1)
  ipcMain.handle('get-pokemon-series', async () => {
    const localSeries = await prisma.pokemonSeries.findMany({
      orderBy: { id: 'desc' } // Newest series first
    })

    if (localSeries.length > 0) return localSeries

    console.log('Fetching Series from TCGDex...')
    try {
      const response = await fetch('https://api.tcgdex.net/v2/en/series')
      const data: any = await response.json()

      const seriesList = data.map((s: any) => ({
        id: s.id,
        name: s.name,
        logo: s.logo || null
      }))

      // Save to DB
      await prisma.$transaction(
        seriesList.map((s) =>
          prisma.pokemonSeries.upsert({
            where: { id: s.id },
            update: { name: s.name, logo: s.logo },
            create: s
          })
        )
      )

      return seriesList
    } catch (e) {
      console.error(e)
      return []
    }
  })

  // 2. Get Sets in a Series (Level 2)
  ipcMain.handle('get-sets-in-series', async (_event, seriesId) => {
    // Check DB first
    const localSets = await prisma.pokemonSet.findMany({
      where: { seriesId },
      orderBy: { id: 'desc' }
    })

    if (localSets.length > 0) return localSets

    console.log(`Fetching Sets for Series: ${seriesId}...`)
    try {
      // TCGDex endpoint for specific series includes its sets
      const response = await fetch(`https://api.tcgdex.net/v2/en/series/${seriesId}`)
      const data: any = await response.json()

      const setsToSave = data.sets.map((set: any) => ({
        id: set.id,
        name: set.name,
        logo: set.logo || null,
        cardCount: set.cardCount?.total || 0,
        seriesId: seriesId
      }))

      // Save to DB
      await prisma.$transaction(
        setsToSave.map((s) =>
          prisma.pokemonSet.upsert({
            where: { id: s.id },
            update: {
              name: s.name,
              logo: s.logo,
              cardCount: s.cardCount,
              seriesId: s.seriesId
            },
            create: s
          })
        )
      )

      return setsToSave
    } catch (e) {
      console.error(e)
      return []
    }
  })

  // 3. Get Cards in a Set (Level 3) - Same as before
  ipcMain.handle('get-cards-in-set', async (_event, setId) => {
    const count = await prisma.pokemonCard.count({ where: { setId } })

    if (count === 0) {
      console.log(`Fetching cards for set ${setId}...`)
      const response = await fetch(`https://api.tcgdex.net/v2/en/sets/${setId}`)
      const data: any = await response.json()

      const cards = data.cards.map((card: any) => ({
        id: card.id,
        localId: card.localId || '??',
        name: card.name,
        image: `${card.image}/low.png`,
        rarity: card.rarity || 'Common',
        setId: setId,
        isOwned: false
      }))

      await prisma.$transaction(
        cards.map((c) =>
          prisma.pokemonCard.upsert({
            where: { id: c.id },
            update: {
              name: c.name,
              image: c.image,
              rarity: c.rarity,
              setId: c.setId
            },
            create: c
          })
        )
      )
    }

    return await prisma.pokemonCard.findMany({ where: { setId } })
  })

  // 4. Toggle Card
  ipcMain.handle('toggle-card-owned', async (_event, cardId) => {
    const card = await prisma.pokemonCard.findUnique({ where: { id: cardId } })
    const newState = !card?.isOwned
    return await prisma.pokemonCard.update({
      where: { id: cardId },
      data: { isOwned: newState, quantity: newState ? 1 : 0 }
    })
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

import { IpcMain } from 'electron'
import { prisma } from '../lib/prisma'

export function registerNoteHandlers(ipcMain: IpcMain) {
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
}

import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Notes
  getNotes: () => ipcRenderer.invoke('get-notes'),
  createNote: (note) => ipcRenderer.invoke('create-note', note),
  deleteNote: (id) => ipcRenderer.invoke('delete-note', id),

  // Pokemon
  // Pokemon API
  getPokemonSeries: () => ipcRenderer.invoke('get-pokemon-series'), // <--- NEW
  getSetsInSeries: (seriesId) => ipcRenderer.invoke('get-sets-in-series', seriesId), // <--- CHANGED
  getCardsInSet: (setId) => ipcRenderer.invoke('get-cards-in-set', setId),
  toggleCardOwned: (cardId) => ipcRenderer.invoke('toggle-card-owned', cardId)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

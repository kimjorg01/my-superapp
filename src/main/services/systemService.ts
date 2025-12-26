import { IpcMain } from 'electron'
import os from 'os'

export function registerSystemHandlers(ipcMain: IpcMain) {
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
}

import { PrismaClient } from '@prisma/client'
import { is } from '@electron-toolkit/utils'
import { join } from 'path'

const dbPath = is.dev
  ? join(__dirname, '../../prisma/dev.db')
  : join(process.resourcesPath, 'prisma/dev.db')

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`
    }
  }
})

import { IpcMain } from 'electron'
import { prisma } from '../lib/prisma'

export function registerPokemonHandlers(ipcMain: IpcMain) {
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

  // 3. Get Cards in a Set (Level 3)
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

  // 4. Update Card Collection
  ipcMain.handle('update-card-collection', async (_event, { cardId, counts }) => {
    console.log(`Updating collection for ${cardId}:`, counts)
    const isOwned = counts.normal + counts.holo + counts.reverseHolo > 0
    return await prisma.pokemonCard.update({
      where: { id: cardId },
      data: {
        countNormal: counts.normal,
        countHolo: counts.holo,
        countReverseHolo: counts.reverseHolo,
        isOwned: isOwned
      }
    })
  })

  // 5. Get Card Details (Prices)
  ipcMain.handle('get-card-details', async (_event, cardId) => {
    console.log(`Fetching details (prices) for card: ${cardId}...`)
    try {
      const response = await fetch(`https://api.tcgdex.net/v2/en/cards/${cardId}`)
      const data: any = await response.json()
      return data
    } catch (e) {
      console.error(`Failed to fetch details for ${cardId}`, e)
      return null
    }
  })

  // 6. Toggle Favorite
  ipcMain.handle('toggle-card-favorite', async (_event, cardId) => {
    const card = await prisma.pokemonCard.findUnique({ where: { id: cardId } })
    const newState = !card?.isFavorite
    return await prisma.pokemonCard.update({
      where: { id: cardId },
      data: { isFavorite: newState }
    })
  })

  // 7. Get Favorite Cards
  ipcMain.handle('get-favorite-cards', async () => {
    return await prisma.pokemonCard.findMany({
      where: { isFavorite: true },
      include: { set: true },
      orderBy: { name: 'asc' }
    })
  })
}

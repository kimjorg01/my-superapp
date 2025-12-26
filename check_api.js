const https = require('https')

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => resolve(JSON.parse(data)))
      res.on('error', reject)
    })
  })
}

async function check() {
  try {
    const series = await fetch('https://api.tcgdex.net/v2/en/series')
    console.log('Series Logo:', series[0].logo)

    const seriesDetail = await fetch(`https://api.tcgdex.net/v2/en/series/${series[0].id}`)
    const set = seriesDetail.sets[0]
    console.log('Set Logo:', set.logo)

    const setDetail = await fetch(`https://api.tcgdex.net/v2/en/sets/${set.id}`)
    const card = setDetail.cards[0]
    console.log('Card Image:', card.image)
  } catch (e) {
    console.error(e)
  }
}

check()

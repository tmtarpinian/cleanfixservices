// Loads every media file in src/assets/portfolio and derives its metadata
// from the filename convention (see "Portfolio media" in the README):
//
//   <category>--<city-slug>--<date-or-id>.<ext>
//
// Photos: .jpg/.jpeg/.png/.webp — Videos: .mp4/.webm, plus a same-named
// image file that serves as the tile/poster frame.
const context = require.context('../../assets/portfolio', false, /\.(jpe?g|png|webp|mp4|webm)$/i)

const VIDEO_EXT = /\.(mp4|webm)$/i

const titleCase = slug =>
  slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const itemsByBase = {}
context.keys().forEach(key => {
  const file = key.replace('./', '')
  const base = file.replace(/\.[^.]+$/, '')
  const [category, citySlug] = base.split('--')
  const item = itemsByBase[base] || (itemsByBase[base] = {
    id: base,
    category,
    city: titleCase(citySlug || ''),
  })
  if (VIDEO_EXT.test(file)) {
    item.video = context(key)
  } else {
    item.image = context(key)
  }
})

// Newest first — the date in the filename sorts naturally.
const portfolioData = Object.values(itemsByBase).sort((a, b) => b.id.localeCompare(a.id))

const categories = [...new Set(portfolioData.map(item => item.category))].sort()

export { categories }
export default portfolioData

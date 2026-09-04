import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ALL_FEED, cityFeed, isVideo } from './mediaIndexClient'
import { flattenFeed, useMediaFeed, useMediaManifest } from './usePortfolioFeed'
import MediaTile from './MediaTile'
import useInView from './useInView'
import './Portfolio.css'

const formatDate = iso => {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

const Portfolio = () => {
  const [serviceType, setServiceType] = useState(ALL_FEED)
  const [city, setCity] = useState(ALL_FEED)
  const [query, setQuery] = useState('')
  const [lightboxIndex, setLightboxIndex] = useState(-1)

  const manifest = useMediaManifest()

  // The index has per-serviceType and per-city feeds but no combined chunks,
  // so the server feed narrows one dimension (city wins — usually the smaller
  // slice) and anything left over is filtered client-side below.
  const feedName = city !== ALL_FEED ? cityFeed(city) : serviceType
  const feed = useMediaFeed(manifest.data, feedName)
  const loaded = flattenFeed(feed.data)

  const q = query.trim().toLowerCase()
  const items = loaded.filter(item =>
    (serviceType === ALL_FEED || item.serviceType === serviceType) &&
    (!q || [item.city, item.serviceType, item.facts]
      .some(field => field && field.toLowerCase().includes(q)))
  )

  // Client-side filters can only see loaded pages, so while one is active the
  // feed pages eagerly to the end instead of waiting on the scroll sentinel.
  const filteringLoaded = q !== '' || (city !== ALL_FEED && serviceType !== ALL_FEED)

  // Sentinel: not `once` — it re-arms after each page appends below it.
  const [sentinelRef, sentinelInView] = useInView({ rootMargin: '600px' })
  useEffect(() => {
    if ((sentinelInView || filteringLoaded) && feed.hasNextPage && !feed.isFetchingNextPage) {
      feed.fetchNextPage()
    }
  }, [sentinelInView, filteringLoaded, feed])

  const serviceTypes = manifest.data
    ? Object.keys(manifest.data.feeds.byServiceType).sort()
    : []
  // byCity is absent from manifests published before the city field existed.
  const cities = manifest.data
    ? Object.keys(manifest.data.feeds.byCity ?? {}).sort()
    : []

  const lightboxItem = lightboxIndex >= 0 ? items[lightboxIndex] ?? null : null

  const closeLightbox = () => setLightboxIndex(-1)
  const stepLightbox = dir =>
    setLightboxIndex(index => (index + dir + items.length) % items.length)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (!lightboxItem) return
    document.body.style.overflow = 'hidden'
    const onKeyDown = event => {
      if (event.key === 'Escape') closeLightbox()
      if (event.key === 'ArrowLeft') stepLightbox(-1)
      if (event.key === 'ArrowRight') stepLightbox(1)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeyDown)
    }
  })

  const selectServiceType = name => {
    setServiceType(name)
    setLightboxIndex(-1)
  }
  const selectCity = name => {
    setCity(name)
    setLightboxIndex(-1)
  }

  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <p className="sec-label">Portfolio</p>
          <h1>Work we've checked off.</h1>
          <p>Recent jobs around Metro Detroit — tap any tile for a closer look.</p>
        </div>
      </div>

      <section>
        <div className="wrap">
          <ul className="filter-chips" aria-label="Filter portfolio">
            <li>
              <button aria-pressed={serviceType === ALL_FEED} onClick={() => selectServiceType(ALL_FEED)}>All</button>
            </li>
            {serviceTypes.map(name => (
              <li key={name}>
                <button aria-pressed={serviceType === name} onClick={() => selectServiceType(name)}>
                  {name}
                </button>
              </li>
            ))}
          </ul>

          <div className="filter-tools">
            {cities.length > 0 && (
              <select
                className="city-select"
                aria-label="Filter by city"
                value={city}
                onChange={event => selectCity(event.target.value)}
              >
                <option value={ALL_FEED}>All cities</option>
                {cities.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            )}
            <input
              type="search"
              className="feed-search"
              placeholder="Search jobs…"
              aria-label="Search jobs"
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
          </div>

          {(manifest.isError || feed.isError) && (
            <p className="feed-status" role="alert">
              Couldn't load the portfolio right now — please try again in a minute.
            </p>
          )}
          {(manifest.isPending || feed.isPending) && !manifest.isError && !feed.isError && (
            <p className="feed-status">Loading recent jobs…</p>
          )}
          {feed.isSuccess && items.length === 0 && !feed.hasNextPage && (
            <p className="feed-status">
              {q
                ? `No jobs match "${query.trim()}" — try a different search.`
                : 'No jobs in this category yet — check back soon.'}
            </p>
          )}

          <div className="portfolio-grid">
            {items.map((item, index) => (
              <MediaTile
                key={item.storageKey}
                item={item}
                onOpen={() => setLightboxIndex(index)}
              />
            ))}
          </div>

          <div ref={sentinelRef} className="scroll-sentinel" aria-hidden="true">
            {feed.isFetchingNextPage && <span className="feed-spinner" />}
          </div>
        </div>
      </section>

      {lightboxItem && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Portfolio item"
          onClick={event => { if (event.target === event.currentTarget) closeLightbox() }}
        >
          <button className="lb-close" onClick={closeLightbox} aria-label="Close">×</button>
          {items.length > 1 && (
            <>
              <button className="lb-nav lb-prev" onClick={() => stepLightbox(-1)} aria-label="Previous">‹</button>
              <button className="lb-nav lb-next" onClick={() => stepLightbox(1)} aria-label="Next">›</button>
            </>
          )}
          <div className="lb-inner">
            <div className="lb-media">
              {isVideo(lightboxItem)
                ? <video src={lightboxItem.mediaUrl} controls autoPlay playsInline />
                : <img src={lightboxItem.mediaUrl} alt={`${lightboxItem.serviceType} job`} />}
            </div>
            <div className="lb-meta">
              <span className="chip">{lightboxItem.serviceType}</span>
              {isVideo(lightboxItem) && <span className="chip video">{lightboxItem.mediaType === 'timelapse' ? 'Timelapse' : 'Video'}</span>}
              <span className="city">
                {lightboxItem.city
                  ? `${lightboxItem.city} · ${formatDate(lightboxItem.date)}`
                  : formatDate(lightboxItem.date)}
              </span>
            </div>
            {lightboxItem.facts && <p className="lb-facts">{lightboxItem.facts}</p>}
          </div>
        </div>
      )}

      <section className="cta-band">
        <div className="wrap">
          <h2 className="sec-title">Want yours on this page?</h2>
          <p>Tell us about the job and we'll get it done.</p>
          <div className="cta-actions">
            <Link className="btn btn-primary" to="/contact">Book now</Link>
          </div>
        </div>
      </section>
    </>
  )
}

export default Portfolio

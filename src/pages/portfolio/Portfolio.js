import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import portfolioData, { categories } from './portfolioData'
import './Portfolio.css'

const PlayBadge = () => (
  <div className="play">
    <span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden="true">
        <path d="M8 5.5v13l11-6.5z"/>
      </svg>
    </span>
  </div>
)

const Portfolio = () => {
  const [filter, setFilter] = useState('all')
  const [lightboxIndex, setLightboxIndex] = useState(-1)

  const visible = filter === 'all'
    ? portfolioData
    : portfolioData.filter(item => item.category === filter)
  const lightboxItem = lightboxIndex >= 0 ? visible[lightboxIndex] : null

  const closeLightbox = () => setLightboxIndex(-1)
  const stepLightbox = dir =>
    setLightboxIndex(index => (index + dir + visible.length) % visible.length)

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

  const selectFilter = category => {
    setFilter(category)
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
              <button aria-pressed={filter === 'all'} onClick={() => selectFilter('all')}>All</button>
            </li>
            {categories.map(category => (
              <li key={category}>
                <button aria-pressed={filter === category} onClick={() => selectFilter(category)}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              </li>
            ))}
          </ul>
          <div className="portfolio-grid">
            {visible.map((item, index) => (
              <button
                className="tile"
                key={item.id}
                onClick={() => setLightboxIndex(index)}
                aria-label={`${item.category} job in ${item.city}${item.video ? ' (video)' : ''}`}
              >
                {item.image
                  ? <img src={item.image} alt="" loading="lazy" />
                  : <video src={item.video} muted playsInline preload="metadata" />}
                {item.video && <PlayBadge />}
              </button>
            ))}
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
          {visible.length > 1 && (
            <>
              <button className="lb-nav lb-prev" onClick={() => stepLightbox(-1)} aria-label="Previous">‹</button>
              <button className="lb-nav lb-next" onClick={() => stepLightbox(1)} aria-label="Next">›</button>
            </>
          )}
          <div className="lb-inner">
            <div className="lb-media">
              {lightboxItem.video
                ? <video src={lightboxItem.video} poster={lightboxItem.image} controls autoPlay playsInline />
                : <img src={lightboxItem.image} alt={`${lightboxItem.category} job in ${lightboxItem.city}`} />}
            </div>
            <div className="lb-meta">
              <span className="chip">{lightboxItem.category}</span>
              {lightboxItem.video && <span className="chip video">Video</span>}
              <span className="city">{lightboxItem.city}</span>
            </div>
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

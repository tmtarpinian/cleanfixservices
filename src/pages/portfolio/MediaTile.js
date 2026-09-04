import { isVideo } from './mediaIndexClient'
import useInView from './useInView'

const PlayBadge = () => (
  <div className="play">
    <span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden="true">
        <path d="M8 5.5v13l11-6.5z"/>
      </svg>
    </span>
  </div>
)

// The tile only sets a media src once it scrolls near the viewport, so
// off-screen assets never hit R2. Videos load metadata only (first frame as
// the poster); full bytes stream when the lightbox plays them.
const MediaTile = ({ item, onOpen }) => {
  const [ref, inView] = useInView({ rootMargin: '400px', once: true })
  const video = isVideo(item)

  return (
    <button
      ref={ref}
      className="tile"
      onClick={onOpen}
      aria-label={`${item.serviceType} job${item.city ? ` in ${item.city}` : ''}, ${item.date}${video ? ' (video)' : ''}`}
    >
      {!inView
        ? <div className="tile-placeholder" aria-hidden="true" />
        : video
          ? <video src={item.mediaUrl} muted playsInline preload="metadata" />
          : <img src={item.mediaUrl} alt="" loading="lazy" />}
      {video && <PlayBadge />}
    </button>
  )
}

export default MediaTile

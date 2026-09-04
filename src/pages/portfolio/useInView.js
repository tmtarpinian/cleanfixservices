import { useEffect, useRef, useState } from 'react'

// Returns [ref, inView]. `once` latches true after the first intersection —
// used by tiles so media, once fetched, never unmounts while scrolling away.
// The sentinel leaves `once` false so it can re-trigger for each next page.
const useInView = ({ rootMargin = '0px', once = false } = {}) => {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true) // ancient browser: load everything rather than nothing
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { rootMargin }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [rootMargin, once])

  return [ref, inView]
}

export default useInView

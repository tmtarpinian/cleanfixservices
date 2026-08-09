import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PHONE } from './constants'
import './ActionBar.css'

// Sticky mobile Call / Book bar. Hidden on the contact page, and on home it
// stays hidden until the hero's own buttons scroll out of view.
const ActionBar = () => {
  const [visible, setVisible] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (location.pathname === '/contact') {
      setVisible(false)
      return
    }
    const heroActions = document.getElementById('heroActions')
    if (!heroActions) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(heroActions)
    return () => observer.disconnect()
  }, [location.pathname])

  return (
    <div className={`action-bar${visible ? ' visible' : ''}`} aria-hidden={!visible}>
      <a className="btn btn-call" href={PHONE.TEL} tabIndex={visible ? 0 : -1}>Call</a>
      <Link className="btn btn-primary" to="/contact" tabIndex={visible ? 0 : -1}>Book now</Link>
    </div>
  )
}

export default ActionBar

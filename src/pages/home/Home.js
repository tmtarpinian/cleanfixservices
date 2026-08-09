import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PHONE } from '../../constants'
import servicesData from './servicesData'
import './Home.css'

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/>
  </svg>
)

const SERVICE_AREA = [
  'Farmington Hills', 'Farmington', 'Novi', 'Northville', 'Livonia',
  'West Bloomfield', 'Bloomfield Hills', 'Franklin', 'Southfield', 'Redford',
]

const Home = () => {
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView()
    } else {
      window.scrollTo(0, 0)
    }
  }, [location])

  return (
    <>
      <section className="hero" aria-labelledby="heroTitle">
        <div className="wrap">
          <p className="eyebrow">Handyman services · Farmington Hills, MI</p>
          <h1 id="heroTitle">Check those items off your <em>to&#8209;do list.</em></h1>
          <p className="sub">Light plumbing, painting, electrical, and landscaping — the small jobs that never make it to the top of the list. We fix, organize, and clean so you don't have to.</p>
          <div className="hero-actions" id="heroActions">
            <Link className="btn btn-primary" to="/contact">Book now</Link>
            <a className="btn btn-ghost-light" href={PHONE.TEL}>
              <PhoneIcon />
              {PHONE.DISPLAY}
            </a>
          </div>
          <ul className="tags" aria-label="What we do">
            <li>Fix</li>
            <li>Organize</li>
            <li>Clean</li>
          </ul>
        </div>
      </section>

      <section id="services" aria-labelledby="servicesTitle">
        <div className="wrap">
          <p className="sec-label">What we do</p>
          <h2 className="sec-title" id="servicesTitle">Small jobs are our whole job.</h2>
          <p className="sec-intro">No project is too small — that's the point. These are the requests we get most.</p>
          <div className="services-grid">
            {servicesData.map(service => (
              <article className="card" key={service.name}>
                <img src={service.source} alt={service.alt} />
                <div className="card-body">
                  <h3>{service.name}</h3>
                  <p>{service.summary}</p>
                  <Link className="card-link" to="/contact">Get a quote →</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="how" aria-labelledby="howTitle">
        <div className="wrap">
          <p className="sec-label">How it works</p>
          <h2 className="sec-title" id="howTitle">Three steps, then it's done.</h2>
          <ol className="steps">
            <li>
              <h3>Tell us about the job</h3>
              <p>Call, text, or send the form — whatever's easiest. Tell us what needs doing and where you are.</p>
            </li>
            <li>
              <h3>Get a straight answer</h3>
              <p>We'll confirm it's something we handle and give you a clear quote. No surprises.</p>
            </li>
            <li>
              <h3>We check it off</h3>
              <p>We show up, do the work, and leave it cleaner than we found it.</p>
            </li>
          </ol>
        </div>
      </section>

      <section aria-labelledby="areaTitle">
        <div className="wrap">
          <p className="sec-label">Service area</p>
          <h2 className="sec-title" id="areaTitle">Proudly serving Metro Detroit's northwest suburbs.</h2>
          <ul className="area-chips">
            {SERVICE_AREA.map(city => <li key={city}>{city}</li>)}
          </ul>
        </div>
      </section>

      <section className="cta-band" aria-labelledby="ctaTitle">
        <div className="wrap">
          <h2 className="sec-title" id="ctaTitle">That list isn't going to do itself.</h2>
          <p>Tell us what needs fixing and we'll take it from there.</p>
          <div className="cta-actions">
            <Link className="btn btn-primary" to="/contact">Book now</Link>
            <a className="btn btn-ghost-light" href={PHONE.TEL}>{PHONE.DISPLAY}</a>
          </div>
        </div>
      </section>
    </>
  )
}

export default Home

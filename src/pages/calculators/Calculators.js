import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import PaintCalculator from './calcs/PaintCalculator'
import GutterCalculator from './calcs/GutterCalculator'
import DripCalculator from './calcs/DripCalculator'
import './Calculators.css'

// The calculator lineup. Swap entries in and out as offerings change —
// order here is display order. Each calculator is a standalone component
// in ./calcs with its rates/constants at the top of the file.
const ACTIVE_CALCULATORS = [
  PaintCalculator,
  GutterCalculator,
  DripCalculator,
]

const Calculators = () => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <p className="sec-label">Calculators</p>
          <h1>Ballpark it before you book it.</h1>
          <p>Quick estimators for common projects. Numbers are rough math — the real quote is always free.</p>
        </div>
      </div>

      <section>
        <div className="wrap">
          <div className="calc-list">
            {ACTIVE_CALCULATORS.map(Calculator => <Calculator key={Calculator.name} />)}
          </div>
          <div className="calc-tease">
            <b>Don't see your project?</b> Some jobs are hard to put a formula on — <Link to="/contact">tell us what you're working on</Link> and we'll ballpark it for free.
          </div>
        </div>
      </section>
    </>
  )
}

export default Calculators

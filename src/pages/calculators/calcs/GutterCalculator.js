import { useState } from 'react'
import { CalcCard, CalcResults, NumberField, Segmented } from '../CalcParts'

// Tune to taste:
const RATE_PER_FOOT = {
  1: [0.9, 1.3],  // single story, $ per linear foot
  2: [1.3, 1.9],  // two story
}
const MINIMUM_JOB = 100
const FEET_PER_DOWNSPOUT = 35

const roundToFive = value => Math.round(value / 5) * 5

const GutterCalculator = () => {
  const [length, setLength] = useState('40')
  const [width, setWidth] = useState('28')
  const [stories, setStories] = useState(1)

  const [L, W] = [length, width].map(v => parseFloat(v) || 0)
  const hasInput = L > 0 && W > 0
  const gutterFeet = hasInput ? Math.round(2 * (L + W)) : 0
  const downspouts = hasInput ? Math.ceil(gutterFeet / FEET_PER_DOWNSPOUT) : 0
  const [lowRate, highRate] = RATE_PER_FOOT[stories]
  const low = Math.max(MINIMUM_JOB, roundToFive(gutterFeet * lowRate))
  const high = Math.max(MINIMUM_JOB, roundToFive(gutterFeet * highRate))

  return (
    <CalcCard title="Gutter cleaning" subtitle="Ballpark a cleaning from your home's footprint.">
      <div className="field-row">
        <NumberField id="gutterLen" label="Home length (ft)" value={length} onChange={setLength} min="10" max="150" />
        <NumberField id="gutterWid" label="Home width (ft)" value={width} onChange={setWidth} min="10" max="150" />
      </div>
      <div className="field">
        <label id="gutterStoriesLabel">Stories</label>
        <Segmented
          ariaLabel="Stories"
          options={[{ value: 1, label: '1 story' }, { value: 2, label: '2 stories' }]}
          value={stories}
          onChange={setStories}
        />
      </div>
      <CalcResults
        results={[
          { value: hasInput ? gutterFeet.toLocaleString() : '—', label: 'ft of gutter (est.)' },
          { value: hasInput ? downspouts : '—', label: 'downspouts' },
          { value: hasInput ? `$${low}–$${high}` : '—', label: 'typical price' },
        ]}
        disclaimer="Assumes gutters along the full roofline, at typical per-foot market rates. Steep roofs, gutter guards, and packed downspouts change the price — the real quote is free."
      />
    </CalcCard>
  )
}

export default GutterCalculator

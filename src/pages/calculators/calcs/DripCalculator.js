import { useState } from 'react'
import { CalcCard, CalcResults, NumberField, Segmented } from '../CalcParts'

// Tune to taste:
const DRIPS_PER_GALLON = 15140       // EPA drip-calculator figure
const WATER_RATE_PER_GALLON = 0.015  // combined water + sewer, $/gallon
const BATHTUB_GALLONS = 40
const MINUTES_PER_YEAR = 525600

const DRIP_SPEEDS = [
  { value: 10, label: 'Occasional' },
  { value: 30, label: 'Steady' },
  { value: 90, label: 'Streaming' },
]

const DripCalculator = () => {
  const [faucets, setFaucets] = useState('1')
  const [dripsPerMinute, setDripsPerMinute] = useState(30)

  const count = parseInt(faucets, 10) || 0
  const hasInput = count > 0
  const gallonsPerYear = Math.round((count * dripsPerMinute * MINUTES_PER_YEAR) / DRIPS_PER_GALLON)
  const bathtubs = Math.round(gallonsPerYear / BATHTUB_GALLONS)
  const costPerYear = Math.round(gallonsPerYear * WATER_RATE_PER_GALLON)

  return (
    <CalcCard
      title="Leaky faucet"
      subtitle="What's that drip actually costing you per year?"
      ctaLabel="Fix that drip"
    >
      <div className="field-row">
        <NumberField id="dripFaucets" label="Dripping faucets" value={faucets} onChange={setFaucets} min="1" max="10" />
        <div className="field">
          <label id="dripSpeedLabel">Drip speed</label>
          <Segmented
            ariaLabel="Drip speed"
            options={DRIP_SPEEDS}
            value={dripsPerMinute}
            onChange={setDripsPerMinute}
          />
        </div>
      </div>
      <CalcResults
        results={[
          { value: hasInput ? gallonsPerYear.toLocaleString() : '—', label: 'gallons a year' },
          { value: hasInput ? bathtubs.toLocaleString() : '—', label: 'bathtubs full' },
          { value: hasInput ? `~$${costPerYear}` : '—', label: 'on your water bill' },
        ]}
        disclaimer="Based on EPA drip math (about 15,000 drips per gallon) and typical combined water + sewer rates."
      />
    </CalcCard>
  )
}

export default DripCalculator

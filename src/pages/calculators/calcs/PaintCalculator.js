import { useState } from 'react'
import { CalcCard, CalcResults, NumberField, Segmented } from '../CalcParts'

// Tune to taste:
const COVERAGE_SQFT_PER_GALLON = 350
const DOOR_WINDOW_ALLOWANCE_SQFT = 40
const PRICE_PER_GALLON = [30, 55]

const PaintCalculator = () => {
  const [length, setLength] = useState('12')
  const [width, setWidth] = useState('10')
  const [height, setHeight] = useState('8')
  const [coats, setCoats] = useState(2)

  const [L, W, H] = [length, width, height].map(v => parseFloat(v) || 0)
  const hasInput = L > 0 && W > 0 && H > 0
  const area = hasInput ? Math.max(0, Math.round(2 * (L + W) * H - DOOR_WINDOW_ALLOWANCE_SQFT)) : 0
  const gallons = hasInput ? Math.max(1, Math.ceil((area * coats) / COVERAGE_SQFT_PER_GALLON)) : 0

  return (
    <CalcCard title="Paint a room" subtitle="How much paint does that room actually need?">
      <div className="field-row">
        <NumberField id="paintLen" label="Room length (ft)" value={length} onChange={setLength} min="1" max="60" />
        <NumberField id="paintWid" label="Room width (ft)" value={width} onChange={setWidth} min="1" max="60" />
      </div>
      <div className="field-row">
        <NumberField id="paintHt" label="Ceiling height (ft)" value={height} onChange={setHeight} min="6" max="20" />
        <div className="field">
          <label id="paintCoatsLabel">Coats</label>
          <Segmented
            ariaLabel="Coats"
            options={[{ value: 1, label: '1 coat' }, { value: 2, label: '2 coats' }]}
            value={coats}
            onChange={setCoats}
          />
        </div>
      </div>
      <CalcResults
        results={[
          { value: hasInput ? area.toLocaleString() : '—', label: 'sq ft of wall' },
          { value: hasInput ? gallons : '—', label: 'gallons' },
          { value: hasInput ? `$${gallons * PRICE_PER_GALLON[0]}–$${gallons * PRICE_PER_GALLON[1]}` : '—', label: 'paint cost (est.)' },
        ]}
        disclaimer="Materials math only — assumes standard door & window coverage. Labor is quoted per job, and the quote is free."
      />
    </CalcCard>
  )
}

export default PaintCalculator

import { Link } from 'react-router-dom'

// Shared building blocks for calculator components. Each calculator composes
// these so it stays a small, self-contained file that can be swapped in and
// out of the registry in Calculators.js.

const CalcCard = ({ title, subtitle, ctaLabel = 'Get a real quote', children }) => (
  <div className="calc-card">
    <h2>{title}</h2>
    <p className="calc-sub">{subtitle}</p>
    {children}
    <div className="calc-cta">
      <Link className="btn btn-primary" to="/contact">{ctaLabel}</Link>
    </div>
  </div>
)

const CalcResults = ({ results, disclaimer }) => (
  <div className="calc-result" aria-live="polite">
    <div className="nums">
      {results.map(result => (
        <div className="num" key={result.label}>
          <b>{result.value}</b>
          <span>{result.label}</span>
        </div>
      ))}
    </div>
    <p className="disclaimer">{disclaimer}</p>
  </div>
)

const NumberField = ({ id, label, value, onChange, min, max, hint }) => (
  <div className="field">
    <label htmlFor={id}>{label}</label>
    <input
      id={id}
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      value={value}
      onChange={event => onChange(event.target.value)}
    />
    {hint && <span className="hint">{hint}</span>}
  </div>
)

const Segmented = ({ ariaLabel, options, value, onChange }) => (
  <div className="segmented" role="radiogroup" aria-label={ariaLabel}>
    {options.map(option => (
      <label key={option.value}>
        <input
          type="radio"
          value={option.value}
          checked={value === option.value}
          onChange={() => onChange(option.value)}
        />
        {option.label}
      </label>
    ))}
  </div>
)

export { CalcCard, CalcResults, NumberField, Segmented }

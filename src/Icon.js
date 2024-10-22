import { Link } from 'react-router-dom'

const Icon = ({ opts }) => { 
  
  return  (
    <div className={opts.padding}>
      <Link to={opts.url} target="_blank" rel="noopener noreferrer" className="navbar-brand">
      <i className={opts.class} data-testid={opts.testId}></i>
      </Link>
    </div>
  )
}

export default Icon
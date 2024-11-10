import { Link } from 'react-router-dom'
import './Nextdoor.css'
const Nextdoor = ({opts}) => {
  return(
    <div className={opts.padding}>
      <Link to={opts.url} target="_blank" rel="noopener noreferrer" className="d-flex navbar-brand ">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          data-testid={opts.testId} 
          fill="none"
          viewBox="0 0 24 24"
          id="nextdoor">
          <path fill="#000" fill-rule="evenodd" d="M2.5 3.5C1.94772 3.5 1.5 3.94772 1.5 4.5V7.5C1.5 9.98528 3.51472 12 6 12H6.5V19.5C6.5 20.0523 6.94772 20.5 7.5 20.5H11.5C12.0523 20.5 12.5 20.0523 12.5 19.5V11.5C12.5 10.3954 13.3954 9.5 14.5 9.5C15.6046 9.5 16.5 10.3954 16.5 11.5V19.5C16.5 20.0523 16.9477 20.5 17.5 20.5H21.5C22.0523 20.5 22.5 20.0523 22.5 19.5V11.5C22.5 7.08172 18.9183 3.5 14.5 3.5C11.7541 3.5 9.33238 4.88389 7.89271 6.98846C7.66813 6.93935 7.5 6.73931 7.5 6.5V4.5C7.5 3.94772 7.05228 3.5 6.5 3.5H2.5Z" clip-rule="evenodd"></path>
        </svg>
      </Link>
    </div>
  )
}

export default Nextdoor
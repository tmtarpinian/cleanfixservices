import { useState } from 'react'
import './Form.css'
import './Contact.css'
const Contact = () => {
  const [communicationPreference, setCommunicationPreference] = useState('phone')

  const updateCommunicationPreference = (event) => {
    setCommunicationPreference(event.target.value)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    console.log(event.target)
  }

  return (
    <div className="d-flex flex-column  new-customer-form-container pb-5">
      <h3 className="d-flex justify-content-center mt-4">Contact Us</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-column d-flex justify-content-center justify-content-lg-around">
          <div className="col-8 col-md-4">
            <div className="form-group d-flex flex-column">
              <label htmlFor="inputFirstName" className="new-customer-form-label">What is your first name?</label>
              <input type="text" className="form-control" required id="inputFirstName" aria-describedby="newCustomerFirstName" placeholder="First Name" />
              <label htmlFor="inputLastName" className="new-customer-form-label">...and Last Name?</label>
              <input type="text" className="form-control" required id="inputLastName" aria-describedby="newCustomerLastName" placeholder="Last Name" />
              <label htmlFor="inputCity" className="new-customer-form-label">Job Location</label>
              <select className="form-control" id="inputCity" required>
                <option selected disabled value="">Select Location...</option>
                <option>Bloomfield Hills</option>
                <option>Farmington</option>
                <option>Farmington Hills</option>
                <option>Franklin</option>
                <option>Livonia</option>
                <option>Novi</option>
                <option>Northville</option>
                <option>Redford</option>
                <option>Southfield</option>
                <option>West Bloomfield</option>
                <option>Other</option>
              </select>
              <label htmlFor="inputJobCategory" className="new-customer-form-label">What do you want to discuss?</label>
              <select className="form-control" id="inputJobCategory">
                <option selected disabled value="">Select Category...</option>
                <option>Interior Painting</option>
                <option>Landscaping</option>
                <option>Light Plumbing</option>
                <option>Light Electrical</option>
                <option>Cleaning</option>
                <option>Gutter Cleaning</option>
                <option>Lawn Mowing</option>
                <option>Organizing</option>
              </select>

              <div className="form-group">
                <label for="inputCommunicationPreference" className="d-flex new-customer-form-label">How do you like to communicate?</label>
                <select className="form-control col-md-4" id="inputCommunicationPreference" placeholder="Enter preference" onChange={updateCommunicationPreference}>
                  <option value="phone">Phone Call</option>
                  <option value="text">Text Message</option>
                  <option value="email">Email</option>
                </select>
              </div>
              {communicationPreference == 'email' ?
                <div className="form-group">
                  <label for="inputEmail" className="new-customer-form-label">Please Enter Your Email</label>
                  <input type="email" className="form-control col-md-4" required id="inputEmail" aria-describedby="newCustomerEmail" placeholder="sample@sample.com" />
                  <small id="inputEmail" className="form-text text-muted">(We'll never share your email with anyone else)</small>
                </div>
                :
                <div className="form-row d-flex flex-wrap">
                  <div className="form-group">
                    <label for="inputPhoneNumber" className="new-customer-form-label">Please Enter your Phone Number</label>
                    <input type="tel" className="form-control col-md-4" required id="inputPhoneNumber" aria-describedby="newCustomerPhoneNumber" placeholder="123-456-7890" />
                    <small id="inputPhoneNumber" className="form-text text-muted">(We'll never share your phone number with anyone else)</small>
                  </div>
                </div>
              }
              <div className="form-group d-flex flex-wrap">
                <label for="inputNewCustomerTextArea" className="new-customer-form-label">Anything else you want to ask or share with us?</label>
                <textarea className="form-control col-md-4" id="inputNewCustomerTextArea">
                </textarea>
              </div>
              <button type="submit" className="btn btn-primary mt-4">Submit</button>
            </div>
          </div>
        </div>
      </form>

    </div>
  )
}

export default Contact

// [ ]- form validation (name length)
// [ ]- api call with axios
// [ ]-
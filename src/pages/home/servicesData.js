import plumbing from '../../assets/plumbing-sink.jpg'
import electrical from '../../assets/electrical-outlet.jpg'
import painting from '../../assets/painting.jpg'
import landscaping from '../../assets/landscaping2.jpg'

const servicesData = [
  { source: plumbing, name: 'Light plumbing', alt: 'Washing hands in a working bathroom sink', summary: 'From fixing slow-filling toilets and leaking sinks to swapping out garbage disposals, we can fix your small plumbing issues.' },
  { source: painting, name: 'Painting', alt: 'A freshly painted interior wall', summary: 'Small projects like painting a single wall or room are our wheelhouse.' },
  { source: electrical, name: 'Light electrical', alt: 'An electrical receptacle', summary: 'Updating receptacles, swapping out light fixtures, or installing ceiling fans are our most common requests.' },
  { source: landscaping, name: 'Landscaping', alt: 'A tidy landscaped yard', summary: 'Brush clearing, debris removal, one-time mowing, landscape edging installation, and gutter cleaning are the core of our services.' },
]

export default servicesData

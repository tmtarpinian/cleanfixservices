import plumbing from '../../assets/plumbing-sink.jpg'
import electrical from '../../assets/electrical-outlet.jpg'
import painting from '../../assets/painting.jpg'
import landscaping from '../../assets/landscaping2.jpg'

const servicesData = [
  {source: plumbing, name: 'light plumbing', alt: 'Washing hands in a working bathroom sink', summary: 'From fixing slow filling toilets and leaking sinks, to swapping out garbage disposals, we can fix your small plubming issues.', path: '/'},
  {source: painting, name: 'painting', alt: 'Service Image', summary: 'Small projects like painting a single wall or room are our wheelhouse.', path: '/'},
  {source: electrical, name: 'light electrical', alt: 'electrical receptacle', summary: 'Updating receptacles, swapping out light fixtures or installing ceiling fans are our most common requests.', path: '/'},
  {source: landscaping, name: 'landscaping', alt: 'Service Image', summary: 'Brush clearing, debris removal, one-time mowing, landscape edging installation, and gutter cleaning are the core of our services.', path: '/'},

]
export default servicesData
import { Link, useParams } from 'react-router-dom';
import { SEO } from '../components/SEO';

const capitalize = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

export default function StatePage() {
  const { state } = useParams<{ state: string }>();
  const stateName = state ? capitalize(state) : 'Unknown State';

  const cities = [
    { name: 'Chicago', slug: 'chicago' },
    { name: 'Springfield', slug: 'springfield' },
    { name: 'Aurora', slug: 'aurora' },
    { name: 'Naperville', slug: 'naperville' },
    // Add more mock cities
  ];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <SEO 
        title={`Skimmer Reports in ${stateName} | SkimmerWatch`}
        description={`Active card skimmer reports and safety alerts for ${stateName}. Browse by city.`}
        canonical={`https://skimmer-report.vercel.app/locations/${state}`}
      />
      
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:underline">Home</Link> &gt;{' '}
        <Link to="/locations" className="hover:underline">Locations</Link> &gt;{' '}
        <span className="text-gray-900">{stateName}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-6">Skimmer Reports in {stateName}</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cities.map(city => (
          <Link 
            key={city.slug} 
            to={`/locations/${state}/${city.slug}`}
            className="block p-4 border rounded hover:bg-gray-50 text-blue-600 font-medium"
          >
            {city.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

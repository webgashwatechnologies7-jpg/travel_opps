import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';

const TopDestinationsTable = ({ title = "Top Destinations" }) => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      const response = await dashboardAPI.topDestinations();
      setDestinations(response.data.data || []);
    } catch (err) {
      setError('Failed to load destinations data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        {title && (
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
        )}
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        {title && (
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
        )}
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {title && (
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
      )}
      <div className="space-y-2">
        {destinations.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No destinations data available</p>
        ) : (
          destinations.slice(0, 6).map((dest, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <span className="text-sm text-gray-800">{dest.destination}</span>
              <span className="text-sm font-semibold text-gray-800">{dest.total}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TopDestinationsTable;


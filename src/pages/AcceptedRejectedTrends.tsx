import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface TrendRequest {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  reason: string;
  status: 'approved' | 'rejected';
  created_at: string;
}

export default function AcceptedRejectedTrends() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [trends, setTrends] = useState<TrendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/trend-requests/public`);
      if (response.ok) {
        const data = await response.json();
        setTrends(data);
      } else {
        setError('fetchError');
      }
    } catch (err) {
      setError('networkError');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">
              {t('viewTrendsButton')}
            </h1>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {t('submitNewRequestButton')}
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
              {t(error)}
            </div>
          )}

          <div className="space-y-6">
            {trends.map((trend) => (
              <div key={trend.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium">
                      {trend.firstName} {trend.middleName} {trend.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(trend.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-md text-sm ${
                    trend.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {t(`${trend.status}Status`)}
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{trend.reason}</p>
              </div>
            ))}
            {trends.length === 0 && (
              <p className="text-gray-600 text-center py-8">
                {t('noTrendsMessage')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

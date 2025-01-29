import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface TrendRequest {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  picoId: string;
  reason: string;
  status: 'under_review' | 'approved' | 'rejected';
  created_at: string;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<TrendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/trend-requests`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else if (response.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/');
      } else {
        setError('fetchError');
      }
    } catch (err) {
      setError('networkError');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/trend-requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchRequests();
      } else if (response.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/');
      }
    } catch (err) {
      setError('networkError');
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
          <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
              {t(error)}
            </div>
          )}
          <div className="space-y-6">
            {requests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium">
                      {request.firstName} {request.middleName} {request.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{request.email}</p>
                    <p className="text-sm text-gray-600">Pico ID: {request.picoId}</p>
                  </div>
                  <div className="flex gap-2">
                    {request.status === 'under_review' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(request.id, 'approved')}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          {t('approvedStatus')}
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(request.id, 'rejected')}
                          className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                        >
                          {t('rejectedStatus')}
                        </button>
                      </>
                    )}
                    <span className={`px-3 py-1 rounded-md text-sm ${
                      request.status === 'under_review' ? 'bg-red-100 text-red-800' :
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {t(`${request.status}Status`)}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{request.reason}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(request.created_at).toLocaleString()}
                </p>
              </div>
            ))}
            {requests.length === 0 && (
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

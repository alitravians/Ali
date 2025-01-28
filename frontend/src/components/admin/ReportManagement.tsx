import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth';

interface Report {
  id: number;
  reporter_id: number;
  target_id: number;
  report_type: string;
  reason: string;
  details: string;
  status: string;
  created_at: string;
  moderator_notes?: string;
}

export function ReportManagement() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/reports`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleUpdateReport = async () => {
    if (!selectedReport) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/${selectedReport.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          status,
          moderator_notes: moderatorNotes
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update report');
      }
      
      fetchReports();
      setSelectedReport(null);
      setModeratorNotes('');
      setStatus('');
    } catch (error) {
      console.error('Error updating report:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Report Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Report #{report.id}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(report.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p><strong>Type:</strong> {report.report_type}</p>
                  <p><strong>Reason:</strong> {report.reason}</p>
                  <p><strong>Details:</strong> {report.details}</p>
                  <p><strong>Status:</strong> {report.status}</p>
                  {report.moderator_notes && (
                    <p><strong>Moderator Notes:</strong> {report.moderator_notes}</p>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedReport(report);
                      setModeratorNotes(report.moderator_notes || '');
                      setStatus(report.status);
                    }}
                  >
                    Review
                  </Button>
                </div>
              </Card>
            ))}

            {selectedReport && (
              <Card className="p-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Update Report #{selectedReport.id}</h3>
                  
                  <div>
                    <Select
                      value={status}
                      onValueChange={setStatus}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Textarea
                      value={moderatorNotes}
                      onChange={(e) => setModeratorNotes(e.target.value)}
                      placeholder="Add moderator notes..."
                      className="mt-1"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={handleUpdateReport}>
                      Update Report
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedReport(null);
                        setModeratorNotes('');
                        setStatus('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

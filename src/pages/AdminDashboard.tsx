import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, CheckCircle, Clock, XCircle, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TrendRequest {
  id: string
  first_name: string
  middle_name?: string
  last_name: string
  email: string
  pico_id: string
  reason: string
  status: "under_review" | "approved" | "rejected"
  created_at: string
}

export default function AdminDashboard() {
  const [requests, setRequests] = React.useState<TrendRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const [approving, setApproving] = React.useState<number | null>(null)
  const [error, setError] = React.useState("")
  const [sortField, setSortField] = React.useState<keyof TrendRequest>("email")
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  React.useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setError("")
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      console.log('Admin token:', token ? 'Present' : 'Missing')
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/trend-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
      } else {
        const data = await response.json()
        setError(data.detail || 'Failed to fetch requests')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const [rejecting, setRejecting] = React.useState<number | null>(null)

  const handleApprove = async (requestToApprove: TrendRequest) => {
    const index = requests.findIndex(r => r.id === requestToApprove.id)
    setApproving(index)
    setError("")
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/trend-requests/${requestToApprove.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      
      if (response.ok) {
        fetchRequests()
      } else {
        const data = await response.json()
        setError(data.detail || 'Failed to approve request')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setApproving(null)
    }
  }

  const handleReject = async (requestToReject: TrendRequest) => {
    const index = requests.findIndex(r => r.id === requestToReject.id)
    setRejecting(index)
    setError("")
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/trend-requests/${requestToReject.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      
      if (response.ok) {
        fetchRequests()
      } else {
        const data = await response.json()
        setError(data.detail || 'Failed to reject request')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setRejecting(null)
    }
  }

  const sortedRequests = React.useMemo(() => {
    return [...requests]
      .filter(request => {
        const searchLower = searchTerm.toLowerCase()
        return (
          request.first_name.toLowerCase().includes(searchLower) ||
          request.last_name.toLowerCase().includes(searchLower) ||
          request.email.toLowerCase().includes(searchLower) ||
          request.pico_id.toLowerCase().includes(searchLower)
        )
      })
      .sort((a, b) => {
        const aValue = String(a[sortField] || '')
        const bValue = String(b[sortField] || '')
        const direction = sortDirection === "asc" ? 1 : -1
        return aValue.localeCompare(bValue) * direction
      })
  }, [requests, sortField, sortDirection, searchTerm])

  const handleSort = (field: keyof TrendRequest) => {
    setSortField(field)
    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96 text-center p-6">
          <CardContent className="space-y-4">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <CardTitle>Loading Requests</CardTitle>
            <CardDescription>Please wait while we fetch the trend requests...</CardDescription>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Trend Requests Dashboard</CardTitle>
            <CardDescription className="text-gray-500">Review and manage trend requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div className="flex-1 max-w-sm">
                <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              </div>
              <Button
                variant="outline"
                onClick={fetchRequests}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  {error}
                </AlertDescription>
              </Alert>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort("first_name")} className="cursor-pointer">
                    <div className="flex items-center">
                      Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("email")} className="cursor-pointer">
                    <div className="flex items-center">
                      Email
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("pico_id")} className="cursor-pointer">
                    <div className="flex items-center">
                      Pico ID
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead onClick={() => handleSort("status")} className="cursor-pointer">
                    <div className="flex items-center">
                      Status
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-64"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  sortedRequests
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((request, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {request.first_name} {request.middle_name} {request.last_name}
                        </TableCell>
                        <TableCell>{request.email}</TableCell>
                        <TableCell>{request.pico_id}</TableCell>
                        <TableCell className="max-w-md">
                          <div className="truncate">{request.reason}</div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              request.status === 'approved' ? 'default' :
                              request.status === 'rejected' ? 'destructive' :
                              'secondary'
                            }
                            className={`flex w-fit items-center gap-1 ${
                              request.status === 'approved' ? 'bg-green-100 text-green-800' :
                              request.status === 'rejected' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            {request.status === 'approved' ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : request.status === 'rejected' ? (
                              <XCircle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {request.status === 'approved' ? 'Approved' :
                             request.status === 'rejected' ? 'Rejected' :
                             'Under Review'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {request.status === 'under_review' && (
                            <div className="flex flex-col gap-2">
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleApprove(request)}
                                  variant="outline"
                                  className="bg-green-50 text-green-600 hover:bg-green-100 flex-1"
                                  disabled={approving === requests.findIndex(r => r.id === request.id) || rejecting === requests.findIndex(r => r.id === request.id)}
                                >
                                  {approving === requests.findIndex(r => r.id === request.id) ? (
                                    <div className="flex items-center gap-2">
                                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
                                      Approving...
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="h-4 w-4" />
                                      Approve
                                    </div>
                                  )}
                                </Button>
                                <Button
                                  onClick={() => handleReject(request)}
                                  variant="outline"
                                  className="bg-red-50 text-red-600 hover:bg-red-100 flex-1"
                                  disabled={rejecting === requests.findIndex(r => r.id === request.id) || approving === requests.findIndex(r => r.id === request.id)}
                                >
                                  {rejecting === requests.findIndex(r => r.id === request.id) ? (
                                    <div className="flex items-center gap-2">
                                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                                      Rejecting...
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <XCircle className="h-4 w-4" />
                                      Reject
                                    </div>
                                  )}
                                </Button>
                              </div>
                              {error && (requests.findIndex(r => r.id === request.id) === approving || requests.findIndex(r => r.id === request.id) === rejecting) && (
                                <div className="text-sm text-red-500 flex items-center gap-1">
                                  <XCircle className="h-4 w-4" />
                                  {error}
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
            {!loading && sortedRequests.length > itemsPerPage && (
              <div className="mt-4 flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from(
                    { length: Math.ceil(sortedRequests.length / itemsPerPage) },
                    (_, i) => (
                      <Button
                        key={i + 1}
                        variant={currentPage === i + 1 ? "default" : "outline"}
                        onClick={() => setCurrentPage(i + 1)}
                        className="w-8 h-8 p-0"
                      >
                        {i + 1}
                      </Button>
                    )
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(sortedRequests.length / itemsPerPage), p + 1))}
                  disabled={currentPage === Math.ceil(sortedRequests.length / itemsPerPage)}
                >
                  Next
                </Button>
              </div>
            )}
            {!loading && sortedRequests.length === 0 && (
              <div className="text-center py-8">
                <CardDescription>No trend requests found</CardDescription>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

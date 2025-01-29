import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import TrendRequestForm from "./pages/TrendRequestForm"
import AdminDashboard from "./pages/AdminDashboard"
import AcceptedRejectedTrends from "./pages/AcceptedRejectedTrends"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TrendRequestForm />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/trends" element={<AcceptedRejectedTrends />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

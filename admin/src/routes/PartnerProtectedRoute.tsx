import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/ui/Spinner'

export const PartnerProtectedRoute: React.FC = () => {
  const { isAuthenticated, isSeller, isLoading } = useAuth()

  if (isLoading) {
    return <Spinner fullPage />
  }

  if (!isAuthenticated || !isSeller) {
    return <Navigate to="/partner/login" replace />
  }

  return <Outlet />
}

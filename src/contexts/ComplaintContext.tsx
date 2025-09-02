import React, { createContext, useContext, useState } from 'react'

export interface PendingComplaintData {
  category: string
  description: string
  location_address?: string
  latitude?: number
  longitude?: number
  is_public: boolean
  files?: File[]
}

interface ComplaintContextType {
  pendingComplaint: PendingComplaintData | null
  setPendingComplaint: (complaint: PendingComplaintData | null) => void
  clearPendingComplaint: () => void
}

const ComplaintContext = createContext<ComplaintContextType | undefined>(undefined)

export const useComplaint = () => {
  const context = useContext(ComplaintContext)
  if (context === undefined) {
    throw new Error('useComplaint must be used within a ComplaintProvider')
  }
  return context
}

interface ComplaintProviderProps {
  children: React.ReactNode
}

export const ComplaintProvider: React.FC<ComplaintProviderProps> = ({ children }) => {
  const [pendingComplaint, setPendingComplaint] = useState<PendingComplaintData | null>(null)

  const clearPendingComplaint = () => {
    setPendingComplaint(null)
  }

  const value = {
    pendingComplaint,
    setPendingComplaint,
    clearPendingComplaint,
  }

  return <ComplaintContext.Provider value={value}>{children}</ComplaintContext.Provider>
}

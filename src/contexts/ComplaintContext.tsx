import React, { createContext, useContext, useState } from 'react'

export interface PendingComplaintData {
  category: string
  description: string
  location_address?: string
  latitude?: number
  longitude?: number
  is_public: boolean
  files?: File[] // Store files in memory for upload after login
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
  // Initialize from localStorage if available (for OAuth redirects)
  const [pendingComplaint, setPendingComplaint] = useState<PendingComplaintData | null>(() => {
    try {
      const stored = localStorage.getItem('pendingComplaint')
      const parsed = stored ? JSON.parse(stored) : null
      console.log('ComplaintContext: Loading from localStorage:', parsed)
      return parsed
    } catch (error) {
      console.error('ComplaintContext: Error loading from localStorage:', error)
      return null
    }
  })

  const clearPendingComplaint = () => {
    setPendingComplaint(null)
    localStorage.removeItem('pendingComplaint')
  }

  // Store complaint data in localStorage (without files) for OAuth redirects
  const updatePendingComplaint = (complaint: PendingComplaintData | null) => {
    console.log('ComplaintContext: Setting pending complaint:', complaint)
    setPendingComplaint(complaint)
    
    if (complaint) {
      // Store complaint data without files (files can't be serialized)
      const complaintWithoutFiles = {
        ...complaint,
        files: undefined
      }
      localStorage.setItem('pendingComplaint', JSON.stringify(complaintWithoutFiles))
      console.log('ComplaintContext: Saved to localStorage (without files)')
    } else {
      localStorage.removeItem('pendingComplaint')
      console.log('ComplaintContext: Removed from localStorage')
    }
  }

  const value = {
    pendingComplaint,
    setPendingComplaint: updatePendingComplaint,
    clearPendingComplaint,
  }

  return <ComplaintContext.Provider value={value}>{children}</ComplaintContext.Provider>
}

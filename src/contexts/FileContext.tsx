import React, { createContext, useContext, useState } from 'react'

export interface StoredFile {
  name: string
  type: string
  size: number
  data: string // base64 encoded file data
}

interface FileContextType {
  pendingFiles: StoredFile[]
  setPendingFiles: (files: StoredFile[]) => void
  clearPendingFiles: () => void
}

const FileContext = createContext<FileContextType | undefined>(undefined)

export const useFiles = () => {
  const context = useContext(FileContext)
  if (context === undefined) {
    throw new Error('useFiles must be used within a FileProvider')
  }
  return context
}

interface FileProviderProps {
  children: React.ReactNode
}

export const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
  // Initialize from localStorage if available
  const [pendingFiles, setPendingFiles] = useState<StoredFile[]>(() => {
    try {
      const stored = localStorage.getItem('pendingFiles')
      const parsed = stored ? JSON.parse(stored) : []
      console.log('FileContext: Loading files from localStorage:', parsed.length, 'files')
      return parsed
    } catch (error) {
      console.error('FileContext: Error loading files from localStorage:', error)
      return []
    }
  })

  const clearPendingFiles = () => {
    setPendingFiles([])
    localStorage.removeItem('pendingFiles')
    console.log('FileContext: Cleared pending files')
  }

  // Store files in localStorage for OAuth redirects
  const updatePendingFiles = (files: StoredFile[]) => {
    console.log('FileContext: Setting pending files:', files.length, 'files')
    setPendingFiles(files)
    
    if (files.length > 0) {
      localStorage.setItem('pendingFiles', JSON.stringify(files))
      console.log('FileContext: Saved files to localStorage')
    } else {
      localStorage.removeItem('pendingFiles')
      console.log('FileContext: Removed files from localStorage')
    }
  }

  const value = {
    pendingFiles,
    setPendingFiles: updatePendingFiles,
    clearPendingFiles,
  }

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>
}

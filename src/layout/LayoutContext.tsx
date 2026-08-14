import { createContext, useContext, useState, ReactNode } from 'react'

export interface HeaderConfig {
  title: string
  subtitle?: string
  backTo?: string
  backTitle?: string
}

interface LayoutContextType {
  headerConfig: HeaderConfig
  setHeaderConfig: (config: HeaderConfig) => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>({ title: '' })

  return (
    <LayoutContext.Provider value={{ headerConfig, setHeaderConfig }}>
      {children}
    </LayoutContext.Provider>
  )
}

export function useHeader() {
  const context = useContext(LayoutContext)
  if (!context) {
    throw new Error('useHeader must be used within a LayoutProvider')
  }
  return context
}

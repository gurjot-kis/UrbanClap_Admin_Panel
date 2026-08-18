import React, { createContext, useContext, useState, type ReactNode } from 'react';

export interface HeaderConfig {
  title?: string;
  subtitle?: string;
  backTo?: string | null;
  backTitle?: string;
}

interface LayoutContextType {
  headerConfig: HeaderConfig;
  setHeaderConfig: React.Dispatch<React.SetStateAction<HeaderConfig>>;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>({
    title: 'Dashboard',
    subtitle: '',
    backTo: null,
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  return (
    <LayoutContext.Provider
      value={{ headerConfig, setHeaderConfig, isSidebarOpen, setIsSidebarOpen }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout(): LayoutContextType {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}

// Backward compatibility if you have other files importing useHeader
export const useHeader = useLayout;
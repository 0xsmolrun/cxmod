import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type DataSource = 'notion' | 'supabase';

interface SettingsContextType {
  dataSource: DataSource;
  setDataSource: (source: DataSource) => void;
  notionConfig: {
    token: string;
    databaseId: string;
  };
  setNotionConfig: (config: { token: string; databaseId: string }) => void;
  supabaseConfig: {
    url: string;
    anonKey: string;
  };
  setSupabaseConfig: (config: { url: string; anonKey: string }) => void;
  isConfigured: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  // Default to supabase since that's what's configured in the environment
  const [dataSource, setDataSource] = useState<DataSource>('supabase');
  const [notionConfig, setNotionConfig] = useState({
    token: '',
    databaseId: '',
  });
  const [supabaseConfig, setSupabaseConfig] = useState({
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  });

  // For supabase, check if environment variables are configured
  const isConfigured = dataSource === 'notion' 
    ? notionConfig.token && notionConfig.databaseId
    : supabaseConfig.url && supabaseConfig.anonKey;

  useEffect(() => {
    // Load saved settings from localStorage
    const savedDataSource = localStorage.getItem('data_source') as DataSource;
    const savedNotionToken = localStorage.getItem('notion_token');
    const savedNotionDatabaseId = localStorage.getItem('notion_database_id');
    const savedSupabaseUrl = localStorage.getItem('supabase_url');
    const savedSupabaseKey = localStorage.getItem('supabase_anon_key');

    if (savedDataSource) {
      setDataSource(savedDataSource);
    }

    if (savedNotionToken || savedNotionDatabaseId) {
      setNotionConfig({
        token: savedNotionToken || '',
        databaseId: savedNotionDatabaseId || '',
      });
    }

    if (savedSupabaseUrl || savedSupabaseKey) {
      setSupabaseConfig({
        url: savedSupabaseUrl || import.meta.env.VITE_SUPABASE_URL || '',
        anonKey: savedSupabaseKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('data_source', dataSource);
  }, [dataSource]);

  useEffect(() => {
    if (notionConfig.token) localStorage.setItem('notion_token', notionConfig.token);
    if (notionConfig.databaseId) localStorage.setItem('notion_database_id', notionConfig.databaseId);
  }, [notionConfig]);

  useEffect(() => {
    if (supabaseConfig.url) localStorage.setItem('supabase_url', supabaseConfig.url);
    if (supabaseConfig.anonKey) localStorage.setItem('supabase_anon_key', supabaseConfig.anonKey);
  }, [supabaseConfig]);

  return (
    <SettingsContext.Provider
      value={{
        dataSource,
        setDataSource,
        notionConfig,
        setNotionConfig,
        supabaseConfig,
        setSupabaseConfig,
        isConfigured,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
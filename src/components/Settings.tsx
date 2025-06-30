import React, { useState } from 'react';
import { Settings as SettingsIcon, Database, FileText, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { GlassCard } from './ui/GlassCard';
import { useSettings } from '../contexts/SettingsContext';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const {
    dataSource,
    setDataSource,
    notionConfig,
    setNotionConfig,
    supabaseConfig,
    setSupabaseConfig,
  } = useSettings();

  const [showNotionToken, setShowNotionToken] = useState(false);
  const [showSupabaseKey, setShowSupabaseKey] = useState(false);

  if (!isOpen) return null;

  const handleNotionConfigChange = (field: string, value: string) => {
    setNotionConfig({ ...notionConfig, [field]: value });
  };

  const handleSupabaseConfigChange = (field: string, value: string) => {
    setSupabaseConfig({ ...supabaseConfig, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Settings</h2>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            ×
          </Button>
        </div>

        <div className="space-y-8">
          {/* Data Source Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Data Source</h3>
            <Select
              value={dataSource}
              onChange={(value) => setDataSource(value as 'notion' | 'supabase')}
              options={[
                { value: 'notion', label: 'Notion Database' },
                { value: 'supabase', label: 'Supabase Database' },
              ]}
              className="w-full"
            />
          </div>

          {/* Notion Configuration */}
          {dataSource === 'notion' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Notion Configuration</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Integration Token
                </label>
                <div className="relative">
                  <Input
                    type={showNotionToken ? 'text' : 'password'}
                    value={notionConfig.token}
                    onChange={(value) => handleNotionConfigChange('token', value)}
                    placeholder="secret_..."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNotionToken(!showNotionToken)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showNotionToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Create an integration at notion.so/my-integrations
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Database ID
                </label>
                <Input
                  type="text"
                  value={notionConfig.databaseId}
                  onChange={(value) => handleNotionConfigChange('databaseId', value)}
                  placeholder="32-character database ID"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Found in your Notion database URL
                </p>
              </div>
            </div>
          )}

          {/* Supabase Configuration */}
          {dataSource === 'supabase' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Supabase Configuration</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project URL
                </label>
                <Input
                  type="url"
                  value={supabaseConfig.url}
                  onChange={(value) => handleSupabaseConfigChange('url', value)}
                  placeholder="https://your-project.supabase.co"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Found in your Supabase project settings
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Anon Key
                </label>
                <div className="relative">
                  <Input
                    type={showSupabaseKey ? 'text' : 'password'}
                    value={supabaseConfig.anonKey}
                    onChange={(value) => handleSupabaseConfigChange('anonKey', value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showSupabaseKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Public anon key from your Supabase project API settings
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-400 mb-2">Database Schema Requirements</h4>
                <p className="text-xs text-gray-300 mb-2">
                  Your Supabase table should have these columns (names can vary):
                </p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• <code>ticket_id</code> - Unique identifier</li>
                  <li>• <code>status</code> - Ticket status (Not Started, Reviewed by Dev, Waiting on Mod, Under Review, In Dev, In QA, Waiting on User, Under Review - Sumsub, Under Review - Provenance, Under Review - Rain, Under Review - Core Team, Resolved)</li>
                  <li>• <code>issue_description</code> - Problem description</li>
                  <li>• <code>wallet_address_safe_email</code> - Contact info (Wallet Address/Safe/Cash ID/Email)</li>
                  <li>• <code>product</code> - Product category</li>
                  <li>• <code>category</code> - Issue category</li>
                  <li>• <code>severity</code> - Priority level (SEV-1 to SEV-5)</li>
                  <li>• <code>created_at</code> - Creation timestamp</li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Save Settings
            </Button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
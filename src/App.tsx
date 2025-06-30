import React, { useState } from 'react';
import { 
  Ticket, 
  Plus, 
  Search, 
  BarChart3, 
  Settings as SettingsIcon,
  AlertCircle,
  Moon,
  Sun,
  Menu,
  X,
  Calculator,
  Heart,
  TrendingUp,
  MessageSquare,
  ExternalLink,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useTickets } from './hooks/useTickets';
import { useFeedback } from './hooks/useFeedback';
import { useTheme } from './contexts/ThemeContext';
import { Ticket as TicketType, TicketFormData, TicketStatus } from './types/ticket';
import { Feedback as FeedbackType, FeedbackFormData } from './types/feedback';
import { Button } from './components/ui/Button';
import { GlassCard } from './components/ui/GlassCard';
import { TicketCard } from './components/TicketCard';
import { TicketForm } from './components/TicketForm';
import { SearchFilters } from './components/SearchFilters';
import { Analytics } from './components/Analytics';
import { Footer } from './components/Footer';
import { TicketGallery } from './components/TicketGallery';
import { KarakPointsCalculator } from './components/KarakPointsCalculator';
import { EtherFiLoyaltyCalculator } from './components/EtherFiLoyaltyCalculator';
import { APYSimulator } from './components/APYSimulator';
import { FeedbackCard } from './components/FeedbackCard';
import { FeedbackForm } from './components/FeedbackForm';
import { FeedbackFilters } from './components/FeedbackFilters';
import { FeedbackGallery } from './components/FeedbackGallery';

type TabType = 'tickets' | 'search' | 'analytics' | 'karak' | 'etherfi' | 'apy' | 'feedback';

interface NavigationSection {
  title: string;
  items: {
    key: TabType | 'sniffmixer';
    label: string;
    icon: React.ComponentType<any>;
    href?: string;
    external?: boolean;
  }[];
  collapsible?: boolean;
}

const navigationSections: NavigationSection[] = [
  {
    title: 'Support Management',
    items: [
      { key: 'tickets', label: 'Tickets', icon: Ticket },
      { key: 'search', label: 'Search', icon: Search },
      { key: 'analytics', label: 'Analytics', icon: BarChart3 },
      { key: 'feedback', label: 'Feedback', icon: MessageSquare }
    ]
  },
  {
    title: 'CX Tools',
    collapsible: true,
    items: [
      { key: 'karak', label: 'Karak Points', icon: Calculator },
      { key: 'etherfi', label: 'Ether.fi Loyalty', icon: Heart },
      { key: 'apy', label: 'APY Simulator', icon: TrendingUp },
      { 
        key: 'sniffmixer', 
        label: 'SniffMixer', 
        icon: ExternalLink, 
        href: 'https://sniffmixer.netlify.app/',
        external: true 
      }
    ]
  }
];

function App() {
  const { isDark, toggleTheme } = useTheme();
  const { 
    tickets, 
    loading: ticketsLoading, 
    error: ticketsError, 
    createTicket, 
    updateTicket, 
    deleteTicket,
    bulkDeleteTickets,
    bulkUpdateTicketStatus,
    searchTickets, 
    fetchTickets 
  } = useTickets();

  const {
    feedback,
    loading: feedbackLoading,
    error: feedbackError,
    createFeedback,
    updateFeedback,
    deleteFeedback,
    bulkDeleteFeedback,
    searchFeedback,
    fetchFeedback
  } = useFeedback();

  const [activeTab, setActiveTab] = useState<TabType>('tickets');
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<FeedbackType | null>(null);
  const [searchResults, setSearchResults] = useState<TicketType[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Get the 5 most recent tickets based on Ticket ID (higher number = more recent)
  const recentTickets = React.useMemo(() => {
    return [...tickets]
      .sort((a, b) => {
        // Convert ticket IDs to numbers for comparison, fallback to string comparison
        const aId = parseInt(a.ticket_id) || 0;
        const bId = parseInt(b.ticket_id) || 0;
        
        if (aId !== bId) {
          return bId - aId; // Higher ticket ID first
        }
        
        // If ticket IDs are the same or both non-numeric, sort by creation date
        return new Date(b.date_created).getTime() - new Date(a.date_created).getTime();
      })
      .slice(0, 5);
  }, [tickets]);

  // Get the 5 most recent feedback items
  const recentFeedback = React.useMemo(() => {
    return [...feedback]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [feedback]);

  const handleCreateTicket = async (data: TicketFormData) => {
    try {
      await createTicket(data);
      setShowTicketForm(false);
    } catch (error) {
      console.error('Failed to create ticket:', error);
    }
  };

  const handleUpdateTicket = async (data: TicketFormData) => {
    if (!editingTicket) return;
    
    try {
      await updateTicket(editingTicket.id, data);
      setEditingTicket(null);
    } catch (error) {
      console.error('Failed to update ticket:', error);
    }
  };

  const handleDeleteTicket = async (id: string) => {
    if (confirm('Are you sure you want to delete this ticket?')) {
      try {
        await deleteTicket(id);
      } catch (error) {
        console.error('Failed to delete ticket:', error);
      }
    }
  };

  const handleBulkDeleteTickets = async (ids: string[]) => {
    try {
      await bulkDeleteTickets(ids);
    } catch (error) {
      console.error('Failed to bulk delete tickets:', error);
    }
  };

  const handleBulkUpdateTicketStatus = async (ids: string[], status: TicketStatus) => {
    try {
      await bulkUpdateTicketStatus(ids, status);
    } catch (error) {
      console.error('Failed to bulk update ticket status:', error);
    }
  };

  const handleEditTicket = (ticket: TicketType) => {
    setEditingTicket(ticket);
  };

  const handleCreateFeedback = async (data: FeedbackFormData) => {
    try {
      await createFeedback(data);
      setShowFeedbackForm(false);
    } catch (error) {
      console.error('Failed to create feedback:', error);
    }
  };

  const handleUpdateFeedback = async (data: FeedbackFormData) => {
    if (!editingFeedback) return;
    
    try {
      await updateFeedback(editingFeedback.id, data);
      setEditingFeedback(null);
    } catch (error) {
      console.error('Failed to update feedback:', error);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (confirm('Are you sure you want to delete this feedback?')) {
      try {
        await deleteFeedback(id);
      } catch (error) {
        console.error('Failed to delete feedback:', error);
      }
    }
  };

  const handleBulkDeleteFeedback = async (ids: string[]) => {
    try {
      await bulkDeleteFeedback(ids);
    } catch (error) {
      console.error('Failed to bulk delete feedback:', error);
    }
  };

  const handleEditFeedback = (feedback: FeedbackType) => {
    setEditingFeedback(feedback);
  };

  const handleSearch = async (filters: any) => {
    try {
      await searchTickets(filters);
      setIsSearchMode(true);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleClearSearch = () => {
    fetchTickets();
    setIsSearchMode(false);
  };

  const handleFeedbackSearch = async (filters: any) => {
    try {
      await searchFeedback(filters);
    } catch (error) {
      console.error('Feedback search failed:', error);
    }
  };

  const handleClearFeedbackSearch = () => {
    fetchFeedback();
  };

  const handleLogoClick = () => {
    setActiveTab('tickets');
    setMobileMenuOpen(false);
  };

  const handleNavigationClick = (item: NavigationSection['items'][0]) => {
    if (item.external && item.href) {
      window.open(item.href, '_blank', 'noopener,noreferrer');
    } else if (item.key !== 'sniffmixer') {
      setActiveTab(item.key as TabType);
      setMobileMenuOpen(false);
    }
  };

  const toggleSection = (sectionTitle: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionTitle)) {
      newCollapsed.delete(sectionTitle);
    } else {
      newCollapsed.add(sectionTitle);
    }
    setCollapsedSections(newCollapsed);
  };

  const renderNavigationSection = (section: NavigationSection, isMobile = false) => {
    const isCollapsed = section.collapsible && collapsedSections.has(section.title);
    
    return (
      <div key={section.title} className="space-y-2">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
            {section.title}
          </h3>
          {section.collapsible && (
            <button
              onClick={() => toggleSection(section.title)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        
        {/* Section Items */}
        {!isCollapsed && (
          <div className="space-y-1">
            {section.items.map((item) => (
              <Button
                key={item.key}
                variant={
                  (item.key === activeTab && !item.external) ? 'primary' : 'ghost'
                }
                icon={item.icon}
                onClick={() => handleNavigationClick(item)}
                className={`justify-start w-full ${isMobile ? 'text-left' : ''}`}
                size="sm"
              >
                <span className="flex items-center gap-2">
                  {item.label}
                  {item.external && <ExternalLink className="w-3 h-3" />}
                </span>
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tickets':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Tickets</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Showing the 5 most recent tickets (sorted by Ticket ID)
                </p>
              </div>
              <Button
                icon={Plus}
                onClick={() => setShowTicketForm(true)}
                className="w-full sm:w-auto"
              >
                Create Ticket
              </Button>
            </div>

            {ticketsError && (
              <GlassCard className="border-red-200 bg-red-50/10 dark:border-red-800 dark:bg-red-900/10">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span>{ticketsError}</span>
                </div>
              </GlassCard>
            )}

            {ticketsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-64"></div>
                  </div>
                ))}
              </div>
            ) : recentTickets.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                  {recentTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onEdit={handleEditTicket}
                      onDelete={handleDeleteTicket}
                    />
                  ))}
                </div>
                
                {tickets.length > 5 && (
                  <GlassCard className="text-center py-6">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Showing 5 of {tickets.length} total tickets. Use the Search tab to view all tickets.
                    </p>
                    <Button
                      variant="secondary"
                      onClick={() => setActiveTab('search')}
                      className="w-full sm:w-auto"
                    >
                      View All Tickets
                    </Button>
                  </GlassCard>
                )}
              </>
            ) : (
              <GlassCard className="text-center py-12">
                <Ticket className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No tickets found</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Get started by creating your first support ticket.</p>
                <Button
                  icon={Plus}
                  onClick={() => setShowTicketForm(true)}
                  className="w-full sm:w-auto"
                >
                  Create First Ticket
                </Button>
              </GlassCard>
            )}
          </div>
        );

      case 'search':
        // Always show current tickets state (either all tickets or search results)
        const displayTickets = tickets;
        
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Search & Filter</h2>
            
            {ticketsError && (
              <GlassCard className="border-red-200 bg-red-50/10 dark:border-red-800 dark:bg-red-900/10">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span>{ticketsError}</span>
                </div>
              </GlassCard>
            )}
            
            <SearchFilters onSearch={handleSearch} onClear={handleClearSearch} />
            
            <TicketGallery
              tickets={displayTickets}
              onEdit={handleEditTicket}
              onDelete={handleDeleteTicket}
              onBulkDelete={handleBulkDeleteTickets}
              onBulkStatusUpdate={handleBulkUpdateTicketStatus}
              loading={ticketsLoading}
            />
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
            <Analytics tickets={tickets} />
          </div>
        );

      case 'feedback':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <MessageSquare className="w-8 h-8 text-blue-400" />
                  Feedback & Feature Requests
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Manage user feedback and feature requests from multiple platforms
                </p>
              </div>
              <Button
                icon={Plus}
                onClick={() => setShowFeedbackForm(true)}
                className="w-full sm:w-auto"
              >
                Create Feedback
              </Button>
            </div>

            {feedbackError && (
              <GlassCard className="border-red-200 bg-red-50/10 dark:border-red-800 dark:bg-red-900/10">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span>{feedbackError}</span>
                </div>
              </GlassCard>
            )}

            <FeedbackFilters onSearch={handleFeedbackSearch} onClear={handleClearFeedbackSearch} />
            
            <FeedbackGallery
              feedback={feedback}
              onEdit={handleEditFeedback}
              onDelete={handleDeleteFeedback}
              onBulkDelete={handleBulkDeleteFeedback}
              loading={feedbackLoading}
            />
          </div>
        );

      case 'karak':
        return <KarakPointsCalculator />;

      case 'etherfi':
        return <EtherFiLoyaltyCalculator />;

      case 'apy':
        return <APYSimulator />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-white/20 dark:border-gray-700/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Clickable Logo and Brand */}
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-1"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                <img 
                  src="/Desktop - 12.png" 
                  alt="CXMod Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">CXMod</h1>
              <span className="hidden sm:inline text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                Powered by Supabase
              </span>
            </button>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              <nav className="flex gap-6">
                {navigationSections.map((section) => (
                  <div key={section.title} className="flex items-center gap-2">
                    {section.title === 'CX Tools' && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {section.title}:
                      </span>
                    )}
                    <div className="flex gap-1">
                      {section.items.map((item) => (
                        <Button
                          key={item.key}
                          variant={
                            (item.key === activeTab && !item.external) ? 'primary' : 'ghost'
                          }
                          icon={item.icon}
                          onClick={() => handleNavigationClick(item)}
                          size="sm"
                        >
                          <span className="flex items-center gap-1">
                            {item.label}
                            {item.external && <ExternalLink className="w-3 h-3" />}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
              
              <Button
                variant="ghost"
                size="sm"
                icon={isDark ? Sun : Moon}
                onClick={toggleTheme}
                className="p-2"
              />
            </div>

            {/* Mobile Navigation */}
            <div className="flex lg:hidden items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon={isDark ? Sun : Moon}
                onClick={toggleTheme}
                className="p-2"
              />
              <Button
                variant="ghost"
                size="sm"
                icon={mobileMenuOpen ? X : Menu}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2"
              />
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-200 dark:border-gray-700">
              <nav className="space-y-4">
                {navigationSections.map((section) => renderNavigationSection(section, true))}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {renderTabContent()}
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      {showTicketForm && (
        <TicketForm
          onSave={handleCreateTicket}
          onCancel={() => setShowTicketForm(false)}
        />
      )}

      {editingTicket && (
        <TicketForm
          ticket={editingTicket}
          onSave={handleUpdateTicket}
          onCancel={() => setEditingTicket(null)}
        />
      )}

      {showFeedbackForm && (
        <FeedbackForm
          onSave={handleCreateFeedback}
          onCancel={() => setShowFeedbackForm(false)}
        />
      )}

      {editingFeedback && (
        <FeedbackForm
          feedback={editingFeedback}
          onSave={handleUpdateFeedback}
          onCancel={() => setEditingFeedback(null)}
        />
      )}
    </div>
  );
}

export default App;
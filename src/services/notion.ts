import { Client } from '@notionhq/client';
import { Ticket, TicketFormData, SearchFilters } from '../types/ticket';

// Get credentials from localStorage or environment variables
const getNotionCredentials = () => {
  return {
    token: localStorage.getItem('notion_token') || import.meta.env.VITE_NOTION_TOKEN || '',
    databaseId: localStorage.getItem('notion_database_id') || import.meta.env.VITE_NOTION_DATABASE_ID || ''
  };
};

// Create Notion client with current credentials
const createNotionClient = () => {
  const { token } = getNotionCredentials();
  if (!token) {
    throw new Error('Notion token not configured. Please configure your Notion integration token in Settings.');
  }
  return new Client({ auth: token });
};

// Generate ticket ID
const generateTicketId = () => {
  return `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
};

// Helper function to convert Notion page to Ticket
const notionPageToTicket = (page: any): Ticket => {
  const properties = page.properties;
  
  return {
    id: page.id,
    ticket_id: properties['Ticket ID']?.title?.[0]?.plain_text || '',
    status: properties['Status']?.select?.name || 'Not Started',
    date_created: properties['Date Created']?.date?.start || new Date().toISOString(),
    date_resolved: properties['Date Resolved']?.date?.start || null,
    core_team_comments: properties['Core Team Comments']?.rich_text?.[0]?.plain_text || '',
    issue_description: properties['Issue Description']?.rich_text?.[0]?.plain_text || '',
    contact_info: properties['Wallet Address/Safe/Cash ID/Email']?.rich_text?.[0]?.plain_text || 
                  properties['Contact Info']?.rich_text?.[0]?.plain_text || '',
    product_tags: properties['Product Tags']?.multi_select?.map((tag: any) => tag.name) || [],
    category_tags: properties['Category Tags']?.multi_select?.map((tag: any) => tag.name) || [],
    severity: properties['Severity']?.select?.name || 'SEV-3',
    created_at: page.created_time,
    updated_at: page.last_edited_time,
  };
};

// Helper function to convert Ticket to Notion properties
const ticketToNotionProperties = (data: TicketFormData, ticketId?: string) => {
  const properties: any = {
    'Status': {
      select: {
        name: data.status
      }
    },
    'Core Team Comments': {
      rich_text: [
        {
          text: {
            content: data.core_team_comments || ''
          }
        }
      ]
    },
    'Issue Description': {
      rich_text: [
        {
          text: {
            content: data.issue_description || ''
          }
        }
      ]
    },
    'Wallet Address/Safe/Cash ID/Email': {
      rich_text: [
        {
          text: {
            content: data.contact_info || ''
          }
        }
      ]
    },
    'Product Tags': {
      multi_select: data.product_tags.map(tag => ({ name: tag }))
    },
    'Category Tags': {
      multi_select: data.category_tags.map(tag => ({ name: tag }))
    },
    'Severity': {
      select: {
        name: data.severity
      }
    }
  };

  // Add ticket ID for new tickets
  if (ticketId) {
    properties['Ticket ID'] = {
      title: [
        {
          text: {
            content: ticketId
          }
        }
      ]
    };
  }

  // Add date created for new tickets
  if (ticketId) {
    properties['Date Created'] = {
      date: {
        start: new Date().toISOString()
      }
    };
  }

  // Auto-set resolved date if status is Resolved
  if (data.status === 'Resolved') {
    properties['Date Resolved'] = {
      date: {
        start: new Date().toISOString()
      }
    };
  } else {
    properties['Date Resolved'] = {
      date: null
    };
  }

  return properties;
};

// Ticket operations
export const ticketService = {
  // Create ticket
  async createTicket(data: TicketFormData): Promise<Ticket> {
    try {
      const { databaseId } = getNotionCredentials();
      
      if (!databaseId) {
        throw new Error('Notion database ID not configured. Please configure your database ID in Settings.');
      }

      const notion = createNotionClient();
      const ticketId = generateTicketId();
      const properties = ticketToNotionProperties(data, ticketId);

      const response = await notion.pages.create({
        parent: {
          database_id: databaseId
        },
        properties
      });

      return notionPageToTicket(response);
    } catch (error) {
      console.error('Error creating ticket:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create ticket in Notion. Please check your configuration.');
    }
  },

  // Get all tickets
  async getTickets(): Promise<Ticket[]> {
    try {
      const { databaseId } = getNotionCredentials();
      
      if (!databaseId) {
        throw new Error('Notion database ID not configured. Please configure your database ID in Settings.');
      }

      const notion = createNotionClient();

      const response = await notion.databases.query({
        database_id: databaseId,
        sorts: [
          {
            property: 'Date Created',
            direction: 'descending'
          }
        ]
      });

      return response.results.map(notionPageToTicket);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch tickets from Notion. Please check your configuration.');
    }
  },

  // Get ticket by ID
  async getTicket(id: string): Promise<Ticket> {
    try {
      const notion = createNotionClient();
      const response = await notion.pages.retrieve({
        page_id: id
      });

      return notionPageToTicket(response);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch ticket from Notion');
    }
  },

  // Update ticket
  async updateTicket(id: string, updates: Partial<TicketFormData>): Promise<Ticket> {
    try {
      const notion = createNotionClient();
      const properties = ticketToNotionProperties(updates as TicketFormData);

      const response = await notion.pages.update({
        page_id: id,
        properties
      });

      return notionPageToTicket(response);
    } catch (error) {
      console.error('Error updating ticket:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update ticket in Notion');
    }
  },

  // Delete ticket (archive in Notion)
  async deleteTicket(id: string): Promise<void> {
    try {
      const notion = createNotionClient();
      await notion.pages.update({
        page_id: id,
        archived: true
      });
    } catch (error) {
      console.error('Error deleting ticket:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete ticket in Notion');
    }
  },

  // Search tickets
  async searchTickets(filters: SearchFilters): Promise<Ticket[]> {
    try {
      const { databaseId } = getNotionCredentials();
      
      if (!databaseId) {
        throw new Error('Notion database ID not configured. Please configure your database ID in Settings.');
      }

      const notion = createNotionClient();

      const filter: any = {
        and: []
      };

      // Status filter
      if (filters.status?.length) {
        filter.and.push({
          property: 'Status',
          select: {
            equals: filters.status[0] // Notion doesn't support OR in filters easily
          }
        });
      }

      // Severity filter
      if (filters.severity?.length) {
        filter.and.push({
          property: 'Severity',
          select: {
            equals: filters.severity[0]
          }
        });
      }

      // Date range filter
      if (filters.date_range?.start) {
        filter.and.push({
          property: 'Date Created',
          date: {
            on_or_after: filters.date_range.start
          }
        });
      }

      if (filters.date_range?.end) {
        filter.and.push({
          property: 'Date Created',
          date: {
            on_or_before: filters.date_range.end
          }
        });
      }

      const response = await notion.databases.query({
        database_id: databaseId,
        filter: filter.and.length > 0 ? filter : undefined,
        sorts: [
          {
            property: 'Date Created',
            direction: 'descending'
          }
        ]
      });

      let results = response.results.map(notionPageToTicket);

      // Client-side filtering for text search and tags (Notion API limitations)
      if (filters.search_query) {
        const query = filters.search_query.toLowerCase();
        results = results.filter(ticket => 
          ticket.issue_description.toLowerCase().includes(query) ||
          ticket.core_team_comments.toLowerCase().includes(query) ||
          ticket.contact_info.toLowerCase().includes(query) ||
          ticket.ticket_id.toLowerCase().includes(query)
        );
      }

      if (filters.product_tags?.length) {
        results = results.filter(ticket =>
          filters.product_tags!.some(tag => ticket.product_tags.includes(tag))
        );
      }

      if (filters.category_tags?.length) {
        results = results.filter(ticket =>
          filters.category_tags!.some(tag => ticket.category_tags.includes(tag))
        );
      }

      return results;
    } catch (error) {
      console.error('Error searching tickets:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to search tickets in Notion');
    }
  },

  // Get unique tags with better error handling
  async getUniqueTags(type: 'product' | 'category'): Promise<string[]> {
    try {
      const { databaseId, token } = getNotionCredentials();
      
      if (!databaseId || !token) {
        console.warn(`Missing Notion credentials for ${type} tags`);
        return [];
      }

      const notion = createNotionClient();

      const response = await notion.databases.retrieve({
        database_id: databaseId
      });

      const property = type === 'product' ? 'Product Tags' : 'Category Tags';
      const propertyConfig = (response as any).properties[property];
      
      if (propertyConfig?.multi_select?.options) {
        return propertyConfig.multi_select.options.map((option: any) => option.name);
      }

      return [];
    } catch (error) {
      console.warn(`Error fetching ${type} tags from Notion:`, error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }
};
import { useState, useEffect } from 'react';
import { Ticket, TicketFormData, SearchFilters, TicketStatus } from '../types/ticket';
import { supabase } from '../services/supabase';

export const useTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to safely parse JSON strings or handle arrays
  const safeJsonParse = (jsonString: string | null | any[]): string[] => {
    if (!jsonString) return [];
    
    // If it's already an array, return it
    if (Array.isArray(jsonString)) {
      return jsonString.filter(item => typeof item === 'string' && item.trim());
    }
    
    // If it's a string, try to parse it
    if (typeof jsonString === 'string') {
      try {
        const parsed = JSON.parse(jsonString);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => typeof item === 'string' && item.trim());
        } else if (typeof parsed === 'string' && parsed.trim()) {
          return [parsed.trim()];
        }
      } catch {
        // If it's not valid JSON, treat it as a single string
        return jsonString.trim() ? [jsonString.trim()] : [];
      }
    }
    
    return [];
  };

  // Helper function to safely stringify arrays
  const safeJsonStringify = (array: string[]): string | null => {
    if (!array || array.length === 0) return null;
    return JSON.stringify(array);
  };

  // Helper function to check if a string is a valid number
  const isNumeric = (str: string): boolean => {
    return !isNaN(Number(str)) && !isNaN(parseFloat(str));
  };

  // Helper function to generate a unique ticket ID
  const generateTicketId = (): number => {
    // Generate a timestamp-based ID with some randomness
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return parseInt(`${timestamp}${random}`.slice(-10)); // Keep it within reasonable integer range
  };

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('Active Issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform Supabase data to match Ticket interface
      const transformedTickets: Ticket[] = (data || []).map(item => ({
        id: item.ticket_id.toString(),
        ticket_id: item.ticket_id.toString(),
        status: item.status || 'Not Started',
        date_created: item.created_at || new Date().toISOString(),
        date_resolved: item.date_of_resolved || null,
        core_team_comments: item.core_team_comment || '',
        issue_description: item.issue_description || '',
        contact_info: item.wallet_address_safe_email || '',
        product_tags: safeJsonParse(item.product),
        category_tags: safeJsonParse(item.category),
        severity: item.severity || 'SEV-3',
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.created_at || new Date().toISOString(),
      }));

      setTickets(transformedTickets);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (data: TicketFormData) => {
    setError(null);
    try {
      // Validate that ticket_id is provided and not empty
      if (!data.ticket_id || !data.ticket_id.trim()) {
        throw new Error('Ticket ID is required and cannot be empty');
      }

      // Use provided ticket_id
      let ticketId: number;
      const trimmedTicketId = data.ticket_id.trim();
      
      if (isNumeric(trimmedTicketId)) {
        ticketId = parseInt(trimmedTicketId);
      } else {
        // If it's not numeric, generate a hash-based ID
        ticketId = Math.abs(trimmedTicketId.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0));
      }

      const { data: newTicket, error } = await supabase
        .from('Active Issues')
        .insert([
          {
            ticket_id: ticketId,
            status: data.status,
            issue_description: data.issue_description,
            core_team_comment: data.core_team_comments,
            wallet_address_safe_email: data.contact_info,
            product: safeJsonStringify(data.product_tags),
            category: safeJsonStringify(data.category_tags),
            severity: data.severity,
            date_of_resolved: data.status === 'Resolved' ? new Date().toISOString().split('T')[0] : null,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Transform and add to tickets list
      const transformedTicket: Ticket = {
        id: newTicket.ticket_id.toString(),
        ticket_id: newTicket.ticket_id.toString(),
        status: newTicket.status || 'Not Started',
        date_created: newTicket.created_at || new Date().toISOString(),
        date_resolved: newTicket.date_of_resolved || null,
        core_team_comments: newTicket.core_team_comment || '',
        issue_description: newTicket.issue_description || '',
        contact_info: newTicket.wallet_address_safe_email || '',
        product_tags: safeJsonParse(newTicket.product),
        category_tags: safeJsonParse(newTicket.category),
        severity: newTicket.severity || 'SEV-3',
        created_at: newTicket.created_at || new Date().toISOString(),
        updated_at: newTicket.created_at || new Date().toISOString(),
      };

      setTickets(prev => [transformedTicket, ...prev]);
      return transformedTicket;
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
      throw err;
    }
  };

  const updateTicket = async (id: string, updates: Partial<TicketFormData>) => {
    setError(null);
    try {
      const updateData: any = {
        status: updates.status,
        issue_description: updates.issue_description,
        core_team_comment: updates.core_team_comments,
        wallet_address_safe_email: updates.contact_info,
        product: updates.product_tags ? safeJsonStringify(updates.product_tags) : null,
        category: updates.category_tags ? safeJsonStringify(updates.category_tags) : null,
        severity: updates.severity,
      };

      // Handle ticket_id update if provided
      if (updates.ticket_id && updates.ticket_id.trim()) {
        let newTicketId: number;
        if (isNumeric(updates.ticket_id.trim())) {
          newTicketId = parseInt(updates.ticket_id.trim());
        } else {
          // If it's not numeric, generate a hash-based ID
          newTicketId = Math.abs(updates.ticket_id.trim().split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
          }, 0));
        }
        updateData.ticket_id = newTicketId;
      }

      // Auto-set resolved date if status is Resolved
      if (updates.status === 'Resolved') {
        updateData.date_of_resolved = new Date().toISOString().split('T')[0];
      } else if (updates.status && updates.status !== 'Resolved') {
        updateData.date_of_resolved = null;
      }

      const { data, error } = await supabase
        .from('Active Issues')
        .update(updateData)
        .eq('ticket_id', parseInt(id))
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setTickets(prev => prev.map(ticket => 
        ticket.id === id 
          ? { 
              ...ticket, 
              id: data.ticket_id.toString(),
              ticket_id: data.ticket_id.toString(),
              status: data.status || ticket.status,
              issue_description: data.issue_description || ticket.issue_description,
              core_team_comments: data.core_team_comment || ticket.core_team_comments,
              contact_info: data.wallet_address_safe_email || ticket.contact_info,
              product_tags: safeJsonParse(data.product),
              category_tags: safeJsonParse(data.category),
              severity: data.severity || ticket.severity,
              date_resolved: data.date_of_resolved || null,
            }
          : ticket
      ));
    } catch (err) {
      console.error('Error updating ticket:', err);
      setError(err instanceof Error ? err.message : 'Failed to update ticket');
      throw err;
    }
  };

  const deleteTicket = async (id: string) => {
    setError(null);
    try {
      const { error } = await supabase
        .from('Active Issues')
        .delete()
        .eq('ticket_id', parseInt(id));

      if (error) throw error;

      setTickets(prev => prev.filter(ticket => ticket.id !== id));
    } catch (err) {
      console.error('Error deleting ticket:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete ticket');
      throw err;
    }
  };

  const bulkDeleteTickets = async (ids: string[]) => {
    setError(null);
    try {
      const numericIds = ids.map(id => parseInt(id));
      const { error } = await supabase
        .from('Active Issues')
        .delete()
        .in('ticket_id', numericIds);

      if (error) throw error;

      setTickets(prev => prev.filter(ticket => !ids.includes(ticket.id)));
    } catch (err) {
      console.error('Error bulk deleting tickets:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete tickets');
      throw err;
    }
  };

  const bulkUpdateTicketStatus = async (ids: string[], status: TicketStatus) => {
    setError(null);
    try {
      const numericIds = ids.map(id => parseInt(id));
      const updateData: any = {
        status,
        date_of_resolved: status === 'Resolved' ? new Date().toISOString().split('T')[0] : null
      };

      const { error } = await supabase
        .from('Active Issues')
        .update(updateData)
        .in('ticket_id', numericIds);

      if (error) throw error;

      // Update local state
      setTickets(prev => prev.map(ticket => 
        ids.includes(ticket.id)
          ? { 
              ...ticket, 
              status,
              date_resolved: status === 'Resolved' ? new Date().toISOString().split('T')[0] : null
            }
          : ticket
      ));
    } catch (err) {
      console.error('Error bulk updating ticket status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update ticket status');
      throw err;
    }
  };

  const getUniqueTagsFromSupabase = async (tagType: 'product' | 'category'): Promise<string[]> => {
    try {
      const columnName = tagType === 'product' ? 'product' : 'category';
      const { data, error } = await supabase
        .from('Active Issues')
        .select(columnName)
        .not(columnName, 'is', null);

      if (error) throw error;

      const uniqueTags = new Set<string>();
      
      data?.forEach(item => {
        const tags = safeJsonParse(item[columnName]);
        tags.forEach(tag => {
          if (tag && tag.trim()) {
            uniqueTags.add(tag.trim());
          }
        });
      });

      return Array.from(uniqueTags).sort();
    } catch (err) {
      console.error(`Error fetching unique ${tagType} tags:`, err);
      return [];
    }
  };

  // Get unique tags from current tickets in memory (faster for UI)
  const getUniqueTagsFromMemory = (tagType: 'product' | 'category'): string[] => {
    const uniqueTags = new Set<string>();
    
    tickets.forEach(ticket => {
      const tags = tagType === 'product' ? ticket.product_tags : ticket.category_tags;
      tags.forEach(tag => {
        if (tag && tag.trim()) {
          uniqueTags.add(tag.trim());
        }
      });
    });

    return Array.from(uniqueTags).sort();
  };

  const searchTickets = async (filters: SearchFilters) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('Active Issues')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filters.status?.length) {
        query = query.in('status', filters.status);
      }

      // Apply severity filter
      if (filters.severity?.length) {
        query = query.in('severity', filters.severity);
      }

      // Apply text search - only include ticket_id search if the query is numeric
      if (filters.search_query) {
        const searchQuery = filters.search_query.trim();
        
        if (isNumeric(searchQuery)) {
          // If the search query is numeric, include ticket_id search
          query = query.or(`issue_description.ilike.%${searchQuery}%,core_team_comment.ilike.%${searchQuery}%,wallet_address_safe_email.ilike.%${searchQuery}%,ticket_id.eq.${searchQuery}`);
        } else {
          // If the search query is not numeric, exclude ticket_id search
          query = query.or(`issue_description.ilike.%${searchQuery}%,core_team_comment.ilike.%${searchQuery}%,wallet_address_safe_email.ilike.%${searchQuery}%`);
        }
      }

      // Apply date range filter
      if (filters.date_range?.start) {
        query = query.gte('created_at', filters.date_range.start);
      }
      if (filters.date_range?.end) {
        query = query.lte('created_at', filters.date_range.end);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform Supabase data to match Ticket interface
      let transformedTickets: Ticket[] = (data || []).map(item => ({
        id: item.ticket_id.toString(),
        ticket_id: item.ticket_id.toString(),
        status: item.status || 'Not Started',
        date_created: item.created_at || new Date().toISOString(),
        date_resolved: item.date_of_resolved || null,
        core_team_comments: item.core_team_comment || '',
        issue_description: item.issue_description || '',
        contact_info: item.wallet_address_safe_email || '',
        product_tags: safeJsonParse(item.product),
        category_tags: safeJsonParse(item.category),
        severity: item.severity || 'SEV-3',
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.created_at || new Date().toISOString(),
      }));

      // Apply client-side filtering for product and category tags
      if (filters.product_tags?.length) {
        transformedTickets = transformedTickets.filter(ticket =>
          filters.product_tags!.some(tag => ticket.product_tags.includes(tag))
        );
      }

      if (filters.category_tags?.length) {
        transformedTickets = transformedTickets.filter(ticket =>
          filters.category_tags!.some(tag => ticket.category_tags.includes(tag))
        );
      }

      setTickets(transformedTickets);
    } catch (err) {
      console.error('Error searching tickets:', err);
      setError(err instanceof Error ? err.message : 'Failed to search tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return {
    tickets,
    loading,
    error,
    createTicket,
    updateTicket,
    deleteTicket,
    bulkDeleteTickets,
    bulkUpdateTicketStatus,
    searchTickets,
    fetchTickets,
    getUniqueTagsFromSupabase,
    getUniqueTagsFromMemory
  };
};
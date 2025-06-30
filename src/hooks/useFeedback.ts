import { useState, useEffect } from 'react';
import { Feedback, FeedbackFormData, FeedbackSearchFilters } from '../types/feedback';
import { supabase } from '../services/supabase';

export const useFeedback = () => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('feedback_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform Supabase data to match Feedback interface
      const transformedFeedback: Feedback[] = (data || []).map(item => ({
        id: item.id.toString(),
        ticket_id: item.ticket_id || null,
        platform: item.platform || 'Intercom',
        product: item.product || '',
        description: item.description || '',
        core_team_acknowledgement: item.core_team_acknowledgement,
        shipped: item.shipped,
        shipping_date: item.shipping_date || null,
        created_at: item.created_at || new Date().toISOString(),
      }));

      setFeedback(transformedFeedback);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  };

  const createFeedback = async (data: FeedbackFormData) => {
    setError(null);
    try {
      const { data: newFeedback, error } = await supabase
        .from('feedback_requests')
        .insert([
          {
            ticket_id: data.ticket_id ? parseInt(data.ticket_id) : null,
            platform: data.platform,
            product: data.product || null,
            description: data.description || null,
            core_team_acknowledgement: data.core_team_acknowledgement,
            shipped: data.shipped,
            shipping_date: data.shipped && data.shipping_date ? data.shipping_date : null,
            created_at: data.created_at || new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Transform and add to feedback list
      const transformedFeedback: Feedback = {
        id: newFeedback.id.toString(),
        ticket_id: newFeedback.ticket_id || null,
        platform: newFeedback.platform || 'Intercom',
        product: newFeedback.product || '',
        description: newFeedback.description || '',
        core_team_acknowledgement: newFeedback.core_team_acknowledgement,
        shipped: newFeedback.shipped,
        shipping_date: newFeedback.shipping_date || null,
        created_at: newFeedback.created_at || new Date().toISOString(),
      };

      setFeedback(prev => [transformedFeedback, ...prev]);
      return transformedFeedback;
    } catch (err) {
      console.error('Error creating feedback:', err);
      setError(err instanceof Error ? err.message : 'Failed to create feedback');
      throw err;
    }
  };

  const updateFeedback = async (id: string, updates: Partial<FeedbackFormData>) => {
    setError(null);
    try {
      const updateData: any = {
        ticket_id: updates.ticket_id ? parseInt(updates.ticket_id) : null,
        platform: updates.platform,
        product: updates.product || null,
        description: updates.description || null,
        core_team_acknowledgement: updates.core_team_acknowledgement,
        shipped: updates.shipped,
        shipping_date: updates.shipped && updates.shipping_date ? updates.shipping_date : null,
      };

      // Auto-set shipping date if shipped is set to true and no date provided
      if (updates.shipped && !updates.shipping_date) {
        updateData.shipping_date = new Date().toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from('feedback_requests')
        .update(updateData)
        .eq('id', parseInt(id))
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setFeedback(prev => prev.map(item => 
        item.id === id 
          ? { 
              ...item, 
              ticket_id: data.ticket_id || null,
              platform: data.platform || item.platform,
              product: data.product || '',
              description: data.description || '',
              core_team_acknowledgement: data.core_team_acknowledgement,
              shipped: data.shipped,
              shipping_date: data.shipping_date || null,
            }
          : item
      ));
    } catch (err) {
      console.error('Error updating feedback:', err);
      setError(err instanceof Error ? err.message : 'Failed to update feedback');
      throw err;
    }
  };

  const deleteFeedback = async (id: string) => {
    setError(null);
    try {
      const { error } = await supabase
        .from('feedback_requests')
        .delete()
        .eq('id', parseInt(id));

      if (error) throw error;

      setFeedback(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting feedback:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete feedback');
      throw err;
    }
  };

  const bulkDeleteFeedback = async (ids: string[]) => {
    setError(null);
    try {
      const numericIds = ids.map(id => parseInt(id));
      const { error } = await supabase
        .from('feedback_requests')
        .delete()
        .in('id', numericIds);

      if (error) throw error;

      setFeedback(prev => prev.filter(item => !ids.includes(item.id)));
    } catch (err) {
      console.error('Error bulk deleting feedback:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete feedback');
      throw err;
    }
  };

  const searchFeedback = async (filters: FeedbackSearchFilters) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('feedback_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply platform filter
      if (filters.platform?.length) {
        query = query.in('platform', filters.platform);
      }

      // Apply acknowledgement filter
      if (filters.core_team_acknowledgement !== undefined) {
        query = query.eq('core_team_acknowledgement', filters.core_team_acknowledgement);
      }

      // Apply shipped filter
      if (filters.shipped !== undefined) {
        query = query.eq('shipped', filters.shipped);
      }

      // Apply text search
      if (filters.search_query) {
        const searchQuery = filters.search_query.trim();
        
        // Check if search query is numeric for ticket_id search
        if (!isNaN(Number(searchQuery))) {
          query = query.or(`description.ilike.%${searchQuery}%,ticket_id.eq.${searchQuery}`);
        } else {
          query = query.ilike('description', `%${searchQuery}%`);
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

      // Transform Supabase data to match Feedback interface
      let transformedFeedback: Feedback[] = (data || []).map(item => ({
        id: item.id.toString(),
        ticket_id: item.ticket_id || null,
        platform: item.platform || 'Intercom',
        product: item.product || '',
        description: item.description || '',
        core_team_acknowledgement: item.core_team_acknowledgement,
        shipped: item.shipped,
        shipping_date: item.shipping_date || null,
        created_at: item.created_at || new Date().toISOString(),
      }));

      // Apply client-side filtering for product
      if (filters.product?.length) {
        transformedFeedback = transformedFeedback.filter(item =>
          filters.product!.some(product => item.product === product)
        );
      }

      setFeedback(transformedFeedback);
    } catch (err) {
      console.error('Error searching feedback:', err);
      setError(err instanceof Error ? err.message : 'Failed to search feedback');
    } finally {
      setLoading(false);
    }
  };

  const getUniqueProductsFromMemory = (): string[] => {
    const uniqueProducts = new Set<string>();
    
    feedback.forEach(item => {
      if (item.product && item.product.trim()) {
        uniqueProducts.add(item.product.trim());
      }
    });

    return Array.from(uniqueProducts).sort();
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  return {
    feedback,
    loading,
    error,
    createFeedback,
    updateFeedback,
    deleteFeedback,
    bulkDeleteFeedback,
    searchFeedback,
    fetchFeedback,
    getUniqueProductsFromMemory
  };
};
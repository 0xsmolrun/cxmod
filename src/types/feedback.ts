export interface Feedback {
  id: string;
  ticket_id?: number | null;
  created_at: string;
  platform: Platform;
  product?: string | null;
  description?: string | null;
  core_team_acknowledgement?: boolean | null;
  shipped?: boolean | null;
  shipping_date?: string | null;
}

export interface FeedbackFormData {
  ticket_id?: string;
  created_at: string;
  platform: Platform;
  product?: string;
  description?: string;
  core_team_acknowledgement?: boolean;
  shipped?: boolean;
  shipping_date?: string;
}

export type Platform = 'Intercom' | 'Discord' | 'X' | 'Zoom (Analyst Call)';

export interface FeedbackSearchFilters {
  search_query?: string;
  platform?: Platform[];
  product?: string[];
  core_team_acknowledgement?: boolean;
  shipped?: boolean;
  date_range?: {
    start?: string;
    end?: string;
  };
}
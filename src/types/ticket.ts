export type TicketStatus = 
  | 'Not Started'
  | 'Reviewed by Dev'
  | 'Waiting on Mod'
  | 'Under Review'
  | 'In Dev'
  | 'In QA'
  | 'Waiting on User'
  | 'Under Review - Sumsub'
  | 'Under Review - Provenance'
  | 'Under Review - Rain'
  | 'Under Review - Core Team'
  | 'Resolved';

export type Severity = 'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4' | 'SEV-5';

export interface Ticket {
  id: string;
  ticket_id: string;
  status: TicketStatus;
  date_created: string;
  date_resolved?: string | null;
  core_team_comments: string;
  issue_description: string;
  contact_info: string;
  product_tags: string[];
  category_tags: string[];
  severity: Severity;
  created_at: string;
  updated_at: string;
}

export interface TicketFormData {
  ticket_id?: string;
  status: TicketStatus;
  core_team_comments: string;
  issue_description: string;
  contact_info: string;
  product_tags: string[];
  category_tags: string[];
  severity: Severity;
}

export interface SearchFilters {
  search_query?: string;
  status?: TicketStatus[];
  severity?: Severity[];
  product_tags?: string[];
  category_tags?: string[];
  date_range?: {
    start?: string;
    end?: string;
  };
}

export interface ChartColors {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
}
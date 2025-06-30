# CXMod - Customer Support Platform with Supabase Integration

A beautiful, modern customer support platform that integrates with Supabase as the backend database. Built with React, TypeScript, and Tailwind CSS.

## Features

- **Ticket Management**: Complete CRUD operations for support tickets
- **Supabase Integration**: All tickets stored in a Supabase database
- **Advanced Search**: Filter and search tickets by any field
- **Analytics Dashboard**: Customizable charts and data visualization
- **Dynamic Tagging**: Product and category tags (stored locally)
- **Beautiful UI**: Skia-inspired design with liquid glass effects

## Setup Instructions

### 1. Supabase Setup

This application is already configured to work with your existing Supabase database. The current schema includes:

**Active Issues Table:**
- `ticket_id` (bigint, Primary Key)
- `status` (text)
- `created_at` (timestamp with time zone)
- `issue_description` (text)

### 2. Environment Setup

The application uses the Supabase configuration from your environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3. Run the Application

```bash
npm install
npm run dev
```

## Usage

- **Create Tickets**: Click "Create Ticket" to add new support tickets
- **Edit Tickets**: Click the edit button on any ticket card
- **Search**: Use the search tab to filter tickets by any criteria
- **Analytics**: View customizable charts and statistics
- **Supabase Sync**: All changes are automatically synced with your Supabase database

## Current Database Schema

The application currently works with the existing "Active Issues" table:

| Column | Type | Description |
|--------|------|-------------|
| ticket_id | bigint | Primary key, auto-generated |
| status | text | Ticket status |
| created_at | timestamp | Creation timestamp |
| issue_description | text | Description of the issue |

## Feature Limitations

Due to the current database schema, some features are stored locally in the application:
- Contact Information
- Core Team Comments
- Product and Category Tags
- Severity Levels
- Date Resolved

To enable full persistence of these features, consider expanding the database schema.

## Benefits of Supabase Integration

- **Real-time Updates**: Automatic synchronization across clients
- **Scalability**: Built on PostgreSQL for enterprise-grade performance
- **Security**: Row Level Security (RLS) enabled by default
- **Backup**: Your data is safely stored in Supabase's cloud
- **Flexibility**: Easy to extend the database schema as needed

## Architecture

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom glass morphism effects
- **Backend**: Supabase for data storage and retrieval
- **Charts**: Chart.js for data visualization
- **Icons**: Lucide React for consistent iconography
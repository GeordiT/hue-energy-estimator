# Housing Upgrade Estimator (HUE)

## Overview

HUE is a comprehensive energy assessment application developed by ESRU at the University of Strathclyde. The system enables users to evaluate and analyze the energy performance of residential buildings through detailed fabric, system, and contextual assessments. It provides energy demand calculations, carbon emissions analysis, and upgrade recommendations to help improve building efficiency.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack Query for server state management with local state for form data
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with custom styling through shadcn/ui

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Storage**: In-memory storage implementation with interface for future database integration
- **API Design**: RESTful endpoints with JSON responses
- **Validation**: Zod schemas for runtime type checking and validation

### Data Models
The application uses three core entities:
- **Assessments**: Building performance evaluations with fabric, system, and context parameters
- **Locations**: Geographic regions with climate data (heating degree days, solar radiation, energy costs)
- **Upgrade Recommendations**: System-generated suggestions for building improvements

### Calculation Engine
- **Energy Performance**: Custom algorithms calculating energy demand, carbon emissions, and costs
- **Building Physics**: U-value calculations, air change rates, and thermal performance modeling
- **Rating System**: Energy Index (EI) scoring from A-G ratings
- **Upgrade Analysis**: Priority-based recommendation system for building improvements

### Development Architecture
- **Monorepo Structure**: Shared schema and types between client and server
- **Hot Reload**: Vite development server with Express middleware integration
- **Type Safety**: End-to-end TypeScript with shared validation schemas
- **Build Process**: Separate client (Vite) and server (esbuild) build pipelines

## External Dependencies

### Database & ORM
- **Drizzle ORM**: Type-safe database toolkit configured for PostgreSQL
- **Neon Database**: Serverless PostgreSQL provider (@neondatabase/serverless)

### UI Framework & Styling
- **React Ecosystem**: React 18 with TypeScript support
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Radix UI**: Comprehensive component primitives for accessibility
- **shadcn/ui**: Pre-built component library with consistent styling

### Form Handling & Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: Schema validation for runtime type checking
- **@hookform/resolvers**: Integration between React Hook Form and Zod

### Development Tools
- **Vite**: Fast build tool with hot module replacement
- **TypeScript**: Static type checking and enhanced developer experience
- **esbuild**: Fast JavaScript bundler for server builds
- **Replit Integration**: Development environment optimizations and error handling
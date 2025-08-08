# Neuroleaf Implementation Guide

This document provides technical details about the implementation, architecture decisions, and development practices used in the Neuroleaf platform.

## 🏗️ **Architecture Overview**

### **Technology Stack**
- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL with real-time features)
- **AI**: Google Gemini API for content generation
- **UI**: Shadcn/UI + Tailwind CSS v4
- **State Management**: TanStack Query (React Query) + Zustand
- **Authentication**: Supabase Auth with RLS
- **Payment**: Stripe (planned)
- **Deployment**: Vercel + Supabase Cloud

### **Project Structure**
```
neuroleaf/
├── apps/web/                          # Next.js application
│   ├── app/                          # App Router pages
│   │   ├── (marketing)/              # Public marketing pages
│   │   ├── auth/                     # Authentication pages  
│   │   └── home/                     # Protected app pages
│   │       └── decks/                # Deck management pages
│   ├── components/                   # App-specific components
│   ├── config/                       # App configuration
│   └── lib/                          # Utility functions
├── packages/                         # Shared packages
│   ├── features/                     # Feature packages
│   │   ├── accounts/                 # User account management
│   │   ├── ai/                       # AI service integration
│   │   ├── auth/                     # Authentication logic
│   │   └── decks/                    # Deck management (NEW)
│   ├── ui/                          # Shared UI components
│   ├── supabase/                    # Database client & types
│   └── shared/                       # Common utilities
└── tooling/                         # Build and dev tools
```

## 🎯 **Current Implementation Status**

### ✅ **Phase 1: Foundation & Deck Management (COMPLETE)**

#### **Database Schema**
Location: `apps/web/supabase/migrations/20250122000000_flashcard_schema.sql`

**Core Tables:**
- `decks`: Flashcard collections with metadata
- `flashcards`: Individual cards with rich content
- `user_progress`: Spaced repetition tracking per user/card
- `study_sessions`: Learning analytics and session data
- `ai_generations`: AI usage tracking for cost monitoring
- `deck_collaborators`: Sharing and collaboration features

**Key Design Decisions:**
- Row Level Security (RLS) for multi-tenant data isolation
- JSONB fields for flexible metadata storage
- Enum types for data consistency (visibility, difficulty, etc.)
- Triggers for automatic timestamp updates and card counting
- Indexes optimized for common query patterns

#### **Deck Management Package**
Location: `packages/features/decks/`

**Package Structure:**
```
@kit/decks/
├── src/
│   ├── components/           # React components
│   │   ├── deck-card.tsx     # Individual deck display
│   │   ├── decks-grid.tsx    # Deck listing with filters
│   │   └── create-deck-dialog.tsx # Deck creation modal
│   ├── hooks/               # React Query hooks
│   │   └── use-decks.ts     # Data fetching and mutations
│   ├── schemas/             # Zod validation schemas
│   │   └── deck.schema.ts   # Type definitions
│   └── server/              # Server-side services
│       ├── deck-service.ts  # Business logic
│       └── deck-actions.ts  # Server actions
└── package.json
```

**Key Implementation Details:**

1. **Type Safety**: Full TypeScript with Zod schemas
   ```typescript
   export const CreateDeckSchema = z.object({
     name: z.string().min(1).max(255),
     description: z.string().max(1000).optional(),
     visibility: z.enum(['private', 'public', 'shared']),
     tags: z.array(z.string()).max(10),
   });
   ```

2. **Server-Side Services**: Clean separation of concerns
   ```typescript
   export class DeckService {
     async createDeck(data: CreateDeckData, accountId: string, userId: string): Promise<Deck>
     async getUserDecks(accountId: string, filters: DeckFilters): Promise<{ decks: DeckWithStats[]; total: number }>
     // ... other methods
   }
   ```

3. **React Hooks**: Optimized data fetching with caching
   ```typescript
   export function useDecks(accountId: string, filters?: DeckFilters) {
     return useQuery({
       queryKey: ['decks', accountId, filters],
       queryFn: () => deckService.getUserDecks(accountId, filters),
     });
   }
   ```

4. **UI Components**: Reusable and accessible
   - Responsive design with Tailwind CSS
   - Loading states and error handling
   - Accessible dropdown menus and modals
   - Optimistic updates for better UX

#### **AI Service Integration**
Location: `packages/features/ai/`

**Gemini Client Implementation:**
- Cost estimation and usage tracking
- Error handling with specific error types
- Rate limiting and retry logic
- Token usage estimation
- Health check functionality

**Service Architecture:**
```typescript
export class FlashcardGenerator {
  async generateFlashcards(request: GenerateFlashcardsRequest): Promise<GenerateFlashcardsResponse>
}

export class ContentEnhancer {
  async enhanceContent(request: ContentEnhancementRequest): Promise<ContentEnhancementResponse>
}
```

### 🚧 **Next Implementation Phase: Flashcard CRUD**

#### **Planned Package Structure**
```
@kit/flashcards/
├── src/
│   ├── components/
│   │   ├── flashcard-editor.tsx     # Rich text editor
│   │   ├── flashcard-list.tsx       # Card listing
│   │   ├── media-upload.tsx         # Image/audio upload
│   │   └── bulk-operations.tsx      # Import/export
│   ├── hooks/
│   │   └── use-flashcards.ts        # CRUD operations
│   ├── schemas/
│   │   └── flashcard.schema.ts      # Validation schemas
│   └── server/
│       ├── flashcard-service.ts     # Business logic
│       └── media-service.ts         # File handling
```

## 🔧 **Development Practices**

### **Code Organization**
1. **Feature-Based Architecture**: Each feature is a separate package
2. **Monorepo Structure**: Shared tooling and dependencies
3. **Type-First Development**: Zod schemas generate TypeScript types
4. **Component Co-location**: Components, hooks, and styles together

### **Data Fetching Strategy**
1. **Server Components**: For initial page loads and SEO
2. **Client Components**: For interactive features
3. **React Query**: For client-side caching and synchronization
4. **Optimistic Updates**: For immediate UI feedback

### **Error Handling**
1. **Validation**: Zod schemas on both client and server
2. **Database Errors**: Wrapped in custom error classes
3. **User Feedback**: Toast notifications for all actions
4. **Fallbacks**: Graceful degradation for network issues

### **Performance Optimizations**
1. **Lazy Loading**: Components loaded on demand
2. **Image Optimization**: Next.js Image component
3. **Bundle Splitting**: Feature-based code splitting
4. **Caching**: React Query + Supabase caching

## 🗄️ **Database Design Decisions**

### **Row Level Security (RLS)**
All tables have RLS policies to ensure data isolation:
```sql
-- Decks are visible to owners and collaborators
CREATE POLICY decks_select ON public.decks FOR SELECT USING (
  account_id = (SELECT auth.uid()) OR 
  visibility = 'public' OR
  (visibility = 'shared' AND id IN (
    SELECT deck_id FROM deck_collaborators WHERE user_id = (SELECT auth.uid())
  ))
);
```

### **Trigger Functions**
Automatic maintenance of data consistency:
```sql
-- Update deck card count when flashcards are added/removed
CREATE TRIGGER trigger_update_deck_card_count_insert
  AFTER INSERT ON public.flashcards
  FOR EACH ROW EXECUTE FUNCTION update_deck_card_count();
```

### **Indexes for Performance**
Strategic indexes for common query patterns:
```sql
-- Optimized for deck listing with filters
CREATE INDEX idx_decks_account_id ON public.decks(account_id);
CREATE INDEX idx_decks_visibility ON public.decks(visibility);
CREATE INDEX idx_decks_tags ON public.decks USING GIN(tags);
```

## 🔐 **Security Implementation**

### **Authentication & Authorization**
- Supabase Auth with JWT tokens
- RLS policies for data access control
- Server-side validation for all mutations
- CSRF protection with Next.js middleware

### **Data Validation**
- Zod schemas validate all inputs
- SQL injection prevention via parameterized queries
- XSS prevention via proper escaping
- File upload validation and scanning

## 📱 **UI/UX Implementation**

### **Design System**
- Shadcn/UI as the base component library
- Custom Neuroleaf theme with brand colors
- Consistent spacing and typography scales
- Dark/light mode support

### **Responsive Design**
- Mobile-first approach
- Breakpoint-based layouts
- Touch-friendly interactive elements
- Optimized for various screen sizes

### **Accessibility**
- WCAG 2.1 compliance
- Semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility

## 🧪 **Testing Strategy** (Planned)

### **Unit Tests**
- Jest + React Testing Library
- Test utilities and custom hooks
- Zod schema validation tests
- Database service tests

### **Integration Tests**
- Playwright for E2E testing
- API endpoint testing
- User flow validation
- Cross-browser compatibility

### **Performance Tests**
- Lighthouse CI for performance monitoring
- Database query optimization
- Bundle size tracking
- Core Web Vitals monitoring

## 📈 **Monitoring & Analytics** (Planned)

### **Application Monitoring**
- Error tracking with Sentry
- Performance monitoring
- Database query analysis
- API endpoint metrics

### **Business Analytics**
- User engagement tracking
- Feature usage analytics
- Conversion funnel analysis
- A/B testing framework

## 🚀 **Deployment Pipeline**

### **Development Environment**
- Local Supabase instance with Docker
- Hot reload for rapid development
- TypeScript strict mode
- ESLint + Prettier for code quality

### **Production Deployment**
- Vercel for Next.js hosting
- Supabase Cloud for database
- Environment-based configuration
- Automatic deployments from main branch

## 📋 **Development Workflow**

### **Feature Development Process**
1. Create feature branch from main
2. Implement package with tests
3. Update FEATURES.md and IMPLEMENTATION.md
4. Create PR with detailed description
5. Code review and testing
6. Merge and deploy to staging
7. User testing and feedback
8. Deploy to production

### **Code Quality Standards**
- TypeScript strict mode enabled
- 100% type coverage required
- ESLint + Prettier formatting
- Commit message conventions
- PR template with checklist

---

## 🔄 **Change Log**

### **2025-01-22: Phase 1 Complete**
- ✅ Implemented complete deck management system
- ✅ Created `@kit/decks` package with full CRUD operations
- ✅ Built modern UI with responsive design
- ✅ Integrated with navigation and routing
- ✅ Added comprehensive error handling and loading states
- ✅ Documented architecture and implementation decisions

### **Next: Phase 2 - Flashcard CRUD**
- 🚧 Individual flashcard creation and editing
- 🚧 Rich text editor with media support
- 🚧 Bulk operations and import/export
- 🚧 Integration with AI generation services
# SM-2 Integration Testing Guide

## Quick Testing Checklist

### 1. Development Server
```bash
npm run dev
# Visit http://localhost:3002
```

### 2. Test User States

#### Free User Testing
- [ ] Dashboard shows basic stats only
- [ ] No premium badges or crown icons
- [ ] "Upgrade" buttons visible in stats
- [ ] "Start Studying" (not "Smart Study") buttons
- [ ] Upgrade prompts in primary actions
- [ ] Study tips show basic practices
- [ ] No SM-2 algorithm indicators

#### Premium User Testing (requires database change)
- [ ] Dashboard shows SM-2 analytics
- [ ] Premium badges with crown icons
- [ ] "Smart Study Session" buttons
- [ ] No upgrade prompts
- [ ] SM-2 algorithm benefits in study tips
- [ ] Ease Factor, retention stats displayed

### 3. Key Files to Test

#### Dashboard Components
- `/home` - Main dashboard with stats integration
- `/home/study` - Study selection page

#### Component Props Flow
1. `learning-dashboard.tsx` - Root component checks SM-2 features
2. `welcome-hero.tsx` - Shows premium badge and messaging
3. `simple-stats.tsx` - Displays SM-2 analytics vs basic stats
4. `primary-actions.tsx` - Smart study vs regular study buttons
5. `study-page.tsx` - Premium study interface

### 4. Database Simulation

```sql
-- Make user premium for testing
UPDATE accounts SET subscription_tier = 'premium' WHERE id = 'YOUR_USER_ID';

-- Make user free for testing  
UPDATE accounts SET subscription_tier = 'free' WHERE id = 'YOUR_USER_ID';
```

### 5. Mock Data Testing

For testing without real subscription data, you can temporarily modify:

```typescript
// In useSM2Features hook, force return premium features
const { data: sm2Features } = useSM2Features(userId);
// Temporarily override for testing:
const testSm2Features = { 
  isEnabled: true, 
  hasAdvancedAnalytics: true,
  hasCustomScheduling: true 
};
```

### 6. Error Handling Tests
- [ ] Network errors when fetching SM-2 data
- [ ] Invalid subscription states
- [ ] Missing user data
- [ ] SM-2 service failures

### 7. UI/UX Tests
- [ ] Premium badges are clearly visible
- [ ] Upgrade prompts are compelling but not intrusive
- [ ] Icons and terminology are consistent
- [ ] Loading states work properly
- [ ] Responsive design on mobile/tablet

### 8. Business Logic Tests
- [ ] Free users see exactly 50 cards per deck limit
- [ ] Premium users see unlimited cards
- [ ] SM-2 algorithm only processes for premium users
- [ ] Upgrade flows direct to correct pricing page

### 9. Performance Tests
- [ ] No unnecessary API calls for free users
- [ ] SM-2 calculations don't block UI
- [ ] Proper caching of subscription data
- [ ] Fast loading of dashboard components

### 10. Integration Tests
- [ ] SM-2 package imports work correctly
- [ ] TypeScript types are properly exported
- [ ] React Query integration functions
- [ ] Supabase service calls work
- [ ] Error boundaries catch SM-2 failures

## Common Issues to Watch For

1. **Import Errors**: Make sure `@kit/spaced-repetition` package is properly built
2. **Type Errors**: Ensure all SM2 types are exported and imported correctly
3. **Subscription Data**: Verify database has correct subscription_tier values
4. **Loading States**: Check that UI gracefully handles loading states
5. **Error States**: Ensure failed SM-2 calls don't break the entire interface

## Quick Debug Commands

```bash
# Check if package builds
cd packages/features/spaced-repetition && npm run typecheck

# Check dev server compilation
npm run dev

# Test specific component
# Navigate to /home and inspect React DevTools
```
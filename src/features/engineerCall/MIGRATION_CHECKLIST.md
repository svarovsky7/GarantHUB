# Migration Checklist

## Pre-Migration Verification

### ✅ Files Created
- [x] `EngineerCallModalModern.refactored.tsx` (300 lines)
- [x] `ui/CallBasicInfo.tsx` (27 lines)
- [x] `ui/CallDateTime.tsx` (143 lines)
- [x] `ui/CallAssignment.tsx` (104 lines)
- [x] `ui/CallLocation.tsx` (214 lines)
- [x] `ui/CallStatusAndNotes.tsx` (58 lines)
- [x] `ui/CallAttachmentsSection.tsx` (59 lines)
- [x] `ui/index.ts` (exports)
- [x] `model/useEngineerCallForm.ts` (121 lines)
- [x] `model/useProjectData.ts` (115 lines)
- [x] `model/useFilteredData.ts` (75 lines)
- [x] `model/useEngineerCallAttachments.ts` (87 lines)
- [x] `model/index.ts` (exports)
- [x] `README.md` (documentation)
- [x] `REFACTORING.md` (detailed docs)
- [x] `COMPONENT_TREE.md` (visual guide)
- [x] `SUMMARY.md` (overview)
- [x] `COMPARISON.md` (before/after)
- [x] `MIGRATION_CHECKLIST.md` (this file)

### ✅ Code Quality Checks
- [ ] Run ESLint: `npm run lint`
- [ ] Run TypeScript check: `npm run typecheck`
- [ ] No console errors in browser
- [ ] No React warnings in console

## Testing Checklist

### 🧪 Functional Testing

#### Create New Call (from button)
- [ ] Modal opens with empty form
- [ ] Default date is today
- [ ] Default time is next hour
- [ ] Default status is "scheduled" or first status
- [ ] Current user is pre-selected as engineer
- [ ] For non-admin: current project is pre-selected
- [ ] Can fill all fields
- [ ] Form validation works
- [ ] Can submit successfully
- [ ] Modal closes after submit
- [ ] New call appears in list/calendar

#### Create Call from Calendar
- [ ] Click on calendar slot opens modal
- [ ] Date/time pre-filled from slot
- [ ] Other fields empty with defaults
- [ ] Can submit successfully

#### Edit Existing Call
- [ ] Click edit opens modal with data
- [ ] All fields populated correctly
- [ ] Can change any field
- [ ] Can submit changes successfully
- [ ] Changes reflected immediately

#### Form Validation
- [ ] Title is required
- [ ] Date is required
- [ ] Start time is required
- [ ] End time is required
- [ ] End time must be after start time
- [ ] Project is required
- [ ] Validation messages show correctly

#### Cascading Dropdowns
- [ ] Select project → loads units and claims
- [ ] Select building → filters units
- [ ] Select unit → filters claims
- [ ] Change project → resets building/unit/claim
- [ ] Change building → resets unit/claim
- [ ] Change unit → resets claim
- [ ] Date/time/status preserved on filter changes

#### Quick Duration Buttons
- [ ] "30 min" sets end time +30 minutes from start
- [ ] "1 час" sets end time +1 hour from start
- [ ] "2 часа" sets end time +2 hours from start
- [ ] Warning shows if start time not selected
- [ ] Success message shows with calculated time

#### File Attachments
- [ ] Can upload multiple files
- [ ] File list shows newly added files
- [ ] Can remove newly added files
- [ ] For existing call: shows existing attachments
- [ ] Can preview existing attachments
- [ ] Can delete existing attachments
- [ ] Files upload successfully on submit

#### Role-Based Access
- [ ] Admin sees all projects
- [ ] Engineer sees assigned projects only
- [ ] User sees assigned projects only
- [ ] Non-admin has current project pre-selected

#### Claim Integration
- [ ] Claim dropdown filters by unit
- [ ] "View Claim" button appears when claim selected
- [ ] Click button opens claim modal
- [ ] Claim modal shows correct data
- [ ] Close claim modal returns to call form

#### Modal Behavior
- [ ] Escape key closes modal
- [ ] Click outside (optional) closes modal
- [ ] Cancel button closes modal
- [ ] Form resets on close
- [ ] Opening again shows clean form

### 🎨 Visual Testing

#### Layout
- [ ] Modal centered on screen
- [ ] Width is 900px
- [ ] Responsive on mobile (test)
- [ ] All fields aligned properly
- [ ] Icons displayed correctly

#### Styling
- [ ] Status dropdown shows color indicators
- [ ] Quick duration tags styled correctly
- [ ] Form labels readable
- [ ] Buttons styled consistently
- [ ] Loading states show spinners

#### Interactions
- [ ] Hover states work
- [ ] Focus states visible
- [ ] Click feedback immediate
- [ ] Smooth transitions
- [ ] No layout shifts

### 🚀 Performance Testing

#### Load Time
- [ ] Modal opens in <100ms
- [ ] Form renders in <50ms
- [ ] No lag when typing
- [ ] Dropdowns open immediately

#### Data Loading
- [ ] Projects load quickly
- [ ] Units load when project selected
- [ ] Claims load when unit selected
- [ ] No unnecessary re-fetches
- [ ] Loading states show appropriately

#### Memory
- [ ] No memory leaks on open/close cycles
- [ ] Files released after upload
- [ ] No retained listeners

### 🐛 Error Handling

#### Network Errors
- [ ] Graceful handling of failed queries
- [ ] Error messages user-friendly
- [ ] Can retry after error
- [ ] No crashes on 500 errors

#### Validation Errors
- [ ] Clear error messages
- [ ] Errors show on correct fields
- [ ] Can fix errors and resubmit
- [ ] No blocking errors

#### Edge Cases
- [ ] Works with no projects
- [ ] Works with no units
- [ ] Works with no claims
- [ ] Works with no engineers
- [ ] Handles very long text
- [ ] Handles special characters

## Browser Testing

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Mobile Chrome
- [ ] Mobile Safari
- [ ] Mobile Firefox

### Screen Sizes
- [ ] Desktop (1920×1080)
- [ ] Laptop (1366×768)
- [ ] Tablet (768×1024)
- [ ] Mobile (375×667)

## Migration Steps

### Phase 1: Preparation
- [ ] Review all documentation
- [ ] Backup current code
- [ ] Create feature branch
- [ ] Notify team of changes

### Phase 2: Switch Files
- [ ] Stop development server
- [ ] Rename original file:
  ```bash
  mv EngineerCallModalModern.tsx EngineerCallModalModern.original.tsx
  ```
- [ ] Rename refactored file:
  ```bash
  mv EngineerCallModalModern.refactored.tsx EngineerCallModalModern.tsx
  ```
- [ ] Start development server
- [ ] Check for import errors

### Phase 3: Testing
- [ ] Run all tests in checklist above
- [ ] Fix any issues found
- [ ] Test with real production data
- [ ] Test with different user roles

### Phase 4: Code Review
- [ ] Create pull request
- [ ] Request team review
- [ ] Address feedback
- [ ] Get approval

### Phase 5: Deployment
- [ ] Merge to main branch
- [ ] Deploy to staging
- [ ] Test on staging
- [ ] Deploy to production
- [ ] Monitor for issues

### Phase 6: Cleanup (after verification period)
- [ ] Remove original file (after 1-2 weeks)
- [ ] Update team documentation
- [ ] Archive migration docs
- [ ] Close related issues/tickets

## Rollback Plan

If issues are discovered in production:

### Quick Rollback
1. Stop accepting new changes
2. Revert the commit
3. Deploy previous version
4. Investigate issues

### File Rollback
```bash
# If original file still exists
mv EngineerCallModalModern.tsx EngineerCallModalModern.refactored.tsx
mv EngineerCallModalModern.original.tsx EngineerCallModalModern.tsx
```

### Gradual Rollback
1. Keep both versions
2. Add feature flag
3. Route some users to old version
4. Route others to new version
5. Compare behavior

## Success Criteria

### Required
- ✅ All functional tests pass
- ✅ No console errors
- ✅ No TypeScript errors
- ✅ No ESLint errors
- ✅ Works in all major browsers
- ✅ Performance acceptable

### Desirable
- ✅ Improved code maintainability
- ✅ Better developer experience
- ✅ Easier to add features
- ✅ Team understands new structure

### Metrics to Track
- Bug reports (should be ≤ original)
- User complaints (should be 0)
- Development time for changes (should be ↓)
- Code review time (should be ↓)

## Post-Migration

### Week 1
- [ ] Monitor error logs daily
- [ ] Track user feedback
- [ ] Fix critical issues immediately
- [ ] Document any workarounds

### Week 2-4
- [ ] Review performance metrics
- [ ] Collect team feedback
- [ ] Plan further improvements
- [ ] Update documentation

### Long-term
- [ ] Analyze maintenance time savings
- [ ] Apply learnings to other components
- [ ] Refactor similar components
- [ ] Share success with team

## Known Issues / Limitations

### None Currently Known
- Original and refactored versions should be functionally identical
- If issues are discovered, document them here

### Future Improvements
1. Add React.memo to components
2. Add useCallback to handlers
3. Add unit tests
4. Add Storybook stories
5. Optimize bundle size

## Support

### Questions?
- Review README.md for usage
- Review COMPONENT_TREE.md for structure
- Review COMPARISON.md for differences
- Ask team lead or senior developer

### Issues?
- Check console for errors
- Review network tab for API failures
- Check Supabase logs
- Create detailed bug report

## Sign-off

### Developer
- [ ] I have reviewed all documentation
- [ ] I have completed all testing
- [ ] I am confident in the changes
- [ ] I am ready for code review

Name: ________________
Date: ________________

### Reviewer
- [ ] I have reviewed the code changes
- [ ] I have tested the functionality
- [ ] I approve the migration
- [ ] Ready for deployment

Name: ________________
Date: ________________

### Project Manager
- [ ] Business requirements met
- [ ] User experience maintained
- [ ] Approved for production
- [ ] Migration complete

Name: ________________
Date: ________________

---

## Appendix: Quick Command Reference

```bash
# Start dev server
npm run dev

# Type check
npm run typecheck

# Lint check
npm run lint

# Build production
npm run build

# Preview build
npm run preview

# Run tests (if available)
npm run test

# Rename files for migration
mv EngineerCallModalModern.tsx EngineerCallModalModern.original.tsx
mv EngineerCallModalModern.refactored.tsx EngineerCallModalModern.tsx

# Rollback if needed
mv EngineerCallModalModern.tsx EngineerCallModalModern.refactored.tsx
mv EngineerCallModalModern.original.tsx EngineerCallModalModern.tsx
```

## Appendix: File Locations

```
src/features/engineerCall/
├── EngineerCallModalModern.tsx (original - 933 lines)
├── EngineerCallModalModern.refactored.tsx (new - 300 lines)
├── EngineerCallAttachments.tsx (shared component)
├── ui/
│   ├── CallBasicInfo.tsx
│   ├── CallDateTime.tsx
│   ├── CallAssignment.tsx
│   ├── CallLocation.tsx
│   ├── CallStatusAndNotes.tsx
│   ├── CallAttachmentsSection.tsx
│   └── index.ts
├── model/
│   ├── useEngineerCallForm.ts
│   ├── useProjectData.ts
│   ├── useFilteredData.ts
│   ├── useEngineerCallAttachments.ts
│   └── index.ts
├── README.md
├── REFACTORING.md
├── COMPONENT_TREE.md
├── SUMMARY.md
├── COMPARISON.md
└── MIGRATION_CHECKLIST.md (this file)
```

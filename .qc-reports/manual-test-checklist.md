# Manual Test Checklist: AddPerson Modal Fix

## Instructions
1. Start the dev server: `npm run dev`
2. Open http://localhost:3000 in your browser
3. Login to your account
4. Follow each test scenario below
5. Check the box when test passes

---

## Test Scenarios

### Scenario 1: Create New Tree
- [ ] Login to application
- [ ] Navigate to dashboard
- [ ] Click "Create New Tree" or similar
- [ ] **EXPECTED:** Modal does NOT auto-open after creating tree
- [ ] **EXPECTED:** See empty state with "Add First Person" button

**Result:** PASS / FAIL

**Notes:**
_______________________________________________________

---

### Scenario 2: Open Existing Empty Tree
- [ ] Login to application
- [ ] Select a tree that has no members (or create one)
- [ ] Open the tree
- [ ] **EXPECTED:** Modal does NOT auto-open
- [ ] **EXPECTED:** See empty state with "Add First Person" button

**Result:** PASS / FAIL

**Notes:**
_______________________________________________________

---

### Scenario 3: Open Modal via "Add First Person"
- [ ] On empty tree page, locate "Add First Person" button
- [ ] Click the button
- [ ] **EXPECTED:** Modal slides in from right side
- [ ] **EXPECTED:** Dark backdrop appears
- [ ] **EXPECTED:** Form title says "Add New Member"
- [ ] **EXPECTED:** First Name and Last Name fields are visible

**Result:** PASS / FAIL

**Notes:**
_______________________________________________________

---

### Scenario 4: Close Modal via Backdrop Click
- [ ] Ensure modal is open
- [ ] Click the dark backdrop (area outside the modal)
- [ ] **EXPECTED:** Modal slides out to the right
- [ ] **EXPECTED:** Backdrop disappears
- [ ] **EXPECTED:** Back to empty state view

**Result:** PASS / FAIL

**Notes:**
_______________________________________________________

---

### Scenario 5: Close Modal via Cancel Button
- [ ] Click "Add First Person" to open modal
- [ ] Locate "Cancel and Go Back" button at bottom
- [ ] Click the Cancel button
- [ ] **EXPECTED:** Modal closes
- [ ] **EXPECTED:** Back to empty state view

**Result:** PASS / FAIL

**Notes:**
_______________________________________________________

---

### Scenario 6: Close Modal via X Button
- [ ] Click "Add First Person" to open modal
- [ ] Locate X button in top-right corner of modal
- [ ] Click the X button
- [ ] **EXPECTED:** Modal closes
- [ ] **EXPECTED:** Back to empty state view

**Result:** PASS / FAIL

**Notes:**
_______________________________________________________

---

### Scenario 7: Reopen Modal Multiple Times
- [ ] Open modal (click "Add First Person")
- [ ] Close modal (click backdrop or Cancel)
- [ ] Open modal again
- [ ] Close modal again
- [ ] Open modal one more time
- [ ] **EXPECTED:** Modal opens and closes correctly each time
- [ ] **EXPECTED:** No console errors
- [ ] **EXPECTED:** No stuck states

**Result:** PASS / FAIL

**Notes:**
_______________________________________________________

---

### Scenario 8: Submit Valid Form
- [ ] Open modal
- [ ] Fill in First Name: "Test"
- [ ] Fill in Last Name: "Person"
- [ ] Select Gender (Male/Female/Other)
- [ ] Click "Add to Family Tree" button
- [ ] **EXPECTED:** Button shows "Adding..." spinner
- [ ] **EXPECTED:** Modal closes after successful submission
- [ ] **EXPECTED:** Page refreshes or updates
- [ ] **EXPECTED:** New person appears in tree

**Result:** PASS / FAIL

**Notes:**
_______________________________________________________

---

### Scenario 9: Quick Add from Populated Tree
- [ ] Open a tree that has existing members
- [ ] Locate "Quick Add" button in floating controls (bottom center)
- [ ] Click "Quick Add"
- [ ] **EXPECTED:** Modal opens
- [ ] **EXPECTED:** Form is functional
- [ ] Close modal to verify it works

**Result:** PASS / FAIL

**Notes:**
_______________________________________________________

---

### Scenario 10: Form Validation
- [ ] Open modal
- [ ] Leave fields empty
- [ ] Click "Add to Family Tree"
- [ ] **EXPECTED:** Validation errors appear
- [ ] **EXPECTED:** Modal does NOT close
- [ ] **EXPECTED:** Error messages show required fields

**Result:** PASS / FAIL

**Notes:**
_______________________________________________________

---

### Scenario 11: Advanced Details Toggle
- [ ] Open modal
- [ ] Click "Add more details" link
- [ ] **EXPECTED:** Advanced fields expand (Birth Date, Birth Place, etc.)
- [ ] Click "Hide" link
- [ ] **EXPECTED:** Advanced fields collapse
- [ ] Verify modal can still be opened/closed

**Result:** PASS / FAIL

**Notes:**
_______________________________________________________

---

### Scenario 12: Keyboard Accessibility
- [ ] Open modal
- [ ] Press ESC key
- [ ] **EXPECTED:** Modal closes (if implemented)
- [ ] Note: This may not be implemented yet

**Result:** PASS / FAIL / N/A

**Notes:**
_______________________________________________________

---

## Summary

### Total Tests: 12
### Passed: _____
### Failed: _____
### Skipped: _____

### Overall Result: PASS / FAIL

---

## Critical Issues Found

List any critical issues that prevent the fix from working:

1.
2.
3.

---

## Minor Issues Found

List any minor issues or improvements needed:

1.
2.
3.

---

## Tester Comments

Additional observations or feedback:

_______________________________________________________
_______________________________________________________
_______________________________________________________

---

## Sign-off

**Tester Name:** __________________________
**Date:** __________________________
**Approved for Merge:** YES / NO

**If NO, reason:**
_______________________________________________________

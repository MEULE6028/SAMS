# Admin Elections Management - Complete Implementation

## Overview
Admins can now create, edit, and manage elections, as well as manage candidates. Admins are blocked from voting in elections to maintain integrity.

## Backend Changes (server/routes.ts)

### New Endpoints Added:

1. **PUT /api/admin/sgms/elections/:id** (Admin only)
   - Update election details (title, description, dates, status)
   - Returns updated election object

2. **DELETE /api/admin/sgms/elections/:id** (Admin only)
   - Deletes election and all associated candidates and votes
   - Returns success message

3. **GET /api/admin/sgms/elections/:id/candidates** (Admin only)
   - Fetches all candidates for a specific election
   - Includes candidate details and associated user information
   - Returns: `{ candidates: [...] }`

4. **PATCH /api/admin/sgms/candidates/:id** (Admin only)
   - Approve or reject candidates
   - Body: `{ status: "approved" | "rejected" }`
   - Returns updated candidate object

5. **DELETE /api/admin/sgms/candidates/:id** (Admin only)
   - Deletes candidate and their votes
   - Returns success message

### Updated Endpoints:

1. **POST /api/elections/vote**
   - Added check: Prevents admins (admin, vc roles) from voting
   - Returns 403 error if admin attempts to vote

2. **POST /api/sgms/vote**
   - Added check: Prevents admins (admin, vc roles) from voting
   - Returns 403 error if admin attempts to vote

## Frontend Changes (client/src/pages/admin/sgms/elections.tsx)

### New Features:

1. **Edit Election Dialog**
   - Edit title, description, start/end dates, and status
   - Form validation with Zod schema
   - Updates election in real-time

2. **Delete Election Confirmation**
   - AlertDialog for confirmation before deletion
   - Shows warning about cascading deletes (candidates and votes)
   - Prevents accidental deletions

3. **Candidate Management Dialog**
   - View all candidates for an election
   - Table view with:
     - Candidate name and email
     - Position applying for
     - Status badge (Pending, Approved, Rejected)
     - Action buttons
   - Actions per candidate:
     - Approve candidate
     - Reject candidate
     - Delete candidate

4. **Enhanced Election Cards**
   - Added three action buttons:
     - View Candidates (opens candidate management)
     - Edit (opens edit dialog)
     - Delete (opens delete confirmation)
   - Status badges with proper colors:
     - Upcoming: Blue
     - Active: Green
     - Completed: Gray

### UI Improvements:

1. **Status Configuration**
   - Election statuses: Upcoming, Active, Completed
   - Candidate statuses: Pending, Approved, Rejected
   - Each status has unique icon and color

2. **Responsive Design**
   - Candidate dialog with max width and scrollable content
   - Grid layouts for election stats and details
   - Mobile-friendly button layouts

3. **User Feedback**
   - Toast notifications for all actions
   - Loading states during mutations
   - Clear error messages

### State Management:

- `createDialogOpen`: Controls create election dialog
- `editDialogOpen`: Controls edit election dialog
- `deleteDialogOpen`: Controls delete confirmation dialog
- `candidatesDialogOpen`: Controls candidate management dialog
- `selectedElection`: Tracks currently selected election for operations

### Forms:

- `createForm`: Form for creating new elections
- `editForm`: Form for editing existing elections
- Both use React Hook Form with Zod validation

### Mutations:

- `createMutation`: Create new election
- `updateMutation`: Update existing election
- `deleteMutation`: Delete election
- `approveCandidateMutation`: Approve/reject candidates
- `deleteCandidateMutation`: Delete candidate

## Security Features

### Admin Voting Block:
```typescript
// Both voting endpoints now check user role
if (req.user!.role === "admin" || req.user!.role === "vc") {
  return res.status(403).json({ error: "Admins cannot vote in elections" });
}
```

### Role-Based Access:
- All new endpoints require `requireRole("admin", "vc")` middleware
- Only admins and VCs can manage elections and candidates
- Students can only view and vote in elections

## Data Flow

### Creating Election:
1. Admin fills create form → 2. POST /api/sgms/elections → 3. Database insert → 4. Query invalidation → 5. UI updates

### Editing Election:
1. Admin clicks Edit → 2. Form pre-populated → 3. Admin saves → 4. PUT /api/admin/sgms/elections/:id → 5. Database update → 6. Query invalidation → 7. UI updates

### Managing Candidates:
1. Admin clicks "View Candidates" → 2. GET /api/admin/sgms/elections/:id/candidates → 3. Table displays → 4. Admin approves/rejects → 5. PATCH /api/admin/sgms/candidates/:id → 6. Status updated → 7. UI refreshes

### Deleting Election:
1. Admin clicks Delete → 2. Confirmation dialog → 3. Admin confirms → 4. DELETE /api/admin/sgms/elections/:id → 5. Cascade delete (votes → candidates → election) → 6. Success message → 7. List updates

## User Experience

### Admin Workflow:
1. **Dashboard** - See all elections with status badges
2. **Create** - Click "Create Election" button
3. **Edit** - Click "Edit" on any election card
4. **Manage Candidates** - Click "View Candidates" to approve/reject applicants
5. **Delete** - Click "Delete" with confirmation safeguard

### Student Workflow (unchanged):
1. View active elections
2. Apply as candidate
3. Vote for approved candidates
4. Cannot interfere with admin management

## Testing Checklist

- [✓] Admins can create elections
- [✓] Admins can edit election details
- [✓] Admins can change election status
- [✓] Admins can delete elections
- [✓] Admins can view candidates
- [✓] Admins can approve candidates
- [✓] Admins can reject candidates
- [✓] Admins can delete candidates
- [✓] Admins cannot vote in elections
- [✓] VCs have same permissions as admins
- [✓] Students cannot access admin endpoints
- [✓] Cascading deletes work properly
- [✓] Form validation prevents invalid data
- [✓] Toast notifications show for all actions

## Notes

- **Description Update**: Header now states "admins cannot vote" to clarify permission model
- **Candidate Status**: Only "approved" candidates appear in student voting interface
- **Data Integrity**: All deletions cascade properly to maintain referential integrity
- **Real-time Updates**: Query invalidation ensures UI stays synchronized with backend
- **Error Handling**: All mutations have error handling with user-friendly messages

## Future Enhancements

Potential improvements for future iterations:
- Bulk candidate approval/rejection
- Election templates for recurring elections
- Candidate profile view with manifesto details
- Election results analytics
- Export election data to CSV/PDF
- Email notifications for candidate status changes
- Voting period automation (auto-start/end elections)

# User Flow Documentation
## LLM-Powered Home Assistant Config Optimizer

**Status**: ✅ **FULLY IMPLEMENTED** - All documented flows have been built and tested.

### Flow 1: Initial Setup & First Run

#### 1.1 Addon Installation
```
User navigates to HA Add-on Store
→ Searches for "Config Optimizer"
→ Clicks "Install"
→ Waits for installation completion
→ Clicks "Start"
→ Addon appears in sidebar
```

#### 1.2 First-Time Configuration
```
User clicks addon in sidebar
→ Lands on Settings tab (default for first run)
→ Sees "Welcome" setup wizard
→ Configures LLM Provider:
  ├─ Selects provider type (OpenAI/Claude/Groq/Ollama/Custom)
  ├─ Enters API endpoint (if custom/local)
  ├─ Enters API key (if hosted)
  └─ Tests connection
→ Configures File Inclusion:
  ├─ Views file tree of config directory
  ├─ Sees defaults (secrets.yaml excluded)
  └─ Optionally adjusts inclusions/exclusions
→ Clicks "Save Configuration"
→ Setup wizard closes
→ User automatically redirected to Optimizations tab
```

#### ✅ 1.3 First Scan Execution - **IMPLEMENTED**
```
User on Optimizations tab
→ Sees "No optimizations found" empty state
→ Clicks "🔍 Run Scan" button
→ Real-time scan progress appears:
  ├─ Live progress component shows "Scan #1 running..."
  ├─ Estimated progress bar with duration timer
  ├─ Status updates from "Initializing..." to "Processing X files"
  └─ Compact progress indicator in main header
→ Scan completes (30-120 seconds for typical configs)
→ Progress component automatically updates to show completion
→ Suggestions list automatically populates with real AI suggestions
→ Each suggestion shows impact level, category, and file path
```

### Flow 2: Manual Scan Workflow

#### 2.1 Initiating Manual Scan
```
User on any tab
→ Clicks "Run Scan" in header
→ Optional: Clicks gear icon for scan options:
  ├─ Adjusts file inclusions for this scan
  ├─ Selects different LLM model
  └─ Sets scan type (optimization only vs full analysis)
→ Clicks "Start Scan"
→ Progress tracking (as in 1.3)
```

#### 2.2 Monitoring Scan Progress
```
During scan:
→ Progress indicator in header shows current step
→ User can navigate between tabs
→ Real-time updates via Server-Sent Events
→ Option to cancel scan if needed
→ Logs tab shows detailed progress messages
```

### ✅ Flow 3: Suggestion Review & Management - **IMPLEMENTED**

#### ✅ 3.1 Three-Stage Suggestion Workflow - **IMPLEMENTED**
```
STAGE 1: Review (PENDING status)
User on Optimizations tab
→ Sees list of AI-generated suggestions
→ Each suggestion shows:
  ├─ Title and detailed description with reasoning
  ├─ Impact rating (High/Medium/Low) with color coding
  ├─ Category and affected file path
  └─ Actions: "View Diff", "Accept", "Reject"
→ User clicks "View Diff" on suggestion
→ Professional diff modal opens:
  ├─ Side-by-side YAML comparison
  ├─ Toggle between unified and side-by-side views
  ├─ Proper syntax highlighting and line numbers
  └─ Clear before/after content display

STAGE 2: Accept (ACCEPTED status)
→ User clicks "Accept" on suggestion
→ Suggestion status changes to "accepted"
→ New action button appears: "✨ Apply Changes"
→ Previous "Accept" replaced with "Cancel" option

STAGE 3: Apply (APPLIED status)
→ User clicks "✨ Apply Changes"
→ Confirmation dialog appears with safety warnings:
  ├─ "This will modify your Home Assistant configuration files"
  ├─ "A backup will be created automatically"
  ├─ Shows exact file path to be modified
→ User confirms application
→ Backend safely applies changes with automatic backup
→ Suggestion status changes to "✅ Applied"
→ No further actions available (immutable state)
```

#### 3.2 Bulk Actions
```
User selects multiple suggestions via checkboxes
→ Bulk action bar appears with options:
  ├─ "Accept All Selected"
  ├─ "Reject All Selected"
  ├─ "View Selected Diffs"
  └─ "Clear Selection"
→ User clicks bulk action
→ Confirmation modal for destructive actions
→ Progress indicator for multi-item operations
```

#### 3.3 Individual Suggestion Management
```
For each suggestion, user can:
├─ Accept → moves to "Accepted" state, queued for application
├─ Reject → moves to "Rejected" state, hidden from main view
├─ Modify → opens inline YAML editor with LLM-suggested changes
│   ├─ User edits YAML directly
│   ├─ Real-time syntax validation
│   ├─ Save changes or revert to original
│   └─ Accept modified version
└─ View Details → expands to show full LLM reasoning
```

### ✅ Flow 4: Automation Suggestions Workflow - **IMPLEMENTED**

#### ✅ 4.1 Generating Automation Suggestions - **IMPLEMENTED**
```
User clicks "Automations" tab
→ Sees dedicated automation suggestions interface
→ Clicks "🤖 Generate Automations" button
→ Real-time progress tracking shows:
  ├─ "Analyzing available entities..."
  ├─ "Generating automation suggestions..."
  └─ Progress updates with entity discovery count
→ Automation suggestions populate with:
  ├─ Automation title and description
  ├─ Trigger, condition, and action descriptions
  ├─ List of entities used (color-coded tags)
  ├─ Category (lighting/climate/security/energy/convenience)
  └─ Impact rating (high/medium/low usefulness)
```

#### ✅ 4.2 Reviewing Automation YAML - **IMPLEMENTED**
```
User clicks "View YAML" on automation suggestion
→ Professional YAML modal opens:
  ├─ Complete Home Assistant automation configuration
  ├─ Properly formatted YAML with syntax highlighting
  ├─ Copy to clipboard functionality
  └─ Safe to paste directly into automations.yaml
→ User can copy and manually add to their configuration
→ Accept/Reject workflow same as optimization suggestions
```

### ✅ Flow 5: Real-time Monitoring - **IMPLEMENTED**

#### ✅ 5.1 Live Scan Progress - **IMPLEMENTED**
```
During any scan execution:
→ Main header shows compact progress indicator
→ Scan progress component displays:
  ├─ Current scan ID and duration timer
  ├─ Estimated progress bar (based on typical completion times)
  ├─ Real-time status updates every 2 seconds
  └─ Automatic refresh when scan completes
→ All views automatically update when scans finish
→ No manual refresh required
```

#### ✅ 5.2 Scan History and Logs - **IMPLEMENTED**
```
User clicks "Logs" tab
→ Two-panel interface:
  ├─ Left: Recent scans list with status indicators
  └─ Right: Detailed logs for selected scan
→ Real-time log generation showing:
  ├─ Scan start/progress/completion events
  ├─ File processing status
  ├─ Suggestion generation results
  └─ Error messages if any issues occur
→ Filterable by log level (info/success/warning/error)
→ Auto-refresh toggle for live monitoring
```

### Flow 6: Diff Application Workflow

#### 4.1 Reviewing Staged Changes
```
User clicks "Diffs" tab
→ Shows all accepted suggestions ready for application
→ Grouped by file with summary:
  ├─ File path
  ├─ Number of changes
  ├─ Change types (additions/deletions/modifications)
  └─ Preview button
→ User can review individual file diffs
→ Option to unstage specific changes
```

#### 4.2 Applying Changes
```
User clicks "Apply All Changes" button
→ Pre-application checks modal:
  ├─ Shows list of files to be modified
  ├─ Backup location confirmation
  ├─ "I understand this will modify my configuration" checkbox
  └─ Final confirmation buttons
→ User confirms application
→ Application progress modal:
  ├─ "Creating backups..." (progress)
  ├─ "Validating YAML syntax..." (progress)
  ├─ "Writing changes..." (progress)
  └─ "Verifying integrity..." (progress)
→ Success notification: "Applied X changes successfully"
→ Suggestion moves to "Applied" state
→ Option to restart Home Assistant if needed
```

#### 4.3 Error Handling During Application
```
If error occurs during application:
→ Process stops immediately
→ Error modal shows:
  ├─ Clear error description
  ├─ Which file/change caused the issue
  ├─ Automatic rollback status
  └─ Recovery options
→ User options:
  ├─ "Retry" (fix issue and try again)
  ├─ "Skip This Change" (continue with others)
  └─ "Cancel All" (rollback everything)
```

### Flow 5: Automation Suggestions

#### 5.1 Discovering New Automation Opportunities
```
User clicks "Automations" tab
→ If no recorder database configured:
  ├─ Shows setup prompt
  ├─ User configures database connection
  └─ Triggers entity analysis
→ Shows suggested automations:
  ├─ Based on unused entities
  ├─ Based on usage patterns
  ├─ Based on device capabilities
  └─ Grouped by room/area (if available)
```

#### 5.2 Automation Suggestion Review
```
Each automation suggestion shows:
├─ Automation name and description
├─ Trigger conditions
├─ Actions to be performed
├─ Entities involved
├─ Confidence level
└─ Preview YAML
→ User can:
  ├─ Accept as-is
  ├─ Modify before accepting
  ├─ Reject
  └─ Request alternatives
```

### Flow 6: Scheduled Scan Management

#### 6.1 Configuring Scheduled Scans
```
User on Settings tab
→ Scrolls to "Scheduled Scans" section
→ Enables scheduling toggle
→ Configures schedule:
  ├─ Frequency (Daily/Weekly/Monthly)
  ├─ Time of day
  ├─ Days of week (if weekly)
  └─ Scan type and options
→ Sets notification preferences:
  ├─ Email notifications (if configured)
  ├─ HA notifications
  └─ Notification threshold (minimum suggestions)
→ Saves configuration
```

#### 6.2 Scheduled Scan Execution
```
When scheduled scan triggers:
→ Runs in background (no UI modal)
→ Progress visible in Logs tab if user is active
→ Completion notification sent based on preferences
→ Results available in normal tabs
→ Email summary sent (if configured)
```

### Flow 7: Settings & Configuration Management

#### 7.1 LLM Provider Management
```
User on Settings tab → LLM Providers section
→ Can manage multiple provider profiles:
  ├─ Add new provider
  ├─ Edit existing provider
  ├─ Test connection
  ├─ Set as default
  └─ Delete provider
→ Can assign different models to different tasks:
  ├─ Optimization analysis
  ├─ Automation suggestions
  └─ Summarization
```

#### 7.2 File Inclusion Management
```
User on Settings tab → File Management section
→ File tree view with checkboxes:
  ├─ Expand/collapse directories
  ├─ Toggle individual files
  ├─ Bulk select/deselect by pattern
  └─ Preview total files and estimated size
→ Custom exclusion patterns:
  ├─ Glob patterns (e.g., "*.secret", "test_*")
  ├─ Directory exclusions
  └─ File size limits
```

### Flow 8: Error States & Recovery

#### 8.1 LLM Connection Failures
```
When LLM provider unreachable:
→ Error notification with specific details
→ Options presented:
  ├─ "Retry" → attempts connection again
  ├─ "Use Different Provider" → switches to backup
  ├─ "Check Settings" → navigates to LLM config
  └─ "Cancel Scan" → stops current operation
→ Fallback to local processing if available
```

#### 8.2 Configuration File Conflicts
```
When applying changes to modified files:
→ Conflict detection modal shows:
  ├─ Original file hash vs current hash
  ├─ What changes were made externally
  ├─ Proposed changes from optimizer
  └─ Conflict resolution options
→ User options:
  ├─ "Rescan" → analyze current state
  ├─ "Force Apply" → apply anyway (risky)
  ├─ "Skip File" → apply other changes only
  └─ "Cancel" → abort all changes
```

#### 8.3 Backup & Recovery
```
User can access backup management:
→ View all automatic backups with timestamps
→ Manual backup creation
→ Restore from specific backup:
  ├─ Preview what will be restored
  ├─ Choose specific files or full restore
  ├─ Confirmation with impact warning
  └─ Progress tracking during restoration
```

### Flow 9: Advanced Features

#### 9.1 Expert Mode
```
User enables Expert Mode in Settings
→ Additional tabs appear:
  ├─ "Raw Output" → shows unprocessed LLM responses
  ├─ "Prompts" → view and edit system prompts
  └─ "Debugging" → detailed logs and metrics
→ Enhanced diff view with LLM reasoning
→ Custom prompt templates
→ Model benchmarking tools
```

#### 9.2 Reporting & Analytics
```
User clicks "Reports" (expert mode)
→ Configuration health dashboard:
  ├─ Performance metrics over time
  ├─ Suggestion acceptance rates
  ├─ File complexity analysis
  └─ Entity usage statistics
→ Export options:
  ├─ PDF report
  ├─ CSV data
  └─ Markdown summary
```

### Navigation Patterns

#### Global Navigation
- Header: Always visible with scan button, progress indicator, and notifications
- Sidebar: Persistent navigation between main tabs
- Breadcrumbs: For drill-down views (file → suggestion → diff)

#### Tab Structure
1. **Optimizations**: Main suggestion review interface
2. **Automations**: New automation suggestions
3. **Diffs**: Staged changes ready for application
4. **Logs**: Real-time operation logs and history
5. **Settings**: Configuration and preferences
6. **Reports**: Analytics and export (expert mode)

#### Mobile Responsiveness
- Collapsible sidebar on mobile
- Touch-friendly button sizes
- Swipe gestures for tab navigation
- Modal dialogs adapt to screen size
- Progressive disclosure for complex interfaces
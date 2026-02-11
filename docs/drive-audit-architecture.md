# Drive Folder Audit - Architecture

## Overview

The Drive Folder Audit script (v1.1.0) scans shared Google Drive folders to identify **shoot folders** that are not stored in the correct year-based subfolder structure. It enforces the organizational pattern where client folders should contain year subfolders (2024, 2025, 2026), with shoot folders nested within the appropriate year.

The script uses keyword-based detection to identify shoot folders (containing words like "nova", "exec", "club", etc.) and only flags these as organizational issues, allowing other folders like "Branding" or "Project Files" to exist at the client root level.

## Expected Folder Structure

```
Shared Drive Root
└── Client Folder (e.g., "Wyntrice Lim (W6Q)")
    ├── 2024/
    │   └── [session folders from 2024]
    ├── 2025/
    │   └── [session folders from 2025]
    └── 2026/
        └── [session folders from 2026]
```

### Bad Structure (Flagged by Audit)

```
Shared Drive Root
└── Client Folder (e.g., "Uma Thana (Z8T)")
    ├── 3pm 11 Nov - Exec    ← Shoot folder directly under client (FLAGGED)
    ├── 5pm 6 Nov - Club     ← Shoot folder directly under client (FLAGGED)
    ├── Branding             ← Non-shoot folder (ALLOWED - not flagged)
    └── Project Files        ← Non-shoot folder (ALLOWED - not flagged)
```

### Shoot Folder Detection

The script identifies shoot folders by checking if the folder name contains any of these keywords (case-insensitive):
- **nova**
- **nest**
- **exec**
- **iris**
- **club**
- **soho**

Folders without these keywords are considered organizational folders (like "Branding", "Project Files") and are allowed at the client root level.

## Script Flow (v1.1.0)

```
┌─────────────────────────────────────────────────────────────────┐
│                    runAudit() / runAuditWithLimit()              │
│  Entry point - sets up sheets, processes folders, writes output │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────┐
        │  For each configured folder (FOLDER_ID_1, │
        │  FOLDER_ID_2), get first-level subfolders │
        │  (client folders)                         │
        │  Track scan statistics                    │
        └───────────────────────────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────┐
        │         auditClientFolder()               │
        │  For each client folder:                  │
        │  1. Iterate through subfolders            │
        │  2. Check if subfolder is year folder     │
        │  3. Check if subfolder is shoot folder    │
        │  4. Return ONE issue if ANY shoot folders │
        └───────────────────────────────────────────┘
                                │
            ┌───────────────────┴───────────────────┐
            ▼                                       ▼
┌─────────────────────────┐           ┌─────────────────────────┐
│   VALID_YEARS check     │           │  SHOOT_KEYWORDS check   │
│   folder in 2024,       │           │  folder contains nova,  │
│   2025, 2026            │           │  exec, club, etc.       │
│   → Allowed (skip)      │           │  → FLAG as issue        │
└─────────────────────────┘           └─────────────────────────┘
            │                                       │
            └───────────────────┬───────────────────┘
                                ▼
        ┌───────────────────────────────────────────┐
        │  Create ONE issue per client summarizing  │
        │  all shoot folders that need organizing   │
        │  (e.g., "3 shoot folders need             │
        │  organizing: folder1, folder2, folder3")  │
        └───────────────────────────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────┐
        │  Write results to "Audit Results" sheet   │
        │  Write summary with scan stats to         │
        │  "Summary" sheet                          │
        │  Apply formatting and conditional rules   │
        └───────────────────────────────────────────┘
```

## Key Functions

| Function | Purpose | Lines |
|----------|---------|-------|
| `onOpen()` | Creates custom menu in Google Sheets UI with debug options | 31-43 |
| `runAudit()` | Main orchestrator - calls runAuditWithLimit(0) | 45-50 |
| `runAuditWithLimit()` | Core audit logic - scans folders, writes results, tracks stats | 503-735 |
| `auditClientFolder()` | Processes a single client folder, checks for shoot folders | 58-120 |
| `testFolderAccess()` | Diagnostic tool to verify folder IDs and access | 324-449 |
| `runAuditDebugMode()` | Runs audit on first 5 clients with debug logging | 477-497 |
| `logDebug()` | Writes debug messages to "Debug Log" sheet | 456-472 |
| `clearResults()` | Clears Audit Results and Summary sheets | 304-318 |
| `checkYearFolder()` | *(Legacy)* Validates files in year folders | 122-149 |
| `checkNonYearFolder()` | *(Legacy)* Flags files in non-year folders | 238-268 |
| `getAllFilesInFolder()` | *(Legacy)* Recursive file scanner | 276-313 |
| `formatDate()` | Formats dates for display | 320-322 |

## Data Flow

```
Input:
  - Two shared Drive folder IDs (configured in script)

Processing:
  - DriveApp.getFolderById() to access folders
  - file.getDateCreated() for creation timestamp
  - Comparison of file year vs folder location

Output (Google Sheet):
  - Column A: Client Folder name
  - Column B: File Name
  - Column C: Current Path
  - Column D: File Created Date
  - Column E: Expected Year Folder
  - Column F: Issue Description
  - Column G: Direct File Link
```

## Issue Types

| Issue | Description | Conditional Format |
|-------|-------------|-------------------|
| Missing year folder | File/folder is directly under client, not in a year subfolder | Red background (#fce8e6) |
| Wrong year folder | File is in a year folder but creation date doesn't match | Yellow background (#fff3cd) |

## Configuration Constants

```javascript
FOLDER_ID_1     // First shared Drive folder ID
FOLDER_ID_2     // Second shared Drive folder ID
VALID_YEARS     // Array: ['2024', '2025', '2026']
```

## Dependencies

| Service | Usage |
|---------|-------|
| DriveApp | Access shared folders, iterate files/folders, get metadata |
| SpreadsheetApp | Write results, create sheets, apply formatting |
| Utilities | Date formatting |
| Session | Get script timezone |

## Limitations

- Google Apps Script execution timeout: 6 minutes (consumer) / 30 minutes (Workspace)
- Large folder structures may require pagination or batching in future versions
- File creation date used (not modified date) - may not reflect actual recording date

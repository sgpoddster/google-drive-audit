# Drive Folder Audit - Architecture

## Overview

The Drive Folder Audit script scans shared Google Drive folders to identify files that are not stored in the correct year-based subfolder structure. It enforces the organizational pattern where client folders should contain year subfolders (2024, 2025, 2026), with session folders nested within the appropriate year.

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
    ├── 3pm 11 Nov - Exec    ← Session folder directly under client (FLAGGED)
    └── 5pm 6 Nov - Exec     ← Session folder directly under client (FLAGGED)
```

## Script Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         runAudit()                               │
│  Entry point - sets up sheets, processes folders, writes output │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────┐
        │  For each configured folder (FOLDER_ID_1, │
        │  FOLDER_ID_2), get first-level subfolders │
        │  (client folders)                         │
        └───────────────────────────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────┐
        │         auditClientFolder()               │
        │  For each client folder:                  │
        │  1. Check for files directly in client    │
        │  2. Iterate through subfolders            │
        └───────────────────────────────────────────┘
                                │
            ┌───────────────────┴───────────────────┐
            ▼                                       ▼
┌─────────────────────────┐           ┌─────────────────────────┐
│   checkYearFolder()     │           │  checkNonYearFolder()   │
│   If subfolder is a     │           │  If subfolder is NOT a  │
│   year (2024/2025/2026) │           │  year folder, flag all  │
│   verify files match    │           │  files as misplaced     │
│   that year             │           │                         │
└─────────────────────────┘           └─────────────────────────┘
            │                                       │
            └───────────────────┬───────────────────┘
                                ▼
        ┌───────────────────────────────────────────┐
        │       getAllFilesInFolder()               │
        │  Recursively collects all files with      │
        │  their relative paths                     │
        └───────────────────────────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────┐
        │  Write results to "Audit Results" sheet   │
        │  Write summary to "Summary" sheet         │
        │  Apply formatting and conditional rules   │
        └───────────────────────────────────────────┘
```

## Key Functions

| Function | Purpose |
|----------|---------|
| `onOpen()` | Creates custom menu in Google Sheets UI |
| `runAudit()` | Main orchestrator - scans folders, writes results |
| `auditClientFolder()` | Processes a single client folder, returns issues array |
| `checkYearFolder()` | Validates files in year folders have matching creation dates |
| `checkNonYearFolder()` | Flags all files in non-year folders as misplaced |
| `getAllFilesInFolder()` | Recursive helper to get all files with path info |
| `formatDate()` | Formats dates for display in sheet |
| `clearResults()` | Clears both output sheets |

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

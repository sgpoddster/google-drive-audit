# 📁 Google Drive Folder Year Audit

> A Google Apps Script tool for auditing and organizing shared Drive folders by year

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-stable-green.svg)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Understanding the Results](#understanding-the-results)
- [Issue Types](#issue-types)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Version History](#version-history)

---

## Overview

The **Drive Folder Year Audit** script helps maintain organized file structures in Google Drive by identifying files that aren't properly stored in year-based subfolders. It's designed for shared Drive folders where files need to be organized chronologically by client and year.

### Expected Folder Structure

```
📁 Shared Drive Folder
├── 📁 Client A
│   ├── 📁 2024
│   │   └── Session folders and files...
│   ├── 📁 2025
│   │   └── Session folders and files...
│   └── 📁 2026
│       └── Session folders and files...
└── 📁 Client B
    ├── 📁 2024
    ├── 📁 2025
    └── 📁 2026
```

### Why Use This Tool?

- **Maintain consistency** across client folders
- **Quickly identify** organizational issues before they accumulate
- **Generate actionable reports** with clickable file links
- **Safe to run** - read-only operation that doesn't modify files
- **Automated detection** of wrong year placements based on file creation dates

---

## Features

✅ **Dual Folder Scanning** - Audits two configured shared Drive folders simultaneously
✅ **Smart Detection** - Identifies files missing year folders AND files in wrong year folders
✅ **Detailed Reports** - Generates comprehensive results in Google Sheets with file paths and links
✅ **Summary Statistics** - Quick overview of total issues and breakdown by type
✅ **Color-Coded Issues** - Red for missing year folders, yellow for wrong year placement
✅ **Custom Menu Integration** - Easy access via "📁 Drive Audit" menu in Google Sheets
✅ **Clickable File Links** - Direct navigation to flagged files in Drive
✅ **Read-Only Operation** - Safe to run repeatedly without risk of data loss

---

## Prerequisites

- **Google Account** with access to the shared Drive folders you want to audit
- **Edit access** to the Google Sheet where the script will be installed
- **View/Read access** to the shared Drive folders being audited
- Basic familiarity with Google Sheets and Google Apps Script

### Required Permissions

When you first run the script, you'll be asked to authorize:
- `https://www.googleapis.com/auth/drive` - Read access to shared Drive folders
- `https://www.googleapis.com/auth/spreadsheets` - Write access to create output sheets

---

## Installation

### Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it something like "Drive Folder Audit Results"

### Step 2: Open the Apps Script Editor

1. In your new sheet, click **Extensions** → **Apps Script**
2. Delete any default code in the editor

### Step 3: Copy the Script

1. Open the [`drive-folder-audit.gs`](/drive-folder-audit.gs) file from this repository
2. Copy the entire contents
3. Paste into the Apps Script editor

### Step 4: Save the Script

1. Click the **Save** icon (💾) or press `Ctrl+S` / `Cmd+S`
2. Name your project (e.g., "Drive Folder Audit")

---

## Configuration

Before running the audit, you need to configure two folder IDs in the script.

### Finding Your Folder ID

1. Open Google Drive and navigate to the shared folder you want to audit
2. Look at the URL in your browser's address bar:
   ```
   https://drive.google.com/drive/folders/1A2B3C4D5E6F7G8H9I0J
                                          └─────────────────┘
                                           This is the Folder ID
   ```
3. Copy the folder ID (the long string after `/folders/`)

### Update the Script Configuration

At the top of the `drive-folder-audit.gs` file, replace the placeholder values:

```javascript
// Configuration: Replace these with your actual shared folder IDs
const FOLDER_ID_1 = 'YOUR_FIRST_FOLDER_ID_HERE';
const FOLDER_ID_2 = 'YOUR_SECOND_FOLDER_ID_HERE';

// Valid year folder names (can be modified if needed)
const VALID_YEARS = ['2024', '2025', '2026'];
```

**Example:**
```javascript
const FOLDER_ID_1 = '1A2B3C4D5E6F7G8H9I0J';
const FOLDER_ID_2 = '9Z8Y7X6W5V4U3T2S1R0Q';
```

### Save Your Changes

After updating the configuration, save the script again (`Ctrl+S` / `Cmd+S`).

---

## Usage

### Running Your First Audit

1. **Return to your Google Sheet** (close the Apps Script editor or switch tabs)
2. **Refresh the page** - you should see a new menu item: **📁 Drive Audit**
3. Click **📁 Drive Audit** → **Run Full Audit**
4. **First-time authorization:**
   - Click "Continue" when prompted
   - Choose your Google account
   - Click "Advanced" → "Go to [Project Name] (unsafe)"
   - Click "Allow" to grant permissions
5. **Wait for completion** - the script will process all folders
6. **View results** - an alert will show the number of issues found

### Menu Options

| Menu Item | Description |
|-----------|-------------|
| **Run Full Audit** | Scans both configured folders and generates a complete report |
| **Clear Results** | Clears the "Audit Results" and "Summary" sheets |

### Performance Notes

- **Small folders** (< 1,000 files): Completes in under 1 minute
- **Medium folders** (1,000-5,000 files): 1-3 minutes
- **Large folders** (> 5,000 files): 3-6 minutes (may approach timeout limits)

---

## Understanding the Results

After running an audit, two sheets are generated in your spreadsheet:

### 1. Audit Results Sheet

Contains a detailed table of all misplaced files:

| Column | Description |
|--------|-------------|
| **Client Folder** | Name of the client folder containing the issue |
| **File Name** | Name of the file or folder flagged |
| **Current Path** | Relative path showing where the file currently lives |
| **File Created Date** | When the file was originally created |
| **Expected Year Folder** | Which year folder the file should be in (based on creation date) |
| **Issue** | Type of problem: "Missing year folder" or "Wrong year folder" |
| **File Link** | Clickable URL to open the file directly in Drive |

**Color Coding:**
- 🔴 **Red background** - File/folder missing year organization (not in 2024/2025/2026)
- 🟡 **Yellow background** - File is in a year folder but the year doesn't match creation date

### 2. Summary Sheet

Provides quick statistics:

```
Last Audit Run:               2026-02-10 14:30:15
Total Misplaced Files:        47
Files Missing Year Folder:    32
Files in Wrong Year Folder:   15
```

---

## Issue Types

### 🔴 Missing Year Folder

**Problem:** Files or folders stored directly under a client folder, not organized into 2024/2025/2026 subfolders.

**Example:**
```
📁 Client A
├── 📁 2024
├── 📁 2025
├── 📄 Important Document.pdf  ⚠️ Issue: Should be in a year folder
└── 📁 Project Files           ⚠️ Issue: Session folder not organized by year
```

**Resolution:** Move the file/folder into the appropriate year subfolder (2024, 2025, or 2026).

---

### 🟡 Wrong Year Folder

**Problem:** File is in a year folder (2024/2025/2026) but the file's creation date doesn't match that year.

**Example:**
```
📁 Client B
└── 📁 2025
    └── 📄 Budget_2024.xlsx  ⚠️ Created: Jan 15, 2024 (should be in 2024 folder)
```

**Resolution:** Move the file to the year folder matching its creation date.

---

## Project Structure

```
drive-folder-audit/
├── drive-folder-audit.gs          # Main Google Apps Script (319 lines)
├── README.md                       # This file
└── docs/
    ├── drive-audit-architecture.md    # Technical architecture documentation
    ├── drive-audit-changelog.md       # Version history and release notes
    └── drive-audit-project-status.md  # Current status and roadmap
```

### Key Files

- **`drive-folder-audit.gs`** - The complete script to copy into Google Apps Script
- **`docs/drive-audit-architecture.md`** - Deep dive into how the script works
- **`docs/drive-audit-project-status.md`** - Feature status and future plans
- **`docs/drive-audit-changelog.md`** - Detailed change history

---

## Roadmap

Future enhancements planned for upcoming versions:

| Feature | Priority | Status |
|---------|----------|--------|
| Exclude specific file types (e.g., .DS_Store) | Medium | 🔲 Not started |
| Exclude folders by name pattern | Medium | 🔲 Not started |
| Progress indicator for large scans | Low | 🔲 Not started |
| Batch processing to prevent timeouts | Medium | 🔲 Not started |
| Auto-move files to correct folders | Low | 🔲 Not started |
| Email notification of results | Low | 🔲 Not started |
| Scheduled automatic audits | Medium | 🔲 Not started |
| Filter results by client in the sheet | Low | 🔲 Not started |

See [`docs/drive-audit-project-status.md`](docs/drive-audit-project-status.md) for the complete roadmap.

---

## Contributing

### Reporting Issues

If you encounter a bug or unexpected behavior:

1. Check the [Known Issues](docs/drive-audit-project-status.md#known-issues) section first
2. Gather details:
   - What were you trying to do?
   - What happened vs. what you expected?
   - How many files/folders were being scanned?
   - Any error messages displayed?
3. Open an issue with a clear description

### Suggesting Features

Have an idea for improvement? We'd love to hear it!

1. Check the [Roadmap](#roadmap) to see if it's already planned
2. Describe your use case and how the feature would help
3. Consider whether the feature fits the tool's core purpose (organizational auditing)

### Code Contributions

Before making significant changes:
1. Review the technical architecture in [`docs/drive-audit-architecture.md`](docs/drive-audit-architecture.md)
2. Ensure changes align with the project's read-only, safety-first philosophy
3. Test thoroughly with various folder structures
4. Update documentation as needed

---

## Version History

**Current Version:** v1.0.0 (Released 2026-02-03)

See [`docs/drive-audit-changelog.md`](docs/drive-audit-changelog.md) for detailed release notes.

---

## Support

For questions or discussions:
- Review the [documentation](docs/) for technical details
- Check existing issues for similar questions
- Open a new issue for specific problems

---

**Made with ❤️ for organized Google Drive folders**

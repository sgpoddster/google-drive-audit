# Drive Folder Audit - Changelog

All notable changes to the Drive Folder Audit script will be documented in this file.

---

## [v1.1.0] - 2026-02-11

### Added
- **Debug Mode**: New "🐛 Run Audit (Debug Mode)" menu option for testing on first 5 clients
- **Test Folder Access**: Diagnostic tool to verify folder IDs and enumerate client folders
- **Enhanced Summary Sheet**: Now shows scan statistics even when 0 issues found
  - Folders scanned with names and IDs
  - Total client folders found
  - List of client folder names (first 10)
- **Debug Logging System**:
  - `logDebug()` function writes to "Debug Log" sheet
  - Comprehensive logging throughout audit process
  - Tracks folder access, subfolder counts, issue detection
- **Shoot Folder Detection**: Smart filtering to only flag specific folder types
  - `SHOOT_KEYWORDS` configuration for keywords: nova, nest, exec, iris, club, soho
  - Only flags folders containing shoot keywords
  - Allows non-shoot folders like "Branding", "Project Files"
- **One Issue Per Client**: Simplified output shows one issue per client instead of per folder
  - Shows count of problematic folders
  - Lists first 3 folder names with "...+N more" if needed

### Changed
- **Audit Logic**: Completely refactored to be folder-based instead of file-based
  - No longer scans files inside folders
  - Checks only first-level folder organization
  - Much faster performance
- **Issue Reporting**: Consolidated multiple issues per client into single summary issue
- **Menu Organization**: Added separator for better menu structure
- **Empty Folders**: Now correctly handles empty client folders (no false positives)

### Fixed
- Resolved issue where script returned 0 results despite organizational problems
- Fixed performance issue with scanning 522 client folders
- Removed duplicate `runAuditOld()` function that caused conflicts

### Configuration
- Added `SHOOT_KEYWORDS` array for defining shoot folder identification
- Folder IDs now properly configured: `0AOgf3l3lzd1vUk9PVA` and `0AMwW0RURekMfUk9PVA`

---

## [v1.0.0] - 2026-02-03

### Added
- Initial release of Drive Folder Audit script
- Custom menu in Google Sheets ("📁 Drive Audit")
- `runAudit()` - Main function to scan two shared Drive folders
- `auditClientFolder()` - Audits individual client folders for year organization
- `checkYearFolder()` - Validates files in year folders match their creation year
- `checkNonYearFolder()` - Identifies session folders not organized by year
- `getAllFilesInFolder()` - Recursive file scanner with path tracking
- `clearResults()` - Utility to clear audit results
- Two output sheets:
  - "Audit Results" - Detailed list of misplaced files
  - "Summary" - Quick stats and last run timestamp
- Conditional formatting for issue types (red for missing, yellow for wrong)
- Direct file links in output for easy navigation
- Support for year folders: 2024, 2025, 2026

### Configuration
- `FOLDER_ID_1` and `FOLDER_ID_2` - Configurable shared folder IDs
- `VALID_YEARS` - Array of valid year folder names

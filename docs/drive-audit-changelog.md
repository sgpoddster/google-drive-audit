# Drive Folder Audit - Changelog

All notable changes to the Drive Folder Audit script will be documented in this file.

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

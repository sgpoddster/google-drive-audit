# Changelog

All notable changes to the Drive Folder Audit Script will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.2.0] - 2025-02-12

### Changed
- **Premiere Pro Audit**: Modified output to show one row per client folder instead of one row per shoot folder
  - Each client now appears only once in the audit results
  - "Shoot Folders" column shows count of shoot folders (e.g., "3 shoot folders")
  - "Summary" column indicates whether .prproj files were found
  - When .prproj files are found, shows the most recently modified one
  - Folder link now points to the client folder instead of individual shoot folders
  - Makes it easier to quickly see which clients have or don't have .prproj files

## [1.1.0] - 2025-02-11

### Added
- Smart shoot folder detection and debug tools

## [1.0.0] - 2025-02-11

### Added
- Initial release of Drive Folder Audit Script
- Year-based folder organization audit
- Premiere Pro project file audit
- Debug mode for both audit types
- Test folder access functionality
- Custom menu integration in Google Sheets
- Comprehensive summary reports
- Conditional formatting for audit results

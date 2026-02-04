/**
 * Drive Folder Year Audit Script
 *
 * Scans two shared Drive folders and identifies files that are not stored
 * in the correct year-based subfolder (2024, 2025, 2026) based on their creation date.
 *
 * SETUP:
 * 1. Create a new Google Sheet
 * 2. Open Extensions > Apps Script
 * 3. Paste this entire script
 * 4. Update FOLDER_ID_1 and FOLDER_ID_2 with your shared folder IDs
 * 5. Run 'runAudit' from the menu or script editor
 */

// ============ CONFIGURATION ============
// Replace these with your actual shared folder IDs
const FOLDER_ID_1 = 'YOUR_FIRST_FOLDER_ID_HERE';
const FOLDER_ID_2 = 'YOUR_SECOND_FOLDER_ID_HERE';

// Valid year folders
const VALID_YEARS = ['2024', '2025', '2026'];

// ============ MAIN FUNCTIONS ============

/**
 * Adds custom menu to the spreadsheet
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📁 Drive Audit')
    .addItem('Run Full Audit', 'runAudit')
    .addItem('Clear Results', 'clearResults')
    .addToUi();
}

/**
 * Main audit function - scans both folders and writes results to sheet
 */
function runAudit() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Audit Results');

  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet('Audit Results');
  }

  // Clear and set up headers
  sheet.clear();
  const headers = [
    'Client Folder',
    'File Name',
    'Current Path',
    'File Created Date',
    'Expected Year Folder',
    'Issue',
    'File Link'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('white');

  // Freeze header row
  sheet.setFrozenRows(1);

  const misplacedFiles = [];

  // Process both folders
  const folderIds = [FOLDER_ID_1, FOLDER_ID_2];

  for (const folderId of folderIds) {
    if (folderId === 'YOUR_FIRST_FOLDER_ID_HERE' || folderId === 'YOUR_SECOND_FOLDER_ID_HERE') {
      SpreadsheetApp.getUi().alert('Please configure the folder IDs in the script before running.');
      return;
    }

    try {
      const rootFolder = DriveApp.getFolderById(folderId);
      Logger.log(`Scanning folder: ${rootFolder.getName()}`);

      // Get all first-level subfolders (client folders)
      const clientFolders = rootFolder.getFolders();

      while (clientFolders.hasNext()) {
        const clientFolder = clientFolders.next();
        const clientName = clientFolder.getName();
        Logger.log(`  Checking client: ${clientName}`);

        // Audit this client folder
        const issues = auditClientFolder(clientFolder, clientName);
        misplacedFiles.push(...issues);
      }
    } catch (e) {
      Logger.log(`Error accessing folder ${folderId}: ${e.message}`);
      SpreadsheetApp.getUi().alert(`Error accessing folder: ${e.message}\n\nMake sure the script has access to the folder.`);
    }
  }

  // Write results to sheet
  if (misplacedFiles.length > 0) {
    sheet.getRange(2, 1, misplacedFiles.length, headers.length).setValues(misplacedFiles);

    // Auto-resize columns
    for (let i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }

    // Add conditional formatting for issues
    const issueRange = sheet.getRange(2, 6, misplacedFiles.length, 1);
    const rule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextContains('Missing year folder')
      .setBackground('#fce8e6')
      .setRanges([issueRange])
      .build();
    const rule2 = SpreadsheetApp.newConditionalFormatRule()
      .whenTextContains('Wrong year folder')
      .setBackground('#fff3cd')
      .setRanges([issueRange])
      .build();
    sheet.setConditionalFormatRules([rule, rule2]);
  }

  // Add summary at top
  const summarySheet = ss.getSheetByName('Summary') || ss.insertSheet('Summary');
  summarySheet.clear();
  summarySheet.getRange('A1').setValue('Drive Folder Audit Summary');
  summarySheet.getRange('A1').setFontWeight('bold').setFontSize(14);
  summarySheet.getRange('A3').setValue('Last Run:');
  summarySheet.getRange('B3').setValue(new Date());
  summarySheet.getRange('A4').setValue('Total Misplaced Files:');
  summarySheet.getRange('B4').setValue(misplacedFiles.length);

  // Count by issue type
  const missingFolder = misplacedFiles.filter(f => f[5].includes('Missing year folder')).length;
  const wrongFolder = misplacedFiles.filter(f => f[5].includes('Wrong year folder')).length;

  summarySheet.getRange('A5').setValue('Files missing year folder:');
  summarySheet.getRange('B5').setValue(missingFolder);
  summarySheet.getRange('A6').setValue('Files in wrong year folder:');
  summarySheet.getRange('B6').setValue(wrongFolder);

  SpreadsheetApp.getUi().alert(`Audit complete!\n\nFound ${misplacedFiles.length} misplaced files.\n\nSee 'Audit Results' sheet for details.`);
}

/**
 * Audits a single client folder for misplaced files
 * @param {Folder} clientFolder - The client's root folder
 * @param {string} clientName - The client folder name
 * @returns {Array} Array of misplaced file records
 */
function auditClientFolder(clientFolder, clientName) {
  const issues = [];

  // Check for files directly in the client folder (not in any year subfolder)
  const directFiles = clientFolder.getFiles();
  while (directFiles.hasNext()) {
    const file = directFiles.next();
    const createdDate = file.getDateCreated();
    const expectedYear = createdDate.getFullYear().toString();

    issues.push([
      clientName,
      file.getName(),
      `${clientName}/`,
      formatDate(createdDate),
      expectedYear,
      `Missing year folder - file is directly in client folder`,
      file.getUrl()
    ]);
  }

  // Check subfolders
  const subfolders = clientFolder.getFolders();
  while (subfolders.hasNext()) {
    const subfolder = subfolders.next();
    const subfolderName = subfolder.getName();

    // Check if this is a year folder
    if (VALID_YEARS.includes(subfolderName)) {
      // This is a year folder - check files inside are from the correct year
      const yearIssues = checkYearFolder(subfolder, clientName, subfolderName);
      issues.push(...yearIssues);
    } else {
      // This is NOT a year folder (e.g., "3pm 11 Nov - Exec")
      // Check if files here should be in a year folder
      const nonYearIssues = checkNonYearFolder(subfolder, clientName, subfolderName);
      issues.push(...nonYearIssues);
    }
  }

  return issues;
}

/**
 * Checks files in a year folder to ensure they match the year
 * @param {Folder} yearFolder - The year folder (e.g., "2025")
 * @param {string} clientName - The client folder name
 * @param {string} yearName - The year folder name
 * @returns {Array} Array of misplaced file records
 */
function checkYearFolder(yearFolder, clientName, yearName) {
  const issues = [];

  // Recursively check all files in this year folder
  const filesInYear = getAllFilesInFolder(yearFolder);

  for (const fileData of filesInYear) {
    const file = fileData.file;
    const relativePath = fileData.path;
    const createdDate = file.getDateCreated();
    const fileYear = createdDate.getFullYear().toString();

    if (fileYear !== yearName) {
      issues.push([
        clientName,
        file.getName(),
        `${clientName}/${yearName}/${relativePath}`,
        formatDate(createdDate),
        fileYear,
        `Wrong year folder - file created in ${fileYear} but stored in ${yearName}`,
        file.getUrl()
      ]);
    }
  }

  return issues;
}

/**
 * Checks files in a non-year folder (session folders directly under client)
 * @param {Folder} folder - The non-year folder
 * @param {string} clientName - The client folder name
 * @param {string} folderName - The folder name
 * @returns {Array} Array of misplaced file records
 */
function checkNonYearFolder(folder, clientName, folderName) {
  const issues = [];

  // Get all files recursively in this folder
  const filesInFolder = getAllFilesInFolder(folder);

  for (const fileData of filesInFolder) {
    const file = fileData.file;
    const relativePath = fileData.path;
    const createdDate = file.getDateCreated();
    const expectedYear = createdDate.getFullYear().toString();

    issues.push([
      clientName,
      file.getName(),
      `${clientName}/${folderName}/${relativePath}`,
      formatDate(createdDate),
      expectedYear,
      `Missing year folder - should be in ${clientName}/${expectedYear}/${folderName}/`,
      file.getUrl()
    ]);
  }

  return issues;
}

/**
 * Recursively gets all files in a folder and its subfolders
 * @param {Folder} folder - The folder to scan
 * @param {string} currentPath - The current relative path
 * @returns {Array} Array of {file, path} objects
 */
function getAllFilesInFolder(folder, currentPath = '') {
  const results = [];

  // Get files in current folder
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    results.push({
      file: file,
      path: currentPath ? `${currentPath}/${file.getName()}` : file.getName()
    });
  }

  // Recursively check subfolders
  const subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    const subfolder = subfolders.next();
    const newPath = currentPath ? `${currentPath}/${subfolder.getName()}` : subfolder.getName();
    const subResults = getAllFilesInFolder(subfolder, newPath);
    results.push(...subResults);
  }

  return results;
}

/**
 * Formats a date for display
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Clears the audit results
 */
function clearResults() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Audit Results');
  if (sheet) {
    sheet.clear();
  }
  const summarySheet = ss.getSheetByName('Summary');
  if (summarySheet) {
    summarySheet.clear();
  }
  SpreadsheetApp.getUi().alert('Results cleared.');
}

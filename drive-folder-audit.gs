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
const FOLDER_ID_1 = '0AOgf3l3lzd1vUk9PVA';
const FOLDER_ID_2 = '0AMwW0RURekMfUk9PVA';

// Valid year folders
const VALID_YEARS = ['2024', '2025', '2026'];

// Shoot folder keywords - folders containing these words should be under year folders
const SHOOT_KEYWORDS = ['nova', 'nest', 'exec', 'iris', 'club', 'soho'];

// Debug mode flag
let DEBUG_MODE = false;

// ============ MAIN FUNCTIONS ============

/**
 * Adds custom menu to the spreadsheet
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📁 Drive Audit')
    .addItem('Run Full Audit', 'runAudit')
    .addItem('🐛 Run Audit (Debug Mode)', 'runAuditDebugMode')
    .addItem('🔍 Test Folder Access', 'testFolderAccess')
    .addSeparator()
    .addItem('Clear Results', 'clearResults')
    .addToUi();
}

/**
 * Main audit function - scans both folders and writes results to sheet
 */
function runAudit() {
  runAuditWithLimit(0); // 0 = no limit, process all folders
}

/**
 * Audits a single client folder for misplaced files
 * @param {Folder} clientFolder - The client's root folder
 * @param {string} clientName - The client folder name
 * @returns {Array} Array of misplaced file records
 */
function auditClientFolder(clientFolder, clientName) {
  const issues = [];
  logDebug(`Starting audit of client folder`, { client: clientName });

  // Check subfolders - looking for shoot folders that should be under year folders
  const subfolders = clientFolder.getFolders();
  let subfolderCount = 0;
  let yearFolderCount = 0;
  let shootFolderCount = 0;
  const shootFolderNames = [];

  while (subfolders.hasNext()) {
    const subfolder = subfolders.next();
    const subfolderName = subfolder.getName();
    subfolderCount++;

    // Check if this is a year folder
    if (VALID_YEARS.includes(subfolderName)) {
      yearFolderCount++;
      logDebug(`Year folder found (OK)`, { client: clientName, yearFolder: subfolderName });
      // Year folder is correctly organized - no issue
    } else {
      // Check if this is a shoot folder (contains shoot keywords)
      const lowerFolderName = subfolderName.toLowerCase();
      const isShootFolder = SHOOT_KEYWORDS.some(keyword => lowerFolderName.includes(keyword));

      if (isShootFolder) {
        shootFolderCount++;
        shootFolderNames.push(subfolderName);
        logDebug(`Shoot folder found (ISSUE)`, { client: clientName, folder: subfolderName });
      } else {
        logDebug(`Non-shoot folder found (OK - allowed)`, { client: clientName, folder: subfolderName });
        // This is allowed (like "Branding", "Project Files", etc.) - no issue
      }
    }
  }

  // If there are ANY shoot folders directly in client root, create ONE issue for this client
  if (shootFolderCount > 0) {
    const clientUrl = clientFolder.getUrl();
    const folderList = shootFolderNames.slice(0, 3).join(', ') + (shootFolderNames.length > 3 ? `, ... +${shootFolderNames.length - 3} more` : '');

    issues.push([
      clientName,
      `${shootFolderCount} shoot folder${shootFolderCount > 1 ? 's' : ''} need organizing`,
      `${clientName}/`,
      'N/A',
      '2024, 2025, or 2026',
      `${shootFolderCount} shoot folder${shootFolderCount > 1 ? 's' : ''} not organized by year: ${folderList}`,
      clientUrl
    ]);
  }

  logDebug(`Client folder audit complete`, {
    client: clientName,
    totalSubfolders: subfolderCount,
    yearFolders: yearFolderCount,
    shootFolders: shootFolderCount,
    totalIssues: issues.length
  });

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
  logDebug(`Scanning non-year folder for files`, { client: clientName, folder: folderName });

  // Get all files recursively in this folder
  const filesInFolder = getAllFilesInFolder(folder);
  logDebug(`Files found in non-year folder`, {
    client: clientName,
    folder: folderName,
    fileCount: filesInFolder.length
  });

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

  logDebug(`Non-year folder scan complete`, {
    client: clientName,
    folder: folderName,
    issuesCreated: issues.length
  });

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
  const folderName = folder.getName();
  logDebug(`Scanning folder recursively`, { folder: folderName, path: currentPath });

  // Get files in current folder
  const files = folder.getFiles();
  let fileCount = 0;
  while (files.hasNext()) {
    const file = files.next();
    fileCount++;
    results.push({
      file: file,
      path: currentPath ? `${currentPath}/${file.getName()}` : file.getName()
    });
  }

  // Recursively check subfolders
  const subfolders = folder.getFolders();
  let subfolderCount = 0;
  while (subfolders.hasNext()) {
    const subfolder = subfolders.next();
    subfolderCount++;
    const newPath = currentPath ? `${currentPath}/${subfolder.getName()}` : subfolder.getName();
    const subResults = getAllFilesInFolder(subfolder, newPath);
    results.push(...subResults);
  }

  logDebug(`Folder scan complete`, {
    folder: folderName,
    path: currentPath,
    filesInThisFolder: fileCount,
    subfolders: subfolderCount,
    totalFilesFound: results.length
  });

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

/**
 * Tests folder access and shows diagnostic information
 * Helps verify that folder IDs are correct and accessible
 */
function testFolderAccess() {
  const folderIds = [FOLDER_ID_1, FOLDER_ID_2];
  let report = '=== FOLDER ACCESS TEST ===\n\n';
  let totalClientFolders = 0;
  let allClientNames = [];

  for (let i = 0; i < folderIds.length; i++) {
    const folderId = folderIds[i];
    const folderNum = i + 1;

    report += `\n--- FOLDER ${folderNum} ---\n`;

    // Check if ID is still placeholder
    if (folderId === 'YOUR_FIRST_FOLDER_ID_HERE' || folderId === 'YOUR_SECOND_FOLDER_ID_HERE') {
      report += `❌ Not configured (still has placeholder value)\n`;
      continue;
    }

    report += `Folder ID: ${folderId}\n`;

    // Try to access folder
    try {
      const folder = DriveApp.getFolderById(folderId);
      report += `✅ Successfully accessed\n`;
      report += `Folder Name: "${folder.getName()}"\n`;

      // Count client folders
      const clientFolders = folder.getFolders();
      let clientCount = 0;
      const clientNames = [];

      while (clientFolders.hasNext()) {
        const clientFolder = clientFolders.next();
        clientCount++;
        totalClientFolders++;
        const clientName = clientFolder.getName();
        clientNames.push(clientName);
        allClientNames.push(clientName);
      }

      report += `Client Folders Found: ${clientCount}\n`;

      if (clientCount > 0) {
        report += `\nClient folder names:\n`;
        for (const name of clientNames) {
          report += `  • ${name}\n`;
        }

        // Show structure of first client folder
        if (clientNames.length > 0) {
          try {
            const firstClient = DriveApp.getFoldersByName(clientNames[0]);
            if (firstClient.hasNext()) {
              const clientFolder = firstClient.next();
              report += `\nStructure of "${clientNames[0]}":\n`;

              const subfolders = clientFolder.getFolders();
              let subfolderCount = 0;
              const subfolderNames = [];

              while (subfolders.hasNext()) {
                const subfolder = subfolders.next();
                subfolderCount++;
                const subName = subfolder.getName();
                subfolderNames.push(subName);
              }

              if (subfolderCount > 0) {
                report += `  Subfolders (${subfolderCount}):\n`;
                for (const subName of subfolderNames) {
                  const isYearFolder = VALID_YEARS.includes(subName);
                  report += `    • ${subName}${isYearFolder ? ' ✓ (year folder)' : ''}\n`;
                }
              } else {
                report += `  (No subfolders found)\n`;
              }

              // Check for direct files
              const files = clientFolder.getFiles();
              let fileCount = 0;
              while (files.hasNext()) {
                files.next();
                fileCount++;
              }
              report += `  Direct files: ${fileCount}\n`;
            }
          } catch (e) {
            report += `  (Could not analyze structure: ${e.message})\n`;
          }
        }
      } else {
        report += `⚠️  No client folders found in this folder.\n`;
        report += `   Make sure this folder contains client subfolders.\n`;
      }

    } catch (e) {
      report += `❌ Error accessing folder: ${e.message}\n`;
      report += `   Possible causes:\n`;
      report += `   - Folder ID is incorrect\n`;
      report += `   - You don't have permission to access this folder\n`;
      report += `   - Folder has been deleted\n`;
    }
  }

  // Summary
  report += `\n\n=== SUMMARY ===\n`;
  report += `Total client folders across all scanned folders: ${totalClientFolders}\n`;

  if (totalClientFolders === 0) {
    report += `\n⚠️  NO CLIENT FOLDERS FOUND\n`;
    report += `\nThis explains why the audit returns no data.\n`;
    report += `Please verify:\n`;
    report += `1. You're using the correct folder IDs\n`;
    report += `2. The folders contain client subfolders\n`;
    report += `3. You have access to view the folder contents\n`;
  } else {
    report += `\n✅ Client folders found! The audit should work.\n`;
    report += `\nIf the audit still shows no results, it means:\n`;
    report += `- All files are properly organized in year folders\n`;
    report += `- OR the client folders are empty\n`;
  }

  // Show report in a dialog
  const ui = SpreadsheetApp.getUi();
  ui.alert('Folder Access Test Results', report, ui.ButtonSet.OK);
}

/**
 * Logs debug messages to the Debug Log sheet
 * @param {string} message - The log message
 * @param {Object} data - Optional data object to log
 */
function logDebug(message, data = null) {
  if (!DEBUG_MODE) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let debugSheet = ss.getSheetByName('Debug Log');

  if (!debugSheet) {
    debugSheet = ss.insertSheet('Debug Log');
    debugSheet.getRange('A1:C1').setValues([['Timestamp', 'Message', 'Data']]);
    debugSheet.getRange('A1:C1').setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
    debugSheet.setFrozenRows(1);
  }

  const timestamp = new Date();
  const dataStr = data ? JSON.stringify(data) : '';
  debugSheet.appendRow([timestamp, message, dataStr]);
}

/**
 * Runs audit in debug mode - only processes first 5 client folders with verbose logging
 */
function runAuditDebugMode() {
  // Clear existing debug log
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const debugSheet = ss.getSheetByName('Debug Log');
  if (debugSheet) {
    ss.deleteSheet(debugSheet);
  }

  // Enable debug mode
  DEBUG_MODE = true;
  logDebug('=== DEBUG MODE AUDIT STARTED ===');
  logDebug('Note: Processing only first 5 client folders for debugging');

  // Run the normal audit function with debug logging enabled
  runAuditWithLimit(5);

  logDebug('=== DEBUG MODE AUDIT COMPLETE ===');
  DEBUG_MODE = false;

  SpreadsheetApp.getUi().alert('Debug audit complete!\n\nCheck the "Debug Log" sheet for detailed execution logs.');
}

/**
 * Runs audit with a limit on number of client folders to process
 * @param {number} maxClients - Maximum number of client folders to process (0 = no limit)
 */
function runAuditWithLimit(maxClients = 0) {
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
  const scanStats = {
    foldersScanned: [],
    totalClientFolders: 0,
    clientFolderNames: [],
    totalFilesChecked: 0
  };

  // Process both folders
  const folderIds = [FOLDER_ID_1, FOLDER_ID_2];
  let clientsProcessed = 0;

  logDebug('Starting folder scan', { maxClients: maxClients || 'unlimited' });

  for (const folderId of folderIds) {
    if (folderId === 'YOUR_FIRST_FOLDER_ID_HERE' || folderId === 'YOUR_SECOND_FOLDER_ID_HERE') {
      SpreadsheetApp.getUi().alert('Please configure the folder IDs in the script before running.');
      return;
    }

    try {
      const rootFolder = DriveApp.getFolderById(folderId);
      const folderName = rootFolder.getName();
      Logger.log(`Scanning folder: ${folderName}`);
      logDebug(`Accessing root folder`, { id: folderId, name: folderName });

      scanStats.foldersScanned.push({
        id: folderId,
        name: folderName
      });

      // Get all first-level subfolders (client folders)
      const clientFolders = rootFolder.getFolders();
      let clientCount = 0;

      while (clientFolders.hasNext()) {
        if (maxClients > 0 && clientsProcessed >= maxClients) {
          logDebug(`Reached client limit of ${maxClients}, stopping scan`);
          break;
        }

        const clientFolder = clientFolders.next();
        const clientName = clientFolder.getName();
        Logger.log(`  Checking client: ${clientName}`);
        logDebug(`Processing client folder`, { client: clientName, number: clientsProcessed + 1 });

        clientCount++;
        clientsProcessed++;
        scanStats.totalClientFolders++;
        scanStats.clientFolderNames.push(clientName);

        // Audit this client folder
        const issues = auditClientFolder(clientFolder, clientName);
        logDebug(`Client audit complete`, { client: clientName, issuesFound: issues.length });
        misplacedFiles.push(...issues);

        // Count files checked (approximate based on issues found)
        scanStats.totalFilesChecked += issues.length;
      }

      Logger.log(`  Found ${clientCount} client folders in ${folderName}`);
      logDebug(`Root folder scan complete`, { folder: folderName, clientsFound: clientCount });

      if (maxClients > 0 && clientsProcessed >= maxClients) {
        break; // Stop processing additional root folders if we've hit the limit
      }
    } catch (e) {
      Logger.log(`Error accessing folder ${folderId}: ${e.message}`);
      logDebug(`ERROR accessing folder`, { folderId: folderId, error: e.message, stack: e.stack });
      SpreadsheetApp.getUi().alert(`Error accessing folder: ${e.message}\n\nMake sure the script has access to the folder.`);
    }
  }

  logDebug(`All folders processed`, {
    totalClientsProcessed: clientsProcessed,
    totalIssuesFound: misplacedFiles.length
  });

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

  // Add summary
  const summarySheet = ss.getSheetByName('Summary') || ss.insertSheet('Summary');
  summarySheet.clear();
  summarySheet.getRange('A1').setValue('Drive Folder Audit Summary');
  summarySheet.getRange('A1').setFontWeight('bold').setFontSize(14);

  let row = 3;

  // Scan statistics section
  summarySheet.getRange(`A${row}`).setValue('=== SCAN STATISTICS ===');
  summarySheet.getRange(`A${row}`).setFontWeight('bold');
  row++;

  summarySheet.getRange(`A${row}`).setValue('Last Run:');
  summarySheet.getRange(`B${row}`).setValue(new Date());
  row++;

  if (maxClients > 0) {
    summarySheet.getRange(`A${row}`).setValue('Mode:');
    summarySheet.getRange(`B${row}`).setValue(`DEBUG (first ${maxClients} clients only)`);
    summarySheet.getRange(`B${row}`).setFontColor('#ff0000');
    row++;
  }

  summarySheet.getRange(`A${row}`).setValue('Folders Scanned:');
  summarySheet.getRange(`B${row}`).setValue(scanStats.foldersScanned.length);
  row++;

  for (const folder of scanStats.foldersScanned) {
    summarySheet.getRange(`A${row}`).setValue(`  • ${folder.name}`);
    summarySheet.getRange(`B${row}`).setValue(folder.id);
    row++;
  }

  summarySheet.getRange(`A${row}`).setValue('Total Client Folders:');
  summarySheet.getRange(`B${row}`).setValue(scanStats.totalClientFolders);
  row++;

  if (scanStats.clientFolderNames.length > 0) {
    summarySheet.getRange(`A${row}`).setValue('Client Folders Found:');
    row++;
    const maxToShow = Math.min(10, scanStats.clientFolderNames.length);
    for (let i = 0; i < maxToShow; i++) {
      summarySheet.getRange(`A${row}`).setValue(`  • ${scanStats.clientFolderNames[i]}`);
      row++;
    }
    if (scanStats.clientFolderNames.length > 10) {
      summarySheet.getRange(`A${row}`).setValue(`  ... and ${scanStats.clientFolderNames.length - 10} more`);
      row++;
    }
  }

  row++; // Blank line

  // Results section
  summarySheet.getRange(`A${row}`).setValue('=== AUDIT RESULTS ===');
  summarySheet.getRange(`A${row}`).setFontWeight('bold');
  row++;

  summarySheet.getRange(`A${row}`).setValue('Total Misplaced Files:');
  summarySheet.getRange(`B${row}`).setValue(misplacedFiles.length);
  row++;

  // Count by issue type
  const missingFolder = misplacedFiles.filter(f => f[5].includes('Missing year folder')).length;
  const wrongFolder = misplacedFiles.filter(f => f[5].includes('Wrong year folder')).length;

  summarySheet.getRange(`A${row}`).setValue('Files missing year folder:');
  summarySheet.getRange(`B${row}`).setValue(missingFolder);
  row++;

  summarySheet.getRange(`A${row}`).setValue('Files in wrong year folder:');
  summarySheet.getRange(`B${row}`).setValue(wrongFolder);
  row++;

  // Auto-resize columns
  summarySheet.autoResizeColumn(1);
  summarySheet.autoResizeColumn(2);

  // Alert message
  let alertMessage = `Audit complete!\n\n`;
  if (maxClients > 0) {
    alertMessage += `DEBUG MODE: Processed ${scanStats.totalClientFolders} of 522 client folders\n`;
  } else {
    alertMessage += `Scanned: ${scanStats.totalClientFolders} client folders\n`;
  }
  alertMessage += `Found: ${misplacedFiles.length} misplaced files\n\n`;

  if (misplacedFiles.length === 0) {
    if (scanStats.totalClientFolders === 0) {
      alertMessage += `⚠️  No client folders found.\nRun "Test Folder Access" to diagnose.`;
    } else {
      alertMessage += `✅ All files are properly organized!`;
    }
  } else {
    alertMessage += `See 'Audit Results' sheet for details.`;
  }

  if (!maxClients) {
    SpreadsheetApp.getUi().alert(alertMessage);
  }
}

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Get backup name for files or directories
export function getBackupName(originalPath: string): string {
    const config = vscode.workspace.getConfiguration('backuper');
    const pattern = config.get<string>('pattern', '{name}{ext}{identifier}');
    const identifier = config.get<string>('identifier', '.bak');
    const extname = path.extname(originalPath);
    const basename = path.basename(originalPath, extname);
    const dir = path.dirname(originalPath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    const backupName = pattern
        .replace('{name}', basename)
        .replace('{ext}', extname)
        .replace('{timestamp}', timestamp)
        .replace('{identifier}', identifier);

    return path.join(dir, backupName);
}

// Backup function for files and directories
export function backupItem(uri: vscode.Uri) {
    const sourcePath = uri.fsPath;
    const backupPath = getBackupName(sourcePath);

    fs.stat(sourcePath, (err, stats) => {
        if (err) {
            vscode.window.showErrorMessage(`Error accessing ${sourcePath}: ${err.message}`);
            return;
        }

        if (stats.isDirectory()) {
            // Backup directory
            fs.cp(sourcePath, backupPath, { recursive: true }, (err) => {
                if (err) {
                    vscode.window.showErrorMessage(`Backup failed: ${err.message}`);
                } else {
                    vscode.window.showInformationMessage(`Backup created: ${backupPath}`);
                }
            });
        } else {
            // Backup file
            fs.copyFile(sourcePath, backupPath, (err) => {
                if (err) {
                    vscode.window.showErrorMessage(`Backup failed: ${err.message}`);
                } else {
                    vscode.window.showInformationMessage(`Backup created: ${backupPath}`);
                }
            });
        }
    });
}

// Restore function for files and directories
export function restoreItem(uri: vscode.Uri) {
    const backupPath = uri.fsPath;
    const identifier = vscode.workspace.getConfiguration('backuper').get<string>('identifier', '.bak');
    const originalPath = backupPath.replaceAll(identifier, '');

    fs.stat(backupPath, (err, stats) => {
        if (err) {
            vscode.window.showErrorMessage(`Error accessing ${backupPath}: ${err.message}`);
            return;
        }

        if (stats.isDirectory()) {
            // Restore directory
            fs.cp(backupPath, originalPath, { recursive: true }, (err) => {
                if (err) {
                    vscode.window.showErrorMessage(`Restore failed: ${err.message}`);
                } else {
                    vscode.window.showInformationMessage(`Directory restored: ${originalPath}`);
                }
            });
        } else {
            // Restore file
            fs.copyFile(backupPath, originalPath, (err) => {
                if (err) {
                    vscode.window.showErrorMessage(`Restore failed: ${err.message}`);
                } else {
                    vscode.window.showInformationMessage(`File restored: ${originalPath}`);
                }
            });
        }
    });
}

// Activate extension
export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('backuper.backup', backupItem),
        vscode.commands.registerCommand('backuper.restore', restoreItem)
    );
}

// Deactivate extension
export function deactivate() {}

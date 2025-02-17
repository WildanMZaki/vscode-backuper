import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { backupItem, restoreItem, getBackupName } from '../extension'; // Ensure correct import

suite('Backuper Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    const testFilePath = path.join(__dirname, 'testfile.txt');
    const testDirPath = path.join(__dirname, 'testdir');
    let backupPath: string;

    setup(() => {
        // Create a temporary test file
        fs.writeFileSync(testFilePath, 'test content');

        // Create a temporary test directory
        if (!fs.existsSync(testDirPath)) {
            fs.mkdirSync(testDirPath);
        }

        // Generate expected backup path
        backupPath = getBackupName(testFilePath);
    });

    teardown(async () => {
        // Cleanup test file
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }

        // Cleanup test directory
        if (fs.existsSync(testDirPath)) {
            fs.rmSync(testDirPath, { recursive: true, force: true });
        }

        // Cleanup backup files
        if (fs.existsSync(backupPath)) {
            fs.rmSync(backupPath, { force: true });
        }
    });

    test('getBackupName should return correct backup name', () => {
        const generatedBackupPath = getBackupName(testFilePath);
        assert.ok(generatedBackupPath.includes('.bak'), 'Backup name should contain .bak');
    });

    test('backupItem should create a backup file', async () => {
        const testUri = vscode.Uri.file(testFilePath);

        await new Promise<void>((resolve) => {
            backupItem(testUri);
            setTimeout(() => {
                resolve();
            }, 100); // Give some time for async operation
        });

        assert.ok(fs.existsSync(backupPath), `Backup file should be created at ${backupPath}`);
    });

    test('restoreItem should restore a backup file', async () => {
        const testUri = vscode.Uri.file(testFilePath);
        const backupUri = vscode.Uri.file(backupPath);

        await new Promise<void>((resolve) => {
            backupItem(testUri);
            setTimeout(() => {
                resolve();
            }, 100);
        });

        assert.ok(fs.existsSync(backupPath), 'Backup file should be created');

        fs.unlinkSync(testFilePath); // Simulate deletion of the original file
        assert.ok(!fs.existsSync(testFilePath), 'Original file should be deleted before restore');

        await new Promise<void>((resolve) => {
            restoreItem(backupUri);
            setTimeout(() => {
                resolve();
            }, 100);
        });

        assert.ok(fs.existsSync(testFilePath), 'File should be restored successfully');
    });

    test('backupItem should create a backup directory', async () => {
        const testUri = vscode.Uri.file(testDirPath);
        const dirBackupPath = getBackupName(testDirPath);

        await new Promise<void>((resolve) => {
            backupItem(testUri);
            setTimeout(() => {
                resolve();
            }, 100);
        });

        assert.ok(fs.existsSync(dirBackupPath), 'Backup directory should be created');
    });

    test('restoreItem should restore a backup directory', async () => {
        const testUri = vscode.Uri.file(testDirPath);
        const dirBackupPath = getBackupName(testDirPath);
        const backupUri = vscode.Uri.file(dirBackupPath);

        await new Promise<void>((resolve) => {
            backupItem(testUri);
            setTimeout(() => {
                resolve();
            }, 100);
        });

        assert.ok(fs.existsSync(dirBackupPath), 'Backup directory should be created');

        fs.rmSync(testDirPath, { recursive: true, force: true }); // Simulate deletion of the original directory
        assert.ok(!fs.existsSync(testDirPath), 'Original directory should be deleted before restore');

        await new Promise<void>((resolve) => {
            restoreItem(backupUri);
            setTimeout(() => {
                resolve();
            }, 100);
        });

        assert.ok(fs.existsSync(testDirPath), 'Directory should be restored successfully');
    });
});

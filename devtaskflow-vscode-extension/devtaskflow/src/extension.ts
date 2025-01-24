import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
  console.log('DevTaskFlow extension is now active!');

  // Command to save workspace state
  const saveWorkspaceCommand = vscode.commands.registerCommand('devtaskflow.saveWorkspace', async () => {
    const taskId = await vscode.window.showInputBox({ prompt: 'Enter Task ID' });
    if (!taskId) {
      vscode.window.showErrorMessage('Task ID is required.');
      return;
    }

    const openFiles = vscode.window.visibleTextEditors.map(editor => editor.document.uri.fsPath);
    const workspaceState = { task_id: taskId, open_files: openFiles };

    try {
      await axios.post('http://localhost:5000/api/workspace', workspaceState, {
        headers: { 'Content-Type': 'application/json' }
      });
      vscode.window.showInformationMessage(`Workspace saved for Task ${taskId}`);
    } catch (error) {
      vscode.window.showErrorMessage('Failed to save workspace.');
    }
  });

  // Command to restore workspace state
  const restoreWorkspaceCommand = vscode.commands.registerCommand('devtaskflow.restoreWorkspace', async () => {
    const taskId = await vscode.window.showInputBox({ prompt: 'Enter Task ID' });
    if (!taskId) {
      vscode.window.showErrorMessage('Task ID is required.');
      return;
    }

    try {
      const response = await axios.get(`http://localhost:5000/api/workspace/${taskId}`);
      const workspaceState = response.data;

      workspaceState.open_files.forEach(async (filePath: string) => {
        const doc = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(doc);
      });

      vscode.window.showInformationMessage(`Workspace restored for Task ${taskId}`);
    } catch (error) {
      vscode.window.showErrorMessage('Failed to restore workspace.');
    }
  });

  // Register commands
  context.subscriptions.push(saveWorkspaceCommand, restoreWorkspaceCommand);
}

export function deactivate() {
  console.log('DevTaskFlow extension is now deactivated.');
}
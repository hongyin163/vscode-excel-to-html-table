'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { looksLikeTable, buildRows } from './utils';
let clipboard = require("copy-paste");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export default function activate(context: vscode.ExtensionContext) {
    let disposableToHtml = vscode.commands.registerCommand('extension.excelToHtml', () => {
        let rawData = clipboard.paste();

        let paste = excelToHtml(rawData);

        if (paste.isTable) {
            // Copy formatted data to clipboard before calling normal paste action
            // Afterwards, replace clipboard data with original content
            clipboard.copy(paste.data, function () {
                vscode.commands.executeCommand('editor.action.clipboardPasteAction');
                vscode.commands.executeCommand('editor.action.formatDocument');
                clipboard.copy(rawData)
            })
        } else {
            vscode.commands.executeCommand('editor.action.clipboardPasteAction');
        }
        // Display a message box to the user
        // vscode.window.showInformationMessage('Excel to Html Table Active!');
    });

    context.subscriptions.push(disposableToHtml);
}



/**
 * Excel to Html
 * @param rawData 
 */
function excelToHtml(rawData: String) {
    // Split rows on newline
    var rows: Array<Array<string>> = buildRows(rawData);

    if (!looksLikeTable(rows))
        return { isTable: false }

    let ths = rows[0];
    let initTrs: Array<Array<string>> = [];
    let trs: Array<Array<string>> = rows.slice(1).reduce((pre, tds: Array<string>) => {
        if (tds.length < ths.length) {
            return pre;
        }
        pre.push(tds);
        return pre;
    }, initTrs);

    let thStr = ths.map((th) => {
        return `<th>${th}</th>`
    }).join('')

    let tdStr = trs.map((tds: Array<string>) => {
        return `<tr>${tds.map((td: String) => (`<td>${td}</td>`)).join('')}</tr>`
    }).join('')

    let table = `
    <table>
        <thead>
            <tr>${thStr}</tr>           
        </thead>
        <tbody>
            ${tdStr}
        </tbody>
    </table>`
    return {
        isTable: true,
        data: table
    }
}

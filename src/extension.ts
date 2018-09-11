'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "excel-to-html-table" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.excelToHtml', () => {
        let clipboard = require("copy-paste");

        let rawData = clipboard.paste();

        let paste = excelToHtml(rawData);

        if (paste.isTable) {
            // Copy formatted data to clipboard before calling normal paste action
            // Afterwards, replace clipboard data with original content
            clipboard.copy(paste.data, function () {
                vscode.commands.executeCommand('editor.action.clipboardPasteAction')
                clipboard.copy(rawData)
            })
        } else {
            vscode.commands.executeCommand('editor.action.clipboardPasteAction');
        }
        // Display a message box to the user
        vscode.window.showInformationMessage('Excel to Html Table Active!');
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

function looksLikeTable(data: Array<Array<string>>) {
    let isTable = true
    let prevLen = data[0].length

    // Ensure all rows have the same number of columns
    data.forEach((row: Array<String>) => {
        isTable = (row.length == prevLen) && isTable
        prevLen = row.length
    });

    return isTable
}


function excelToHtml(rawData: String) {
    let data = rawData.trim()

    // Split rows on newline
    var rows: Array<Array<string>> = data.split((/[\n\u0085\u2028\u2029]|\r\n?/g)).map(function (row) {
        // Split columns on tab
        return row.split("\t")
    })

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

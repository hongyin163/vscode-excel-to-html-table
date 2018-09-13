'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { looksLikeTable } from './utils';
let clipboard = require("copy-paste");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export default function activate(context: vscode.ExtensionContext) {

    let disCsvToJson = vscode.commands.registerCommand('extension.csvToJson', () => {
        let rawData = clipboard.paste();
        let paste = csvToJson(rawData);

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

    context.subscriptions.push(disCsvToJson);

}


/**
 * Excel to Json
 * @param rawData 
 */
function csvToJson(rawData: String) {
    let data = rawData.trim()

    // Split rows on newline
    var rows: Array<Array<string>> = data.split((/\r\n/g)).map(function (row) {
        // Split columns on tab
        const regex = new RegExp(',(?![^"]*"\\B');
        return row.split(regex)
    })

    if (!looksLikeTable(rows)) {
        return { isTable: false }
    } else {
        // console.log('is table');
    }

    let ths = rows[0];
    let initTrs: Array<Array<string>> = [];
    let trs: Array<Array<string>> = rows.slice(1).reduce((pre, tds: Array<string>) => {
        if (tds.length < ths.length) {
            return pre;
        }
        pre.push(tds);
        return pre;
    }, initTrs);

    let tdList = trs.map((tds: Array<string>) => {
        return tds.reduce((pre, td, i) => {
            let lines = td.split((/[\n\u0085\u2028\u2029]|\r\n?/g));
            let tdStr = '';
            if (lines.length > 1) {
                tdStr = lines.map((li) => (`<p>${li}</p>`)).join('');
            } else {
                tdStr = lines[0];
            }
            return Object.assign(pre, {
                [ths[i]]: tdStr
            })
        }, {})
    });

    let table = JSON.stringify(tdList);
    return {
        isTable: true,
        data: table
    }
}

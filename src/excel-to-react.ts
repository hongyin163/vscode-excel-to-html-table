'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { looksLikeTable, buildRows } from './utils';
let clipboard = require("copy-paste");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export default function activate(context: vscode.ExtensionContext) {

    let disposableToCode = vscode.commands.registerCommand('extension.excelToReactCode', () => {
        let rawData = clipboard.paste();
        let paste = excelToReactCode(rawData);

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

    context.subscriptions.push(disposableToCode);

}


/**
 * Excel to Json
 * @param rawData 
 */
function excelToReactCode(rawData: String) {
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

    let propsMap = ths.reduce((pre, th, i) => {
        return Object.assign(pre, {
            [th]: th
        })
    }, {
            'list': '宣讲会'
        });
    let thHtm = ths.map((th, i) => {
        return `
        <th dangerouslySetInnerHTML={{
            __html: propsMap['${th}']
        }}
        >
        </th>        `
    }).join('');

    let tdHtm = ths.map((th, i) => {
        return `
                <td dangerouslySetInnerHTML={{
                    __html: item.${th}
                }}
                >
                </td>`
    }).join('');
    let template = `
    import React, { Component } from 'react';
    import { setEditProps } from 'services/page-model';
    const propsMap= ${JSON.stringify(propsMap)};
    @setEditProps(
        {
            list:${JSON.stringify(tdList)}
        },
        propsMap
    )
    class Table extends Component {
        state = {}
        render() {
            let me = this;
            let {
                list
            } = me.props;
            return (
                <table >
                    <thead>
                        <tr>
                            ${thHtm}
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((item, j) => {
                            return (
                                <tr key={j} className={j % 2 ? 'odd' : 'even'}>
                                    ${tdHtm}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            );
        }
    }
    
    export default Table;
    `
    return {
        isTable: true,
        data: template
    }
}

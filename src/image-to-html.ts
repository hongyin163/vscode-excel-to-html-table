'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
let clipboard = require("copy-paste");
export default function activate(context: vscode.ExtensionContext) {

    let disposable = vscode.commands.registerCommand('extension.imageToHtml', () => {
        imageToHtml();
        vscode.commands.executeCommand('editor.action.clipboardPasteAction');
    });

    context.subscriptions.push(disposable);
}

const buildType = [
    {
        test: /js[x]*/,
        handler: buildJsx
    }, {
        test: /htm[l]*/,
        handler: buildHtml
    }, {
        test: /css|less|scss/,
        handler: buildCss
    }
];

function imageToHtml() {
    // get current edit file path
    let editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let fileUri = editor.document.uri;
    if (!fileUri) return;
    if (fileUri.scheme === 'untitled') {

        return;
    }
    let filePath = fileUri.fsPath;
    let folderPath = path.dirname(filePath) + '/img';
    let extname = path.extname(filePath);

    var fileName = '';
    var selection = editor.selection;
    var selectText = editor.document.getText(selection);
    if (selectText) {
        fileName = selectText;
    } else {
        fileName = `img_${(Math.random() * 1000000).toFixed(0)}`;
    }
    let buildCode = buildHtml;
    let buildHander = buildType.find((item) => (item.test.test(extname)));
    if (buildHander) {
        buildCode = buildHander.handler;
    }

    // console.log(fileName);
    saveImageToFouler(folderPath, fileName + '.png', (imageUris: string) => {
        // console.log(imageUris);
        let uris = imageUris.replace(/#$/, '').split(',')
            .map((url: string) => './img/' + url);
        // console.log(uris);
        let html = buildCode(uris);
        clipboard.copy(html, function () {
            vscode.commands.executeCommand('editor.action.clipboardPasteAction');
            // vscode.commands.executeCommand('editor.action.formatDocument');
            clipboard.copy('')
        })

    })
}

function saveImageToFouler(imagePath: string, imageName: string, cb: Function) {
    if (!imagePath) return;

    let platform = process.platform;
    var result = '';
    if (platform === 'win32') {
        // Windows
        const scriptPath = path.join(__dirname, '../cmd/copy.ps1');

        let command = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
        let powershellExisted = fs.existsSync(command)
        if (!powershellExisted) {
            command = "powershell"
        }

        const powershell = spawn(command, [
            '-noprofile',
            '-noninteractive',
            '-nologo',
            '-sta',
            '-executionpolicy', 'unrestricted',
            '-windowstyle', 'hidden',
            '-file', scriptPath,
            imagePath,
            imageName
        ]);
        powershell.on('error', function (e) {
            // if (e.code == "ENOENT") {
            //     console.log(`The powershell command is not in you PATH environment variables.Please add it and retry.`);
            // } else {
            // console.log(e);
            // }
        });
        powershell.on('exit', function (code, signal) {
            // console.log('exit');
            // if (code == 0) {
            //     console.log(result);
            //     cb(result);
            // }
        });
        powershell.on('close', function (code, signal) {
            // console.log('close');
            // if (code == 0) {
            //     console.log(result);
            //     cb(result);
            // }
        });
        powershell.stdout.on('data', function (data: Buffer) {
            result += data.toString().trim();
            if (result.endsWith('#')) {
                cb(result);
            }
        });

        // powershell.stdout.on('end', function (code, signal) {
        //     console.log('close');
        //     // if (code == 0) {
        //     //     console.log(result);
        //     //     cb(result);
        //     // }
        // });
    }

}

function normalizeUrls(imagUrls: string[] = []) {
    return imagUrls.map((url) => {
        let name = path.basename(url)
            .replace(/[-]/g, '')
            .replace(/default|class/g, (a, b) => {
                return '_' + a;
            })
            .replace(path.extname(url), '');
        return {
            name,
            url
        }
    })
}

function buildHtml(imagUrls: string[] = []) {
    let urls = normalizeUrls(imagUrls);
    return urls.map(({ url }) => {
        return `<img src="${url}" alt="">
        `
    }).join('');
}
function buildJsx(imagUrls: string[] = []) {
    let urls = normalizeUrls(imagUrls);
    let imp = urls.map(({ name, url }) => {
        return `import ${name} from '${url}';
        `
    }).join('');
    let html = urls.map(({ name }) => {
        return `<img src={${name}} alt="">
        `
    }).join('');
    return imp + '\n' + html;
}
function buildCss(imagUrls: string[] = []) {
    let urls = normalizeUrls(imagUrls);
    let imp = urls.map(({ name, url }) => {
        return `
        .${name}{
            background: transparent url(${url}) no-repeat center center;
        }`
    }).join('');
    let html = urls.map(({ name }) => {
        return `
        <div className="${name}"></div>`
    }).join('');
    return imp + '\n' + html;
}
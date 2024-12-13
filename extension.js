// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

const AccessToken = vscode.workspace.getConfiguration('mjdamavandiCodeGemma').get('AccessTokens');

async function query(data){
	const response = await fetch(
		"https://api-inference.huggingface.co/models/google/codegemma-2b",
		{
			headers: {
				Authorization: "Bearer "+AccessToken,
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('CodeGemma.complete', function () {
		// // The code you place here will be executed every time your command is executed
		// console.log('Notification are showing');
		// // Display a message box to the user
		// vscode.window.showInformationMessage('Hello World from Code Gemma!');

		const editor = vscode.window.activeTextEditor;
		
		if(editor){
			const col = editor.selection.active.character.toLocaleString();
			const zeroedrow = editor.selection.active.line.toLocaleString();
			const rowint = parseInt(zeroedrow) + 1;
			const row = rowint.toString();

			const doc = editor.document;
			const textToCursor = doc.getText(new vscode.Range(doc.lineAt(0).range.start, editor.selection.active));
			const textFromCursor = doc.getText(new vscode.Range(editor.selection.active, doc.lineAt(doc.lineCount - 1).range.end));
			const text = textToCursor + "<FILE-SEP>" + textFromCursor;

			vscode.window.showInformationMessage("Creating your code ...");
			query({"inputs": text}).then((response) => {
				if(isNaN(response["error"])){
					var generated_text = response[0]["generated_text"]
					const fileSepIndex = generated_text.indexOf("<FILE-SEP>");
					generated_text = generated_text.slice(fileSepIndex + 10,generated_text.length)
					generated_text = generated_text.replaceAll("<FILE-SEP>","",)
					generated_text = generated_text.replaceAll("<|file_separator|>","")
					editor.edit(editBuilder => {
						editBuilder.insert(editor.selection.active,generated_text);
					});
					vscode.window.showInformationMessage("Your code created.");
				}else{
					vscode.window.showErrorMessage(response["error"])
				}
			},err => {
				vscode.window.showErrorMessage(err)
			});
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}

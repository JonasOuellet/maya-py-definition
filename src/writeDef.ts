import * as fs from "fs";
import { resolve, extname } from "path";
import * as core from "./core";

let cmdInfo = require("../working/cmdsInfo.json");


let _definitionInbetween = "\n\n";
let _tab = "    ";


function _setLineMaxCharLength(line: string, maxChar=70, newLineSpaces=0, minChar=1) {
    if (line.length <= maxChar) {
        return line;
    }
    let _spaces = "";
    for (let x = 0; x < newLineSpaces; x++){
        _spaces += " ";
    }
    let finalLine = "";
    let newLine = line;

    while (maxChar < newLine.length) {
        let commaPos = newLine.lastIndexOf(',', maxChar);
        let spacePose = newLine.lastIndexOf(' ', maxChar);

        let index = Math.max(commaPos, spacePose);

        if (index < minChar){
            // Find space or comma pose after
            commaPos = newLine.indexOf(',', maxChar);
            spacePose = newLine.indexOf(' ', maxChar);

            index = Math.max(commaPos, spacePose);

            if (index < 0){
                index = newLine.length;
            }
        }

        // check if string ends with a coma
        if (newLine[index] === ','){
            finalLine += newLine.slice(0, index+1);
            newLine = newLine.slice(index+1, newLine.length);
            newLine = newLine.trimLeft();
            newLine = _spaces + newLine;
        } else {
            finalLine += newLine.slice(0, index);
            newLine = _spaces + newLine.slice(index+1, newLine.length);
        }

        if (newLine.length) {
            finalLine += '\n';
        }
    }
    
    finalLine += newLine;

    return finalLine;
}


/**
 * Return description for the specified command info object.
 * @param cmd Command info object
 * @param maxLineLength max char line length
 */
function _getDescription(cmd: core.ICmdInfo, maxLineLength=70, maxLen=-1) : string {
    let out = "";
    if (cmd.description !== "") {
        let lines = cmd.description.split('\n');
        for (let x = 0; x < lines.length; x++){
            let line = lines[x];
            if (line){
                if (x > 0){
                    out += '\n';
                }
                
                out += _setLineMaxCharLength(line, maxLineLength);
                if (maxLen > 0 && out.length > maxLen){
                    return out.substring(0, maxLen);
                }
            }
        }
        
    }
    return out;
}


function _getExample(cmd: core.ICmdInfo): string {
    let out = "";
    if (cmd.example !== "") {
        for (let ex of cmd.example.split('\n')){
            // make sure to replace """ with '''
            // because """ is used for the docstring.
            out += `>>> ${ex.replace(/"""/gm, "'''")}\n`;
        }
    }
    return out;
}


// Function for doc string:
// take core.ICmdInfo as param and return a string


/**
 * see https://thomas-cokelaer.info/tutorials/sphinx/docstring_python.html for how to write
 * rest python docstring
 * @param cmd  
 * @param maxLineLength 
 * @param shortKwargs 
 */
function _restDocString(cmd: core.ICmdInfo, maxLineLength: number, shortKwargs=true, description: boolean, 
    maxDescLen: number, example: boolean, maxArgLen: number, writeType=true) : string {

    let out = "";

    let addBr = (br="\n\n") => {
        if (out){
            out += br;
        }
    };

    if (description){
        let def = _getDescription(cmd, maxLineLength, maxDescLen);
        if (def){
            out += def;
        }
    }

    addBr();
    for (let arg of cmd.args){
        if (shortKwargs && arg.shortname !== arg.fullname){
            out += `:param ${arg.shortname}: (${arg.fullname})\n`;
        }
        let arg_desc = arg.description;
        if (maxArgLen > 0) {
            arg_desc = arg_desc.substring(0, maxArgLen);
        }
        arg_desc = arg_desc.trim();

        let argLine = `:param ${arg.fullname}: ${core.Args.prototype.argMod.call(arg)} ${arg_desc}\n`;

        out += _setLineMaxCharLength(argLine, maxLineLength, 0, (maxLineLength * 0.7));
        
        if (writeType){
            out += `:type ${arg.fullname}: ${arg.type}\n`;
        }
    }

    if (cmd.return){
        addBr('\n');
        let ret = `:returns: ${cmd.return.info}`;
        out += _setLineMaxCharLength(ret, maxLineLength);

        if (writeType){
            out += `\n:rtype: ${cmd.return.type}`;
        }
    }

    if (example){
        let ex = _getExample(cmd);
        if (ex){
            addBr();
            out += ":Exemple:\n\n";
            out += ex;
        }
    }

    return out;
}


interface IDocstring {
    [key: string]: (cmd: core.ICmdInfo, maxLineLength: number, shortKwargs: boolean, description: boolean,
        maxDescLen: number, example: boolean, maxArgLen: number, writeType: boolean) => string;
}


let DocStrings: IDocstring = {
    "rest": _restDocString,
};


export function getDocstringType(): string[] {
    return Object.keys(DocStrings);
}

function _pyDefinitionInterface(cmd: core.ICmdInfo, shortKwargs: boolean) : string {
    let def = `def ${cmd.name}(*args, `;
    // let def = `def ${cmd.name}(`;

    let x = 0;
    for(let arg of cmd.args){
        if (x > 0){
            def += ', ';
        }
        
        if (shortKwargs && arg.fullname !== arg.shortname) {
            def += `${arg.shortname}=${core.Args.prototype.getDefaultValue.call(arg)}, `;
        }
        def += `${arg.fullname}=${core.Args.prototype.getDefaultValue.call(arg)}`;

        x += 1;
    }

    if (x > 0){
        def += ', ';
    }

    if (cmd.queryable){
        def += 'q=True, query=True, ';
    }
    if (cmd.editable){
        def += 'e=True, edit=True, ';
    }

    def += "**kwargs):";
    //def += "*args, **kwargs):";
    return def;
}

function _getValidPyiType(type: string): string {
    let lower = type.toLowerCase();
    if (lower === 'none'){
        return 'None';
    }
    if (lower === 'boolean'){
        return 'bool';
    }
    if (lower === 'string'){
        return 'AnyStr';
    }
    if (lower === 'script'){
        return 'Script';
    }

    if (lower.indexOf('[') >= 0){
        lower = type.replace(/string/g, 'AnyStr');
        lower = lower.replace(/(\[|\])/g, '');
        let items = lower.split(',');
        lower = '';
        for (let i of items){
            i = i.trim();
            if (i) {
                if (lower){
                    lower += ', ';
                }
                lower += _getValidPyiType(i);
            }
        }
        lower = `List[${lower}]`;
        return lower;
    }

    return type;
}

function _pyiDefinitionInterface(cmd: core.ICmdInfo, shortKwargs: boolean) : string {
    let def = `def ${cmd.name}(*args, `;

    let x = 0;
    for(let arg of cmd.args){
        if (x > 0){
            def += ', ';
        }

        let argtypes = [_getValidPyiType(arg.type)];
        if (arg.multiuse){
            argtypes.push(`List[${argtypes[0]}]`);
        }
        if (arg.query && argtypes[0].indexOf("bool") < 0){
            argtypes.push('bool');
        }
        let argtype = '';
        if (argtypes.length > 1){
            argtype = `Union[${argtypes.join(', ')}]`;
        } else {
            argtype = argtypes[0];
        }

        let defaultarg = core.Args.prototype.getDefaultValue.call(arg);

        if (shortKwargs && arg.fullname !== arg.shortname) {
            def += `${arg.shortname}: ${argtype}=${defaultarg}, `;
        }
        def += `${arg.fullname}: ${argtype}=${defaultarg}`;

        x += 1;
    }

    if (x > 0){
        def += ', ';
    }

    if (cmd.queryable){
        def += 'q=True, query=True, ';
    }
    if (cmd.editable){
        def += 'e=True, edit=True, ';
    }

    let retType = 'None';
    if (cmd.return){
        retType = _getValidPyiType(cmd.return.type);
    }
    if (cmd.queryable){
        retType = `Union[${retType}, Any]`;
    }

    def += `**kwargs)->${retType}:`;
return def;
}


interface IDefinitionInterface {
    [key: string]: (cmd: core.ICmdInfo, shotKwarg: boolean) => string;
}


let DefinitionInterface: IDefinitionInterface = {
    py: _pyDefinitionInterface,
    pyi: _pyiDefinitionInterface
};


export function getDefinitionType(): string[] {
    return Object.keys(DefinitionInterface);
}


function pyiFileHeader(): string {
    return "from typing import Union, List, Any, AnyStr, Callable\n\n\nScript = Union[AnyStr, Callable[..., Any]]";
}

interface IFileHeader {
    [key: string]: () => string;
}


let FileHeader: IFileHeader = {
    py: () => {return '';},
    pyi: pyiFileHeader
};


/**
 * Return function definition for the given 
 * @param info Command to get the function definition from
 * @param docstring (rest, google, etc) docstring format
 * @param defInterface (py, pyi) definition interface, base python or typed python.
 */
function _getDefinition(info: core.ICmdInfo, shortKwarg=true, docstring="rest", defInterface="py", maxLineLength=70,
description: boolean, maxDescLen: number, example: boolean, maxArgLen: number): string {
    let def = DefinitionInterface[defInterface](info, shortKwarg);

    // make sure it respect the line lenght and newline start where the first paranthesis is
    let para = def.indexOf('(') + 1;
    def = _setLineMaxCharLength(def, maxLineLength, para);

    def += `\n${_tab}"""\n`;


    let desc = "";
    if (info.type === core.CmdType.command){
        // remove 4 char for the endent
        desc = DocStrings[docstring](info, maxLineLength - _tab.length, shortKwarg, description, maxDescLen, example, maxArgLen, defInterface==='py');
    }else{
        desc = core.CmdType[info.type];
    }

    for (let line of desc.split('\n')){
        def += `${_tab}${line}\n`;
    }
    def += `${_tab}"""\n${_tab}pass\n`;

    return def;
}


function _getCommandsList(commandName: string | string[]){
    let commandList: any = {};
    if (commandName){
        for (let name of commandName){
            commandList[name] = cmdInfo[name];
        }
    } else {
        commandList = cmdInfo;
    }

    return commandList;
}


export function getDefinition(commandName: any, shortKwarg=true, docstring="rest", defInterface="py", maxLineLength=70,
description: boolean, maxDescLen: number, example: boolean, maxArgLen: number): string {
    let commandList = _getCommandsList(commandName);

    let out = "";
    for (let cmd in commandList){
        out += _getDefinition(commandList[cmd], shortKwarg, docstring, defInterface, maxLineLength,
            description, maxDescLen, example, maxArgLen);
        out += _definitionInbetween;
    }
    return out;
}


export  function writeDefFile(commandName: any, shortKwarg: any, docstring: any, defInterface:any, maxLineLength: any,
                                      filepath: any, description: any, maxDescLen: any, example: any, maxArgLen: any)
{
    let _filepath = core.cmdsDefPath;
    if (filepath){
        _filepath = resolve(process.cwd(), filepath);
    }
    _filepath = _filepath.replace(extname(_filepath), `.${defInterface}`);

    let fd = fs.openSync(_filepath, 'w');
    if (!fd) {
        console.error("Couldn't open file: " + _filepath);
        return;
    }

    let _inb = Buffer.from(_definitionInbetween);

    let header = FileHeader[defInterface]();
    if (header){
        header = header.trimRight() + '\n';
        let buff = Buffer.from(header, "utf-8");
        fs.writeSync(fd, buff);
        fs.writeSync(fd, _inb);
    }

    let commandList = _getCommandsList(commandName);
    let x = 1;
    let cmdCount = Object.keys(commandList).length;
    for (let cmd in commandList){
        console.log(`Writing "${cmd}" ${x.toString().padStart(4)}/${cmdCount}`);
        let test = _getDefinition(cmdInfo[cmd], shortKwarg, docstring, defInterface, maxLineLength,
            description, maxDescLen, example, maxArgLen);
        let buffer = Buffer.from(test, "utf-8");

        fs.writeSync(fd, buffer);
        fs.writeSync(fd, _inb);

        x += 1;
    }

    fs.closeSync(fd);

    console.log(`File successfully written: "${_filepath}"`);
}
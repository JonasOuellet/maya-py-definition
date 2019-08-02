import * as fs from "fs";

import * as core from "./core";

let cmdInfo = require("../cmdsInfo.json");


function _getFunctionDefinition(info: core.ICmdInfo): string {
    let out = `def ${info.name}(`;
    let start = true;
    for(let arg of info.args){
        if (!start){
            out += ', '
        }else{
            start = false;
        }
        out += `${arg.fullname}=None, ${arg.shortname}=None`;
    }
    if (!start){
        out += ', ';
    }

    let desc = "";
    if (info.type === core.CmdType.command){
        desc = info.description;
    }else{
        desc = core.CmdType[info.type];
    }

    out += `*args, **kwargs):\n    """\n    ${desc}\n    """\n    pass\n`;

    return out;
}


export function getFunctionDefinition(commandName: string): string {
    let info = cmdInfo[commandName];
    return _getFunctionDefinition(info);
}


export function writeDefFile() {
    let fd = fs.openSync(core.cmdsDefPath, 'w');
    if (!fd) {
        console.error("Couldn't open file: " + core.cmdsDefPath);
        return;
    }

    let doubleRet = Buffer.from("\n\n");

    for (let cmd in cmdInfo){
        fs.writeSync(fd, doubleRet);
        let test = _getFunctionDefinition(cmdInfo[cmd]);
        let buffer = Buffer.from(test, "utf-8");

        fs.writeSync(fd, buffer);
    }

    fs.closeSync(fd);
}
import { join, resolve } from "path";

export let MayaCmds = require("../working/cmds.json");

export let cmdsInfoPath = resolve(join(__dirname, '..', "working", "cmdsInfo.json"));
export let cmdsDefPath = resolve(join(__dirname, '..', "out", "cmds.py"));


/**
 * Type base on type found in cmds.json.
 */
export enum CmdType {
    runTimeCommand = 0,
    command = 1,
    unknown = 2
}


export class Args {
    [key: string]: any;

    fullname: string = "";
    shortname: string = "";
    description: string = "";
    type: string = "";
    defaultValue: string = "";

    edit: boolean = false;
    query: boolean = false;
    create: boolean = false;
    multiuse: boolean = false;

    public isValid(): boolean {
        return this.fullname !== "" && this.shortname !== "" && this.type !== "";
    }

    public argMod(): string {
        let out = "";
        
        if (this.create) { out += 'C';}

        if (this.query) {
            if (out)  {out += ' ';}
            out += 'Q';
        }

        if (this.edit) { 
            if (out)  {out += ' ';}
            out += 'E';
        }

        if (this.multiuse) { 
            if (out)  {out += ' ';}
            out += 'M';
        }

        out = "(" + out +")";
        return out;
    }
}


export interface ICmdReturn {
    type: string;
    info: string;
}


export interface ICmdInfo {
    name: string;
    type: CmdType;
    description: string;
    example: string;
    undoable: boolean;
    queryable: boolean;
    editable: boolean;
    args: Args[];
    return: ICmdReturn | undefined;
}


export interface ICmdInfoObject {
    [key: string]: ICmdInfo;
}

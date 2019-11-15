import { join, resolve } from "path";

export let MayaCmds = require("../working/cmds.json");

export let cmdsInfoPath = resolve(join(__dirname, '..', "working", "cmdsInfo.json"));
export let cmdsDefPath = resolve(join(__dirname, '..', "out", "cmds", "__init__.py"));


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

    constructor (fullname='', shortname='', type='any', description='', defaultValue=''){
        this.fullname = fullname;
        this.shortname = shortname;
        this.type = type;
        this.description = description;
        this.defaultValue = defaultValue;
    }

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

    public getDefaultValue(): string {
        if (this.defaultValue) { return this.defaultValue; }

        let test = /(?:default is|default:|default).*?([0-9]+(\.[0-9]+)*|".*?"|[a-z]+)/gim.exec(this.description);
        if (test){
            let lower = test[1].toLowerCase();
            if (lower === 'false') {return 'False';}
            if (lower === 'true') {return 'True';}
            
            let value = test[1];
            if ((this.type === 'int' || this.type === 'float') && !Number.isNaN(parseFloat(value))){
                return value;
            } 
            if (this.type ==='string' && ((value.indexOf('"') === 0))) {
                if (value.lastIndexOf('"') === value.length-1) {
                    if (value.indexOf(' ') === -1){
                        console.log("***************************************************");
                        console.log(value);
                        return value;
                    }
                }
            } 
        }

        if (this.type === 'int'){return '0';}
        if (this.type === 'float'){return '0.0';}

        if (this.type === 'boolean'){return 'True';}

        if (this.type === 'string'){
            return '""';
        }

        return 'None';
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

export function getCmdArgs(cmd: ICmdInfo) : Args[] {
    if (cmd.editable || cmd.queryable){
        let args = [...cmd.args];

        if (cmd.editable){
            args.push(new Args('edit', 'e', 'boolean', 'Edit flag', 'True'));
        }

        if (cmd.queryable){
            args.push(new Args('query', 'q', 'boolean', 'Query flags', 'True'));
        }

        return args;
    }

    return cmd.args;
}


export interface ICmdInfoObject {
    [key: string]: ICmdInfo;
}

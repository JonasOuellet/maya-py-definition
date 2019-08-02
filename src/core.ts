import { join, resolve } from "path"

export let MayaCmds = require("../cmds.json");
export let settings = require("../settings.json");

export let cmdsInfoPath = resolve(join(__dirname, '..', "cmdsInfo.json"));
export let cmdsDefPath = resolve(join(__dirname, '..', "cmds.py"));

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

    isValid(): boolean {
        return this.fullname !== "" && this.shortname !== "" && this.type !== "";
    };
}

export interface ICmdInfo {
    name: string,
    type: CmdType,
    description: string,
    example: string,
    undoable: boolean,
    queryable: boolean,
    editable: boolean,
    args: Args[]
}

export interface ICmdInfoObject {
    [key: string]: ICmdInfo
}

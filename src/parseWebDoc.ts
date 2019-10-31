import * as request from "request";
import { JSDOM } from "jsdom";

import { resolve } from "path";
import { writeFileSync, readFileSync } from "fs";

import * as core from "./core";


interface IUrlInfo {
    host: string;
    path: string;
}

/**
 * Return web adress information to pass to the http request.
 */
function getMayaHelpWebInfo(url: string): IUrlInfo {
    let reg = /(^.*.com)(.+?)(\/$|$|\/.\w*.html)/g;
    let match = reg.exec(url);
    if (match){
        return {
            host: match[1],
            path: match[2] + '/'
        };
    }
    throw new Error("Invalid maya help web site.");
}

function getMayaHelpUrlForCmd(urlInfo: IUrlInfo, cmdName: string): string{
    return urlInfo.host + urlInfo.path + cmdName + '.html';
}


async function getJSDOM(urlInfo: IUrlInfo, cmdName: string) : Promise<JSDOM> {
    let prom = new Promise<JSDOM>((resolve, reject) => {
        request.get(getMayaHelpUrlForCmd(urlInfo, cmdName), (error, response, body) => {
            if (error) {
                reject(error);
                return;
            }
            if (response.statusCode !== 200){
                reject(`Status code: ${response.statusCode}`);
                return;
            }
            resolve(new JSDOM(body));
        });
    });
    return prom;
}


function fixHTMLinnerElem(text: string, space=true) : string {
    let out = text.replace(/(<i>|<\/i>|<p>|<\/p>|<dd>|<\/dd>|<dl>|<\/dl>|<b>|<\/b>|<\/li>)/g, "");
    out = out.replace(/&lt;/g, "<");
    out = out.replace(/&gt;/g, ">");
    out = out.replace(/<code>/g, "");
    out = out.replace(/<\/code>/g, "");
    if (space){
        out = out.replace(/( *\n *| *\r *| *\t *)/g, " ");
        // out = out.replace(/( {3,})/g, " ");
        out = out.replace(/( +)/g, " ");
        out = out.replace(/(\. +)/g, "  ");
        out = out.replace(/( *<li> *)/g, "\n    - ");
    } else {
        out = out.replace(/(<li> *)/g, "- ");
    }

    return out;
}


function parseDom(name: string, t: number, dom: JSDOM): core.ICmdInfo {
    let desc = "";
    let example = "";
    let undoable = false;
    let queryable = false;
    let editable = false;
    let args : core.Args[] = [];
    let cmdReturn = undefined;

    let synopsisP = dom.window.document.querySelector("#synopsis");
    if (synopsisP && synopsisP.nextElementSibling) {
        let sibling = synopsisP.nextElementSibling;
        if (sibling.textContent)
        {
            let text = sibling.textContent.toLowerCase();
            undoable = text.includes("undoable") && !text.includes("not undoable");
            queryable = text.includes("queryable") && !text.includes("not queryable");
            editable = text.includes("editable") && !text.includes("not editable");
        }
        // Description ----------------------------
        let next = sibling.nextSibling;
        // let stop when text content is empty to avoid getting to many description information
        while (next && next.textContent && next.nodeName !== "H2"){
            desc += fixHTMLinnerElem(next.textContent);
            // if ((<any>next).innerHTML){
            //     desc += fixHTMLinnerElem((<any>next).innerHTML);
            // } else {
            //     desc += fixHTMLinnerElem(next.textContent);
            // }
            
            next = next.nextSibling;
        }
        // remove start and end spaces.
        desc = desc.replace(/(^ +| +$)/gm, "");
    }

    // return type and info
    let returnElems = dom.window.document.querySelectorAll("h2");
    for (let x = 0; x < returnElems.length; x++) {
        let cur = returnElems.item(x);
        
        if (cur.textContent && cur.textContent.toLowerCase() === 'return value'){

            let elem = <any>cur;
            // find next tag that containt return information
            while (elem && elem.nodeName !== "P" && elem.nodeName !== "TABLE") {
                elem = elem.nextSibling;
            }

            if (elem && elem.nodeName === "P"){
                if (elem.textContent){
                    cmdReturn = {
                        type: elem.textContent,
                        info: ""
                    };
                }
            } else if (elem) {
                // this is a table
                let tableBody = elem.firstChild;
                if (tableBody){
                    let tableRow = tableBody.firstChild;
                    if (tableRow && tableRow.childNodes.length >= 2){
                        if (tableRow.childNodes[0].textContent && tableRow.childNodes[1].textContent){
                            cmdReturn = {
                                type: tableRow.childNodes[0].textContent,
                                info: tableRow.childNodes[1].textContent
                            };
                        }
                    }
                }
            }
            break;
        }
    }

    let pre = dom.window.document.querySelectorAll("pre");
    if (pre && pre.length > 0){
        let exElem = pre.item(pre.length - 1);
        if (exElem. textContent){
            example = exElem.textContent;
        }
    }
    
    let argTable = dom.window.document.body.querySelectorAll(":scope > table");
    if (argTable && argTable.length >= 2){
        let tableBody = argTable[argTable.length - 2].querySelector("tbody");
        if (tableBody){
            let rows = tableBody.querySelectorAll(':scope > tr');
            let id = 0;
            while (id < rows.length - 1) {
                let row1 = rows[id];
                let attr = row1.attributes.getNamedItem("bgcolor");
                if (!attr || attr.value !== "#EEEEEE"){
                    id += 1;
                    continue;
                }
                let row2 = rows[id + 1];
                
                let arg = new core.Args();

                let column1 = row1.querySelectorAll("td");
                if (column1.length === 3){
                    let code = row1.querySelectorAll("code");
                    if (code.length === 2){
                        if (code[0].textContent){
                            let name = fixHTMLinnerElem(code[0].textContent);
                            let names = name.match(/(\w+)\((\w+)\)/);
                            if (names){
                                arg.fullname = names[1];
                                arg.shortname = names[2];
                            }
                        }

                        if (code[1].textContent){
                            let varType = fixHTMLinnerElem(code[1].textContent);
                            varType = varType.replace(/(angle|linear)/g, 'float');
                            varType = varType.replace(/uint/g, 'int');
                            arg.type = varType;
                        }
                    }
                    let imgs = column1[2].querySelectorAll("img");
                    let x = 0;
                    while (x < imgs.length){
                        arg[imgs[x].title] = true;
                        x += 1;
                    }
                }
                let descElems = row2.querySelectorAll("td");
                if (descElems){
                    let text = descElems[descElems.length-1].textContent;
                    if (text){
                        arg.description = fixHTMLinnerElem(text);
                    }
                }
                id += 3;

                if (arg.isValid()){
                    args.push(arg);
                }
            }
        }
    }
    return {
        name: name,
        type: t,
        description: desc,
        example: example,
        undoable: undoable,
        queryable: queryable,
        editable: editable,
        args: args,
        return: cmdReturn
    };
}


async function _getCmdInfo(urlInfo: IUrlInfo, commandName: string): Promise<core.ICmdInfo> {
    let t = core.MayaCmds.cmds[commandName];
    
    return new Promise(async (resolve, reject) => {
        if (t === core.CmdType.command){
            // load web page and parse it
            await getJSDOM(urlInfo, commandName).then( (dom) => {
                let cmdInfo = parseDom(commandName, t, dom);
                resolve(cmdInfo);
            }).catch( (err) => {
                console.log(err);
            });
        }
        resolve({
            name: commandName,
            type: t,
            description: "",
            example: "",
            undoable: false,
            queryable: false,
            editable: false,
            args: [],
            return: undefined
        });
    });
}

/**
 * Get command info for all the command or specified one.
 * @param url Maya python command help url.
 * @param commandName list of command name to retrieve information. If none specified, parse all the commands.
 */
export async function getCommandInfo(url: string, commandName?: [string]): Promise<core.ICmdInfoObject> {
    let urlInfo = getMayaHelpWebInfo(url);

    let commandList: any = {};
    if (commandName){
        for (let name of commandName){
            commandList[name] = core.MayaCmds.cmds[name];
        }
    } else {
        commandList = core.MayaCmds.cmds;
    }

    return new Promise( async (resolve, reject) => {
        let out: core.ICmdInfoObject = {};
        let x = 1;
        let cmdCount = Object.keys(commandList).length;
        for (let cmd in commandList){
            console.log(`Parsing "${cmd}" ${x.toString().padStart(4)}/${cmdCount}`);
            await _getCmdInfo(urlInfo, cmd).then((info)=> {
                out[info.name] = info;
            }).catch( (reason) => {
                console.log(reason);
            });
            x += 1 ;
        }
        resolve(out);
    });
}


export async function parseCommandDoc(url: string | any, commandName: any, outputToFile: any, override: any, filepath: any){
    let info = await getCommandInfo(url, commandName);

    if (outputToFile){

        let _filepath = core.cmdsInfoPath;
        if (filepath){
            _filepath = resolve(process.cwd(), filepath);
        }

        let jsonObject = {};

        if (!override){
            jsonObject = JSON.parse(readFileSync(_filepath, {encoding: "utf8"}));
        }

        Object.assign(jsonObject, info);

        writeFileSync(_filepath, JSON.stringify(jsonObject, undefined, 4), { encoding: "utf8" });

        console.log(`Command info successfully written to "${_filepath}".`);

    } else {
        // param to print everything ??
        console.log(info);
    }
}
import * as request from "request";
import { JSDOM } from "jsdom";
import { writeFile } from "fs";

import * as core from "./core";


/**
 * Return web adress information to pass to the http request.
 */
function getMayaHelpWebInfo() {
    let reg = /(^.*.com)(.+?)(\/$|$|\/.\w*.html)/g;
    let match = reg.exec(core.settings.mayaHelp);
    if (match){
        return {
            host: match[1],
            path: match[2] + '/'
        }
    }
    throw new Error("Invalid maya help web site.");

}


let mMayaWebInfo = getMayaHelpWebInfo();


function getUrlForCmd(cmdName: string): string{
    return mMayaWebInfo.host + mMayaWebInfo.path + cmdName + '.html';
}


async function getJSDOM(cmdName: string) : Promise<JSDOM> {
    let prom = new Promise<JSDOM>((resolve, reject) => {
        request.get(getUrlForCmd(cmdName), (error, response, body) => {
            if (error) {
                reject(error);
                return;
            }
            if (response.statusCode != 200){
                reject(`Status code: ${response.statusCode}`);
                return;
            }
            resolve(new JSDOM(body))
        });
    });
    return prom;
}


function fixHTMLinnerElem(text: string, space=true) : string {
    let out = text.replace(/(<i>|<\/i>|<p>|<\/p>|<dd>|<\/dd>|<dl>|<\/dl>)/g, "");
    out = out.replace(/&lt;/g, "<");
    out = out.replace(/&gt;/g, ">");
    out = out.replace(/&gt;/g, ">");
    out = out.replace(/<code><b>/g, "<code>");
    out = out.replace(/<\/b><\/code>/g, "</code>");
    if (space){
        out = out.replace(/(\n|\r|\t|^ *)/g, " ");
        out = out.replace(/(^ *| {2,})/g, "");
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

    let synopsisP = dom.window.document.querySelector("#synopsis");
    if (synopsisP && synopsisP.nextElementSibling) {
        let sibling = synopsisP.nextElementSibling;
        if (sibling.textContent)
        {
            let text = sibling.textContent.toLowerCase();
            undoable = text.includes("undoable");
            queryable = text.includes("queryable");
            editable = text.includes("editable");
        }
        let next = sibling.nextSibling
        if (next && next.textContent){
            desc = fixHTMLinnerElem(next.textContent);
        }
    }

    let pre = dom.window.document.querySelector("pre");
    if (pre && pre.textContent){
        example = pre.textContent;
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
                if (column1.length == 3){
                    let code = row1.querySelectorAll("code");
                    if (code.length == 2){
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
            };
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
        args: args
    }
}


export async function getCmdInfoForCommand(commandName: string): Promise<core.ICmdInfo> {
    let t = core.MayaCmds.cmds[commandName];
    
    return new Promise(async (resolve, reject) => {
        if (t === core.CmdType.command){
            // load web page and parse it
            await getJSDOM(commandName).then( (dom) => {
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
            args: []
        });
    });
}


export async function getInfoForAllCmds(): Promise<core.ICmdInfoObject> {
    return new Promise( async (resolve, reject) => {
        let out: core.ICmdInfoObject = {};
        for (let cmd in core.MayaCmds.cmds){
            console.log(`Parsing "${cmd}":`);
            await getCmdInfoForCommand(cmd).then((info)=> {
                out[info.name] = info;
            }).catch( (reason) => {
                console.log(reason)
            });
        }
        resolve(out);
    });
}


export async function parseAndSaveInfo(){
    getInfoForAllCmds().then( (infoArr) => { 
        writeFile(core.cmdsInfoPath, JSON.stringify(infoArr, undefined, 4), { encoding: "utf8" }, (err) => {
            console.log(err);
        });
    }).catch((err) => {
        console.error(err);
    });
}

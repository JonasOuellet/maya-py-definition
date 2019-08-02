"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var request = __importStar(require("request"));
var jsdom_1 = require("jsdom");
var fs_1 = require("fs");
var path_1 = require("path");
var mayaCmds = require("../cmds.json");
var settings = require("../settings.json");
/**
 * Type base on type found in cmds.json.
 */
var cmdType;
(function (cmdType) {
    cmdType[cmdType["runTimeCommand"] = 0] = "runTimeCommand";
    cmdType[cmdType["command"] = 1] = "command";
    cmdType[cmdType["unknown"] = 2] = "unknown";
})(cmdType || (cmdType = {}));
var Args = /** @class */ (function () {
    function Args() {
        this.fullname = "";
        this.shortname = "";
        this.description = "";
        this.type = "";
        this.defaultValue = "";
        this.edit = false;
        this.query = false;
        this.create = false;
        this.multiuse = false;
    }
    Args.prototype.isValid = function () {
        return this.fullname !== "" && this.shortname !== "" && this.type !== "";
    };
    ;
    return Args;
}());
/**
 * Return web adress information to pass to the http request.
 */
function getMayaHelpWebInfo() {
    var reg = /(^.*.com)(.+?)(\/$|$|\/.\w*.html)/g;
    var match = reg.exec(settings.mayaHelp);
    if (match) {
        return {
            host: match[1],
            path: match[2] + '/'
        };
    }
    throw new Error("Invalid maya help web site.");
}
var mMayaWebInfo = getMayaHelpWebInfo();
function getUrlForCmd(cmdName) {
    return mMayaWebInfo.host + mMayaWebInfo.path + cmdName + '.html';
}
function getJSDOM(cmdName) {
    return __awaiter(this, void 0, void 0, function () {
        var prom;
        return __generator(this, function (_a) {
            prom = new Promise(function (resolve, reject) {
                request.get(getUrlForCmd(cmdName), function (error, response, body) {
                    if (error) {
                        reject(error);
                        return;
                    }
                    if (response.statusCode != 200) {
                        reject("Status code: " + response.statusCode);
                        return;
                    }
                    resolve(new jsdom_1.JSDOM(body));
                });
            });
            return [2 /*return*/, prom];
        });
    });
}
function fixHTMLinnerElem(text, space) {
    if (space === void 0) { space = true; }
    var out = text.replace(/(<i>|<\/i>|<p>|<\/p>|<dd>|<\/dd>|<dl>|<\/dl>)/g, "");
    out = out.replace(/&lt;/g, "<");
    out = out.replace(/&gt;/g, ">");
    out = out.replace(/&gt;/g, ">");
    out = out.replace(/<code><b>/g, "<code>");
    out = out.replace(/<\/b><\/code>/g, "</code>");
    if (space) {
        out = out.replace(/(\n|\r|\t|^ *)/g, " ");
        out = out.replace(/(^ *| {2,})/g, "");
    }
    return out;
}
function parseDom(name, t, dom) {
    var desc = "";
    var example = "";
    var undoable = false;
    var queryable = false;
    var editable = false;
    var args = [];
    var synopsisP = dom.window.document.querySelector("#synopsis");
    if (synopsisP && synopsisP.nextElementSibling) {
        var sibling = synopsisP.nextElementSibling;
        if (sibling.textContent) {
            var text = sibling.textContent.toLowerCase();
            undoable = text.includes("undoable");
            queryable = text.includes("queryable");
            editable = text.includes("editable");
        }
        var next = sibling.nextSibling;
        if (next && next.textContent) {
            desc = fixHTMLinnerElem(next.textContent);
        }
    }
    var pre = dom.window.document.querySelector("pre");
    if (pre && pre.textContent) {
        example = pre.textContent;
    }
    var argTable = dom.window.document.body.querySelectorAll(":scope > table");
    if (argTable && argTable.length >= 2) {
        var tableBody = argTable[argTable.length - 2].querySelector("tbody");
        if (tableBody) {
            var rows = tableBody.querySelectorAll(':scope > tr');
            var id = 0;
            while (id < rows.length - 1) {
                var row1 = rows[id];
                var attr = row1.attributes.getNamedItem("bgcolor");
                if (!attr || attr.value !== "#EEEEEE") {
                    id += 1;
                    continue;
                }
                var row2 = rows[id + 1];
                var arg = new Args();
                var column1 = row1.querySelectorAll("td");
                if (column1.length == 3) {
                    var code = row1.querySelectorAll("code");
                    if (code.length == 2) {
                        if (code[0].textContent) {
                            var name_1 = fixHTMLinnerElem(code[0].textContent);
                            var names = name_1.match(/(\w+)\((\w+)\)/);
                            if (names) {
                                arg.fullname = names[1];
                                arg.shortname = names[2];
                            }
                        }
                        if (code[1].textContent) {
                            var varType = fixHTMLinnerElem(code[1].textContent);
                            arg.type = varType;
                        }
                    }
                    var imgs = column1[2].querySelectorAll("img");
                    var x = 0;
                    while (x < imgs.length) {
                        arg[imgs[x].title] = true;
                        x += 1;
                    }
                }
                var descElems = row2.querySelectorAll("td");
                if (descElems) {
                    var text = descElems[descElems.length - 1].textContent;
                    if (text) {
                        arg.description = fixHTMLinnerElem(text);
                    }
                }
                id += 3;
                if (arg.isValid()) {
                    args.push(arg);
                }
            }
            ;
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
    };
}
function getCmdInfoForCommand(commandName) {
    return __awaiter(this, void 0, void 0, function () {
        var t;
        var _this = this;
        return __generator(this, function (_a) {
            t = mayaCmds.cmds[commandName];
            return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!(t === cmdType.command)) return [3 /*break*/, 2];
                                // load web page and parse it
                                return [4 /*yield*/, getJSDOM(commandName).then(function (dom) {
                                        var cmdInfo = parseDom(commandName, t, dom);
                                        resolve(cmdInfo);
                                    }).catch(function (err) {
                                        console.log(err);
                                    })];
                            case 1:
                                // load web page and parse it
                                _a.sent();
                                _a.label = 2;
                            case 2:
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
                                return [2 /*return*/];
                        }
                    });
                }); })];
        });
    });
}
function getInfoForAllCmds() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                    var out, _a, _b, _i, cmd;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                out = {};
                                _a = [];
                                for (_b in mayaCmds.cmds)
                                    _a.push(_b);
                                _i = 0;
                                _c.label = 1;
                            case 1:
                                if (!(_i < _a.length)) return [3 /*break*/, 4];
                                cmd = _a[_i];
                                console.log("Parsing \"" + cmd + "\":");
                                return [4 /*yield*/, getCmdInfoForCommand(cmd).then(function (info) {
                                        out[info.name] = info;
                                    }).catch(function (reason) {
                                        console.log(reason);
                                    })];
                            case 2:
                                _c.sent();
                                _c.label = 3;
                            case 3:
                                _i++;
                                return [3 /*break*/, 1];
                            case 4:
                                resolve(out);
                                return [2 /*return*/];
                        }
                    });
                }); })];
        });
    });
}
getInfoForAllCmds().then(function (infoArr) {
    var path = path_1.resolve(path_1.join(__dirname, '..', "cmdsInfo.json"));
    console.log(path);
    fs_1.writeFile(path, JSON.stringify(infoArr, undefined, 4), { encoding: "utf8" }, function (err) {
        console.log(err);
    });
}).catch(function (err) {
    console.error(err);
});
//# sourceMappingURL=index.js.map
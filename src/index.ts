import { writeDefFile, getDefinitionType, getDocstringType } from "./writeDef";
import { parseCommandDoc } from "./parseWebDoc";
import yargs from 'yargs';

const argv = yargs.command(
    'parse-cmds [url]',
    'Parse maya command list and, by default, write the definition to ./cmdsInfo.json',
    (yargs) => {
        yargs.positional('url', {
            describe: 'Maya python command help url',
            type: 'string',
            default: 'http://help.autodesk.com/cloudhelp/2019/ENU/Maya-Tech-Docs/CommandsPython'
        }).options({
            c: {
                alias: "command",
                describe: "command names to parse, if not specified parse all the commands.",
                type: "string",
                array: true
            },
            console: {
                boolean: true,
                describe: "output to console",
            },
            f: {
                alias: "file",
                type: "string",
                describe: "modify file content with new parsed command, or override it if -o is specified",
                default: null
            },
            o: {
                alias: "override",
                boolean: true,
                describe: "override output file instead of modified its content",
            }
            }
        );
    },
    (argv) => {
        parseCommandDoc(argv.url, argv.command, !argv.console, argv.override, argv.file);
    }
).command(
    'write-def [file]',
    'Write python definition for Maya commands.',
    (yargs) => {
        yargs.positional('file', {
            describe: 'Maya commands python file path',
            type: 'string'
        }).options({
            c: {
                alias: "command",
                describe: "command names to write definition, if not specified write all the commands.",
                type: "string",
                array: true
            },
            l: {
                alias: "line-length",
                describe: "command names to parse, if not specified parse all the commands.",
                type: "number",
                default: 95
            },
            s: {
                alias: "no-short",
                describe: "Do not write short keywords arg in the definition",
                boolean: true,
            },
            d: {
                alias: "docstring",
                describe: "Docstring type",
                type: "string",
                default: "rest"
            },
            i: {
                alias: "interface",
                describe: "Definition interface type",
                type: "string",
                default: "py"
            },
            o: {
                alias: "show-option",
                describe: "Show possible option for docstring and interface type",
                boolean: true
            }
            }
        );
    },
    (argv) => {
        if (argv.showOption){
            console.log("Docstring: ");
            console.log(getDocstringType());

            console.log("Interface: ");
            console.log(getDefinitionType());
        } else {
            writeDefFile(argv.command, !argv.noshort, argv.docstring, argv.interface, argv.linelength, argv.file);
        }
    }
).demandCommand(1, "Specify at least one command").help().recommendCommands().argv;

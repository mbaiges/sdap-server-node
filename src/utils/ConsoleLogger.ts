// Prefixes

import { Service } from "typedi";

const PREFIX_LOG   = "[LOG]";
const PREFIX_DEBUG = "[DEBUG]";
const PREFIX_WARN  = "[WARN]";
const PREFIX_ERROR = "[ERROR]";

// Colors

const colorsCodes: object = {
    "red":    31,
    "green":  32,
    "yellow": 33,
    "blue":   34,
    "purple": 35,
    "cyan":   36
}

const COLOR_LOG   = "white";
const COLOR_DEBUG = "blue";
const COLOR_WARN  = "yellow";
const COLOR_ERROR = "red";

// Helpers

function date() {
    return `${new Date().toJSON()}`;
}

function wrapWithColor(s: string, c: string) {
    let ret = s;

    const code: number = colorsCodes[c as keyof typeof colorsCodes];
    if (code) {
        ret = `\u001b[${code}m` + s + '\u001b[0m';
    }
    return ret;
}

// Loggers

@Service()
export default class ConsoleLogger {

    log(s: string) {
        console.log(wrapWithColor(`${date()} - ${PREFIX_LOG} - ${s}`, COLOR_LOG));
    }
    
    debug(s: string) {
        console.debug(wrapWithColor(`${date()} - ${PREFIX_DEBUG} - ${s}`, COLOR_DEBUG));
    }
    
    warn(s: string) {
        console.warn(wrapWithColor(`${date()} - ${PREFIX_WARN} - ${s}`, COLOR_WARN));
    }
    
    error(s: string) {
        console.error(wrapWithColor(`${date()} - ${PREFIX_ERROR} - ${s}`, COLOR_ERROR));
    }
}
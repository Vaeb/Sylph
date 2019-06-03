import * as dateformat from 'dateformat';
import { format as nodeFormat } from 'util';

const logCopy = console.log.bind(console);

console.log = (...args: any[]) => {
    if (!args.length) return logCopy();

    const nowDate = new Date();
    nowDate.setHours(nowDate.getHours() + 1);

    const [firstArg, ...otherArgs] = args; // Necessary because nodeFormat requires 1+ arguments and TS thinks ...args is 0+ arguments

    let out = nodeFormat(firstArg, ...otherArgs);

    if (out.slice(0, 2) === '> ') out = `\n${out}`;

    let outIndex = out.search(/[^\n\r]/g);
    if (outIndex === -1) outIndex = 0;

    out = out.slice(0, outIndex) + dateformat(nowDate, '| dd/mm/yyyy | HH:MM | ') + out.slice(outIndex);

    return logCopy(out);
};

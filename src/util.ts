import { Guild, GuildMember, Message, TextChannel, User } from 'discord.js';
import { format as nodeFormat } from 'util';

import { IAnyObject } from './types';

export const charLimit = 1949;

interface ICloneObjDepth {
    (obj: Date, maxDepth?: number, nowDepth?: number): Date; // Date
    <T>(obj: T[], maxDepth?: number, nowDepth?: number): T[] | string; // Array
    (obj: IAnyObject, maxDepth?: number, nowDepth?: number): IAnyObject | string; // Object
    <T>(obj: T, maxDepth?: number, nowDepth?: number): T; // Null/Undefined or Other
}

export const cloneObjDepth: ICloneObjDepth = (obj: any, maxDepth: number = 1, nowDepth: number = 0): any => {
    if (obj == null || typeof obj !== 'object') return obj; // Null/Undefined or Other

    if (obj instanceof Date) {
        // Date
        const copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    if (obj instanceof Array) {
        // Array
        const len = obj.length;

        if (nowDepth >= maxDepth && len > 0) return '[Array]';

        const copy = [];
        for (let i = 0; i < len; i++) {
            copy[i] = exports.cloneObjDepth(obj[i], maxDepth, nowDepth + 1);
        }

        return copy;
    }

    if (obj instanceof Object && !(obj instanceof Buffer)) {
        // Object
        const entries = Object.entries(obj);

        if (nowDepth >= maxDepth && entries.length > 0) return '[Object]';

        const copy: IAnyObject = {};
        for (const [attr, objAttr] of entries) {
            copy[attr] = exports.cloneObjDepth(objAttr, maxDepth, nowDepth + 1);
        }

        return copy;
    }

    console.log('Couldn\'t clone obj, returning real value');

    return obj; // Buffer (Still Object)
};

export const format = (...args: any[]): string => {
    if (args.length < 1) return '';

    const newArgs = args.map((arg) => cloneObjDepth(arg, 2));

    const [firstArg, ...otherArgs] = newArgs; // Have to do this because nodeFormat needs 1+ arguments and TS thinks ...newArgs is 0+ arguments

    return nodeFormat(firstArg, ...otherArgs);
};

export const escapeRegExp = (str: string): string => str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

const getMatchesWithBlock = (str: string, matchChars: string, blockChars: string, useInside: boolean) => {
    // Gets all matches of a substring that are in/out of a code block
    const pattern = new RegExp(escapeRegExp(blockChars), 'g');
    let result;

    let numMatches = 0;
    let strPointer = 0;
    let newStr = '';

    // tslint:disable-next-line:no-conditional-assignment
    while ((result = pattern.exec(str))) {
        numMatches++;
        if (useInside) {
            if (numMatches % 2 === 1) {
                // Open block
                newStr += '.'.repeat(result.index - strPointer);
                strPointer = result.index;
            } else {
                // Close block (Store data)
                newStr += '.'.repeat(blockChars.length) + str.substring(strPointer + blockChars.length, result.index);
                strPointer = result.index;
            }
        } else if (numMatches % 2 === 1) {
            // Open block (Store data)
            newStr += str.substring(strPointer, result.index);
            strPointer = result.index;
        } else {
            // Close block
            newStr += '.'.repeat(result.index - strPointer + blockChars.length);
            strPointer = result.index + blockChars.length;
        }
    }

    if (useInside) {
        newStr += '.'.repeat(str.length - strPointer);
    } else {
        newStr += str.substring(strPointer);
    }

    if (newStr.length !== str.length) {
        throw new Error('[E_GetMatchesWithBlock] Failed because the output string didn\'t match input string length');
    }

    return newStr.match(new RegExp(escapeRegExp(matchChars), 'g')) || [];
};

const formatSets = [['___', '__'], ['***', '**', '*'], ['```', '``', '`']];

const splitSets = [
    // pivot: -1 = Split Start, 0 = Remove, 1 = Split End
    { chars: '```', pivot: 1 }, // Only applies to end ```
    { chars: '\n\n', pivot: 0 },
    { chars: '\n', pivot: 0 },
    { chars: ' ', pivot: 0 },
];

const leaveExtra = formatSets.reduce((a, b) => a.concat(b)).length * 2;

export const chunkMessage = (msg: string): string[] => {
    if (msg.length <= charLimit) return [msg];

    const origChunks = [msg];
    let content = msg;
    let appendBeginning = [];

    const baseChunkSize = charLimit - leaveExtra;

    for (let i = 0; content; ++i, content = origChunks[i]) {
        for (const preContent of appendBeginning) {
            content = preContent + content;
        }

        if (content.length < charLimit) {
            origChunks[i] = content;
            break;
        }

        let chunk = content.substr(0, baseChunkSize);
        let leftOver;

        appendBeginning = [];

        for (const splitSet of splitSets) {
            const splitChars = splitSet.chars;
            const splitType = splitSet.pivot;

            let pivotStart = chunk.lastIndexOf(splitChars); // exclusive
            let pivotEnd = pivotStart; // inclusive

            if (pivotStart === -1) continue;

            if (splitType === 1) {
                // Split End
                pivotStart += splitChars.length;
                pivotEnd = pivotStart;
            } else if (splitType === 0) {
                // Remove
                pivotEnd += splitChars.length;
            }

            let chunkTemp = chunk.substring(0, pivotStart);

            if (splitChars === '```') {
                // Has to be closing a block
                const numSets = (chunkTemp.match(new RegExp(escapeRegExp(splitChars), 'g')) || []).length;
                if (numSets % 2 === 1) {
                    if (numSets === 1) continue;
                    pivotStart = chunk.substring(0, pivotStart - splitChars.length).lastIndexOf(splitChars);
                    if (pivotStart === -1) continue;
                    pivotStart += splitChars.length;
                    pivotEnd = pivotStart;
                    chunkTemp = chunk.substring(0, pivotStart);
                }
            }

            if (chunkTemp.length <= leaveExtra) continue;

            chunk = chunkTemp;
            leftOver = content.substr(pivotEnd);

            break;
        }

        if (leftOver == null) {
            leftOver = content.substr(baseChunkSize);
        }

        for (const formatSet of formatSets) {
            for (const formatChars of formatSet) {
                const numSets = getMatchesWithBlock(chunk, formatChars, '```', false).length; // Should really only be counting matches not inside code blocks

                if (numSets % 2 === 1) {
                    chunk += formatChars;
                    appendBeginning.push(formatChars);
                    break;
                }
            }
        }

        if (chunk.substr(chunk.length - 3, 3) === '```') appendBeginning.push('​\n');

        origChunks[i] = chunk;

        if (leftOver && leftOver.length > 0) origChunks.push(leftOver);
    }

    return origChunks;
};

export const print = async (channel: TextChannel, ...args: any[]): Promise<void> => {
    const strArgs: string[] = args.map((arg) => (typeof arg !== 'string' ? format(arg) : arg));

    Promise.all(
        chunkMessage(strArgs.join(' ')).map(async (msg, index) => {
            try {
                await channel.send(msg);
            } catch (err) {
                console.log(`>> Print failed (${index}) <<`);
                console.error(err);
            }
        })
    );
};

interface IPropInterface {
    newProp: string;
    fromProps: string[];
    generate(...args: string[]): any;
}

interface IObjValues {
    [key: string]: any;
}

interface IMessageValues {
    id: string;
    guild: Guild;
    channel: TextChannel;
    member: GuildMember;
    author: User;
    content: string;
    createdTimestamp: number;
    contentLower: string;
    speaker: GuildMember;
    nowStamp: number;
}

export const getValuesFromObj = (obj: any, props: string[] = [], newProps: IPropInterface[] = []): IObjValues => {
    const newObj: IObjValues = {};

    props.forEach((prop) => {
        newObj[prop] = obj[prop];
    });

    newProps.forEach(({ newProp, fromProps, generate }) => {
        if (!fromProps) fromProps = [];
        newObj[newProp] = generate(...fromProps.map((prop) => obj[prop]));
    });

    return newObj;
};

export const getMsgObjValues = (msgObj: Message): IMessageValues =>
    getValuesFromObj(
        msgObj,
        ['id', 'guild', 'channel', 'member', 'author', 'content', 'createdTimestamp'],
        [
            { newProp: 'contentLower', fromProps: ['content'], generate: (content) => content.toLowerCase() },
            { newProp: 'speaker', fromProps: ['member'], generate: (member) => member },
            { newProp: 'nowStamp', fromProps: [], generate: () => +new Date() },
        ]
    ) as IMessageValues;

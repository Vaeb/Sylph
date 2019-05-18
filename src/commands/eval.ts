// tslint:disable:no-require-imports
// tslint:disable:no-var-requires

import { format } from 'util';

import { ICommand } from '../types';

const util = require('../util');
const { bot, Bot } = require('../bot');
const { print: printOld } = util;
const client = bot.client;

export const command: ICommand = {
    names: ['eval'],
    desc: 'Run code',
    requireArgs: true,

    func: async ({ msgObj, guild, channel, speaker, args }) => {
        const print = (...args2: any[]) => printOld(channel, ...args2);

        const code = `(async () => {\n${args}\n})()`;

        try {
            const result = await eval(code);
            console.log('Eval result:', result);

            if (result !== undefined) {
                const outStr = ['**Output:**'];
                outStr.push('```');
                outStr.push(format(result));
                outStr.push('```');
                printOld(channel, outStr.join('\n'));
            }
        } catch (err) {
            console.log('Eval Error:', err);
            const outStr = ['**Error:**'];
            outStr.push('```');
            outStr.push(format(err));
            outStr.push('```');
            printOld(channel, outStr.join('\n'));
        }
    },
};

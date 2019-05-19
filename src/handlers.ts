import { Message } from 'discord.js';

import { Bot } from './bot';
import { ICommand } from './types';
import { getMsgObjValues } from './util';

interface ICommandData {
    command: ICommand;
    contentCmd: string;
    contentArgs: string;
}

export class EventHandler {
    private bot: Bot;

    public constructor(bot: Bot) {
        this.bot = bot;
    }

    public async onMessageCreate(msgObj: Message): Promise<void> {
        const msgObjValues = getMsgObjValues(msgObj);

        const { guild, channel, speaker, content, contentLower } = msgObjValues;

        console.log(`Sent message: ${content}`);

        const { command, contentCmd, contentArgs } = this.parseCommand(content, contentLower) as ICommandData;

        if (command) {
            try {
                await command.func({ msgObj, guild, channel, speaker, args: contentArgs });
            } catch (err) {
                console.log(`>> Command Error: ${contentCmd} <<`);
            }
        }
    }

    private parseCommand(content: string, contentLower: string): ICommandData | {} {
        const { prefix } = this.bot.config;

        let contentCmd;
        let contentArgs;

        const command = this.bot.commands.find(({ names, requireArgs }) =>
            names.some((cmdName) => {
                const checkCmd = requireArgs ? `${prefix + cmdName} ` : prefix + cmdName;

                if (contentLower.substr(0, checkCmd.length) === checkCmd) {
                    contentCmd = cmdName;
                    contentArgs = content.substring(checkCmd.length);
                    return true;
                }

                return false;
            })
        );

        if (command) return { command, contentCmd, contentArgs };

        return {};
    }
}

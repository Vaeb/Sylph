import { Client, Message } from 'discord.js';
import { sync as globSync } from 'glob';
import { resolve as pathResolve } from 'path';

import { config as baseConfig, IConfig } from './config';
import { EventHandler } from './handlers';
import { ICommand } from './types';

export class Bot {
    public client: Client;
    public commands: ICommand[] = [];
    public config: IConfig;
    private eventHandler: EventHandler;

    public constructor(config: IConfig) {
        this.client = new Client({
            disabledEvents: [
                'TYPING_START',
                'GUILD_MEMBER_UPDATE',
                'GUILD_MEMBER_REMOVE',
                'MESSAGE_REACTION_ADD',
                'MESSAGE_REACTION_REMOVE',
                'USER_UPDATE',
            ],
            messageCacheMaxSize: 20,
            disableEveryone: true,
        });
        this.config = config;
    }

    public async start(eventHandler: EventHandler): Promise<void> {
        try {
            this.eventHandler = eventHandler;
            console.log('Logging in...');
            await this.client.login(this.config.token);
            console.log('Logged in');
            this.setupCommands();
            this.hookEvents();
            console.log('Bot started');
        } catch (err) {
            console.log('Bot start failed.');
            console.error(err);
        }
    }

    private hookEvents(): void {
        this.client.on('message', (msgObj: Message) => {
            if (!msgObj.guild || !msgObj.member || msgObj.member.id !== this.config.selfId) return;
            this.eventHandler.onMessageCreate(msgObj);
        });
    }

    private setupCommands(): void {
        globSync('./dist/commands/**/*.js').forEach((file) => {
            const filePath = pathResolve(file);
            const command: ICommand = require(filePath).command;

            if (!command) {
                console.log('Command data not found:', file);
                return;
            }

            command.name = command.names[0];
            if (!command.desc) command.desc = 'Command description not provided';

            this.commands.push(command);
        });
    }
}

export const bot: Bot = new Bot(baseConfig);

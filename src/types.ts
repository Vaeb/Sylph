import { Guild, GuildMember, Message, TextChannel } from 'discord.js';

export interface IAnyObject {
    [name: string]: any;
}

export interface IAnyObjectOf<T> {
    [name: string]: T;
}

export const isAnyObject = (obj: any): obj is IAnyObject => (obj && obj.constructor === Object) || false;

export interface ICommandParams {
    msgObj: Message;
    guild: Guild;
    channel: TextChannel;
    speaker: GuildMember;
    args: string;
}

export interface ICommand {
    names: string[];
    name?: string;
    desc: string;
    requireArgs: boolean;
    func(data: ICommandParams): void;
}

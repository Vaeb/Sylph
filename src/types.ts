import { Guild, GuildMember, Message, TextChannel } from 'discord.js';

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

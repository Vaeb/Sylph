import { Guild, GuildMember, Message, TextChannel, User } from 'discord.js';
import { format } from 'util';

export const print = async (channel: TextChannel, ...args: any[]): Promise<void> => {
    const strArgs = args.map((arg) => (typeof arg !== 'string' ? format(arg) : arg));

    try {
        await channel.send(strArgs.join(' '));
    } catch (err) {
        console.log('>> Print failed <<');
        console.error(err);
    }
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

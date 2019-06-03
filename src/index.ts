import './setup';
// tslint:disable-next-line:ordered-imports
import { bot } from './bot';
import { EventHandler } from './handlers';

console.log('Starting');

const eventHandler: EventHandler = new EventHandler(bot);
bot.start(eventHandler);

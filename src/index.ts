import { LogLevel, SapphireClient } from '@sapphire/framework';
import { green } from 'colorette';
import { GatewayIntentBits } from 'discord.js';
import './lib/setup';

const client = new SapphireClient({
  logger: {
    level: LogLevel.Debug,
  },
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  partials: [],
  loadDefaultErrorListeners: false,
  loadSubcommandErrorListeners: false,
});

const main = async () => {
  try {
    await client.login();
    client.logger.info(green('Successfully logged in.'));
  } catch (error) {
    client.logger.fatal(error);
    await client?.destroy();
    process.exit(1);
  }
};

void main();

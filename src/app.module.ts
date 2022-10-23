import { MovieModule } from '@modules/movie/movie.module';
import { SuggestionModule } from '@modules/suggestion/suggestion.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GatewayIntentBits } from 'discord.js';
import { NecordModule } from 'necord';
import { AppUpdate } from './app.update';
import { TMDBModule } from './lib/tmdb/tmdb.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'postgres',
      port: 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    NecordModule.forRoot({
      token: process.env.DISCORD_TOKEN,
      //   intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
      development: [process.env.DISCORD_DEV_GUILD_ID],
    }),
    TMDBModule,
    SuggestionModule,
    MovieModule,
  ],
  providers: [AppUpdate],
})
export class AppModule {}

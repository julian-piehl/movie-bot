import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NecordModule } from 'necord';
import { AppUpdate } from './app.update';

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
      intents: [],
      development: [process.env.DISCORD_DEV_GUILD_ID],
    }),
  ],
  providers: [AppUpdate],
})
export class AppModule {}

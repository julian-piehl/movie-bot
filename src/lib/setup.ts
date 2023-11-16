// Unless explicitly defined, set NODE_ENV as development:
process.env.NODE_ENV ??= 'development';

import { PrismaClient } from '@prisma/client';
import { ApplicationCommandRegistries, RegisterBehavior, container } from '@sapphire/framework';
import '@sapphire/plugin-logger/register';
import '@sapphire/plugin-subcommands/register';
import { setup } from '@skyra/env-utilities';
import * as colorette from 'colorette';
import { join } from 'path';

const prisma = new PrismaClient();
container.prisma = prisma;

ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);

setup({ path: join(__dirname, '..', '..', '.env') });

colorette.createColors({ useColor: true });

declare module '@sapphire/pieces' {
  interface Container {
    prisma: typeof prisma;
  }
}

import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';
import { CommandsModule } from './commands/commands.module';

/**
 * Entry point for CLI commands
 */
async function bootstrap() {
  await CommandFactory.run(CommandsModule, {
    cliName: 'Multi-SaaS Platform CLI',
    logger: ['error', 'warn'],
    usePlugins: [
      {
        name: 'app',
        module: AppModule,
      },
    ],
  });
}

bootstrap();
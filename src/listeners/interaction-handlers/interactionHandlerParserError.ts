import { Events, InteractionHandlerParseError, Listener } from '@sapphire/framework';
import { handleInteractionError } from '../../lib/utils/functions/interactionErrorHandler';

export class UserListener extends Listener<typeof Events.InteractionHandlerParseError> {
  public run(error: Error, payload: InteractionHandlerParseError) {
    return handleInteractionError(error, payload);
  }
}

import { Events, InteractionHandlerError, Listener } from '@sapphire/framework';
import { handleInteractionError } from '../../lib/utils/functions/interactionErrorHandler';

export class UserListener extends Listener<typeof Events.InteractionHandlerError> {
  public run(error: Error, payload: InteractionHandlerError) {
    return handleInteractionError(error, payload);
  }
}

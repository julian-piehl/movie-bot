import { isNullish } from '@sapphire/utilities';

export const OwnerID = process.env.OWNER_ID || '482280103058079775';
export const LogChannelID = process.env.LOG_CHANNEL_ID || null;

export const TmdbID = process.env.TMDB_ID || null;

export const LimitVotes = isNullish(process.env.MOVIEBOT_LIMIT_VOTES)
  ? true
  : Boolean(process.env.MOVIEBOT_LIMIT_VOTES);

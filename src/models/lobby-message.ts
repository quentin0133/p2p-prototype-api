import { Lobby } from './lobby';

export interface LobbyMessage {
  added?: Lobby,
  removed?: string,
  updated?: Lobby,
  additionalMessage?: string,
  from_id?: String,
  to_id?: String
}
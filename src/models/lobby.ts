import { Player } from './player';
import { PeerConnectionInfo } from './peer-connection-info';

export interface Lobby {
  id: string;
  host_player: Player;
  players: Player[];
  connections: Record<string, PeerConnectionInfo>;
  max_player: number;
  pwd: String;
}
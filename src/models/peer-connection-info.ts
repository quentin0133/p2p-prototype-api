import { IceCandidate } from './ice-candidate';
import { Player } from './player';

export interface PeerConnectionInfo {
  id: number;
  state: string;
  player: Player;
  offer?: string | null;
  answer?: string | null;
  ice_candidates_host: IceCandidate[];
  ice_candidates_client: IceCandidate[];
}
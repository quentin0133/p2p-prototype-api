export interface IceCandidate {
  candidate: string;
  sdp_mid: string | null;
  sdp_mline_index: number | null;
}
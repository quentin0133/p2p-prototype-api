import { Router } from 'express';
import {
  broadcastLobby,
  connectionEstablished,
  createLobby,
  deleteLobby,
  joinLobby,
  quitLobby,
  retrieveLobby, sendIceCandidate,
  sendSDP,
} from '../controllers/lobby-controller';


const router = Router();

router.get('/', retrieveLobby);
router.post('/', createLobby);
router.post('/join-lobby', joinLobby);
router.post('/quit-lobby', quitLobby);
router.post('/broadcast-lobby', broadcastLobby);
router.put('/send-sdp', sendSDP);
router.put('/send-ice-candidates', sendIceCandidate);
router.put('/connection-established', connectionEstablished);
router.delete('/', deleteLobby);

export default router;

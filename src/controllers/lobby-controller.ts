import {
  connectionEstablishedService,
  createLobbyService,
  deleteLobbyService,
  fetchLobbies, fetchLobbyById,
  joinLobbyService,
  quitLobbyService,
  updateLobbyIceCandidateService,
  updateLobbySDPService,
} from '../services/lobby-service';
import { Request, Response, NextFunction } from 'express';

export const retrieveLobby = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let lobbies = fetchLobbies();
    res.status(200).json(lobbies);
  } catch (error) {
    next(error);
  }
};

export const retrieveLobbyById = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let { lobby_id } = req.body;
    let lobby = fetchLobbyById(lobby_id);
    res.status(200).json(lobby);
  } catch (error) {
    next(error);
  }
};

export const createLobby = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let lobby = createLobbyService(req.body);
    res.status(201).json(lobby);
  } catch (error) {
    next(error);
  }
};

export const joinLobby = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let { lobby_id, player, pwd } = req.body;
    let lobby = joinLobbyService(lobby_id, player, pwd);
    res.status(200).json(lobby);
  } catch (error) {
    next(error);
  }
};

export const quitLobby = (req: Request, res: Response, next: NextFunction): void => {
  try {
    quitLobbyService(req.body.lobby_id, req.body.player_id);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export const deleteLobby = (req: Request, res: Response, next: NextFunction): void => {
  try {
    deleteLobbyService(req.body.id);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export const sendSDP = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let { lobby_id, player_id, sdp, type } = req.body;
    updateLobbySDPService(lobby_id, player_id, sdp, type);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export const sendIceCandidate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let { lobby_id, player_id, ice_candidates, is_host } = req.body;
    updateLobbyIceCandidateService(lobby_id, player_id, ice_candidates, is_host);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export const connectionEstablished = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let { lobby_id, player_id } = req.body;
    connectionEstablishedService(lobby_id, player_id);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}
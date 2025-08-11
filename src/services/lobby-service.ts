import { nanoid } from 'nanoid';
import { MessageType } from '../enums/message-type';
import { Lobby } from '../models/lobby';

import { Player } from '../models/player';
import { wss } from '../server';
import { LobbyMessage } from '../models/lobby-message';
import { HttpError } from '../middlewares/errors/error-handle';
import { IceCandidate } from '../models/ice-candidate';
import { SDPType } from '../types/sdp-type';
import { PeerConnectionInfo } from '../models/peer-connection-info';
import { generateId } from '../utils/ids';

const lobbies: Lobby[] = [];
const oldLobbies: Lobby[] = [];

export let lobbiesVersion = 0;

export function fetchLobbies(): Lobby[] {
    return lobbies;
}

export function createLobbyService(lobby: Lobby): Lobby {
    lobby.id = nanoid(6);
    lobby.connections = {};
    while (lobbies.some(lob => lob.id === lobby.id))
        lobby.id = nanoid(6);

    lobbies.push(lobby);

    broadcastLobbies({
        added: lobby
    });

    return lobby;
}

export function joinLobbyService(lobbyId: string, player: Player, pwd: string) {
    const indexLobby = getLobbyIndexById(lobbyId);
    const lobby = lobbies[indexLobby];

    if (lobby.max_player <= lobby.players.length)
        throw new HttpError(404, "Max player reached, can't add player");

    if (lobby.pwd !== "" && lobby.pwd !== pwd)
        throw new HttpError(401, "Password is incorrect");

    let newId = generateId();
    while (Object.values(lobby.connections).some(conn => conn.id === newId) || newId <= 1) {
        newId = generateId();
    }

    lobby.connections[player.id] = {
        id: newId,
        state: "want_join",
        player: player,
        ice_candidates_host: [],
        ice_candidates_client: []
    };

    lobbies[indexLobby] = lobby;

    broadcastLobbies({ updated: lobby, from_id: player.id, to_id: lobby.host_player.id });

    return lobby;
}

export function quitLobbyService(lobbyId: string, playerId: string) {
    let indexLobby = lobbies.findIndex(lobby => lobby.id === lobbyId);
    if (indexLobby === -1)
        throw new HttpError(404, "Lobby id not found");

    let lobby = lobbies[indexLobby];
    let indexPlayer = lobby.players.findIndex(player => player.id === playerId);
    let hasConnection = Object.keys(lobby.connections).some(id => id === playerId);

    if (!hasConnection && indexPlayer === -1)
        throw new HttpError(404, "Player id not found in lobby");

    if (hasConnection)
        delete lobby.connections[playerId];

    if (indexPlayer !== -1)
        lobby.players.splice(indexPlayer, 1);

    if (lobby.players.length === 0)
        lobbies.splice(indexLobby, 1);

    if (playerId === lobby.host_player.id)
        broadcastLobbies({ removed: lobby.id, additionalMessage: "host_quit" });
    else
        broadcastLobbies({ updated: lobby });
}

export function clearPlayerService(playerId: string) {
    let lobbiesPlayer = lobbies.filter(lobby => lobby.players.some(player => player.id === playerId));

    for (let lobbyPlayer of lobbiesPlayer)
        quitLobbyService(lobbyPlayer.id, playerId);
}

export function deleteLobbyService(id: string) {
    let index = lobbies.findIndex(lobby => lobby.id === id);
    if (index === -1)
        throw new HttpError(404, "Lobby id not found");

    let lobby = lobbies[index];
    lobbies.splice(index, 1);

    broadcastLobbies({
        removed: lobby.id
    });
}

export function updateLobbySDPService(lobbyId: string, playerId: string, sdp: string, type: SDPType) {
    const indexLobby = getLobbyIndexById(lobbyId);
    const lobby = lobbies[indexLobby];
    const connection = lobby.connections[playerId];
    if (!connection)
        throw new HttpError(400, "Invalid connection ID in lobby");

    let fromId;
    let toId;
    switch (type) {
        case 'answer':
            fromId = playerId;
            toId = lobby.host_player.id;
            connection.answer = sdp;
            connection.state = "answer";
            break;
        case 'offer':
            fromId = lobby.host_player.id;
            toId = playerId;
            connection.offer = sdp
            connection.state = "offer";
            break;
        default:
            throw new HttpError(400, "Invalid type for an SDP");
    }

    lobby.connections[playerId] = connection;
    lobbies[indexLobby] = lobby;

    console.log(`[LOBBY] SDP ${type.toUpperCase()} updated for player ${playerId} in lobby ${lobbyId}`);

    if (type == "offer" && connection.ice_candidates_host.length > 0 || type == "answer" && connection.ice_candidates_client.length > 0) {
        broadcastLobbies({ updated: lobby, from_id: fromId, to_id: toId })
        console.log("Broadcast after sdp assigned")
    }
}

export function updateLobbyIceCandidateService(lobbyId: string, playerId: string, iceCandidates: IceCandidate[], isHost: boolean) {
    const indexLobby = getLobbyIndexById(lobbyId);
    const lobby = lobbies[indexLobby];
    const connection = getConnection(lobby, playerId);

    let fromId;
    let toId;
    if (isHost) {
        fromId = lobby.host_player.id;
        toId = playerId;
        connection.ice_candidates_host = iceCandidates;
    }
    else {
        fromId = playerId;
        toId = lobby.host_player.id;
        connection.ice_candidates_client = iceCandidates;
    }

    lobby.connections[playerId] = connection;
    lobbies[indexLobby] = lobby;

    console.log(`[LOBBY] Ice candidate ${isHost ? "host" : "client" } updated for player ${playerId} in lobby ${lobbyId}`);

    if (isHost && connection.offer != null && connection.offer != "" || !isHost && connection.answer != null && connection.answer != "") {
        broadcastLobbies({ updated: lobby, from_id: fromId, to_id: toId })
        console.log("Broadcast after ice candidate assigned")
    }
}

export function connectionEstablishedService(lobbyId: string, playerId: string) {
    const indexLobby = getLobbyIndexById(lobbyId);
    const lobby = lobbies[indexLobby];
    const connection = getConnection(lobby, playerId);

    lobby.players.push(connection.player);
    delete lobby.connections[playerId];
    lobbies[indexLobby] = lobby;

    console.log(`The lobby ${lobbyId} has successfully connected the peer ${playerId}`);

    broadcastLobbies({ updated: lobby })
}

function broadcastLobbies(props: LobbyMessage) {
    lobbiesVersion++;

    const message = JSON.stringify({
        type: MessageType.LOBBY_UPDATE,
        payload: {
            ...props,
            lobbies_version: lobbiesVersion
        },
    });

    oldLobbies.splice(0, oldLobbies.length, ...lobbies);

    for (const client of wss.clients) {
        client.send(message);
    }
}

function getLobbyIndexById(lobbyId: string): number {
    const indexLobby = lobbies.findIndex(l => l.id === lobbyId);
    if (indexLobby == -1) throw new HttpError(404, "Lobby id not found");
    return indexLobby;
}

function getConnection(lobby: Lobby, playerId: string): PeerConnectionInfo {
    const conn = lobby.connections[playerId];
    if (!conn) throw new HttpError(400, `Connection not found with the player id ${playerId}`);
    return conn;
}
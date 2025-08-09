import {MessageType} from "../enums/message-type";

export interface WebSocketMessage {
    type: MessageType;
    payload: any;
};

import type { WebSocket } from 'ws';
import type { Awareness } from 'y-protocols/awareness';
import type * as Y from 'yjs';
import type { PermissionRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  docPermissions: Record<string, PermissionRole>;
  iat: number;
  exp: number;
  jti: string;
}

export interface WSAuthClient extends WebSocket {
  userColor: string;
  userName: string;
  userId: string;
  documentId: string;
  isAlive: boolean;
  server?: import('ws').WebSocketServer;
}

export interface YDocInstance {
  doc: Y.Doc;
  awareness: Awareness;
}

export type IncomingWSMessage =
  | { type: 'update'; data: number[] }                   
  | { type: 'awareness'; data: number[] }                
  | { type: 'query-sync'; stateVector: number[] }         
  | { type: 'sync-request'; stateVector: number[] };     

export type OutgoingWSMessage =
  | { type: 'init'; update: number[]; stateVector: number[] }                    
  | { type: 'update'; data: number[] }                                           
  | { type: 'awareness-init'; data: number[] }                                   
  | { type: 'awareness'; data: number[] }                                        
  | { type: 'sync-response'; update: number[]; stateVector?: number[] };        
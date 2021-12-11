import { Response } from 'express';

/***** DATA *****/
export interface Clients {
  [key: number]: Response;
}

export interface ClientNames {
  [key: number]: string;
}

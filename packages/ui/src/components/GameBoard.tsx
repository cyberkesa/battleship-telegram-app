import React from 'react';
// Minimal re-export shim to keep package API stable if this file was truncated.
export const GameBoard: React.FC<any> = (props) => {
  return <div className={props?.className || ''}>{props?.children}</div>;
};
export type GameBoardHandle = unknown;
export type Position = { x: number; y: number };
export type PlacedShip = { id: string; size: number; positions: Position[]; isHorizontal: boolean };

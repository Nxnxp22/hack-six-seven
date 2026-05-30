import axios from 'axios';
import type { GameState, CutResponse } from '../types';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api';

export interface DBManualRule {
  id: number;
  difficulty: string;
  rule_number: number;
  description: string;
}

export const fetchNewGame = async (difficulty?: string): Promise<GameState> => {
  const response = await axios.post(`${API_URL}/game/start`, { difficulty });
  return response.data;
};

export const cutWire = async (sessionId: string, wireId: string): Promise<CutResponse> => {
  const response = await axios.post(`${API_URL}/game/cut-wire`, { sessionId, wireId });
  return response.data;
};

export const fetchManualRules = async (difficulty: string): Promise<DBManualRule[]> => {
  const response = await axios.get(`${API_URL}/game/manual`, { params: { difficulty } });
  return response.data;
};
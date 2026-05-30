import axios from 'axios';
import type { GameState, CutResponse } from '../types';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DBManualRule {
  id: number;
  difficulty: string;
  rule_number: number;
  description: string;
}

export interface DBCriticalTemplate {
  id: number;
  difficulty: string;
  template: string;
}

// ─── Game API ─────────────────────────────────────────────────────────────────

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

// ─── Admin: Decoding Rules CRUD ───────────────────────────────────────────────

export const adminGetAllRules = async (): Promise<DBManualRule[]> => {
  const res = await axios.get(`${API_URL}/admin/rules`);
  return res.data;
};

export const adminCreateRule = async (data: Omit<DBManualRule, 'id'>): Promise<DBManualRule> => {
  const res = await axios.post(`${API_URL}/admin/rules`, data);
  return res.data;
};

export const adminUpdateRule = async (id: number, data: Omit<DBManualRule, 'id'>): Promise<void> => {
  await axios.put(`${API_URL}/admin/rules/${id}`, data);
};

export const adminDeleteRule = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/admin/rules/${id}`);
};

// ─── Admin: Critical Templates CRUD ──────────────────────────────────────────

export const adminGetAllTemplates = async (): Promise<DBCriticalTemplate[]> => {
  const res = await axios.get(`${API_URL}/admin/templates`);
  return res.data;
};

export const adminCreateTemplate = async (data: Omit<DBCriticalTemplate, 'id'>): Promise<DBCriticalTemplate> => {
  const res = await axios.post(`${API_URL}/admin/templates`, data);
  return res.data;
};

export const adminUpdateTemplate = async (id: number, data: Omit<DBCriticalTemplate, 'id'>): Promise<void> => {
  await axios.put(`${API_URL}/admin/templates/${id}`, data);
};

export const adminDeleteTemplate = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/admin/templates/${id}`);
};
import axios from 'axios';
import type { GameState, CutResponse } from '../types';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api';

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

// ─── Game session ─────────────────────────────────────────────────────────────

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

// ─── decoding_rules CRUD ─────────────────────────────────────────────────────

export const fetchAllRules = async (): Promise<DBManualRule[]> => {
  const response = await axios.get(`${API_URL}/game/rules`);
  return response.data;
};

export const fetchRulesByDifficulty = async (difficulty: string): Promise<DBManualRule[]> => {
  const response = await axios.get(`${API_URL}/game/rules/by-difficulty`, {
    params: { difficulty },
  });
  return response.data;
};

export const fetchRuleById = async (id: number): Promise<DBManualRule> => {
  const response = await axios.get(`${API_URL}/game/rules/${id}`);
  return response.data;
};

export const createRule = async (body: {
  difficulty: string;
  rule_number: number;
  description: string;
}): Promise<DBManualRule> => {
  const response = await axios.post(`${API_URL}/game/rules`, body);
  return response.data;
};

export const updateRule = async (
  id: number,
  body: { difficulty: string; rule_number: number; description: string },
): Promise<DBManualRule> => {
  const response = await axios.put(`${API_URL}/game/rules/${id}`, body);
  return response.data;
};

export const deleteRule = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/game/rules/${id}`);
};

// ─── critical_templates CRUD ───────────────────────────────────────────────────

export const fetchAllTemplates = async (): Promise<DBCriticalTemplate[]> => {
  const response = await axios.get(`${API_URL}/game/templates`);
  return response.data;
};

export const fetchTemplateByDifficulty = async (
  difficulty: string,
): Promise<DBCriticalTemplate> => {
  const response = await axios.get(`${API_URL}/game/templates/by-difficulty`, {
    params: { difficulty },
  });
  return response.data;
};

export const fetchTemplateById = async (id: number): Promise<DBCriticalTemplate> => {
  const response = await axios.get(`${API_URL}/game/templates/${id}`);
  return response.data;
};

export const createTemplate = async (body: {
  difficulty: string;
  template: string;
}): Promise<DBCriticalTemplate> => {
  const response = await axios.post(`${API_URL}/game/templates`, body);
  return response.data;
};

export const updateTemplate = async (
  id: number,
  body: { difficulty: string; template: string },
): Promise<DBCriticalTemplate> => {
  const response = await axios.put(`${API_URL}/game/templates/${id}`, body);
  return response.data;
};

export const deleteTemplate = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/game/templates/${id}`);
};

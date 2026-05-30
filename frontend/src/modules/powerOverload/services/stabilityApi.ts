import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface ModuleStabilityItem {
  moduleId: string;
  stability: number;
}

export interface StabilityResponse {
  modules: ModuleStabilityItem[];
}

/** GET /api/stability — fetch current stability % for all modules */
export const fetchStability = async (): Promise<StabilityResponse> => {
  const response = await axios.get(`${API_URL}/stability`);
  return response.data;
};

/** POST /api/stability/apply — add/subtract stability for a module after a game */
export const applyStabilityDelta = async (
  moduleId: string,
  delta: number,
): Promise<ModuleStabilityItem> => {
  const response = await axios.post(`${API_URL}/stability/apply`, { moduleId, delta });
  return response.data;
};

/** POST /api/stability/reset — restart all modules at 100% and coins at 100 */
export const resetAllStability = async (): Promise<void> => {
  await axios.post(`${API_URL}/stability/reset`);
};

// ─── Coins ────────────────────────────────────────────────────────────────────

export interface CoinsResponse {
  balance: number;
}

/** GET /api/stability/coins — returns { balance } */
export const fetchCoins = async (): Promise<CoinsResponse> => {
  const response = await axios.get(`${API_URL}/stability/coins`);
  return response.data;
};

/** POST /api/stability/coins/apply — body: { delta } (positive=earn, negative=spend) */
export const applyCoins = async (delta: number): Promise<CoinsResponse> => {
  const response = await axios.post(`${API_URL}/stability/coins/apply`, { delta });
  return response.data;
};

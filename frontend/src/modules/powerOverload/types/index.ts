export type WireColor = 'GREEN' | 'YELLOW' | 'CYAN' | 'RED' | 'BLUE' | 'ORANGE' | 'PURPLE';

export interface Wire {
    id: string;
    color: WireColor;
    label: string;
    isCut?: boolean;
}

export interface GameState {
    sessionId: string;
    serialNumber:string;
    instruction: string;
    totalCutsNeeded: number;
    currentCuts: number;
    timeLimitSeconds: number;
    wires: Wire[];    
}

export interface CutResponse {
    success: boolean;
    currentCuts: number;
    isGameOver: boolean;
    message: string;
}
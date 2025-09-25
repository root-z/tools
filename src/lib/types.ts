export interface Activity {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  isActive: boolean;
}

export type Activities = Activity[];

export interface HoleInfo {
  number: number;
  par: number;
}

export interface PlayerScore {
  id: string;
  name: string;
  strokes: number[];
}

export interface Scorecard {
  courseName: string;
  holes: HoleInfo[];
  players: PlayerScore[];
}

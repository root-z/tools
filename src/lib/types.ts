export interface Activity {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  isActive: boolean;
}

export type Activities = Activity[];

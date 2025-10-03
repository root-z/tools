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

export interface MortgageInput {
  principal: number;
  annualInterestRate: number;
  termYears: number;
  extraMonthlyPayment?: number;
}

export interface AmortizationRow {
  month: number;
  interestPaid: number;
  principalPaid: number;
  extraPayment: number;
  totalPayment: number;
  remainingBalance: number;
}

export interface MortgageSummary {
  monthlyPayment: number;
  extraMonthlyPayment: number;
  payoffMonths: number;
  totalInterest: number;
  totalPaid: number;
  baselineMonths: number;
  interestSaved: number;
  schedule: AmortizationRow[];
}

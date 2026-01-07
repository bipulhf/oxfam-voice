export type SessionStatus = "IN_PROGRESS" | "COMPLETED" | "FAILED";
export type TaskType = "MERGE_AUDIO" | "TRANSCRIBE";
export type TaskStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface RespondentData {
  name?: string;
  fatherName?: string;
  motherName?: string;
  district?: string;
  upazila?: string;
  union?: string;
  village?: string;
  profession?: string;
  incidentType?: string;
  incidentYear?: number;
  incidentMonth?: string;
  lossAmount?: number;
  additionalInfo?: string;
}

export interface SessionResponse {
  id: string;
  sessionCode: string;
  status: SessionStatus;
  createdAt: Date;
  completedAt?: Date;
  respondent?: RespondentData;
}

export interface StatsResponse {
  totalResponses: number;
  totalLossAmount: number;
  averageLossAmount: number;
  pendingSessions: number;
  districtDistribution: { district: string; count: number }[];
  incidentTypeDistribution: { type: string; count: number }[];
  yearlyTrends: { year: number; count: number }[];
  lossDistribution: { range: string; count: number }[];
}

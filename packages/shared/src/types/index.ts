export * from "../schemas/common.js";
export * from "../schemas/planner.js";
export * from "../schemas/performer.js";
export * from "../schemas/crew.js";
export * from "../schemas/requirement.js";
export * from "../schemas/steps.js";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface RequirementStats {
  total: number;
  byCategory: {
    planner: number;
    performer: number;
    crew: number;
  };
  totalEstimatedBudget: number;
  urgentCount: number;
}

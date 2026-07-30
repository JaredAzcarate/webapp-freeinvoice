/**
 * Types for settings API requests and responses
 */

export interface LoginMethods {
  hasPassword: boolean;
  hasGoogle: boolean;
}

export interface BillingSettingsResponse {
  hourlyRate: number | null;
  digestEmail: string | null;
  excludedProjects: string[];
}

export interface UpdateBillingSettingsRequest {
  hourlyRate?: number | null;
  digestEmail?: string | null;
  excludedProjects?: string[];
}

export interface ProjectOptionsResponse {
  projects: string[];
}

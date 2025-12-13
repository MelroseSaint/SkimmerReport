/**
 * AI Utilities Module
 * 
 * This module contains optional AI-powered utilities for:
 * - Spam detection
 * - Brigading detection  
 * - Text classification
 * - Confidence scoring
 * 
 * IMPORTANT: Per the PRD, AI is advisory only.
 * The app must function fully if AI is disabled.
 * AI outputs never block submissions outright — only down-rank influence.
 */

export interface AIConfig {
    enabled: boolean;
    // Future: API keys, model settings, etc.
}

export const defaultAIConfig: AIConfig = {
    enabled: false, // AI disabled by default
};

/**
 * Placeholder for spam detection
 * Returns confidence score 0-1 (1 = likely spam)
 */
export async function detectSpam(_text: string): Promise<number> {
    // TODO: Implement AI-based spam detection
    return 0; // Assume not spam by default
}

/**
 * Placeholder for text classification
 * Returns category confidence scores
 */
export async function classifyText(_text: string): Promise<Record<string, number>> {
    // TODO: Implement AI-based classification
    return {};
}

export const RATING_KEYS = ['mid', 'three', 'finish', 'dunk', 'dribble', 'pass', 'athleticism', 'defense', 'leadership'] as const;
export type RatingKey = typeof RATING_KEYS[number];
export type Ratings = Record<RatingKey, number>;

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export const HOT_STREAK = 3;
export const HOT_GREEN_FACTOR = 1.5;
export interface HotState { streak: number; onFire: boolean }
export const HOT_START: HotState = { streak: 0, onFire: false };

export function nextHot(s: HotState, made: boolean): HotState {
  if (!made) return HOT_START;
  const streak = s.streak + 1;
  return { streak, onFire: streak >= HOT_STREAK };
}

export function hotGreenZone(greenZone: number, onFire: boolean): number {
  return greenZone * (onFire ? HOT_GREEN_FACTOR : 1);
}

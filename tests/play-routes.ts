import type { Option, Play } from '../src/play/types';

export function playRoutes(play: Play, segment = play.start, depth = 3): Option[][] {
  return (play.segments[segment].options ?? []).flatMap(option => {
    if (depth > 0 && option.kind === 'pass' && !option.lob && option.next) {
      return playRoutes(play, option.next, depth - 1).map(rest => [option, ...rest]);
    }
    return [[option]];
  });
}

export function routeTo(play: Play, target: string, segment = play.start, seen: string[] = []): Option[] | undefined {
  if (segment === target) return [];
  if (seen.includes(segment)) return undefined;
  for (const option of play.segments[segment].options ?? []) {
    if (option.kind !== 'pass' || !option.next) continue;
    if (option.next === target) return [option];
    if (option.lob) continue;
    const rest = routeTo(play, target, option.next, [...seen, segment]);
    if (rest) return [option, ...rest];
  }
  return undefined;
}

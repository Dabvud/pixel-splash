import type { Play } from '../types';

export const HANDOFF: Play = {
  id: 'handoff', name: 'Handoff (DHO)', clockS: 12, deficit: 2,
  actors: ['r3', 'r11', 'r23', 'r32', 'r50', 'b1', 'b7', 'b15', 'b21', 'b44'],
  start: 'setup',
  segments: {
    setup: {
      id: 'setup', handler: 'r50',
      paths: {
        r50: [{ t: 0, x: 1.8, z: 4.2, act: 'dribble' }, { t: 1.3, x: 2.3, z: 4.3, act: 'dribble' }, { t: 2.8, x: 2, z: 4.2, act: 'screen' }],
        r3: [{ t: 0, x: -0.8, z: 7.2, act: 'run' }, { t: 1.3, x: 1, z: 5.8, act: 'run' }, { t: 2.8, x: 2.5, z: 4.5, act: 'run' }],
        r11: [{ t: 0, x: 5.8, z: 6, act: 'run' }, { t: 1.3, x: 4.7, z: 5.1, act: 'run' }, { t: 2.8, x: 2.7, z: 4.1, act: 'run' }],
        r23: [{ t: 0, x: -5.5, z: 3, act: 'run' }, { t: 1.3, x: -6.6, z: 1.5, act: 'run' }, { t: 2.8, x: -6.9, z: 0.5, act: 'run' }],
        r32: [{ t: 0, x: -1, z: 1, act: 'run' }, { t: 1.3, x: 0, z: 1.1, act: 'run' }, { t: 2.8, x: -1.4, z: 1.3, act: 'run' }]
      },
      decisionAt: 2.8,
      options: [{ kind: 'pass', to: 'r3', next: 'guard_left' }, { kind: 'pass', to: 'r11', next: 'guard_right' }]
    },
    guard_left: {
      id: 'guard_left', handler: 'r3',
      paths: {
        r50: [{ t: 0, x: 2, z: 4.2, act: 'run' }, { t: 2.6, x: 0.8, z: 1.7, act: 'run' }],
        r3: [{ t: 0, x: 2.5, z: 4.5, act: 'dribble' }, { t: 1.3, x: -1.1, z: 6.5, act: 'dribble' }, { t: 2.6, x: -4.9, z: 5.2, act: 'dribble' }],
        r11: [{ t: 0, x: 2.7, z: 4.1, act: 'run' }, { t: 2.6, x: 2.2, z: 4.6, act: 'run' }],
        r23: [{ t: 0, x: -6.9, z: 0.5, act: 'run' }, { t: 2.6, x: -6.4, z: 1, act: 'run' }],
        r32: [{ t: 0, x: -1.4, z: 1.3, act: 'run' }, { t: 2.6, x: -0.9, z: 1.8, act: 'run' }]
      },
      decisionAt: 2.6,
      options: [{ kind: 'drive' }, { kind: 'shoot' }, { kind: 'pass', to: 'r50', next: 'pocket_left' }]
    },
    guard_right: {
      id: 'guard_right', handler: 'r11',
      paths: {
        r50: [{ t: 0, x: 2, z: 4.2, act: 'run' }, { t: 2.6, x: 1, z: 1.6, act: 'run' }],
        r3: [{ t: 0, x: 2.5, z: 4.5, act: 'run' }, { t: 2.6, x: 2, z: 5, act: 'run' }],
        r11: [{ t: 0, x: 2.7, z: 4.1, act: 'dribble' }, { t: 2.6, x: -3.8, z: 6.1, act: 'dribble' }],
        r23: [{ t: 0, x: -6.9, z: 0.5, act: 'run' }, { t: 2.6, x: -6.4, z: 1, act: 'run' }],
        r32: [{ t: 0, x: -1.4, z: 1.3, act: 'run' }, { t: 2.6, x: -0.9, z: 1.8, act: 'run' }]
      },
      decisionAt: 2.6,
      options: [{ kind: 'drive' }, { kind: 'shoot' }, { kind: 'pass', to: 'r50', next: 'pocket_right' }]
    },
    pocket_left: {
      id: 'pocket_left', handler: 'r50',
      paths: {
        r50: [{ t: 0, x: 0.8, z: 1.7, act: 'dribble' }, { t: 2.6, x: -0.8, z: 1.3, act: 'dribble' }],
        r3: [{ t: 0, x: -4.9, z: 5.2, act: 'run' }, { t: 2.6, x: 3.3, z: 6.3, act: 'run' }],
        r11: [{ t: 0, x: 2.2, z: 4.6, act: 'run' }, { t: 2.6, x: 1.7, z: 5.1, act: 'run' }],
        r23: [{ t: 0, x: -6.4, z: 1, act: 'run' }, { t: 2.6, x: -5.9, z: 1.5, act: 'run' }],
        r32: [{ t: 0, x: -0.9, z: 1.8, act: 'run' }, { t: 2.6, x: -0.4, z: 2.3, act: 'run' }]
      },
      decisionAt: 2.6,
      options: [{ kind: 'shoot' }, { kind: 'drive' }]
    },
    pocket_right: {
      id: 'pocket_right', handler: 'r50',
      paths: {
        r50: [{ t: 0, x: 1, z: 1.6, act: 'dribble' }, { t: 2.6, x: -0.6, z: 1.2, act: 'dribble' }],
        r3: [{ t: 0, x: 2, z: 5, act: 'run' }, { t: 2.6, x: 1.5, z: 5.5, act: 'run' }],
        r11: [{ t: 0, x: -3.8, z: 6.1, act: 'run' }, { t: 2.6, x: 4.3, z: 5.7, act: 'run' }],
        r23: [{ t: 0, x: -6.4, z: 1, act: 'run' }, { t: 2.6, x: -5.9, z: 1.5, act: 'run' }],
        r32: [{ t: 0, x: -0.9, z: 1.8, act: 'run' }, { t: 2.6, x: -0.4, z: 2.3, act: 'run' }]
      },
      decisionAt: 2.6,
      options: [{ kind: 'shoot' }, { kind: 'drive' }]
    }
  },
  variants: [
    {
      id: 'trail', weight: 3,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -0.5, z: 6.5, act: 'defend' }, { t: 1.3, x: 0.5, z: 6, act: 'defend' }, { t: 2.8, x: 1.3, z: 5.3, act: 'defend' }],
          b7: [{ t: 0, x: 5.3, z: 5.5, act: 'defend' }, { t: 1.3, x: 4.5, z: 5.4, act: 'defend' }, { t: 2.8, x: 3.8, z: 4.8, act: 'defend' }],
          b15: [{ t: 0, x: -5, z: 2.5, act: 'defend' }, { t: 1.3, x: -6, z: 1.3, act: 'defend' }, { t: 2.8, x: -6.3, z: 0.5, act: 'defend' }],
          b21: [{ t: 0, x: -0.7, z: 1, act: 'defend' }, { t: 1.3, x: 0, z: 0.8, act: 'defend' }, { t: 2.8, x: -1, z: 1, act: 'defend' }],
          b44: [{ t: 0, x: 1.5, z: 3.6, act: 'defend' }, { t: 1.3, x: 1.7, z: 3.2, act: 'defend' }, { t: 2.8, x: 1, z: 2.3, act: 'defend' }]
        },
        guard_left: {
          b1: [{ t: 0, x: 1.3, z: 5.3, act: 'defend' }, { t: 2.6, x: -4.41, z: 4.55, act: 'defend' }],
          b7: [{ t: 0, x: 3.8, z: 4.8, act: 'defend' }, { t: 2.6, x: 1.98, z: 3.95, act: 'defend' }],
          b15: [{ t: 0, x: -6.3, z: 0.5, act: 'defend' }, { t: 2.6, x: -5.76, z: 0.4, act: 'defend' }],
          b21: [{ t: 0, x: -1, z: 1, act: 'defend' }, { t: 2.6, x: -0.81, z: 1.15, act: 'defend' }],
          b44: [{ t: 0, x: 1, z: 2.3, act: 'defend' }, { t: 2.6, x: 0.72, z: 1.05, act: 'defend' }]
        },
        guard_right: {
          b1: [{ t: 0, x: 1.3, z: 5.3, act: 'defend' }, { t: 2.6, x: 1.8, z: 4.35, act: 'defend' }],
          b7: [{ t: 0, x: 3.8, z: 4.8, act: 'defend' }, { t: 2.6, x: -3.42, z: 5.45, act: 'defend' }],
          b15: [{ t: 0, x: -6.3, z: 0.5, act: 'defend' }, { t: 2.6, x: -5.76, z: 0.4, act: 'defend' }],
          b21: [{ t: 0, x: -1, z: 1, act: 'defend' }, { t: 2.6, x: -0.81, z: 1.15, act: 'defend' }],
          b44: [{ t: 0, x: 1, z: 2.3, act: 'defend' }, { t: 2.6, x: 0.9, z: 0.95, act: 'defend' }]
        },
        pocket_left: {
          b1: [{ t: 0, x: -4.41, z: 4.55, act: 'defend' }, { t: 2.6, x: 2.97, z: 5.65, act: 'defend' }],
          b7: [{ t: 0, x: 1.98, z: 3.95, act: 'defend' }, { t: 2.6, x: 1.53, z: 4.45, act: 'defend' }],
          b15: [{ t: 0, x: -5.76, z: 0.4, act: 'defend' }, { t: 2.6, x: -5.31, z: 0.85, act: 'defend' }],
          b21: [{ t: 0, x: -0.81, z: 1.15, act: 'defend' }, { t: 2.6, x: -0.36, z: 1.65, act: 'defend' }],
          b44: [{ t: 0, x: 0.72, z: 1.05, act: 'defend' }, { t: 2.6, x: -0.72, z: 0.65, act: 'defend' }]
        },
        pocket_right: {
          b1: [{ t: 0, x: 1.8, z: 4.35, act: 'defend' }, { t: 2.6, x: 1.35, z: 4.85, act: 'defend' }],
          b7: [{ t: 0, x: -3.42, z: 5.45, act: 'defend' }, { t: 2.6, x: 3.87, z: 5.05, act: 'defend' }],
          b15: [{ t: 0, x: -5.76, z: 0.4, act: 'defend' }, { t: 2.6, x: -5.31, z: 0.85, act: 'defend' }],
          b21: [{ t: 0, x: -0.81, z: 1.15, act: 'defend' }, { t: 2.6, x: -0.36, z: 1.65, act: 'defend' }],
          b44: [{ t: 0, x: 0.9, z: 0.95, act: 'defend' }, { t: 2.6, x: -0.54, z: 0.55, act: 'defend' }]
        }
      }
    },
    {
      id: 'switch', weight: 2,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -0.5, z: 6.5, act: 'defend' }, { t: 1.3, x: 0.5, z: 5.5, act: 'defend' }, { t: 2.8, x: 1.4, z: 3.7, act: 'defend' }],
          b7: [{ t: 0, x: 5.3, z: 5.5, act: 'defend' }, { t: 1.3, x: 4.1, z: 4.7, act: 'defend' }, { t: 2.8, x: 2, z: 3.4, act: 'defend' }],
          b15: [{ t: 0, x: -5, z: 2.5, act: 'defend' }, { t: 1.3, x: -6, z: 1.3, act: 'defend' }, { t: 2.8, x: -6.3, z: 0.5, act: 'defend' }],
          b21: [{ t: 0, x: -0.7, z: 1, act: 'defend' }, { t: 1.3, x: 0, z: 0.8, act: 'defend' }, { t: 2.8, x: -1, z: 1, act: 'defend' }],
          b44: [{ t: 0, x: 1.5, z: 3.6, act: 'defend' }, { t: 1.3, x: 2, z: 4, act: 'defend' }, { t: 2.8, x: 2.6, z: 4.3, act: 'defend' }]
        },
        guard_left: {
          b1: [{ t: 0, x: 1.4, z: 3.7, act: 'defend' }, { t: 2.6, x: -4.41, z: 4.55, act: 'defend' }],
          b7: [{ t: 0, x: 2, z: 3.4, act: 'defend' }, { t: 2.6, x: 1.98, z: 3.95, act: 'defend' }],
          b15: [{ t: 0, x: -6.3, z: 0.5, act: 'defend' }, { t: 2.6, x: -5.76, z: 0.4, act: 'defend' }],
          b21: [{ t: 0, x: -1, z: 1, act: 'defend' }, { t: 2.6, x: -0.81, z: 1.15, act: 'defend' }],
          b44: [{ t: 0, x: 2.6, z: 4.3, act: 'defend' }, { t: 2.6, x: 0.72, z: 1.05, act: 'defend' }]
        },
        guard_right: {
          b1: [{ t: 0, x: 1.4, z: 3.7, act: 'defend' }, { t: 2.6, x: 1.8, z: 4.35, act: 'defend' }],
          b7: [{ t: 0, x: 2, z: 3.4, act: 'defend' }, { t: 2.6, x: -3.42, z: 5.45, act: 'defend' }],
          b15: [{ t: 0, x: -6.3, z: 0.5, act: 'defend' }, { t: 2.6, x: -5.76, z: 0.4, act: 'defend' }],
          b21: [{ t: 0, x: -1, z: 1, act: 'defend' }, { t: 2.6, x: -0.81, z: 1.15, act: 'defend' }],
          b44: [{ t: 0, x: 2.6, z: 4.3, act: 'defend' }, { t: 2.6, x: 0.9, z: 0.95, act: 'defend' }]
        },
        pocket_left: {
          b1: [{ t: 0, x: -4.41, z: 4.55, act: 'defend' }, { t: 2.6, x: 2.97, z: 5.65, act: 'defend' }],
          b7: [{ t: 0, x: 1.98, z: 3.95, act: 'defend' }, { t: 2.6, x: 1.53, z: 4.45, act: 'defend' }],
          b15: [{ t: 0, x: -5.76, z: 0.4, act: 'defend' }, { t: 2.6, x: -5.31, z: 0.85, act: 'defend' }],
          b21: [{ t: 0, x: -0.81, z: 1.15, act: 'defend' }, { t: 2.6, x: -0.36, z: 1.65, act: 'defend' }],
          b44: [{ t: 0, x: 0.72, z: 1.05, act: 'defend' }, { t: 2.6, x: -0.72, z: 0.65, act: 'defend' }]
        },
        pocket_right: {
          b1: [{ t: 0, x: 1.8, z: 4.35, act: 'defend' }, { t: 2.6, x: 1.35, z: 4.85, act: 'defend' }],
          b7: [{ t: 0, x: -3.42, z: 5.45, act: 'defend' }, { t: 2.6, x: 3.87, z: 5.05, act: 'defend' }],
          b15: [{ t: 0, x: -5.76, z: 0.4, act: 'defend' }, { t: 2.6, x: -5.31, z: 0.85, act: 'defend' }],
          b21: [{ t: 0, x: -0.81, z: 1.15, act: 'defend' }, { t: 2.6, x: -0.36, z: 1.65, act: 'defend' }],
          b44: [{ t: 0, x: 0.9, z: 0.95, act: 'defend' }, { t: 2.6, x: -0.54, z: 0.55, act: 'defend' }]
        }
      }
    },
    {
      id: 'blitz', weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -0.5, z: 6.5, act: 'defend' }, { t: 1.3, x: 0.8, z: 5.6, act: 'defend' }, { t: 2.8, x: 2.2, z: 4.9, act: 'defend' }],
          b7: [{ t: 0, x: 5.3, z: 5.5, act: 'defend' }, { t: 1.3, x: 4.1, z: 4.7, act: 'defend' }, { t: 2.8, x: 3.2, z: 4.4, act: 'defend' }],
          b15: [{ t: 0, x: -5, z: 2.5, act: 'defend' }, { t: 1.3, x: -6, z: 1.3, act: 'defend' }, { t: 2.8, x: -6.3, z: 0.5, act: 'defend' }],
          b21: [{ t: 0, x: -0.7, z: 1, act: 'defend' }, { t: 1.3, x: 0, z: 0.8, act: 'defend' }, { t: 2.8, x: -1, z: 1, act: 'defend' }],
          b44: [{ t: 0, x: 1.5, z: 3.6, act: 'defend' }, { t: 1.3, x: 2, z: 4, act: 'defend' }, { t: 2.8, x: 2.5, z: 3.8, act: 'defend' }]
        },
        guard_left: {
          b1: [{ t: 0, x: 2.2, z: 4.9, act: 'defend' }, { t: 2.6, x: -4.41, z: 4.55, act: 'defend' }],
          b7: [{ t: 0, x: 3.2, z: 4.4, act: 'defend' }, { t: 2.6, x: 1.98, z: 3.95, act: 'defend' }],
          b15: [{ t: 0, x: -6.3, z: 0.5, act: 'defend' }, { t: 2.6, x: -5.76, z: 0.4, act: 'defend' }],
          b21: [{ t: 0, x: -1, z: 1, act: 'defend' }, { t: 2.6, x: -0.81, z: 1.15, act: 'defend' }],
          b44: [{ t: 0, x: 2.5, z: 3.8, act: 'defend' }, { t: 2.6, x: 0.72, z: 1.05, act: 'defend' }]
        },
        guard_right: {
          b1: [{ t: 0, x: 2.2, z: 4.9, act: 'defend' }, { t: 2.6, x: 1.8, z: 4.35, act: 'defend' }],
          b7: [{ t: 0, x: 3.2, z: 4.4, act: 'defend' }, { t: 2.6, x: -3.42, z: 5.45, act: 'defend' }],
          b15: [{ t: 0, x: -6.3, z: 0.5, act: 'defend' }, { t: 2.6, x: -5.76, z: 0.4, act: 'defend' }],
          b21: [{ t: 0, x: -1, z: 1, act: 'defend' }, { t: 2.6, x: -0.81, z: 1.15, act: 'defend' }],
          b44: [{ t: 0, x: 2.5, z: 3.8, act: 'defend' }, { t: 2.6, x: 0.9, z: 0.95, act: 'defend' }]
        },
        pocket_left: {
          b1: [{ t: 0, x: -4.41, z: 4.55, act: 'defend' }, { t: 2.6, x: 2.97, z: 5.65, act: 'defend' }],
          b7: [{ t: 0, x: 1.98, z: 3.95, act: 'defend' }, { t: 2.6, x: 1.53, z: 4.45, act: 'defend' }],
          b15: [{ t: 0, x: -5.76, z: 0.4, act: 'defend' }, { t: 2.6, x: -5.31, z: 0.85, act: 'defend' }],
          b21: [{ t: 0, x: -0.81, z: 1.15, act: 'defend' }, { t: 2.6, x: -0.36, z: 1.65, act: 'defend' }],
          b44: [{ t: 0, x: 0.72, z: 1.05, act: 'defend' }, { t: 2.6, x: -0.72, z: 0.65, act: 'defend' }]
        },
        pocket_right: {
          b1: [{ t: 0, x: 1.8, z: 4.35, act: 'defend' }, { t: 2.6, x: 1.35, z: 4.85, act: 'defend' }],
          b7: [{ t: 0, x: -3.42, z: 5.45, act: 'defend' }, { t: 2.6, x: 3.87, z: 5.05, act: 'defend' }],
          b15: [{ t: 0, x: -5.76, z: 0.4, act: 'defend' }, { t: 2.6, x: -5.31, z: 0.85, act: 'defend' }],
          b21: [{ t: 0, x: -0.81, z: 1.15, act: 'defend' }, { t: 2.6, x: -0.36, z: 1.65, act: 'defend' }],
          b44: [{ t: 0, x: 0.9, z: 0.95, act: 'defend' }, { t: 2.6, x: -0.54, z: 0.55, act: 'defend' }]
        }
      }
    }
  ]
};


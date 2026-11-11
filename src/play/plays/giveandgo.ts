import type { Play } from '../types';

// Die Flügelseite trennt normalen Rückpass und Lob ohne doppelte Passziele.
export const GIVEANDGO: Play = {
  id: 'giveandgo', name: 'Give-and-Go', clockS: 14, deficit: 2,
  actors: ['r3', 'r11', 'r23', 'r32', 'r50', 'b1', 'b7', 'b15', 'b21', 'b44'],
  start: 'setup',
  segments: {
    setup: {
      id: 'setup', handler: 'r3',
      paths: {
        r3: [{ t: 0, x: 0, z: 7.8, act: 'dribble' }, { t: 1.3, x: 0.5, z: 6.8, act: 'dribble' }, { t: 2.8, x: 0, z: 6.2, act: 'dribble' }],
        r23: [{ t: 0, x: -5.5, z: 5, act: 'run' }, { t: 1.3, x: -4.5, z: 4.6, act: 'run' }, { t: 2.8, x: -4, z: 4.4, act: 'run' }],
        r32: [{ t: 0, x: 5.7, z: 4.8, act: 'run' }, { t: 1.3, x: 5.2, z: 4.6, act: 'run' }, { t: 2.8, x: 4.4, z: 4.4, act: 'run' }],
        r11: [{ t: 0, x: -6.8, z: 0.5, act: 'run' }, { t: 1.3, x: -6.9, z: 0.8, act: 'run' }, { t: 2.8, x: -6.9, z: 1, act: 'run' }],
        r50: [{ t: 0, x: 1.8, z: 1.3, act: 'run' }, { t: 1.3, x: 1.4, z: 1.4, act: 'run' }, { t: 2.8, x: 1.7, z: 1.2, act: 'run' }]
      },
      decisionAt: 2.8,
      options: [{ kind: 'pass', to: 'r23', next: 'left_wing' }, { kind: 'pass', to: 'r32', next: 'right_wing' }]
    },
    left_wing: {
      id: 'left_wing', handler: 'r23',
      paths: {
        r3: [{ t: 0, x: 0, z: 6.2, act: 'run' }, { t: 2.6, x: -0.6, z: 1.1, act: 'run' }],
        r23: [{ t: 0, x: -4, z: 4.4, act: 'dribble' }, { t: 1.3, x: -0.8, z: 6.6, act: 'dribble' }, { t: 2.6, x: 3, z: 6, act: 'dribble' }],
        r32: [{ t: 0, x: 4.4, z: 4.4, act: 'run' }, { t: 2.6, x: 3.9, z: 4.9, act: 'run' }],
        r11: [{ t: 0, x: -6.9, z: 1, act: 'run' }, { t: 2.6, x: -6.4, z: 1.5, act: 'run' }],
        r50: [{ t: 0, x: 1.7, z: 1.2, act: 'run' }, { t: 2.6, x: 1.2, z: 1.7, act: 'run' }]
      },
      decisionAt: 2.6,
      options: [{ kind: 'shoot' }, { kind: 'drive' }, { kind: 'pass', to: 'r3', next: 'return_finish' }]
    },
    right_wing: {
      id: 'right_wing', handler: 'r32',
      paths: {
        r3: [{ t: 0, x: 0, z: 6.2, act: 'run' }, { t: 2.6, x: 0.6, z: 1.1, act: 'run' }],
        r23: [{ t: 0, x: -4, z: 4.4, act: 'run' }, { t: 2.6, x: -3.5, z: 4.9, act: 'run' }],
        r32: [{ t: 0, x: 4.4, z: 4.4, act: 'dribble' }, { t: 1.3, x: 1.2, z: 6.8, act: 'dribble' }, { t: 2.6, x: -2.8, z: 6.5, act: 'dribble' }],
        r11: [{ t: 0, x: -6.9, z: 1, act: 'run' }, { t: 2.6, x: -6.4, z: 1.5, act: 'run' }],
        r50: [{ t: 0, x: 1.7, z: 1.2, act: 'run' }, { t: 2.6, x: 1.2, z: 1.7, act: 'run' }]
      },
      decisionAt: 2.6,
      options: [{ kind: 'shoot' }, { kind: 'drive' }, { kind: 'pass', to: 'r3', next: 'lob_return', lob: true }]
    },
    return_finish: {
      id: 'return_finish', handler: 'r3',
      paths: {
        r3: [{ t: 0, x: -0.6, z: 1.1, act: 'dribble' }, { t: 2.6, x: 1, z: 1.3, act: 'dribble' }],
        r23: [{ t: 0, x: 3, z: 6, act: 'run' }, { t: 2.6, x: -4.3, z: 5.8, act: 'run' }],
        r32: [{ t: 0, x: 3.9, z: 4.9, act: 'run' }, { t: 2.6, x: 3.4, z: 5.4, act: 'run' }],
        r11: [{ t: 0, x: -6.4, z: 1.5, act: 'run' }, { t: 2.6, x: -5.9, z: 2, act: 'run' }],
        r50: [{ t: 0, x: 1.2, z: 1.7, act: 'run' }, { t: 2.6, x: 0.7, z: 2.2, act: 'run' }]
      },
      decisionAt: 2.6,
      options: [{ kind: 'shoot' }, { kind: 'drive' }, { kind: 'pass', to: 'r11', next: 'extra_pass' }]
    },
    lob_return: {
      id: 'lob_return', handler: 'r3',
      paths: {
        r3: [{ t: 0, x: 0.6, z: 1.1, act: 'dribble' }, { t: 2.6, x: -1, z: 1.3, act: 'dribble' }],
        r23: [{ t: 0, x: -3.5, z: 4.9, act: 'run' }, { t: 2.6, x: -3, z: 5.4, act: 'run' }],
        r32: [{ t: 0, x: -2.8, z: 6.5, act: 'run' }, { t: 2.6, x: 5, z: 5.3, act: 'run' }],
        r11: [{ t: 0, x: -6.4, z: 1.5, act: 'run' }, { t: 2.6, x: -5.9, z: 2, act: 'run' }],
        r50: [{ t: 0, x: 1.2, z: 1.7, act: 'run' }, { t: 2.6, x: 0.7, z: 2.2, act: 'run' }]
      },
      decisionAt: 2.6,
      options: [{ kind: 'shoot' }, { kind: 'drive' }]
    },
    extra_pass: {
      id: 'extra_pass', handler: 'r11',
      paths: {
        r3: [{ t: 0, x: 1, z: 1.3, act: 'run' }, { t: 2.6, x: 0.5, z: 1.8, act: 'run' }],
        r23: [{ t: 0, x: -4.3, z: 5.8, act: 'run' }, { t: 2.6, x: -3.8, z: 6.3, act: 'run' }],
        r32: [{ t: 0, x: 3.4, z: 5.4, act: 'run' }, { t: 2.6, x: 2.9, z: 5.9, act: 'run' }],
        r11: [{ t: 0, x: -5.9, z: 2, act: 'dribble' }, { t: 2.6, x: -6.9, z: 3, act: 'dribble' }],
        r50: [{ t: 0, x: 0.7, z: 2.2, act: 'run' }, { t: 2.6, x: 0.2, z: 2.7, act: 'run' }]
      },
      decisionAt: 2.6,
      options: [{ kind: 'shoot' }, { kind: 'drive' }]
    }
  },
  variants: [
    {
      id: 'ball_watch', weight: 3,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0, z: 7.1, act: 'defend' }, { t: 1.3, x: 0.4, z: 6.1, act: 'defend' }, { t: 2.8, x: 0, z: 5.6, act: 'defend' }],
          b7: [{ t: 0, x: -6.2, z: 0.5, act: 'defend' }, { t: 1.3, x: -6.2, z: 0.8, act: 'defend' }, { t: 2.8, x: -6.2, z: 1, act: 'defend' }],
          b15: [{ t: 0, x: -5, z: 4.5, act: 'defend' }, { t: 1.3, x: -4, z: 4, act: 'defend' }, { t: 2.8, x: -3.5, z: 3.8, act: 'defend' }],
          b21: [{ t: 0, x: 5.1, z: 4.4, act: 'defend' }, { t: 1.3, x: 4.7, z: 4, act: 'defend' }, { t: 2.8, x: 3.8, z: 3.8, act: 'defend' }],
          b44: [{ t: 0, x: 1.3, z: 1, act: 'defend' }, { t: 1.3, x: 1, z: 1, act: 'defend' }, { t: 2.8, x: 1.2, z: 0.8, act: 'defend' }]
        },
        left_wing: {
          b1: [{ t: 0, x: 0, z: 5.6, act: 'defend' }, { t: 2.6, x: 1.4, z: 5.7, act: 'defend' }],
          b7: [{ t: 0, x: -6.2, z: 1, act: 'defend' }, { t: 2.6, x: -5.76, z: 0.85, act: 'defend' }],
          b15: [{ t: 0, x: -3.5, z: 3.8, act: 'defend' }, { t: 2.6, x: 2.7, z: 5.35, act: 'defend' }],
          b21: [{ t: 0, x: 3.8, z: 3.8, act: 'defend' }, { t: 2.6, x: 3.51, z: 4.25, act: 'defend' }],
          b44: [{ t: 0, x: 1.2, z: 0.8, act: 'defend' }, { t: 2.6, x: 1.08, z: 1.05, act: 'defend' }]
        },
        right_wing: {
          b1: [{ t: 0, x: 0, z: 5.6, act: 'defend' }, { t: 2.6, x: -1.2, z: 6.1, act: 'defend' }],
          b7: [{ t: 0, x: -6.2, z: 1, act: 'defend' }, { t: 2.6, x: -5.76, z: 0.85, act: 'defend' }],
          b15: [{ t: 0, x: -3.5, z: 3.8, act: 'defend' }, { t: 2.6, x: -3.15, z: 4.25, act: 'defend' }],
          b21: [{ t: 0, x: 3.8, z: 3.8, act: 'defend' }, { t: 2.6, x: -2.52, z: 5.85, act: 'defend' }],
          b44: [{ t: 0, x: 1.2, z: 0.8, act: 'defend' }, { t: 2.6, x: 1.08, z: 1.05, act: 'defend' }]
        },
        return_finish: {
          b1: [{ t: 0, x: -0.54, z: 0.45, act: 'defend' }, { t: 2.6, x: 0.9, z: 0.65, act: 'defend' }],
          b7: [{ t: 0, x: -5.76, z: 0.85, act: 'defend' }, { t: 2.6, x: -5.31, z: 1.35, act: 'defend' }],
          b15: [{ t: 0, x: 2.7, z: 5.35, act: 'defend' }, { t: 2.6, x: -3.87, z: 5.15, act: 'defend' }],
          b21: [{ t: 0, x: 3.51, z: 4.25, act: 'defend' }, { t: 2.6, x: 3.06, z: 4.75, act: 'defend' }],
          b44: [{ t: 0, x: 1.08, z: 1.05, act: 'defend' }, { t: 2.6, x: 0.63, z: 1.55, act: 'defend' }]
        },
        lob_return: {
          b1: [{ t: 0, x: 0.54, z: 0.45, act: 'defend' }, { t: 2.6, x: -0.9, z: 0.65, act: 'defend' }],
          b7: [{ t: 0, x: -5.76, z: 0.85, act: 'defend' }, { t: 2.6, x: -5.31, z: 1.35, act: 'defend' }],
          b15: [{ t: 0, x: -3.15, z: 4.25, act: 'defend' }, { t: 2.6, x: -2.7, z: 4.75, act: 'defend' }],
          b21: [{ t: 0, x: -2.52, z: 5.85, act: 'defend' }, { t: 2.6, x: 4.5, z: 4.65, act: 'defend' }],
          b44: [{ t: 0, x: 1.08, z: 1.05, act: 'defend' }, { t: 2.6, x: 0.63, z: 1.55, act: 'defend' }]
        },
        extra_pass: {
          b1: [{ t: 0, x: 0.9, z: 0.65, act: 'defend' }, { t: 2.6, x: 0.45, z: 1.15, act: 'defend' }],
          b7: [{ t: 0, x: -5.31, z: 1.35, act: 'defend' }, { t: 2.6, x: -6.21, z: 2.35, act: 'defend' }],
          b15: [{ t: 0, x: -3.87, z: 5.15, act: 'defend' }, { t: 2.6, x: -3.42, z: 5.65, act: 'defend' }],
          b21: [{ t: 0, x: 3.06, z: 4.75, act: 'defend' }, { t: 2.6, x: 2.61, z: 5.25, act: 'defend' }],
          b44: [{ t: 0, x: 0.63, z: 1.55, act: 'defend' }, { t: 2.6, x: 0.18, z: 2.05, act: 'defend' }]
        }
      }
    },
    {
      id: 'deny_return', weight: 2,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0, z: 7.1, act: 'defend' }, { t: 1.3, x: 0.4, z: 6.1, act: 'defend' }, { t: 2.8, x: 0, z: 5.6, act: 'defend' }],
          b7: [{ t: 0, x: -6.2, z: 0.5, act: 'defend' }, { t: 1.3, x: -6.2, z: 0.8, act: 'defend' }, { t: 2.8, x: -6.2, z: 1, act: 'defend' }],
          b15: [{ t: 0, x: -5, z: 4.5, act: 'defend' }, { t: 1.3, x: -3.7, z: 4.8, act: 'defend' }, { t: 2.8, x: -2.5, z: 4.7, act: 'defend' }],
          b21: [{ t: 0, x: 5.1, z: 4.4, act: 'defend' }, { t: 1.3, x: 3.7, z: 4.8, act: 'defend' }, { t: 2.8, x: 2.7, z: 4.7, act: 'defend' }],
          b44: [{ t: 0, x: 1.3, z: 1, act: 'defend' }, { t: 1.3, x: 1, z: 1, act: 'defend' }, { t: 2.8, x: 1.2, z: 0.8, act: 'defend' }]
        },
        left_wing: {
          b1: [{ t: 0, x: 0, z: 5.6, act: 'defend' }, { t: 2.6, x: -0.5, z: 0.8, act: 'defend' }],
          b7: [{ t: 0, x: -6.2, z: 1, act: 'defend' }, { t: 2.6, x: -5.76, z: 0.85, act: 'defend' }],
          b15: [{ t: 0, x: -2.5, z: 4.7, act: 'defend' }, { t: 2.6, x: 2.7, z: 5.35, act: 'defend' }],
          b21: [{ t: 0, x: 2.7, z: 4.7, act: 'defend' }, { t: 2.6, x: 3.51, z: 4.25, act: 'defend' }],
          b44: [{ t: 0, x: 1.2, z: 0.8, act: 'defend' }, { t: 2.6, x: 1.08, z: 1.05, act: 'defend' }]
        },
        right_wing: {
          b1: [{ t: 0, x: 0, z: 5.6, act: 'defend' }, { t: 2.6, x: 0.5, z: 0.8, act: 'defend' }],
          b7: [{ t: 0, x: -6.2, z: 1, act: 'defend' }, { t: 2.6, x: -5.76, z: 0.85, act: 'defend' }],
          b15: [{ t: 0, x: -2.5, z: 4.7, act: 'defend' }, { t: 2.6, x: -3.15, z: 4.25, act: 'defend' }],
          b21: [{ t: 0, x: 2.7, z: 4.7, act: 'defend' }, { t: 2.6, x: -2.52, z: 5.85, act: 'defend' }],
          b44: [{ t: 0, x: 1.2, z: 0.8, act: 'defend' }, { t: 2.6, x: 1.08, z: 1.05, act: 'defend' }]
        },
        return_finish: {
          b1: [{ t: 0, x: -0.54, z: 0.45, act: 'defend' }, { t: 2.6, x: 0.9, z: 0.65, act: 'defend' }],
          b7: [{ t: 0, x: -5.76, z: 0.85, act: 'defend' }, { t: 2.6, x: -5.31, z: 1.35, act: 'defend' }],
          b15: [{ t: 0, x: 2.7, z: 5.35, act: 'defend' }, { t: 2.6, x: -3.87, z: 5.15, act: 'defend' }],
          b21: [{ t: 0, x: 3.51, z: 4.25, act: 'defend' }, { t: 2.6, x: 3.06, z: 4.75, act: 'defend' }],
          b44: [{ t: 0, x: 1.08, z: 1.05, act: 'defend' }, { t: 2.6, x: 0.63, z: 1.55, act: 'defend' }]
        },
        lob_return: {
          b1: [{ t: 0, x: 0.54, z: 0.45, act: 'defend' }, { t: 2.6, x: -0.9, z: 0.65, act: 'defend' }],
          b7: [{ t: 0, x: -5.76, z: 0.85, act: 'defend' }, { t: 2.6, x: -5.31, z: 1.35, act: 'defend' }],
          b15: [{ t: 0, x: -3.15, z: 4.25, act: 'defend' }, { t: 2.6, x: -2.7, z: 4.75, act: 'defend' }],
          b21: [{ t: 0, x: -2.52, z: 5.85, act: 'defend' }, { t: 2.6, x: 4.5, z: 4.65, act: 'defend' }],
          b44: [{ t: 0, x: 1.08, z: 1.05, act: 'defend' }, { t: 2.6, x: 0.63, z: 1.55, act: 'defend' }]
        },
        extra_pass: {
          b1: [{ t: 0, x: 0.9, z: 0.65, act: 'defend' }, { t: 2.6, x: 0.45, z: 1.15, act: 'defend' }],
          b7: [{ t: 0, x: -5.31, z: 1.35, act: 'defend' }, { t: 2.6, x: -6.21, z: 2.35, act: 'defend' }],
          b15: [{ t: 0, x: -3.87, z: 5.15, act: 'defend' }, { t: 2.6, x: -3.42, z: 5.65, act: 'defend' }],
          b21: [{ t: 0, x: 3.06, z: 4.75, act: 'defend' }, { t: 2.6, x: 2.61, z: 5.25, act: 'defend' }],
          b44: [{ t: 0, x: 0.63, z: 1.55, act: 'defend' }, { t: 2.6, x: 0.18, z: 2.05, act: 'defend' }]
        }
      }
    },
    {
      id: 'help', weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0, z: 7.1, act: 'defend' }, { t: 1.3, x: 0.4, z: 6.1, act: 'defend' }, { t: 2.8, x: 0, z: 5.6, act: 'defend' }],
          b7: [{ t: 0, x: -6.2, z: 0.5, act: 'defend' }, { t: 1.3, x: -6.2, z: 0.8, act: 'defend' }, { t: 2.8, x: -6.2, z: 1, act: 'defend' }],
          b15: [{ t: 0, x: -5, z: 4.5, act: 'defend' }, { t: 1.3, x: -4, z: 4, act: 'defend' }, { t: 2.8, x: -3.5, z: 3.8, act: 'defend' }],
          b21: [{ t: 0, x: 5.1, z: 4.4, act: 'defend' }, { t: 1.3, x: 4.7, z: 4, act: 'defend' }, { t: 2.8, x: 3.8, z: 3.8, act: 'defend' }],
          b44: [{ t: 0, x: 1.3, z: 1, act: 'defend' }, { t: 1.3, x: 0.7, z: 1, act: 'defend' }, { t: 2.8, x: 0, z: 0.6, act: 'defend' }]
        },
        left_wing: {
          b1: [{ t: 0, x: 0, z: 5.6, act: 'defend' }, { t: 2.6, x: 0, z: 2.5, act: 'defend' }],
          b7: [{ t: 0, x: -6.2, z: 1, act: 'defend' }, { t: 2.6, x: -5.76, z: 0.85, act: 'defend' }],
          b15: [{ t: 0, x: -3.5, z: 3.8, act: 'defend' }, { t: 2.6, x: 2.7, z: 5.35, act: 'defend' }],
          b21: [{ t: 0, x: 3.8, z: 3.8, act: 'defend' }, { t: 2.6, x: 3.51, z: 4.25, act: 'defend' }],
          b44: [{ t: 0, x: 0, z: 0.6, act: 'defend' }, { t: 2.6, x: 0, z: 0.6, act: 'defend' }]
        },
        right_wing: {
          b1: [{ t: 0, x: 0, z: 5.6, act: 'defend' }, { t: 2.6, x: 0, z: 2.5, act: 'defend' }],
          b7: [{ t: 0, x: -6.2, z: 1, act: 'defend' }, { t: 2.6, x: -5.76, z: 0.85, act: 'defend' }],
          b15: [{ t: 0, x: -3.5, z: 3.8, act: 'defend' }, { t: 2.6, x: -3.15, z: 4.25, act: 'defend' }],
          b21: [{ t: 0, x: 3.8, z: 3.8, act: 'defend' }, { t: 2.6, x: -2.52, z: 5.85, act: 'defend' }],
          b44: [{ t: 0, x: 0, z: 0.6, act: 'defend' }, { t: 2.6, x: 0, z: 0.6, act: 'defend' }]
        },
        return_finish: {
          b1: [{ t: 0, x: -0.54, z: 0.45, act: 'defend' }, { t: 2.6, x: 0.9, z: 0.65, act: 'defend' }],
          b7: [{ t: 0, x: -5.76, z: 0.85, act: 'defend' }, { t: 2.6, x: -5.31, z: 1.35, act: 'defend' }],
          b15: [{ t: 0, x: 2.7, z: 5.35, act: 'defend' }, { t: 2.6, x: -3.87, z: 5.15, act: 'defend' }],
          b21: [{ t: 0, x: 3.51, z: 4.25, act: 'defend' }, { t: 2.6, x: 3.06, z: 4.75, act: 'defend' }],
          b44: [{ t: 0, x: 1.08, z: 1.05, act: 'defend' }, { t: 2.6, x: 0.63, z: 1.55, act: 'defend' }]
        },
        lob_return: {
          b1: [{ t: 0, x: 0.54, z: 0.45, act: 'defend' }, { t: 2.6, x: -0.9, z: 0.65, act: 'defend' }],
          b7: [{ t: 0, x: -5.76, z: 0.85, act: 'defend' }, { t: 2.6, x: -5.31, z: 1.35, act: 'defend' }],
          b15: [{ t: 0, x: -3.15, z: 4.25, act: 'defend' }, { t: 2.6, x: -2.7, z: 4.75, act: 'defend' }],
          b21: [{ t: 0, x: -2.52, z: 5.85, act: 'defend' }, { t: 2.6, x: 4.5, z: 4.65, act: 'defend' }],
          b44: [{ t: 0, x: 1.08, z: 1.05, act: 'defend' }, { t: 2.6, x: 0.63, z: 1.55, act: 'defend' }]
        },
        extra_pass: {
          b1: [{ t: 0, x: 0.9, z: 0.65, act: 'defend' }, { t: 2.6, x: 0.45, z: 1.15, act: 'defend' }],
          b7: [{ t: 0, x: -5.31, z: 1.35, act: 'defend' }, { t: 2.6, x: -6.21, z: 2.35, act: 'defend' }],
          b15: [{ t: 0, x: -3.87, z: 5.15, act: 'defend' }, { t: 2.6, x: -3.42, z: 5.65, act: 'defend' }],
          b21: [{ t: 0, x: 3.06, z: 4.75, act: 'defend' }, { t: 2.6, x: 2.61, z: 5.25, act: 'defend' }],
          b44: [{ t: 0, x: 0.63, z: 1.55, act: 'defend' }, { t: 2.6, x: 0.18, z: 2.05, act: 'defend' }]
        }
      }
    }
  ]
};


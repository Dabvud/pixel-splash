import type { Play } from '../types';

export const PINDOWN: Play = {
  id: 'pindown', name: 'Pin-down Ecke', clockS: 12, deficit: 2,
  actors: ['r3', 'r11', 'r23', 'r32', 'r50', 'b1', 'b7', 'b15', 'b21', 'b44'],
  start: 'setup',
  segments: {
    setup: {
      id: 'setup', handler: 'r3',
      paths: {
        r3: [{ t: 0, x: -1, z: 7.5, act: 'dribble' }, { t: 1.5, x: -0.5, z: 7.2, act: 'dribble' }, { t: 3.4, x: 0, z: 7, act: 'dribble' }, { t: 5.9, x: 0, z: 7, act: 'dribble' }],
        r11: [{ t: 0, x: 0.5, z: 1, act: 'run' }, { t: 1.5, x: 3.3, z: 1.1, act: 'run' }, { t: 3.4, x: 6.9, z: 0.7, act: 'run' }, { t: 5.9, x: 6.9, z: 0.7, act: 'run' }],
        r23: [{ t: 0, x: -5, z: 4, act: 'run' }, { t: 1.5, x: -6, z: 2.4, act: 'run' }, { t: 3.4, x: -6.9, z: 0.5, act: 'run' }, { t: 5.9, x: -6.9, z: 0.5, act: 'run' }],
        r32: [{ t: 0, x: -2, z: 4.2, act: 'run' }, { t: 1.5, x: -2.3, z: 4.7, act: 'run' }, { t: 3.4, x: -2.8, z: 5.2, act: 'run' }, { t: 5.9, x: -2.8, z: 5.2, act: 'run' }],
        r50: [{ t: 0, x: 3.4, z: 2.5, act: 'run' }, { t: 1.5, x: 3.8, z: 1.7, act: 'screen' }, { t: 3.4, x: 3.8, z: 1.7, act: 'screen' }, { t: 5.9, x: 3.8, z: 1.7, act: 'screen' }]
      },
      decisionAt: 5.9, options: [{ kind: 'pass', to: 'r11', next: 'corner' }, { kind: 'pass', to: 'r50', next: 'slip' }]
    },
    corner: {
      id: 'corner', handler: 'r11',
      paths: {
        r3: [{ t: 0, x: 0, z: 7, act: 'run' }, { t: 2.6, x: 0.45, z: 7.5, act: 'run' }],
        r11: [{ t: 0, x: 6.9, z: 0.7, act: 'dribble' }, { t: 2.6, x: 4.5, z: 5.4, act: 'dribble' }],
        r23: [{ t: 0, x: -6.9, z: 0.5, act: 'run' }, { t: 2.6, x: -6.45, z: 1, act: 'run' }],
        r32: [{ t: 0, x: -2.8, z: 5.2, act: 'run' }, { t: 2.6, x: -3.25, z: 5.7, act: 'run' }],
        r50: [{ t: 0, x: 3.8, z: 1.7, act: 'run' }, { t: 2.6, x: 4.25, z: 2.2, act: 'run' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }, { kind: 'drive' }]
    },
    slip: {
      id: 'slip', handler: 'r50',
      paths: {
        r3: [{ t: 0, x: 0, z: 7, act: 'run' }, { t: 2.6, x: 0.45, z: 7.5, act: 'run' }],
        r11: [{ t: 0, x: 6.9, z: 0.7, act: 'run' }, { t: 2.6, x: 6.45, z: 1.2, act: 'run' }],
        r23: [{ t: 0, x: -6.9, z: 0.5, act: 'run' }, { t: 2.6, x: -6.45, z: 1, act: 'run' }],
        r32: [{ t: 0, x: -2.8, z: 5.2, act: 'run' }, { t: 2.6, x: -3.25, z: 5.7, act: 'run' }],
        r50: [{ t: 0, x: 3.8, z: 1.7, act: 'dribble' }, { t: 2.6, x: -2.8, z: 1.4, act: 'dribble' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }, { kind: 'drive' }]
    }
  },
  variants: [
    {
      id: 'trail', weight: 3,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -0.93, z: 8.2, act: 'defend' }, { t: 1.5, x: -0.465, z: 7.9, act: 'defend' }, { t: 3.4, x: 0, z: 7.7, act: 'defend' }, { t: 5.9, x: 0, z: 7.7, act: 'defend' }],
          b7: [{ t: 0, x: 0.465, z: 1.7, act: 'defend' }, { t: 1.5, x: 3.069, z: 1.8, act: 'defend' }, { t: 3.4, x: 6.417, z: 1.4, act: 'defend' }, { t: 5.9, x: 6.417, z: 1.4, act: 'defend' }],
          b15: [{ t: 0, x: -4.65, z: 4.7, act: 'defend' }, { t: 1.5, x: -5.58, z: 3.1, act: 'defend' }, { t: 3.4, x: -6.417, z: 1.2, act: 'defend' }, { t: 5.9, x: -6.417, z: 1.2, act: 'defend' }],
          b21: [{ t: 0, x: -1.86, z: 4.9, act: 'defend' }, { t: 1.5, x: -2.139, z: 5.4, act: 'defend' }, { t: 3.4, x: -2.604, z: 5.9, act: 'defend' }, { t: 5.9, x: -2.604, z: 5.9, act: 'defend' }],
          b44: [{ t: 0, x: 3.162, z: 3.2, act: 'defend' }, { t: 1.5, x: 3.534, z: 2.4, act: 'defend' }, { t: 3.4, x: 3.534, z: 2.4, act: 'defend' }, { t: 5.9, x: 3.534, z: 2.4, act: 'defend' }]
        },
        corner: {
          b1: [{ t: 0, x: 0, z: 7.7, act: 'defend' }, { t: 2.6, x: 0.419, z: 8.2, act: 'defend' }],
          b7: [{ t: 0, x: 6.417, z: 1.4, act: 'defend' }, { t: 2.6, x: 4.185, z: 6.1, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 1.2, act: 'defend' }, { t: 2.6, x: -5.999, z: 1.7, act: 'defend' }],
          b21: [{ t: 0, x: -2.604, z: 5.9, act: 'defend' }, { t: 2.6, x: -3.022, z: 6.4, act: 'defend' }],
          b44: [{ t: 0, x: 3.534, z: 2.4, act: 'defend' }, { t: 2.6, x: 3.953, z: 2.9, act: 'defend' }]
        },
        slip: {
          b1: [{ t: 0, x: 0, z: 7.7, act: 'defend' }, { t: 2.6, x: 0.419, z: 8.2, act: 'defend' }],
          b7: [{ t: 0, x: 6.417, z: 1.4, act: 'defend' }, { t: 2.6, x: 5.999, z: 1.9, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 1.2, act: 'defend' }, { t: 2.6, x: -5.999, z: 1.7, act: 'defend' }],
          b21: [{ t: 0, x: -2.604, z: 5.9, act: 'defend' }, { t: 2.6, x: -3.022, z: 6.4, act: 'defend' }],
          b44: [{ t: 0, x: 3.534, z: 2.4, act: 'defend' }, { t: 2.6, x: -2.604, z: 2.1, act: 'defend' }]
        }
      }
    },
    {
      id: 'under', weight: 2,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -0.93, z: 5.7, act: 'defend' }, { t: 1.5, x: -0.465, z: 5.4, act: 'defend' }, { t: 3.4, x: 0, z: 5.2, act: 'defend' }, { t: 5.9, x: 0, z: 5.2, act: 'defend' }],
          b7: [{ t: 0, x: 0.465, z: 0.25, act: 'defend' }, { t: 1.5, x: 3.069, z: 0.25, act: 'defend' }, { t: 3.4, x: 6.417, z: 0.25, act: 'defend' }, { t: 5.9, x: 6.417, z: 0.25, act: 'defend' }],
          b15: [{ t: 0, x: -4.65, z: 2.2, act: 'defend' }, { t: 1.5, x: -5.58, z: 0.6, act: 'defend' }, { t: 3.4, x: -6.417, z: 0.25, act: 'defend' }, { t: 5.9, x: -6.417, z: 0.25, act: 'defend' }],
          b21: [{ t: 0, x: -1.86, z: 2.4, act: 'defend' }, { t: 1.5, x: -2.139, z: 2.9, act: 'defend' }, { t: 3.4, x: -2.604, z: 3.4, act: 'defend' }, { t: 5.9, x: -2.604, z: 3.4, act: 'defend' }],
          b44: [{ t: 0, x: 3.162, z: 0.7, act: 'defend' }, { t: 1.5, x: 3.534, z: 0.25, act: 'defend' }, { t: 3.4, x: 3.534, z: 0.25, act: 'defend' }, { t: 5.9, x: 3.534, z: 0.25, act: 'defend' }]
        },
        corner: {
          b1: [{ t: 0, x: 0, z: 5.2, act: 'defend' }, { t: 2.6, x: 0.419, z: 5.7, act: 'defend' }],
          b7: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: 4.185, z: 3.6, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.25, act: 'defend' }],
          b21: [{ t: 0, x: -2.604, z: 3.4, act: 'defend' }, { t: 2.6, x: -3.022, z: 3.9, act: 'defend' }],
          b44: [{ t: 0, x: 3.534, z: 0.25, act: 'defend' }, { t: 2.6, x: 3.953, z: 0.4, act: 'defend' }]
        },
        slip: {
          b1: [{ t: 0, x: 0, z: 5.2, act: 'defend' }, { t: 2.6, x: 0.419, z: 5.7, act: 'defend' }],
          b7: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: 5.999, z: 0.25, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.25, act: 'defend' }],
          b21: [{ t: 0, x: -2.604, z: 3.4, act: 'defend' }, { t: 2.6, x: -3.022, z: 3.9, act: 'defend' }],
          b44: [{ t: 0, x: 3.534, z: 0.25, act: 'defend' }, { t: 2.6, x: -2.604, z: 0.25, act: 'defend' }]
        }
      }
    },
    {
      id: 'switch', weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -0.93, z: 7.1, act: 'defend' }, { t: 1.5, x: -0.465, z: 6.8, act: 'defend' }, { t: 3.4, x: 0, z: 6.6, act: 'defend' }, { t: 5.9, x: 0, z: 6.6, act: 'defend' }],
          b7: [{ t: 0, x: 0.465, z: 0.6, act: 'defend' }, { t: 1.5, x: 3.418, z: 1.15, act: 'defend' }, { t: 3.4, x: 3.534, z: 1.3, act: 'defend' }, { t: 5.9, x: 3.534, z: 1.3, act: 'defend' }],
          b15: [{ t: 0, x: -4.65, z: 3.6, act: 'defend' }, { t: 1.5, x: -5.58, z: 2, act: 'defend' }, { t: 3.4, x: -6.417, z: 0.25, act: 'defend' }, { t: 5.9, x: -6.417, z: 0.25, act: 'defend' }],
          b21: [{ t: 0, x: -1.86, z: 3.8, act: 'defend' }, { t: 1.5, x: -2.139, z: 4.3, act: 'defend' }, { t: 3.4, x: -2.604, z: 4.8, act: 'defend' }, { t: 5.9, x: -2.604, z: 4.8, act: 'defend' }],
          b44: [{ t: 0, x: 3.162, z: 2.1, act: 'defend' }, { t: 1.5, x: 3.185, z: 0.85, act: 'defend' }, { t: 3.4, x: 6.417, z: 0.3, act: 'defend' }, { t: 5.9, x: 6.417, z: 0.3, act: 'defend' }]
        },
        corner: {
          b1: [{ t: 0, x: 0, z: 6.6, act: 'defend' }, { t: 2.6, x: 0.419, z: 7.1, act: 'defend' }],
          b7: [{ t: 0, x: 3.534, z: 1.3, act: 'defend' }, { t: 2.6, x: 3.953, z: 1.8, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.6, act: 'defend' }],
          b21: [{ t: 0, x: -2.604, z: 4.8, act: 'defend' }, { t: 2.6, x: -3.022, z: 5.3, act: 'defend' }],
          b44: [{ t: 0, x: 6.417, z: 0.3, act: 'defend' }, { t: 2.6, x: 4.185, z: 5, act: 'defend' }]
        },
        slip: {
          b1: [{ t: 0, x: 0, z: 6.6, act: 'defend' }, { t: 2.6, x: 0.419, z: 7.1, act: 'defend' }],
          b7: [{ t: 0, x: 3.534, z: 1.3, act: 'defend' }, { t: 2.6, x: -2.604, z: 1, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.6, act: 'defend' }],
          b21: [{ t: 0, x: -2.604, z: 4.8, act: 'defend' }, { t: 2.6, x: -3.022, z: 5.3, act: 'defend' }],
          b44: [{ t: 0, x: 6.417, z: 0.3, act: 'defend' }, { t: 2.6, x: 5.999, z: 0.8, act: 'defend' }]
        }
      }
    }
  ]
};

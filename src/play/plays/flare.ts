import type { Play } from '../types';

export const FLARE: Play = {
  id: 'flare', name: 'Flare-Screen', clockS: 12, deficit: 2,
  actors: ['r3', 'r11', 'r23', 'r32', 'r50', 'b1', 'b7', 'b15', 'b21', 'b44'],
  start: 'setup',
  segments: {
    setup: {
      id: 'setup', handler: 'r3',
      paths: {
        r3: [{ t: 0, x: -4.7, z: 4.3, act: 'dribble' }, { t: 1.5, x: -3.9, z: 4.7, act: 'dribble' }, { t: 3.4, x: -3, z: 5.1, act: 'dribble' }, { t: 5.9, x: -3, z: 5.1, act: 'dribble' }],
        r11: [{ t: 0, x: 1.2, z: 4.6, act: 'run' }, { t: 1.5, x: 3.6, z: 5.7, act: 'run' }, { t: 3.4, x: 6.1, z: 3.5, act: 'run' }, { t: 5.9, x: 6.1, z: 3.5, act: 'run' }],
        r23: [{ t: 0, x: -1.4, z: 4.6, act: 'run' }, { t: 1.5, x: -3.5, z: 6.3, act: 'run' }, { t: 3.4, x: -6.1, z: 3.5, act: 'run' }, { t: 5.9, x: -6.1, z: 3.5, act: 'run' }],
        r32: [{ t: 0, x: -2.7, z: 5, act: 'run' }, { t: 1.5, x: -2.8, z: 5.4, act: 'screen' }, { t: 3.4, x: -2.8, z: 5.4, act: 'screen' }, { t: 5.9, x: -2.8, z: 5.4, act: 'screen' }],
        r50: [{ t: 0, x: 2.5, z: 4.7, act: 'run' }, { t: 1.5, x: 2.8, z: 5, act: 'screen' }, { t: 3.4, x: 2.8, z: 5, act: 'screen' }, { t: 5.9, x: 2.8, z: 5, act: 'screen' }]
      },
      decisionAt: 5.9, options: [{ kind: 'pass', to: 'r11', next: 'skip_right' }, { kind: 'pass', to: 'r23', next: 'skip_left' }]
    },
    skip_right: {
      id: 'skip_right', handler: 'r11',
      paths: {
        r3: [{ t: 0, x: -3, z: 5.1, act: 'run' }, { t: 2.6, x: -2.55, z: 5.6, act: 'run' }],
        r11: [{ t: 0, x: 6.1, z: 3.5, act: 'dribble' }, { t: 2.6, x: -0.6, z: 7.1, act: 'dribble' }],
        r23: [{ t: 0, x: -6.1, z: 3.5, act: 'run' }, { t: 2.6, x: -5.65, z: 4, act: 'run' }],
        r32: [{ t: 0, x: -2.8, z: 5.4, act: 'run' }, { t: 2.6, x: -3.25, z: 5.9, act: 'run' }],
        r50: [{ t: 0, x: 2.8, z: 5, act: 'run' }, { t: 2.6, x: 3.25, z: 5.5, act: 'run' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }, { kind: 'drive' }]
    },
    skip_left: {
      id: 'skip_left', handler: 'r23',
      paths: {
        r3: [{ t: 0, x: -3, z: 5.1, act: 'run' }, { t: 2.6, x: -2.55, z: 5.6, act: 'run' }],
        r11: [{ t: 0, x: 6.1, z: 3.5, act: 'run' }, { t: 2.6, x: 5.65, z: 4, act: 'run' }],
        r23: [{ t: 0, x: -6.1, z: 3.5, act: 'dribble' }, { t: 2.6, x: 0.6, z: 7.1, act: 'dribble' }],
        r32: [{ t: 0, x: -2.8, z: 5.4, act: 'run' }, { t: 2.6, x: -3.25, z: 5.9, act: 'run' }],
        r50: [{ t: 0, x: 2.8, z: 5, act: 'run' }, { t: 2.6, x: 3.25, z: 5.5, act: 'run' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }, { kind: 'drive' }]
    }
  },
  variants: [
    {
      id: 'trail', weight: 3,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -4.371, z: 5, act: 'defend' }, { t: 1.5, x: -3.627, z: 5.4, act: 'defend' }, { t: 3.4, x: -2.79, z: 5.8, act: 'defend' }, { t: 5.9, x: -2.79, z: 5.8, act: 'defend' }],
          b7: [{ t: 0, x: 1.116, z: 5.3, act: 'defend' }, { t: 1.5, x: 3.348, z: 6.4, act: 'defend' }, { t: 3.4, x: 5.673, z: 4.2, act: 'defend' }, { t: 5.9, x: 5.673, z: 4.2, act: 'defend' }],
          b15: [{ t: 0, x: -1.302, z: 5.3, act: 'defend' }, { t: 1.5, x: -3.255, z: 7, act: 'defend' }, { t: 3.4, x: -5.673, z: 4.2, act: 'defend' }, { t: 5.9, x: -5.673, z: 4.2, act: 'defend' }],
          b21: [{ t: 0, x: -2.511, z: 5.7, act: 'defend' }, { t: 1.5, x: -2.604, z: 6.1, act: 'defend' }, { t: 3.4, x: -2.604, z: 6.1, act: 'defend' }, { t: 5.9, x: -2.604, z: 6.1, act: 'defend' }],
          b44: [{ t: 0, x: 2.325, z: 5.4, act: 'defend' }, { t: 1.5, x: 2.604, z: 5.7, act: 'defend' }, { t: 3.4, x: 2.604, z: 5.7, act: 'defend' }, { t: 5.9, x: 2.604, z: 5.7, act: 'defend' }]
        },
        skip_right: {
          b1: [{ t: 0, x: -2.79, z: 5.8, act: 'defend' }, { t: 2.6, x: -2.372, z: 6.3, act: 'defend' }],
          b7: [{ t: 0, x: 5.673, z: 4.2, act: 'defend' }, { t: 2.6, x: -0.558, z: 7.8, act: 'defend' }],
          b15: [{ t: 0, x: -5.673, z: 4.2, act: 'defend' }, { t: 2.6, x: -5.255, z: 4.7, act: 'defend' }],
          b21: [{ t: 0, x: -2.604, z: 6.1, act: 'defend' }, { t: 2.6, x: -3.022, z: 6.6, act: 'defend' }],
          b44: [{ t: 0, x: 2.604, z: 5.7, act: 'defend' }, { t: 2.6, x: 3.022, z: 6.2, act: 'defend' }]
        },
        skip_left: {
          b1: [{ t: 0, x: -2.79, z: 5.8, act: 'defend' }, { t: 2.6, x: -2.372, z: 6.3, act: 'defend' }],
          b7: [{ t: 0, x: 5.673, z: 4.2, act: 'defend' }, { t: 2.6, x: 5.255, z: 4.7, act: 'defend' }],
          b15: [{ t: 0, x: -5.673, z: 4.2, act: 'defend' }, { t: 2.6, x: 0.558, z: 7.8, act: 'defend' }],
          b21: [{ t: 0, x: -2.604, z: 6.1, act: 'defend' }, { t: 2.6, x: -3.022, z: 6.6, act: 'defend' }],
          b44: [{ t: 0, x: 2.604, z: 5.7, act: 'defend' }, { t: 2.6, x: 3.022, z: 6.2, act: 'defend' }]
        }
      }
    },
    {
      id: 'under', weight: 2,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -4.371, z: 2.5, act: 'defend' }, { t: 1.5, x: -3.627, z: 2.9, act: 'defend' }, { t: 3.4, x: -2.79, z: 3.3, act: 'defend' }, { t: 5.9, x: -2.79, z: 3.3, act: 'defend' }],
          b7: [{ t: 0, x: 1.116, z: 2.8, act: 'defend' }, { t: 1.5, x: 3.348, z: 3.9, act: 'defend' }, { t: 3.4, x: 5.673, z: 1.7, act: 'defend' }, { t: 5.9, x: 5.673, z: 1.7, act: 'defend' }],
          b15: [{ t: 0, x: -1.302, z: 2.8, act: 'defend' }, { t: 1.5, x: -3.255, z: 4.5, act: 'defend' }, { t: 3.4, x: -5.673, z: 1.7, act: 'defend' }, { t: 5.9, x: -5.673, z: 1.7, act: 'defend' }],
          b21: [{ t: 0, x: -2.511, z: 3.2, act: 'defend' }, { t: 1.5, x: -2.604, z: 3.6, act: 'defend' }, { t: 3.4, x: -2.604, z: 3.6, act: 'defend' }, { t: 5.9, x: -2.604, z: 3.6, act: 'defend' }],
          b44: [{ t: 0, x: 2.325, z: 2.9, act: 'defend' }, { t: 1.5, x: 2.604, z: 3.2, act: 'defend' }, { t: 3.4, x: 2.604, z: 3.2, act: 'defend' }, { t: 5.9, x: 2.604, z: 3.2, act: 'defend' }]
        },
        skip_right: {
          b1: [{ t: 0, x: -2.79, z: 3.3, act: 'defend' }, { t: 2.6, x: -2.372, z: 3.8, act: 'defend' }],
          b7: [{ t: 0, x: 5.673, z: 1.7, act: 'defend' }, { t: 2.6, x: -0.558, z: 5.3, act: 'defend' }],
          b15: [{ t: 0, x: -5.673, z: 1.7, act: 'defend' }, { t: 2.6, x: -5.255, z: 2.2, act: 'defend' }],
          b21: [{ t: 0, x: -2.604, z: 3.6, act: 'defend' }, { t: 2.6, x: -3.022, z: 4.1, act: 'defend' }],
          b44: [{ t: 0, x: 2.604, z: 3.2, act: 'defend' }, { t: 2.6, x: 3.022, z: 3.7, act: 'defend' }]
        },
        skip_left: {
          b1: [{ t: 0, x: -2.79, z: 3.3, act: 'defend' }, { t: 2.6, x: -2.372, z: 3.8, act: 'defend' }],
          b7: [{ t: 0, x: 5.673, z: 1.7, act: 'defend' }, { t: 2.6, x: 5.255, z: 2.2, act: 'defend' }],
          b15: [{ t: 0, x: -5.673, z: 1.7, act: 'defend' }, { t: 2.6, x: 0.558, z: 5.3, act: 'defend' }],
          b21: [{ t: 0, x: -2.604, z: 3.6, act: 'defend' }, { t: 2.6, x: -3.022, z: 4.1, act: 'defend' }],
          b44: [{ t: 0, x: 2.604, z: 3.2, act: 'defend' }, { t: 2.6, x: 3.022, z: 3.7, act: 'defend' }]
        }
      }
    },
    {
      id: 'switch', weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -4.371, z: 3.9, act: 'defend' }, { t: 1.5, x: -3.627, z: 4.3, act: 'defend' }, { t: 3.4, x: -2.79, z: 4.7, act: 'defend' }, { t: 5.9, x: -2.79, z: 4.7, act: 'defend' }],
          b7: [{ t: 0, x: 1.116, z: 4.2, act: 'defend' }, { t: 1.5, x: 2.79, z: 4.775, act: 'defend' }, { t: 3.4, x: 2.604, z: 4.6, act: 'defend' }, { t: 5.9, x: 2.604, z: 4.6, act: 'defend' }],
          b15: [{ t: 0, x: -1.302, z: 4.2, act: 'defend' }, { t: 1.5, x: -2.767, z: 5.225, act: 'defend' }, { t: 3.4, x: -2.604, z: 5, act: 'defend' }, { t: 5.9, x: -2.604, z: 5, act: 'defend' }],
          b21: [{ t: 0, x: -2.511, z: 4.6, act: 'defend' }, { t: 1.5, x: -3.092, z: 5.675, act: 'defend' }, { t: 3.4, x: -5.673, z: 3.1, act: 'defend' }, { t: 5.9, x: -5.673, z: 3.1, act: 'defend' }],
          b44: [{ t: 0, x: 2.325, z: 4.3, act: 'defend' }, { t: 1.5, x: 3.162, z: 5.125, act: 'defend' }, { t: 3.4, x: 5.673, z: 3.1, act: 'defend' }, { t: 5.9, x: 5.673, z: 3.1, act: 'defend' }]
        },
        skip_right: {
          b1: [{ t: 0, x: -2.79, z: 4.7, act: 'defend' }, { t: 2.6, x: -2.372, z: 5.2, act: 'defend' }],
          b7: [{ t: 0, x: 2.604, z: 4.6, act: 'defend' }, { t: 2.6, x: 3.022, z: 5.1, act: 'defend' }],
          b15: [{ t: 0, x: -2.604, z: 5, act: 'defend' }, { t: 2.6, x: -3.022, z: 5.5, act: 'defend' }],
          b21: [{ t: 0, x: -5.673, z: 3.1, act: 'defend' }, { t: 2.6, x: -5.255, z: 3.6, act: 'defend' }],
          b44: [{ t: 0, x: 5.673, z: 3.1, act: 'defend' }, { t: 2.6, x: -0.558, z: 6.7, act: 'defend' }]
        },
        skip_left: {
          b1: [{ t: 0, x: -2.79, z: 4.7, act: 'defend' }, { t: 2.6, x: -2.372, z: 5.2, act: 'defend' }],
          b7: [{ t: 0, x: 2.604, z: 4.6, act: 'defend' }, { t: 2.6, x: 3.022, z: 5.1, act: 'defend' }],
          b15: [{ t: 0, x: -2.604, z: 5, act: 'defend' }, { t: 2.6, x: -3.022, z: 5.5, act: 'defend' }],
          b21: [{ t: 0, x: -5.673, z: 3.1, act: 'defend' }, { t: 2.6, x: 0.558, z: 6.7, act: 'defend' }],
          b44: [{ t: 0, x: 5.673, z: 3.1, act: 'defend' }, { t: 2.6, x: 5.255, z: 3.6, act: 'defend' }]
        }
      }
    }
  ]
};

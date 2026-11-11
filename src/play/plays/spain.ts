import type { Play } from '../types';

export const SPAIN: Play = {
  id: 'spain', name: 'Spain Pick & Roll', clockS: 13, deficit: 2,
  actors: ['r3', 'r11', 'r23', 'r32', 'r50', 'b1', 'b7', 'b15', 'b21', 'b44'],
  start: 'setup',
  segments: {
    setup: {
      id: 'setup', handler: 'r3',
      paths: {
        r3: [{ t: 0, x: 0, z: 8.4, act: 'dribble' }, { t: 1.5, x: 1.8, z: 6.3, act: 'dribble' }, { t: 3.4, x: 3, z: 5.2, act: 'dribble' }, { t: 5.9, x: 3, z: 5.2, act: 'dribble' }],
        r11: [{ t: 0, x: -3, z: 2, act: 'run' }, { t: 1.5, x: 0.4, z: 3.2, act: 'screen' }, { t: 1.65, x: 0.4, z: 3.2, act: 'run' }, { t: 3.4, x: -2.2, z: 6.6, act: 'run' }, { t: 5.9, x: -2.2, z: 6.6, act: 'run' }],
        r23: [{ t: 0, x: -6.9, z: 0.6, act: 'run' }, { t: 1.5, x: -6.7, z: 1.2, act: 'run' }, { t: 3.4, x: -6.9, z: 0.7, act: 'run' }, { t: 5.9, x: -6.9, z: 0.7, act: 'run' }],
        r32: [{ t: 0, x: 6.9, z: 0.6, act: 'run' }, { t: 1.5, x: 6.7, z: 1.2, act: 'run' }, { t: 3.4, x: 6.9, z: 0.7, act: 'run' }, { t: 5.9, x: 6.9, z: 0.7, act: 'run' }],
        r50: [{ t: 0, x: 1.4, z: 6.2, act: 'screen' }, { t: 0.15, x: 1.4, z: 6.2, act: 'run' }, { t: 1.5, x: 1.4, z: 5.8, act: 'screen' }, { t: 1.65, x: 1.4, z: 5.8, act: 'run' }, { t: 3.4, x: 0.7, z: 1.3, act: 'run' }, { t: 5.9, x: 0.7, z: 1.3, act: 'run' }]
      },
      decisionAt: 5.9, options: [{ kind: 'pass', to: 'r50', next: 'lob', lob: true }, { kind: 'pass', to: 'r11', next: 'pop' }, { kind: 'shoot' }, { kind: 'drive' }]
    },
    lob: {
      id: 'lob', handler: 'r50',
      paths: {
        r3: [{ t: 0, x: 3, z: 5.2, act: 'run' }, { t: 2.6, x: 3.45, z: 5.7, act: 'run' }],
        r11: [{ t: 0, x: -2.2, z: 6.6, act: 'run' }, { t: 2.6, x: -2.65, z: 7.1, act: 'run' }],
        r23: [{ t: 0, x: -6.9, z: 0.7, act: 'run' }, { t: 2.6, x: -6.45, z: 1.2, act: 'run' }],
        r32: [{ t: 0, x: 6.9, z: 0.7, act: 'run' }, { t: 2.6, x: 6.45, z: 1.2, act: 'run' }],
        r50: [{ t: 0, x: 0.7, z: 1.3, act: 'dribble' }, { t: 2.6, x: -0.8, z: 1.3, act: 'dribble' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }]
    },
    pop: {
      id: 'pop', handler: 'r11',
      paths: {
        r3: [{ t: 0, x: 3, z: 5.2, act: 'run' }, { t: 2.6, x: 3.45, z: 5.7, act: 'run' }],
        r11: [{ t: 0, x: -2.2, z: 6.6, act: 'dribble' }, { t: 2.6, x: 4, z: 5.7, act: 'dribble' }],
        r23: [{ t: 0, x: -6.9, z: 0.7, act: 'run' }, { t: 2.6, x: -6.45, z: 1.2, act: 'run' }],
        r32: [{ t: 0, x: 6.9, z: 0.7, act: 'run' }, { t: 2.6, x: 6.45, z: 1.2, act: 'run' }],
        r50: [{ t: 0, x: 0.7, z: 1.3, act: 'run' }, { t: 2.6, x: 1.15, z: 1.8, act: 'run' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }, { kind: 'drive' }]
    }
  },
  variants: [
    {
      id: 'backscreen', weight: 3,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0, z: 7.8, act: 'defend' }, { t: 1.5, x: 1.674, z: 5.7, act: 'defend' }, { t: 3.4, x: 2.79, z: 4.6, act: 'defend' }, { t: 5.9, x: 2.79, z: 4.6, act: 'defend' }],
          b7: [{ t: 0, x: -2.8, z: 1.6, act: 'defend' }, { t: 1.5, x: -0.3, z: 2.8, act: 'defend' }, { t: 3.4, x: 0.4, z: 1.8, act: 'defend' }, { t: 5.9, x: 0.4, z: 1.8, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 1.5, x: -6.231, z: 0.6, act: 'defend' }, { t: 3.4, x: -6.417, z: 0.25, act: 'defend' }, { t: 5.9, x: -6.417, z: 0.25, act: 'defend' }],
          b21: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 1.5, x: 6.231, z: 0.6, act: 'defend' }, { t: 3.4, x: 6.417, z: 0.25, act: 'defend' }, { t: 5.9, x: 6.417, z: 0.25, act: 'defend' }],
          b44: [{ t: 0, x: 1.1, z: 5.6, act: 'defend' }, { t: 1.5, x: 0.5, z: 3.6, act: 'defend' }, { t: 3.4, x: -0.2, z: 3, act: 'defend' }, { t: 5.9, x: -0.2, z: 3, act: 'defend' }]
        },
        lob: {
          b1: [{ t: 0, x: 2.79, z: 4.6, act: 'defend' }, { t: 2.6, x: 3.209, z: 5.1, act: 'defend' }],
          b7: [{ t: 0, x: 0.4, z: 1.8, act: 'defend' }, { t: 2.6, x: -2.465, z: 6.5, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.6, act: 'defend' }],
          b21: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: 5.999, z: 0.6, act: 'defend' }],
          b44: [{ t: 0, x: -0.2, z: 3, act: 'defend' }, { t: 2.6, x: -0.744, z: 0.7, act: 'defend' }]
        },
        pop: {
          b1: [{ t: 0, x: 2.79, z: 4.6, act: 'defend' }, { t: 2.6, x: 3.209, z: 5.1, act: 'defend' }],
          b7: [{ t: 0, x: 0.4, z: 1.8, act: 'defend' }, { t: 2.6, x: 3.72, z: 5.1, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.6, act: 'defend' }],
          b21: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: 5.999, z: 0.6, act: 'defend' }],
          b44: [{ t: 0, x: -0.2, z: 3, act: 'defend' }, { t: 2.6, x: 1.069, z: 1.2, act: 'defend' }]
        }
      }
    },
    {
      id: 'switch', weight: 2,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0, z: 8, act: 'defend' }, { t: 1.5, x: 1.674, z: 5.9, act: 'defend' }, { t: 3.4, x: 2.79, z: 4.8, act: 'defend' }, { t: 5.9, x: 2.79, z: 4.8, act: 'defend' }],
          b7: [{ t: 0, x: -2.79, z: 1.6, act: 'defend' }, { t: 0.15, x: -2.191, z: 2.026, act: 'defend' }, { t: 1.5, x: 1.069, z: 4.75, act: 'defend' }, { t: 1.65, x: 1.139, z: 4.945, act: 'defend' }, { t: 3.4, x: 0.651, z: 0.9, act: 'defend' }, { t: 5.9, x: 0.651, z: 0.9, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 1.5, x: -6.231, z: 0.8, act: 'defend' }, { t: 3.4, x: -6.417, z: 0.3, act: 'defend' }, { t: 5.9, x: -6.417, z: 0.3, act: 'defend' }],
          b21: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 1.5, x: 6.231, z: 0.8, act: 'defend' }, { t: 3.4, x: 6.417, z: 0.3, act: 'defend' }, { t: 5.9, x: 6.417, z: 0.3, act: 'defend' }],
          b44: [{ t: 0, x: 1.302, z: 5.8, act: 'defend' }, { t: 1.5, x: 0.605, z: 3.45, act: 'defend' }, { t: 1.65, x: 0.535, z: 3.255, act: 'defend' }, { t: 3.4, x: -2.046, z: 6.2, act: 'defend' }, { t: 5.9, x: -2.046, z: 6.2, act: 'defend' }]
        },
        lob: {
          b1: [{ t: 0, x: 2.79, z: 4.8, act: 'defend' }, { t: 2.6, x: 3.209, z: 5.3, act: 'defend' }],
          b7: [{ t: 0, x: 0.651, z: 0.9, act: 'defend' }, { t: 2.6, x: -0.744, z: 0.9, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.3, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.8, act: 'defend' }],
          b21: [{ t: 0, x: 6.417, z: 0.3, act: 'defend' }, { t: 2.6, x: 5.999, z: 0.8, act: 'defend' }],
          b44: [{ t: 0, x: -2.046, z: 6.2, act: 'defend' }, { t: 2.6, x: -2.465, z: 6.7, act: 'defend' }]
        },
        pop: {
          b1: [{ t: 0, x: 2.79, z: 4.8, act: 'defend' }, { t: 2.6, x: 3.209, z: 5.3, act: 'defend' }],
          b7: [{ t: 0, x: 0.651, z: 0.9, act: 'defend' }, { t: 2.6, x: 1.069, z: 1.4, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.3, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.8, act: 'defend' }],
          b21: [{ t: 0, x: 6.417, z: 0.3, act: 'defend' }, { t: 2.6, x: 5.999, z: 0.8, act: 'defend' }],
          b44: [{ t: 0, x: -2.046, z: 6.2, act: 'defend' }, { t: 2.6, x: 3.72, z: 5.3, act: 'defend' }]
        }
      }
    },
    {
      id: 'blitz', weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0, z: 7.7, act: 'defend' }, { t: 1.5, x: 2.2, z: 6, act: 'defend' }, { t: 3.4, x: 2.6, z: 4.8, act: 'defend' }, { t: 5.9, x: 2.6, z: 4.8, act: 'defend' }],
          b7: [{ t: 0, x: -2.79, z: 1.4, act: 'defend' }, { t: 1.5, x: 0.372, z: 2.6, act: 'defend' }, { t: 1.65, x: 0.372, z: 2.6, act: 'defend' }, { t: 3.4, x: -2.046, z: 6, act: 'defend' }, { t: 5.9, x: -2.046, z: 6, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 1.5, x: -6.231, z: 0.6, act: 'defend' }, { t: 3.4, x: -6.417, z: 0.25, act: 'defend' }, { t: 5.9, x: -6.417, z: 0.25, act: 'defend' }],
          b21: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 1.5, x: 6.231, z: 0.6, act: 'defend' }, { t: 3.4, x: 6.417, z: 0.25, act: 'defend' }, { t: 5.9, x: 6.417, z: 0.25, act: 'defend' }],
          b44: [{ t: 0, x: 1.1, z: 5.7, act: 'defend' }, { t: 1.5, x: 2.1, z: 5.8, act: 'defend' }, { t: 3.4, x: 3.3, z: 4.8, act: 'defend' }, { t: 5.9, x: 3.3, z: 4.8, act: 'defend' }]
        },
        lob: {
          b1: [{ t: 0, x: 2.6, z: 4.8, act: 'defend' }, { t: 2.6, x: 3.209, z: 5.1, act: 'defend' }],
          b7: [{ t: 0, x: -2.046, z: 6, act: 'defend' }, { t: 2.6, x: -2.465, z: 6.5, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.6, act: 'defend' }],
          b21: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: 5.999, z: 0.6, act: 'defend' }],
          b44: [{ t: 0, x: 3.3, z: 4.8, act: 'defend' }, { t: 2.6, x: -0.744, z: 0.7, act: 'defend' }]
        },
        pop: {
          b1: [{ t: 0, x: 2.6, z: 4.8, act: 'defend' }, { t: 2.6, x: 3.209, z: 5.1, act: 'defend' }],
          b7: [{ t: 0, x: -2.046, z: 6, act: 'defend' }, { t: 2.6, x: 3.72, z: 5.1, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.6, act: 'defend' }],
          b21: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: 5.999, z: 0.6, act: 'defend' }],
          b44: [{ t: 0, x: 3.3, z: 4.8, act: 'defend' }, { t: 2.6, x: 1.069, z: 1.2, act: 'defend' }]
        }
      }
    }
  ]
};

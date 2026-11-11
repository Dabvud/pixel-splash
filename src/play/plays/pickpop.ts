import type { Play } from '../types';

export const PICKPOP: Play = {
  id: 'pickpop', name: 'Pick & Pop', clockS: 12, deficit: 3,
  actors: ['r3', 'r11', 'r23', 'r32', 'r50', 'b1', 'b7', 'b15', 'b21', 'b44'],
  start: 'setup',
  segments: {
    setup: {
      id: 'setup', handler: 'r3',
      paths: {
        r3: [{ t: 0, x: -1.2, z: 8.2, act: 'dribble' }, { t: 1.3, x: 1.3, z: 6.5, act: 'dribble' }, { t: 2.8, x: 2.4, z: 4.8, act: 'dribble' }],
        r50: [{ t: 0, x: 0.5, z: 6, act: 'screen' }, { t: 1.3, x: 0.5, z: 6, act: 'screen' }, { t: 2.8, x: -2.6, z: 6.6, act: 'run' }],
        r11: [{ t: 0, x: 6.5, z: 1.8, act: 'run' }, { t: 1.3, x: 6.9, z: 1, act: 'run' }, { t: 2.8, x: 6.9, z: 0.5, act: 'run' }],
        r23: [{ t: 0, x: -5.5, z: 4.2, act: 'run' }, { t: 1.3, x: -6.1, z: 4, act: 'run' }, { t: 2.8, x: -5.5, z: 4.6, act: 'run' }],
        r32: [{ t: 0, x: -6.8, z: 0.5, act: 'run' }, { t: 1.3, x: -5.3, z: 1, act: 'run' }, { t: 2.8, x: -3.7, z: 1.6, act: 'run' }]
      },
      decisionAt: 2.8,
      options: [{ kind: 'pass', to: 'r50', next: 'pop' }, { kind: 'drive' }]
    },
    pop: {
      id: 'pop', handler: 'r50',
      paths: {
        r3: [{ t: 0, x: 2.4, z: 4.8, act: 'run' }, { t: 2.6, x: 1.9, z: 5.3, act: 'run' }],
        r50: [{ t: 0, x: -2.6, z: 6.6, act: 'dribble' }, { t: 1.3, x: 1.2, z: 6.9, act: 'dribble' }, { t: 2.6, x: 4.7, z: 5.1, act: 'dribble' }],
        r11: [{ t: 0, x: 6.9, z: 0.5, act: 'run' }, { t: 2.6, x: 6.4, z: 1, act: 'run' }],
        r23: [{ t: 0, x: -5.5, z: 4.6, act: 'run' }, { t: 2.6, x: -5, z: 5.1, act: 'run' }],
        r32: [{ t: 0, x: -3.7, z: 1.6, act: 'run' }, { t: 2.6, x: -3.2, z: 2.1, act: 'run' }]
      },
      decisionAt: 2.6,
      options: [{ kind: 'shoot' }, { kind: 'drive' }, { kind: 'pass', to: 'r11', next: 'corner' }]
    },
    corner: {
      id: 'corner', handler: 'r11',
      paths: {
        r3: [{ t: 0, x: 1.9, z: 5.3, act: 'run' }, { t: 2.6, x: 1.4, z: 5.8, act: 'run' }],
        r50: [{ t: 0, x: 4.7, z: 5.1, act: 'run' }, { t: 2.6, x: -4.4, z: 5.7, act: 'run' }],
        r11: [{ t: 0, x: 6.4, z: 1, act: 'dribble' }, { t: 2.6, x: 6.9, z: 3, act: 'dribble' }],
        r23: [{ t: 0, x: -5, z: 5.1, act: 'run' }, { t: 2.6, x: -4.5, z: 5.6, act: 'run' }],
        r32: [{ t: 0, x: -3.2, z: 2.1, act: 'run' }, { t: 2.6, x: -2.7, z: 2.6, act: 'run' }]
      },
      decisionAt: 2.6,
      options: [{ kind: 'shoot' }, { kind: 'drive' }]
    }
  },
  variants: [
    {
      id: 'drop', weight: 3,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -1, z: 7.6, act: 'defend' }, { t: 1.3, x: 0.7, z: 6.6, act: 'defend' }, { t: 2.8, x: 1.4, z: 5.5, act: 'defend' }],
          b7: [{ t: 0, x: 6, z: 1.5, act: 'defend' }, { t: 1.3, x: 6.3, z: 1, act: 'defend' }, { t: 2.8, x: 6.3, z: 0.5, act: 'defend' }],
          b15: [{ t: 0, x: -5, z: 3.7, act: 'defend' }, { t: 1.3, x: -5.6, z: 3.5, act: 'defend' }, { t: 2.8, x: -5, z: 4.1, act: 'defend' }],
          b21: [{ t: 0, x: -6.2, z: 0.5, act: 'defend' }, { t: 1.3, x: -4.8, z: 0.8, act: 'defend' }, { t: 2.8, x: -3.2, z: 1.2, act: 'defend' }],
          b44: [{ t: 0, x: 0.3, z: 5.4, act: 'defend' }, { t: 1.3, x: 0.3, z: 4.2, act: 'defend' }, { t: 2.8, x: 0.3, z: 1.2, act: 'defend' }]
        },
        pop: {
          b1: [{ t: 0, x: 1.4, z: 5.5, act: 'defend' }, { t: 2.6, x: 1.71, z: 4.65, act: 'defend' }],
          b7: [{ t: 0, x: 6.3, z: 0.5, act: 'defend' }, { t: 2.6, x: 5.76, z: 0.4, act: 'defend' }],
          b15: [{ t: 0, x: -5, z: 4.1, act: 'defend' }, { t: 2.6, x: -4.5, z: 4.45, act: 'defend' }],
          b21: [{ t: 0, x: -3.2, z: 1.2, act: 'defend' }, { t: 2.6, x: -2.88, z: 1.45, act: 'defend' }],
          b44: [{ t: 0, x: 0.3, z: 1.2, act: 'defend' }, { t: 2.6, x: 4.23, z: 4.45, act: 'defend' }]
        },
        corner: {
          b1: [{ t: 0, x: 1.71, z: 4.65, act: 'defend' }, { t: 2.6, x: 1.26, z: 5.15, act: 'defend' }],
          b7: [{ t: 0, x: 5.76, z: 0.4, act: 'defend' }, { t: 2.6, x: 6.21, z: 2.35, act: 'defend' }],
          b15: [{ t: 0, x: -4.5, z: 4.45, act: 'defend' }, { t: 2.6, x: -4.05, z: 4.95, act: 'defend' }],
          b21: [{ t: 0, x: -2.88, z: 1.45, act: 'defend' }, { t: 2.6, x: -2.43, z: 1.95, act: 'defend' }],
          b44: [{ t: 0, x: 4.23, z: 4.45, act: 'defend' }, { t: 2.6, x: -3.96, z: 5.05, act: 'defend' }]
        }
      }
    },
    {
      id: 'switch', weight: 2,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -1, z: 7.6, act: 'defend' }, { t: 1.3, x: 0.4, z: 6.4, act: 'defend' }, { t: 2.8, x: -2.3, z: 6, act: 'defend' }],
          b7: [{ t: 0, x: 6, z: 1.5, act: 'defend' }, { t: 1.3, x: 6.3, z: 1, act: 'defend' }, { t: 2.8, x: 6.3, z: 0.5, act: 'defend' }],
          b15: [{ t: 0, x: -5, z: 3.7, act: 'defend' }, { t: 1.3, x: -5.6, z: 3.5, act: 'defend' }, { t: 2.8, x: -5, z: 4.1, act: 'defend' }],
          b21: [{ t: 0, x: -6.2, z: 0.5, act: 'defend' }, { t: 1.3, x: -4.8, z: 0.8, act: 'defend' }, { t: 2.8, x: -3.2, z: 1.2, act: 'defend' }],
          b44: [{ t: 0, x: 0.3, z: 5.4, act: 'defend' }, { t: 1.3, x: 1.5, z: 5.8, act: 'defend' }, { t: 2.8, x: 2, z: 4.3, act: 'defend' }]
        },
        pop: {
          b1: [{ t: 0, x: -2.3, z: 6, act: 'defend' }, { t: 2.6, x: 1.71, z: 4.65, act: 'defend' }],
          b7: [{ t: 0, x: 6.3, z: 0.5, act: 'defend' }, { t: 2.6, x: 5.76, z: 0.4, act: 'defend' }],
          b15: [{ t: 0, x: -5, z: 4.1, act: 'defend' }, { t: 2.6, x: -4.5, z: 4.45, act: 'defend' }],
          b21: [{ t: 0, x: -3.2, z: 1.2, act: 'defend' }, { t: 2.6, x: -2.88, z: 1.45, act: 'defend' }],
          b44: [{ t: 0, x: 2, z: 4.3, act: 'defend' }, { t: 2.6, x: 4.23, z: 4.45, act: 'defend' }]
        },
        corner: {
          b1: [{ t: 0, x: 1.71, z: 4.65, act: 'defend' }, { t: 2.6, x: 1.26, z: 5.15, act: 'defend' }],
          b7: [{ t: 0, x: 5.76, z: 0.4, act: 'defend' }, { t: 2.6, x: 6.21, z: 2.35, act: 'defend' }],
          b15: [{ t: 0, x: -4.5, z: 4.45, act: 'defend' }, { t: 2.6, x: -4.05, z: 4.95, act: 'defend' }],
          b21: [{ t: 0, x: -2.88, z: 1.45, act: 'defend' }, { t: 2.6, x: -2.43, z: 1.95, act: 'defend' }],
          b44: [{ t: 0, x: 4.23, z: 4.45, act: 'defend' }, { t: 2.6, x: -3.96, z: 5.05, act: 'defend' }]
        }
      }
    },
    {
      id: 'blitz', weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -1, z: 7.6, act: 'defend' }, { t: 1.3, x: 1.3, z: 6.1, act: 'defend' }, { t: 2.8, x: 2.1, z: 4.4, act: 'defend' }],
          b7: [{ t: 0, x: 6, z: 1.5, act: 'defend' }, { t: 1.3, x: 6.3, z: 1, act: 'defend' }, { t: 2.8, x: 6.3, z: 0.5, act: 'defend' }],
          b15: [{ t: 0, x: -5, z: 3.7, act: 'defend' }, { t: 1.3, x: -5.6, z: 3.5, act: 'defend' }, { t: 2.8, x: -5, z: 4.1, act: 'defend' }],
          b21: [{ t: 0, x: -6.2, z: 0.5, act: 'defend' }, { t: 1.3, x: -4.8, z: 0.8, act: 'defend' }, { t: 2.8, x: -3.2, z: 1.2, act: 'defend' }],
          b44: [{ t: 0, x: 0.3, z: 5.4, act: 'defend' }, { t: 1.3, x: 1.5, z: 5.8, act: 'defend' }, { t: 2.8, x: 2.8, z: 5.1, act: 'defend' }]
        },
        pop: {
          b1: [{ t: 0, x: 2.1, z: 4.4, act: 'defend' }, { t: 2.6, x: 1.71, z: 4.65, act: 'defend' }],
          b7: [{ t: 0, x: 6.3, z: 0.5, act: 'defend' }, { t: 2.6, x: 5.76, z: 0.4, act: 'defend' }],
          b15: [{ t: 0, x: -5, z: 4.1, act: 'defend' }, { t: 2.6, x: -4.5, z: 4.45, act: 'defend' }],
          b21: [{ t: 0, x: -3.2, z: 1.2, act: 'defend' }, { t: 2.6, x: -2.88, z: 1.45, act: 'defend' }],
          b44: [{ t: 0, x: 2.8, z: 5.1, act: 'defend' }, { t: 2.6, x: 4.23, z: 4.45, act: 'defend' }]
        },
        corner: {
          b1: [{ t: 0, x: 1.71, z: 4.65, act: 'defend' }, { t: 2.6, x: 1.26, z: 5.15, act: 'defend' }],
          b7: [{ t: 0, x: 5.76, z: 0.4, act: 'defend' }, { t: 2.6, x: 6.21, z: 2.35, act: 'defend' }],
          b15: [{ t: 0, x: -4.5, z: 4.45, act: 'defend' }, { t: 2.6, x: -4.05, z: 4.95, act: 'defend' }],
          b21: [{ t: 0, x: -2.88, z: 1.45, act: 'defend' }, { t: 2.6, x: -2.43, z: 1.95, act: 'defend' }],
          b44: [{ t: 0, x: 4.23, z: 4.45, act: 'defend' }, { t: 2.6, x: -3.96, z: 5.05, act: 'defend' }]
        }
      }
    }
  ]
};


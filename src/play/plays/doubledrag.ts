import type { Play } from '../types';

// Der Wing besetzt den zweiten großen Slot, damit der vorhandene Kader tauschbar bleibt.
export const DOUBLEDRAG: Play = {
  id: 'doubledrag', name: 'Double Drag', clockS: 13, deficit: 2,
  actors: ['r3', 'r11', 'r23', 'r32', 'r50', 'b1', 'b7', 'b15', 'b21', 'b44'],
  start: 'setup',
  segments: {
    setup: {
      id: 'setup', handler: 'r3',
      paths: {
        r3: [{ t: 0, x: -1, z: 12, act: 'dribble' }, { t: 1.6, x: 0, z: 8.3, act: 'dribble' }, { t: 3.4, x: 3.2, z: 5.4, act: 'dribble' }, { t: 5.9, x: 3.2, z: 5.4, act: 'dribble' }],
        r11: [{ t: 0, x: 6, z: 10, act: 'run' }, { t: 1.6, x: 6.4, z: 5.2, act: 'run' }, { t: 3.4, x: 6.9, z: 0.6, act: 'run' }, { t: 5.9, x: 6.9, z: 0.6, act: 'run' }],
        r23: [{ t: 0, x: -6, z: 10, act: 'run' }, { t: 1.6, x: -6.4, z: 5.2, act: 'run' }, { t: 3.4, x: -6.9, z: 0.6, act: 'run' }, { t: 5.9, x: -6.9, z: 0.6, act: 'run' }],
        r32: [{ t: 0, x: 2.4, z: 8.6, act: 'run' }, { t: 1.6, x: 2.5, z: 6.4, act: 'screen' }, { t: 1.75, x: 2.5, z: 6.4, act: 'run' }, { t: 3.4, x: 1.9, z: 7, act: 'run' }, { t: 5.9, x: 1.9, z: 7, act: 'run' }],
        r50: [{ t: 0, x: 0.1, z: 9.6, act: 'run' }, { t: 1.6, x: 0.2, z: 7.8, act: 'screen' }, { t: 1.75, x: 0.2, z: 7.8, act: 'run' }, { t: 3.4, x: 0.6, z: 1.6, act: 'run' }, { t: 5.9, x: 0.6, z: 1.6, act: 'run' }]
      },
      decisionAt: 5.9, options: [{ kind: 'drive' }, { kind: 'pass', to: 'r50', next: 'roll' }, { kind: 'pass', to: 'r32', next: 'pop' }]
    },
    roll: {
      id: 'roll', handler: 'r50',
      paths: {
        r3: [{ t: 0, x: 3.2, z: 5.4, act: 'run' }, { t: 2.6, x: 3.65, z: 5.9, act: 'run' }],
        r11: [{ t: 0, x: 6.9, z: 0.6, act: 'run' }, { t: 2.6, x: 6.45, z: 1.1, act: 'run' }],
        r23: [{ t: 0, x: -6.9, z: 0.6, act: 'run' }, { t: 2.6, x: -6.45, z: 1.1, act: 'run' }],
        r32: [{ t: 0, x: 1.9, z: 7, act: 'run' }, { t: 2.6, x: 1.45, z: 7.5, act: 'run' }],
        r50: [{ t: 0, x: 0.6, z: 1.6, act: 'dribble' }, { t: 2.6, x: -5.8, z: 1.5, act: 'dribble' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }, { kind: 'drive' }]
    },
    pop: {
      id: 'pop', handler: 'r32',
      paths: {
        r3: [{ t: 0, x: 3.2, z: 5.4, act: 'run' }, { t: 2.6, x: 3.65, z: 5.9, act: 'run' }],
        r11: [{ t: 0, x: 6.9, z: 0.6, act: 'run' }, { t: 2.6, x: 6.45, z: 1.1, act: 'run' }],
        r23: [{ t: 0, x: -6.9, z: 0.6, act: 'run' }, { t: 2.6, x: -6.45, z: 1.1, act: 'run' }],
        r32: [{ t: 0, x: 1.9, z: 7, act: 'dribble' }, { t: 2.6, x: -4.4, z: 5.4, act: 'dribble' }],
        r50: [{ t: 0, x: 0.6, z: 1.6, act: 'run' }, { t: 2.6, x: 1.05, z: 2.1, act: 'run' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }, { kind: 'drive' }]
    }
  },
  variants: [
    {
      id: 'drop', weight: 3,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -0.93, z: 11.4, act: 'defend' }, { t: 1.6, x: 0, z: 7.7, act: 'defend' }, { t: 3.4, x: 2.976, z: 4.8, act: 'defend' }, { t: 5.9, x: 2.976, z: 4.8, act: 'defend' }],
          b7: [{ t: 0, x: 5.58, z: 9.4, act: 'defend' }, { t: 1.6, x: 5.952, z: 4.6, act: 'defend' }, { t: 3.4, x: 6.417, z: 0.25, act: 'defend' }, { t: 5.9, x: 6.417, z: 0.25, act: 'defend' }],
          b15: [{ t: 0, x: -5.58, z: 9.4, act: 'defend' }, { t: 1.6, x: -5.952, z: 4.6, act: 'defend' }, { t: 3.4, x: -6.417, z: 0.25, act: 'defend' }, { t: 5.9, x: -6.417, z: 0.25, act: 'defend' }],
          b21: [{ t: 0, x: 2, z: 7.8, act: 'defend' }, { t: 1.6, x: 2.2, z: 5.2, act: 'defend' }, { t: 3.4, x: 1.8, z: 4.4, act: 'defend' }, { t: 5.9, x: 1.8, z: 4.4, act: 'defend' }],
          b44: [{ t: 0, x: 0, z: 8.6, act: 'defend' }, { t: 1.6, x: 0.4, z: 5.8, act: 'defend' }, { t: 3.4, x: 0, z: 1.1, act: 'defend' }, { t: 5.9, x: 0, z: 1.1, act: 'defend' }]
        },
        roll: {
          b1: [{ t: 0, x: 2.976, z: 4.8, act: 'defend' }, { t: 2.6, x: 3.395, z: 5.3, act: 'defend' }],
          b7: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: 5.999, z: 0.5, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.5, act: 'defend' }],
          b21: [{ t: 0, x: 1.8, z: 4.4, act: 'defend' }, { t: 2.6, x: 1.349, z: 6.9, act: 'defend' }],
          b44: [{ t: 0, x: 0, z: 1.1, act: 'defend' }, { t: 2.6, x: -5.394, z: 0.9, act: 'defend' }]
        },
        pop: {
          b1: [{ t: 0, x: 2.976, z: 4.8, act: 'defend' }, { t: 2.6, x: 3.395, z: 5.3, act: 'defend' }],
          b7: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: 5.999, z: 0.5, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.5, act: 'defend' }],
          b21: [{ t: 0, x: 1.8, z: 4.4, act: 'defend' }, { t: 2.6, x: -4.092, z: 4.8, act: 'defend' }],
          b44: [{ t: 0, x: 0, z: 1.1, act: 'defend' }, { t: 2.6, x: 0.977, z: 1.5, act: 'defend' }]
        }
      }
    },
    {
      id: 'under', weight: 2,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -0.93, z: 10.1, act: 'defend' }, { t: 1.6, x: 0, z: 6.4, act: 'defend' }, { t: 3.4, x: 2.976, z: 3.5, act: 'defend' }, { t: 5.9, x: 2.976, z: 3.5, act: 'defend' }],
          b7: [{ t: 0, x: 5.58, z: 8.1, act: 'defend' }, { t: 1.6, x: 5.952, z: 3.3, act: 'defend' }, { t: 3.4, x: 6.417, z: 0.25, act: 'defend' }, { t: 5.9, x: 6.417, z: 0.25, act: 'defend' }],
          b15: [{ t: 0, x: -5.58, z: 8.1, act: 'defend' }, { t: 1.6, x: -5.952, z: 3.3, act: 'defend' }, { t: 3.4, x: -6.417, z: 0.25, act: 'defend' }, { t: 5.9, x: -6.417, z: 0.25, act: 'defend' }],
          b21: [{ t: 0, x: 2.232, z: 6.7, act: 'defend' }, { t: 1.6, x: 2.325, z: 4.5, act: 'defend' }, { t: 1.75, x: 2.325, z: 4.5, act: 'defend' }, { t: 3.4, x: 1.767, z: 5.1, act: 'defend' }, { t: 5.9, x: 1.767, z: 5.1, act: 'defend' }],
          b44: [{ t: 0, x: 0.093, z: 7.7, act: 'defend' }, { t: 1.6, x: 0.186, z: 5.9, act: 'defend' }, { t: 1.75, x: 0.186, z: 5.9, act: 'defend' }, { t: 3.4, x: 0.558, z: 0.25, act: 'defend' }, { t: 5.9, x: 0.558, z: 0.25, act: 'defend' }]
        },
        roll: {
          b1: [{ t: 0, x: 2.976, z: 3.5, act: 'defend' }, { t: 2.6, x: 3.395, z: 4, act: 'defend' }],
          b7: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: 5.999, z: 0.25, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.25, act: 'defend' }],
          b21: [{ t: 0, x: 1.767, z: 5.1, act: 'defend' }, { t: 2.6, x: 1.349, z: 5.6, act: 'defend' }],
          b44: [{ t: 0, x: 0.558, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.394, z: 0.25, act: 'defend' }]
        },
        pop: {
          b1: [{ t: 0, x: 2.976, z: 3.5, act: 'defend' }, { t: 2.6, x: 3.395, z: 4, act: 'defend' }],
          b7: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: 5.999, z: 0.25, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.25, act: 'defend' }],
          b21: [{ t: 0, x: 1.767, z: 5.1, act: 'defend' }, { t: 2.6, x: -4.092, z: 3.5, act: 'defend' }],
          b44: [{ t: 0, x: 0.558, z: 0.25, act: 'defend' }, { t: 2.6, x: 0.977, z: 0.25, act: 'defend' }]
        }
      }
    },
    {
      id: 'switch', weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -0.93, z: 11.5, act: 'defend' }, { t: 1.6, x: 0.149, z: 7.4, act: 'defend' }, { t: 1.75, x: 0.194, z: 7.332, act: 'defend' }, { t: 3.4, x: 0.558, z: 1.1, act: 'defend' }, { t: 5.9, x: 0.558, z: 1.1, act: 'defend' }],
          b7: [{ t: 0, x: 5.58, z: 9.5, act: 'defend' }, { t: 1.6, x: 5.952, z: 4.7, act: 'defend' }, { t: 3.4, x: 6.417, z: 0.25, act: 'defend' }, { t: 5.9, x: 6.417, z: 0.25, act: 'defend' }],
          b15: [{ t: 0, x: -5.58, z: 9.5, act: 'defend' }, { t: 1.6, x: -5.952, z: 4.7, act: 'defend' }, { t: 3.4, x: -6.417, z: 0.25, act: 'defend' }, { t: 5.9, x: -6.417, z: 0.25, act: 'defend' }],
          b21: [{ t: 0, x: 2.232, z: 8.1, act: 'defend' }, { t: 1.6, x: 0.465, z: 7.42, act: 'defend' }, { t: 3.4, x: 2.976, z: 4.9, act: 'defend' }, { t: 5.9, x: 2.976, z: 4.9, act: 'defend' }],
          b44: [{ t: 0, x: 0.093, z: 9.1, act: 'defend' }, { t: 1.6, x: 1.897, z: 6.18, act: 'defend' }, { t: 1.75, x: 2.058, z: 6.075, act: 'defend' }, { t: 3.4, x: 1.767, z: 6.5, act: 'defend' }, { t: 5.9, x: 1.767, z: 6.5, act: 'defend' }]
        },
        roll: {
          b1: [{ t: 0, x: 0.558, z: 1.1, act: 'defend' }, { t: 2.6, x: -5.394, z: 1, act: 'defend' }],
          b7: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: 5.999, z: 0.6, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.6, act: 'defend' }],
          b21: [{ t: 0, x: 2.976, z: 4.9, act: 'defend' }, { t: 2.6, x: 3.395, z: 5.4, act: 'defend' }],
          b44: [{ t: 0, x: 1.767, z: 6.5, act: 'defend' }, { t: 2.6, x: 1.349, z: 7, act: 'defend' }]
        },
        pop: {
          b1: [{ t: 0, x: 0.558, z: 1.1, act: 'defend' }, { t: 2.6, x: 0.977, z: 1.6, act: 'defend' }],
          b7: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: 5.999, z: 0.6, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.6, act: 'defend' }],
          b21: [{ t: 0, x: 2.976, z: 4.9, act: 'defend' }, { t: 2.6, x: 3.395, z: 5.4, act: 'defend' }],
          b44: [{ t: 0, x: 1.767, z: 6.5, act: 'defend' }, { t: 2.6, x: -4.092, z: 4.9, act: 'defend' }]
        }
      }
    }
  ]
};

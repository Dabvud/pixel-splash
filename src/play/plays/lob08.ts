import type { Play } from '../types';

export const LOB08: Play = {
  id: 'lob08', name: 'Lob vom Einwurf', clockS: 0.8, deficit: [1,2],
  actors: ['r3', 'r11', 'r23', 'r32', 'r50', 'b1', 'b7', 'b15', 'b21', 'b44'],
  start: 'setup', inboundBy: 'r3',
  segments: {
    setup: {
      id: 'setup', handler: 'r3',
      paths: {
        r3: [{ t: 0, x: 3, z: -1.4, act: 'inbound' }, { t: 0.6, x: 3, z: -1.4, act: 'inbound' }, { t: 1.3, x: 3, z: -1.4, act: 'inbound' }, { t: 3.8, x: 3, z: -1.4, act: 'inbound' }],
        r11: [{ t: 0, x: 6.5, z: 2, act: 'run' }, { t: 0.6, x: 6.7, z: 1.3, act: 'run' }, { t: 1.3, x: 6.9, z: 0.6, act: 'run' }, { t: 3.8, x: 6.9, z: 0.6, act: 'run' }],
        r23: [{ t: 0, x: -3, z: 2.5, act: 'run' }, { t: 0.6, x: -1.8, z: 1.6, act: 'run' }, { t: 1.3, x: -0.5, z: 0.9, act: 'run' }, { t: 3.8, x: -0.5, z: 0.9, act: 'run' }],
        r32: [{ t: 0, x: -2, z: 4.3, act: 'run' }, { t: 0.6, x: -1.2, z: 3.5, act: 'screen' }, { t: 1.3, x: -1.2, z: 3.5, act: 'screen' }, { t: 3.8, x: -1.2, z: 3.5, act: 'screen' }],
        r50: [{ t: 0, x: 2, z: 3.8, act: 'run' }, { t: 0.6, x: 1.4, z: 2.3, act: 'run' }, { t: 1.3, x: 0.6, z: 0.9, act: 'run' }, { t: 3.8, x: 0.6, z: 0.9, act: 'run' }]
      },
      decisionAt: 3.8, options: [{ kind: 'pass', to: 'r50', next: 'oop', lob: true }, { kind: 'pass', to: 'r23', next: 'tip', lob: true }]
    },
    oop: {
      id: 'oop', handler: 'r50',
      paths: {
        r3: [{ t: 0, x: 3, z: -1.4, act: 'run' }, { t: 0.3, x: 3.45, z: -0.9, act: 'run' }],
        r11: [{ t: 0, x: 6.9, z: 0.6, act: 'run' }, { t: 0.3, x: 6.45, z: 1.1, act: 'run' }],
        r23: [{ t: 0, x: -0.5, z: 0.9, act: 'run' }, { t: 0.3, x: -0.05, z: 1.4, act: 'run' }],
        r32: [{ t: 0, x: -1.2, z: 3.5, act: 'run' }, { t: 0.3, x: -1.65, z: 4, act: 'run' }],
        r50: [{ t: 0, x: 0.6, z: 0.9, act: 'dribble' }, { t: 0.3, x: 0.6, z: 0.9, act: 'dribble' }]
      },
      decisionAt: 0.3, options: [{ kind: 'shoot' }]
    },
    tip: {
      id: 'tip', handler: 'r23',
      paths: {
        r3: [{ t: 0, x: 3, z: -1.4, act: 'run' }, { t: 0.3, x: 3.45, z: -0.9, act: 'run' }],
        r11: [{ t: 0, x: 6.9, z: 0.6, act: 'run' }, { t: 0.3, x: 6.45, z: 1.1, act: 'run' }],
        r23: [{ t: 0, x: -0.5, z: 0.9, act: 'dribble' }, { t: 0.3, x: -0.5, z: 0.9, act: 'dribble' }],
        r32: [{ t: 0, x: -1.2, z: 3.5, act: 'run' }, { t: 0.3, x: -1.65, z: 4, act: 'run' }],
        r50: [{ t: 0, x: 0.6, z: 0.9, act: 'run' }, { t: 0.3, x: 1.05, z: 1.4, act: 'run' }]
      },
      decisionAt: 0.3, options: [{ kind: 'shoot' }]
    }
  },
  variants: [
    {
      id: 'front', weight: 3,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 2.79, z: 0.25, act: 'defend' }, { t: 0.6, x: 2.79, z: 0.25, act: 'defend' }, { t: 1.3, x: 2.79, z: 0.25, act: 'defend' }, { t: 3.8, x: 2.79, z: 0.25, act: 'defend' }],
          b7: [{ t: 0, x: 6.045, z: 1.4, act: 'defend' }, { t: 0.6, x: 6.231, z: 0.7, act: 'defend' }, { t: 1.3, x: 6.417, z: 0.25, act: 'defend' }, { t: 3.8, x: 6.417, z: 0.25, act: 'defend' }],
          b15: [{ t: 0, x: -2.5, z: 2.1, act: 'defend' }, { t: 0.6, x: -1.8, z: 1.5, act: 'defend' }, { t: 1.3, x: -1.3, z: 1.3, act: 'defend' }, { t: 3.8, x: -1.3, z: 1.3, act: 'defend' }],
          b21: [{ t: 0, x: -1.86, z: 3.7, act: 'defend' }, { t: 0.6, x: -1.116, z: 2.9, act: 'defend' }, { t: 1.3, x: -1.116, z: 2.9, act: 'defend' }, { t: 3.8, x: -1.116, z: 2.9, act: 'defend' }],
          b44: [{ t: 0, x: 2.2, z: 3.2, act: 'defend' }, { t: 0.6, x: 1.8, z: 1.7, act: 'defend' }, { t: 1.3, x: 1.4, z: 0.7, act: 'defend' }, { t: 3.8, x: 1.4, z: 0.7, act: 'defend' }]
        },
        oop: {
          b1: [{ t: 0, x: 2.79, z: 0.25, act: 'defend' }, { t: 0.3, x: 3.209, z: 0.25, act: 'defend' }],
          b7: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 0.3, x: 5.999, z: 0.5, act: 'defend' }],
          b15: [{ t: 0, x: -1.3, z: 1.3, act: 'defend' }, { t: 0.3, x: -0.047, z: 0.8, act: 'defend' }],
          b21: [{ t: 0, x: -1.116, z: 2.9, act: 'defend' }, { t: 0.3, x: -1.534, z: 3.4, act: 'defend' }],
          b44: [{ t: 0, x: 1.4, z: 0.7, act: 'defend' }, { t: 0.3, x: 0.558, z: 0.3, act: 'defend' }]
        },
        tip: {
          b1: [{ t: 0, x: 2.79, z: 0.25, act: 'defend' }, { t: 0.3, x: 3.209, z: 0.25, act: 'defend' }],
          b7: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 0.3, x: 5.999, z: 0.5, act: 'defend' }],
          b15: [{ t: 0, x: -1.3, z: 1.3, act: 'defend' }, { t: 0.3, x: -0.465, z: 0.3, act: 'defend' }],
          b21: [{ t: 0, x: -1.116, z: 2.9, act: 'defend' }, { t: 0.3, x: -1.534, z: 3.4, act: 'defend' }],
          b44: [{ t: 0, x: 1.4, z: 0.7, act: 'defend' }, { t: 0.3, x: 0.977, z: 0.8, act: 'defend' }]
        }
      }
    },
    {
      id: 'behind', weight: 2,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 2.79, z: 0.25, act: 'defend' }, { t: 0.6, x: 2.79, z: 0.25, act: 'defend' }, { t: 1.3, x: 2.79, z: 0.25, act: 'defend' }, { t: 3.8, x: 2.79, z: 0.25, act: 'defend' }],
          b7: [{ t: 0, x: 6.045, z: 1.4, act: 'defend' }, { t: 0.6, x: 6.231, z: 0.7, act: 'defend' }, { t: 1.3, x: 6.417, z: 0.25, act: 'defend' }, { t: 3.8, x: 6.417, z: 0.25, act: 'defend' }],
          b15: [{ t: 0, x: -3.1, z: 3.2, act: 'defend' }, { t: 0.6, x: -2, z: 2.3, act: 'defend' }, { t: 1.3, x: -0.8, z: 1.7, act: 'defend' }, { t: 3.8, x: -0.8, z: 1.7, act: 'defend' }],
          b21: [{ t: 0, x: -1.86, z: 3.7, act: 'defend' }, { t: 0.6, x: -1.116, z: 2.9, act: 'defend' }, { t: 1.3, x: -1.116, z: 2.9, act: 'defend' }, { t: 3.8, x: -1.116, z: 2.9, act: 'defend' }],
          b44: [{ t: 0, x: 1.7, z: 4.3, act: 'defend' }, { t: 0.6, x: 1.2, z: 3, act: 'defend' }, { t: 1.3, x: 0.3, z: 1.8, act: 'defend' }, { t: 3.8, x: 0.3, z: 1.8, act: 'defend' }]
        },
        oop: {
          b1: [{ t: 0, x: 2.79, z: 0.25, act: 'defend' }, { t: 0.3, x: 3.209, z: 0.25, act: 'defend' }],
          b7: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 0.3, x: 5.999, z: 0.5, act: 'defend' }],
          b15: [{ t: 0, x: -0.8, z: 1.7, act: 'defend' }, { t: 0.3, x: -0.047, z: 0.8, act: 'defend' }],
          b21: [{ t: 0, x: -1.116, z: 2.9, act: 'defend' }, { t: 0.3, x: -1.534, z: 3.4, act: 'defend' }],
          b44: [{ t: 0, x: 0.3, z: 1.8, act: 'defend' }, { t: 0.3, x: 0.558, z: 0.3, act: 'defend' }]
        },
        tip: {
          b1: [{ t: 0, x: 2.79, z: 0.25, act: 'defend' }, { t: 0.3, x: 3.209, z: 0.25, act: 'defend' }],
          b7: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 0.3, x: 5.999, z: 0.5, act: 'defend' }],
          b15: [{ t: 0, x: -0.8, z: 1.7, act: 'defend' }, { t: 0.3, x: -0.465, z: 0.3, act: 'defend' }],
          b21: [{ t: 0, x: -1.116, z: 2.9, act: 'defend' }, { t: 0.3, x: -1.534, z: 3.4, act: 'defend' }],
          b44: [{ t: 0, x: 0.3, z: 1.8, act: 'defend' }, { t: 0.3, x: 0.977, z: 0.8, act: 'defend' }]
        }
      }
    }
  ]
};

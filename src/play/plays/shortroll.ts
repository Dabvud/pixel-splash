import type { Play } from '../types';

// Der Wing besetzt den zweiten großen Slot, damit der vorhandene Kader tauschbar bleibt.
export const SHORTROLL: Play = {
  id: 'shortroll', name: 'Short Roll', clockS: 14, deficit: 2,
  actors: ['r3', 'r11', 'r23', 'r32', 'r50', 'b1', 'b7', 'b15', 'b21', 'b44'],
  start: 'setup',
  segments: {
    setup: {
      id: 'setup', handler: 'r3',
      paths: {
        r3: [{ t: 0, x: 0, z: 8.3, act: 'dribble' }, { t: 1.5, x: 2, z: 6.5, act: 'dribble' }, { t: 3.4, x: 3.4, z: 5.4, act: 'dribble' }, { t: 5.9, x: 3.4, z: 5.4, act: 'dribble' }],
        r11: [{ t: 0, x: 6.5, z: 2.2, act: 'run' }, { t: 1.5, x: 6.8, z: 1.2, act: 'run' }, { t: 3.4, x: 6.9, z: 0.6, act: 'run' }, { t: 5.9, x: 6.9, z: 0.6, act: 'run' }],
        r23: [{ t: 0, x: -5.3, z: 5, act: 'run' }, { t: 1.5, x: -5.9, z: 4.2, act: 'run' }, { t: 3.4, x: -6.5, z: 3, act: 'run' }, { t: 5.9, x: -6.5, z: 3, act: 'run' }],
        r32: [{ t: 0, x: -3, z: 1.5, act: 'run' }, { t: 1.5, x: -2.7, z: 1.2, act: 'run' }, { t: 3.4, x: -1.2, z: 1.1, act: 'run' }, { t: 5.9, x: -1.2, z: 1.1, act: 'run' }],
        r50: [{ t: 0, x: 1.3, z: 6.2, act: 'screen' }, { t: 0.15, x: 1.3, z: 6.2, act: 'run' }, { t: 1.5, x: 1.3, z: 5.7, act: 'screen' }, { t: 1.65, x: 1.3, z: 5.7, act: 'run' }, { t: 3.4, x: 0.2, z: 4.2, act: 'run' }, { t: 5.9, x: 0.2, z: 4.2, act: 'run' }]
      },
      decisionAt: 5.9, options: [{ kind: 'pass', to: 'r50', next: 'read' }, { kind: 'drive' }]
    },
    read: {
      id: 'read', handler: 'r50',
      paths: {
        r3: [{ t: 0, x: 3.4, z: 5.4, act: 'run' }, { t: 2.6, x: 3.85, z: 5.9, act: 'run' }],
        r11: [{ t: 0, x: 6.9, z: 0.6, act: 'run' }, { t: 2.6, x: 6.45, z: 1.1, act: 'run' }],
        r23: [{ t: 0, x: -6.5, z: 3, act: 'run' }, { t: 2.6, x: -6.05, z: 3.5, act: 'run' }],
        r32: [{ t: 0, x: -1.2, z: 1.1, act: 'run' }, { t: 2.6, x: 0.6, z: 1, act: 'run' }],
        r50: [{ t: 0, x: 0.2, z: 4.2, act: 'dribble' }, { t: 2.6, x: -6, z: 4, act: 'dribble' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }, { kind: 'pass', to: 'r32', next: 'lob', lob: true }, { kind: 'pass', to: 'r11', next: 'corner' }]
    },
    lob: {
      id: 'lob', handler: 'r32',
      paths: {
        r3: [{ t: 0, x: 3.85, z: 5.9, act: 'run' }, { t: 2.6, x: 4.3, z: 6.4, act: 'run' }],
        r11: [{ t: 0, x: 6.45, z: 1.1, act: 'run' }, { t: 2.6, x: 6, z: 1.6, act: 'run' }],
        r23: [{ t: 0, x: -6.05, z: 3.5, act: 'run' }, { t: 2.6, x: -5.6, z: 4, act: 'run' }],
        r32: [{ t: 0, x: 0.6, z: 1, act: 'dribble' }, { t: 2.6, x: -0.8, z: 1.1, act: 'dribble' }],
        r50: [{ t: 0, x: -6, z: 4, act: 'run' }, { t: 2.6, x: -5.55, z: 4.5, act: 'run' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }]
    },
    corner: {
      id: 'corner', handler: 'r11',
      paths: {
        r3: [{ t: 0, x: 3.85, z: 5.9, act: 'run' }, { t: 2.6, x: 4.3, z: 6.4, act: 'run' }],
        r11: [{ t: 0, x: 6.45, z: 1.1, act: 'dribble' }, { t: 2.6, x: 4.5, z: 5.4, act: 'dribble' }],
        r23: [{ t: 0, x: -6.05, z: 3.5, act: 'run' }, { t: 2.6, x: -5.6, z: 4, act: 'run' }],
        r32: [{ t: 0, x: 0.6, z: 1, act: 'run' }, { t: 2.6, x: 0.15, z: 1.5, act: 'run' }],
        r50: [{ t: 0, x: -6, z: 4, act: 'run' }, { t: 2.6, x: -5.55, z: 4.5, act: 'run' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }, { kind: 'drive' }]
    }
  },
  variants: [
    {
      id: 'blitz', weight: 3,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0, z: 7.6, act: 'defend' }, { t: 1.5, x: 2.2, z: 6.1, act: 'defend' }, { t: 3.4, x: 3, z: 5.1, act: 'defend' }, { t: 5.9, x: 3, z: 5.1, act: 'defend' }],
          b7: [{ t: 0, x: 6.045, z: 1.6, act: 'defend' }, { t: 1.5, x: 6.324, z: 0.6, act: 'defend' }, { t: 3.4, x: 6.417, z: 0.25, act: 'defend' }, { t: 5.9, x: 6.417, z: 0.25, act: 'defend' }],
          b15: [{ t: 0, x: -4.929, z: 4.4, act: 'defend' }, { t: 1.5, x: -5.487, z: 3.6, act: 'defend' }, { t: 3.4, x: -6.045, z: 2.4, act: 'defend' }, { t: 5.9, x: -6.045, z: 2.4, act: 'defend' }],
          b21: [{ t: 0, x: -2.79, z: 0.9, act: 'defend' }, { t: 1.5, x: -2.511, z: 0.6, act: 'defend' }, { t: 3.4, x: -1.116, z: 0.5, act: 'defend' }, { t: 5.9, x: -1.116, z: 0.5, act: 'defend' }],
          b44: [{ t: 0, x: 1, z: 5.6, act: 'defend' }, { t: 1.5, x: 2.6, z: 6, act: 'defend' }, { t: 3.4, x: 3.7, z: 5.1, act: 'defend' }, { t: 5.9, x: 3.7, z: 5.1, act: 'defend' }]
        },
        read: {
          b1: [{ t: 0, x: 3, z: 5.1, act: 'defend' }, { t: 2.6, x: 3.581, z: 5.3, act: 'defend' }],
          b7: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: 5.999, z: 0.5, act: 'defend' }],
          b15: [{ t: 0, x: -6.045, z: 2.4, act: 'defend' }, { t: 2.6, x: -5.627, z: 2.9, act: 'defend' }],
          b21: [{ t: 0, x: -1.116, z: 0.5, act: 'defend' }, { t: 2.6, x: 0.558, z: 0.4, act: 'defend' }],
          b44: [{ t: 0, x: 3.7, z: 5.1, act: 'defend' }, { t: 2.6, x: -5.58, z: 3.4, act: 'defend' }]
        },
        lob: {
          b1: [{ t: 0, x: 3.581, z: 5.3, act: 'defend' }, { t: 2.6, x: 3.999, z: 5.8, act: 'defend' }],
          b7: [{ t: 0, x: 5.999, z: 0.5, act: 'defend' }, { t: 2.6, x: 5.58, z: 1, act: 'defend' }],
          b15: [{ t: 0, x: -5.627, z: 2.9, act: 'defend' }, { t: 2.6, x: -5.208, z: 3.4, act: 'defend' }],
          b21: [{ t: 0, x: 0.558, z: 0.4, act: 'defend' }, { t: 2.6, x: -0.744, z: 0.5, act: 'defend' }],
          b44: [{ t: 0, x: -5.58, z: 3.4, act: 'defend' }, { t: 2.6, x: -5.162, z: 3.9, act: 'defend' }]
        },
        corner: {
          b1: [{ t: 0, x: 3.581, z: 5.3, act: 'defend' }, { t: 2.6, x: 3.999, z: 5.8, act: 'defend' }],
          b7: [{ t: 0, x: 5.999, z: 0.5, act: 'defend' }, { t: 2.6, x: 4.185, z: 4.8, act: 'defend' }],
          b15: [{ t: 0, x: -5.627, z: 2.9, act: 'defend' }, { t: 2.6, x: -5.208, z: 3.4, act: 'defend' }],
          b21: [{ t: 0, x: 0.558, z: 0.4, act: 'defend' }, { t: 2.6, x: 0.14, z: 0.9, act: 'defend' }],
          b44: [{ t: 0, x: -5.58, z: 3.4, act: 'defend' }, { t: 2.6, x: -5.162, z: 3.9, act: 'defend' }]
        }
      }
    },
    {
      id: 'tag_roller', weight: 2,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0, z: 7.6, act: 'defend' }, { t: 1.5, x: 2.2, z: 6.1, act: 'defend' }, { t: 3.4, x: 3, z: 5.1, act: 'defend' }, { t: 5.9, x: 3, z: 5.1, act: 'defend' }],
          b7: [{ t: 0, x: 6.045, z: 1.6, act: 'defend' }, { t: 1.5, x: 6.324, z: 0.6, act: 'defend' }, { t: 3.4, x: 6.417, z: 0.25, act: 'defend' }, { t: 5.9, x: 6.417, z: 0.25, act: 'defend' }],
          b15: [{ t: 0, x: -4.929, z: 4.4, act: 'defend' }, { t: 1.5, x: -5.487, z: 3.6, act: 'defend' }, { t: 3.4, x: -6.045, z: 2.4, act: 'defend' }, { t: 5.9, x: -6.045, z: 2.4, act: 'defend' }],
          b21: [{ t: 0, x: -2.7, z: 1.2, act: 'defend' }, { t: 1.5, x: -1.4, z: 2.5, act: 'defend' }, { t: 3.4, x: 0, z: 3.6, act: 'defend' }, { t: 5.9, x: 0, z: 3.6, act: 'defend' }],
          b44: [{ t: 0, x: 1, z: 5.6, act: 'defend' }, { t: 1.5, x: 2.6, z: 6, act: 'defend' }, { t: 3.4, x: 3.7, z: 5.1, act: 'defend' }, { t: 5.9, x: 3.7, z: 5.1, act: 'defend' }]
        },
        read: {
          b1: [{ t: 0, x: 3, z: 5.1, act: 'defend' }, { t: 2.6, x: 3.581, z: 5.3, act: 'defend' }],
          b7: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: 5.999, z: 0.5, act: 'defend' }],
          b15: [{ t: 0, x: -6.045, z: 2.4, act: 'defend' }, { t: 2.6, x: -5.627, z: 2.9, act: 'defend' }],
          b21: [{ t: 0, x: 0, z: 3.6, act: 'defend' }, { t: 2.6, x: 0.558, z: 0.4, act: 'defend' }],
          b44: [{ t: 0, x: 3.7, z: 5.1, act: 'defend' }, { t: 2.6, x: -5.58, z: 3.4, act: 'defend' }]
        },
        lob: {
          b1: [{ t: 0, x: 3.581, z: 5.3, act: 'defend' }, { t: 2.6, x: 3.999, z: 5.8, act: 'defend' }],
          b7: [{ t: 0, x: 5.999, z: 0.5, act: 'defend' }, { t: 2.6, x: 5.58, z: 1, act: 'defend' }],
          b15: [{ t: 0, x: -5.627, z: 2.9, act: 'defend' }, { t: 2.6, x: -5.208, z: 3.4, act: 'defend' }],
          b21: [{ t: 0, x: 0.558, z: 0.4, act: 'defend' }, { t: 2.6, x: -0.744, z: 0.5, act: 'defend' }],
          b44: [{ t: 0, x: -5.58, z: 3.4, act: 'defend' }, { t: 2.6, x: -5.162, z: 3.9, act: 'defend' }]
        },
        corner: {
          b1: [{ t: 0, x: 3.581, z: 5.3, act: 'defend' }, { t: 2.6, x: 3.999, z: 5.8, act: 'defend' }],
          b7: [{ t: 0, x: 5.999, z: 0.5, act: 'defend' }, { t: 2.6, x: 4.185, z: 4.8, act: 'defend' }],
          b15: [{ t: 0, x: -5.627, z: 2.9, act: 'defend' }, { t: 2.6, x: -5.208, z: 3.4, act: 'defend' }],
          b21: [{ t: 0, x: 0.558, z: 0.4, act: 'defend' }, { t: 2.6, x: 0.14, z: 0.9, act: 'defend' }],
          b44: [{ t: 0, x: -5.58, z: 3.4, act: 'defend' }, { t: 2.6, x: -5.162, z: 3.9, act: 'defend' }]
        }
      }
    },
    {
      id: 'corner_help', weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0, z: 7.6, act: 'defend' }, { t: 1.5, x: 2.2, z: 6.1, act: 'defend' }, { t: 3.4, x: 3, z: 5.1, act: 'defend' }, { t: 5.9, x: 3, z: 5.1, act: 'defend' }],
          b7: [{ t: 0, x: 6, z: 1.8, act: 'defend' }, { t: 1.5, x: 3.7, z: 2, act: 'defend' }, { t: 3.4, x: 1.4, z: 2.4, act: 'defend' }, { t: 5.9, x: 1.4, z: 2.4, act: 'defend' }],
          b15: [{ t: 0, x: -4.929, z: 4.4, act: 'defend' }, { t: 1.5, x: -5.487, z: 3.6, act: 'defend' }, { t: 3.4, x: -6.045, z: 2.4, act: 'defend' }, { t: 5.9, x: -6.045, z: 2.4, act: 'defend' }],
          b21: [{ t: 0, x: -2.79, z: 0.9, act: 'defend' }, { t: 1.5, x: -2.511, z: 0.6, act: 'defend' }, { t: 3.4, x: -1.116, z: 0.5, act: 'defend' }, { t: 5.9, x: -1.116, z: 0.5, act: 'defend' }],
          b44: [{ t: 0, x: 1, z: 5.6, act: 'defend' }, { t: 1.5, x: 2.6, z: 6, act: 'defend' }, { t: 3.4, x: 3.7, z: 5.1, act: 'defend' }, { t: 5.9, x: 3.7, z: 5.1, act: 'defend' }]
        },
        read: {
          b1: [{ t: 0, x: 3, z: 5.1, act: 'defend' }, { t: 2.6, x: 3.581, z: 5.3, act: 'defend' }],
          b7: [{ t: 0, x: 1.4, z: 2.4, act: 'defend' }, { t: 2.6, x: 5.999, z: 0.5, act: 'defend' }],
          b15: [{ t: 0, x: -6.045, z: 2.4, act: 'defend' }, { t: 2.6, x: -5.627, z: 2.9, act: 'defend' }],
          b21: [{ t: 0, x: -1.116, z: 0.5, act: 'defend' }, { t: 2.6, x: 0.558, z: 0.4, act: 'defend' }],
          b44: [{ t: 0, x: 3.7, z: 5.1, act: 'defend' }, { t: 2.6, x: -5.58, z: 3.4, act: 'defend' }]
        },
        lob: {
          b1: [{ t: 0, x: 3.581, z: 5.3, act: 'defend' }, { t: 2.6, x: 3.999, z: 5.8, act: 'defend' }],
          b7: [{ t: 0, x: 5.999, z: 0.5, act: 'defend' }, { t: 2.6, x: 5.58, z: 1, act: 'defend' }],
          b15: [{ t: 0, x: -5.627, z: 2.9, act: 'defend' }, { t: 2.6, x: -5.208, z: 3.4, act: 'defend' }],
          b21: [{ t: 0, x: 0.558, z: 0.4, act: 'defend' }, { t: 2.6, x: -0.744, z: 0.5, act: 'defend' }],
          b44: [{ t: 0, x: -5.58, z: 3.4, act: 'defend' }, { t: 2.6, x: -5.162, z: 3.9, act: 'defend' }]
        },
        corner: {
          b1: [{ t: 0, x: 3.581, z: 5.3, act: 'defend' }, { t: 2.6, x: 3.999, z: 5.8, act: 'defend' }],
          b7: [{ t: 0, x: 5.999, z: 0.5, act: 'defend' }, { t: 2.6, x: 4.185, z: 4.8, act: 'defend' }],
          b15: [{ t: 0, x: -5.627, z: 2.9, act: 'defend' }, { t: 2.6, x: -5.208, z: 3.4, act: 'defend' }],
          b21: [{ t: 0, x: 0.558, z: 0.4, act: 'defend' }, { t: 2.6, x: 0.14, z: 0.9, act: 'defend' }],
          b44: [{ t: 0, x: -5.58, z: 3.4, act: 'defend' }, { t: 2.6, x: -5.162, z: 3.9, act: 'defend' }]
        }
      }
    }
  ]
};

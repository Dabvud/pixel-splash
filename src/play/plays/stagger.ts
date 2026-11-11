import type { Play } from '../types';

// Der Wing besetzt den zweiten großen Slot, damit der vorhandene Kader tauschbar bleibt.
export const STAGGER: Play = {
  id: 'stagger', name: 'Stagger für den Dreier', clockS: 13, deficit: 2,
  actors: ['r3', 'r11', 'r23', 'r32', 'r50', 'b1', 'b7', 'b15', 'b21', 'b44'],
  start: 'setup',
  segments: {
    setup: {
      id: 'setup', handler: 'r3',
      paths: {
        r3: [{ t: 0, x: -2.5, z: 7.5, act: 'dribble' }, { t: 1.6, x: -2, z: 7.1, act: 'dribble' }, { t: 3.6, x: -1.5, z: 7.2, act: 'dribble' }, { t: 6.1, x: -1.5, z: 7.2, act: 'dribble' }],
        r11: [{ t: 0, x: -5, z: 0.5, act: 'run' }, { t: 1.6, x: -0.8, z: 2.5, act: 'run' }, { t: 3.6, x: 5.3, z: 4.6, act: 'run' }, { t: 6.1, x: 5.3, z: 4.6, act: 'run' }],
        r23: [{ t: 0, x: -6.7, z: 2, act: 'run' }, { t: 1.6, x: -6.8, z: 1.2, act: 'run' }, { t: 3.6, x: -6.9, z: 0.6, act: 'run' }, { t: 6.1, x: -6.9, z: 0.6, act: 'run' }],
        r32: [{ t: 0, x: 1, z: 5, act: 'run' }, { t: 1.6, x: 2.4, z: 4, act: 'screen' }, { t: 3.6, x: 2.4, z: 4, act: 'screen' }, { t: 6.1, x: 2.4, z: 4, act: 'screen' }],
        r50: [{ t: 0, x: -1, z: 4, act: 'run' }, { t: 1.6, x: -0.7, z: 2.7, act: 'screen' }, { t: 3.6, x: -0.7, z: 2.7, act: 'screen' }, { t: 6.1, x: -0.7, z: 2.7, act: 'screen' }]
      },
      decisionAt: 6.1, options: [{ kind: 'pass', to: 'r11', next: 'wing' }, { kind: 'pass', to: 'r50', next: 'slip' }]
    },
    wing: {
      id: 'wing', handler: 'r11',
      paths: {
        r3: [{ t: 0, x: -1.5, z: 7.2, act: 'run' }, { t: 2.6, x: -1.05, z: 7.7, act: 'run' }],
        r11: [{ t: 0, x: 5.3, z: 4.6, act: 'dribble' }, { t: 2.6, x: -1.1, z: 7.1, act: 'dribble' }],
        r23: [{ t: 0, x: -6.9, z: 0.6, act: 'run' }, { t: 2.6, x: -6.45, z: 1.1, act: 'run' }],
        r32: [{ t: 0, x: 2.4, z: 4, act: 'run' }, { t: 2.6, x: 1.95, z: 4.5, act: 'run' }],
        r50: [{ t: 0, x: -0.7, z: 2.7, act: 'run' }, { t: 2.6, x: -0.25, z: 3.2, act: 'run' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }, { kind: 'drive' }]
    },
    slip: {
      id: 'slip', handler: 'r50',
      paths: {
        r3: [{ t: 0, x: -1.5, z: 7.2, act: 'run' }, { t: 2.6, x: -1.05, z: 7.7, act: 'run' }],
        r11: [{ t: 0, x: 5.3, z: 4.6, act: 'run' }, { t: 2.6, x: 4.85, z: 5.1, act: 'run' }],
        r23: [{ t: 0, x: -6.9, z: 0.6, act: 'run' }, { t: 2.6, x: -6.45, z: 1.1, act: 'run' }],
        r32: [{ t: 0, x: 2.4, z: 4, act: 'run' }, { t: 2.6, x: 1.95, z: 4.5, act: 'run' }],
        r50: [{ t: 0, x: -0.7, z: 2.7, act: 'dribble' }, { t: 2.6, x: 5.8, z: 1.3, act: 'dribble' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }, { kind: 'drive' }]
    }
  },
  variants: [
    {
      id: 'trail', weight: 3,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -2.325, z: 8.2, act: 'defend' }, { t: 1.6, x: -1.86, z: 7.8, act: 'defend' }, { t: 3.6, x: -1.395, z: 7.9, act: 'defend' }, { t: 6.1, x: -1.395, z: 7.9, act: 'defend' }],
          b7: [{ t: 0, x: -4.65, z: 1.2, act: 'defend' }, { t: 1.6, x: -0.744, z: 3.2, act: 'defend' }, { t: 3.6, x: 4.929, z: 5.3, act: 'defend' }, { t: 6.1, x: 4.929, z: 5.3, act: 'defend' }],
          b15: [{ t: 0, x: -6.231, z: 2.7, act: 'defend' }, { t: 1.6, x: -6.324, z: 1.9, act: 'defend' }, { t: 3.6, x: -6.417, z: 1.3, act: 'defend' }, { t: 6.1, x: -6.417, z: 1.3, act: 'defend' }],
          b21: [{ t: 0, x: 0.93, z: 5.7, act: 'defend' }, { t: 1.6, x: 2.232, z: 4.7, act: 'defend' }, { t: 3.6, x: 2.232, z: 4.7, act: 'defend' }, { t: 6.1, x: 2.232, z: 4.7, act: 'defend' }],
          b44: [{ t: 0, x: -0.93, z: 4.7, act: 'defend' }, { t: 1.6, x: -0.651, z: 3.4, act: 'defend' }, { t: 3.6, x: -0.651, z: 3.4, act: 'defend' }, { t: 6.1, x: -0.651, z: 3.4, act: 'defend' }]
        },
        wing: {
          b1: [{ t: 0, x: -1.395, z: 7.9, act: 'defend' }, { t: 2.6, x: -0.977, z: 8.4, act: 'defend' }],
          b7: [{ t: 0, x: 4.929, z: 5.3, act: 'defend' }, { t: 2.6, x: -1.023, z: 7.8, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 1.3, act: 'defend' }, { t: 2.6, x: -5.999, z: 1.8, act: 'defend' }],
          b21: [{ t: 0, x: 2.232, z: 4.7, act: 'defend' }, { t: 2.6, x: 1.814, z: 5.2, act: 'defend' }],
          b44: [{ t: 0, x: -0.651, z: 3.4, act: 'defend' }, { t: 2.6, x: -0.233, z: 3.9, act: 'defend' }]
        },
        slip: {
          b1: [{ t: 0, x: -1.395, z: 7.9, act: 'defend' }, { t: 2.6, x: -0.977, z: 8.4, act: 'defend' }],
          b7: [{ t: 0, x: 4.929, z: 5.3, act: 'defend' }, { t: 2.6, x: 4.51, z: 5.8, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 1.3, act: 'defend' }, { t: 2.6, x: -5.999, z: 1.8, act: 'defend' }],
          b21: [{ t: 0, x: 2.232, z: 4.7, act: 'defend' }, { t: 2.6, x: 1.814, z: 5.2, act: 'defend' }],
          b44: [{ t: 0, x: -0.651, z: 3.4, act: 'defend' }, { t: 2.6, x: 5.394, z: 2, act: 'defend' }]
        }
      }
    },
    {
      id: 'under', weight: 2,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -2.325, z: 5.7, act: 'defend' }, { t: 1.6, x: -1.86, z: 5.3, act: 'defend' }, { t: 3.6, x: -1.395, z: 5.4, act: 'defend' }, { t: 6.1, x: -1.395, z: 5.4, act: 'defend' }],
          b7: [{ t: 0, x: -4.65, z: 0.25, act: 'defend' }, { t: 1.6, x: -0.744, z: 0.7, act: 'defend' }, { t: 3.6, x: 4.929, z: 2.8, act: 'defend' }, { t: 6.1, x: 4.929, z: 2.8, act: 'defend' }],
          b15: [{ t: 0, x: -6.231, z: 0.25, act: 'defend' }, { t: 1.6, x: -6.324, z: 0.25, act: 'defend' }, { t: 3.6, x: -6.417, z: 0.25, act: 'defend' }, { t: 6.1, x: -6.417, z: 0.25, act: 'defend' }],
          b21: [{ t: 0, x: 0.93, z: 3.2, act: 'defend' }, { t: 1.6, x: 2.232, z: 2.2, act: 'defend' }, { t: 3.6, x: 2.232, z: 2.2, act: 'defend' }, { t: 6.1, x: 2.232, z: 2.2, act: 'defend' }],
          b44: [{ t: 0, x: -0.93, z: 2.2, act: 'defend' }, { t: 1.6, x: -0.651, z: 0.9, act: 'defend' }, { t: 3.6, x: -0.651, z: 0.9, act: 'defend' }, { t: 6.1, x: -0.651, z: 0.9, act: 'defend' }]
        },
        wing: {
          b1: [{ t: 0, x: -1.395, z: 5.4, act: 'defend' }, { t: 2.6, x: -0.977, z: 5.9, act: 'defend' }],
          b7: [{ t: 0, x: 4.929, z: 2.8, act: 'defend' }, { t: 2.6, x: -1.023, z: 5.3, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.25, act: 'defend' }],
          b21: [{ t: 0, x: 2.232, z: 2.2, act: 'defend' }, { t: 2.6, x: 1.814, z: 2.7, act: 'defend' }],
          b44: [{ t: 0, x: -0.651, z: 0.9, act: 'defend' }, { t: 2.6, x: -0.233, z: 1.4, act: 'defend' }]
        },
        slip: {
          b1: [{ t: 0, x: -1.395, z: 5.4, act: 'defend' }, { t: 2.6, x: -0.977, z: 5.9, act: 'defend' }],
          b7: [{ t: 0, x: 4.929, z: 2.8, act: 'defend' }, { t: 2.6, x: 4.51, z: 3.3, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.25, act: 'defend' }],
          b21: [{ t: 0, x: 2.232, z: 2.2, act: 'defend' }, { t: 2.6, x: 1.814, z: 2.7, act: 'defend' }],
          b44: [{ t: 0, x: -0.651, z: 0.9, act: 'defend' }, { t: 2.6, x: 5.394, z: 0.25, act: 'defend' }]
        }
      }
    },
    {
      id: 'switch', weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -2.325, z: 7.1, act: 'defend' }, { t: 1.6, x: -1.86, z: 6.7, act: 'defend' }, { t: 3.6, x: -1.395, z: 6.8, act: 'defend' }, { t: 6.1, x: -1.395, z: 6.8, act: 'defend' }],
          b7: [{ t: 0, x: -4.65, z: 0.25, act: 'defend' }, { t: 1.6, x: 1.637, z: 3.3, act: 'defend' }, { t: 3.6, x: 2.232, z: 3.6, act: 'defend' }, { t: 6.1, x: 2.232, z: 3.6, act: 'defend' }],
          b15: [{ t: 0, x: -6.231, z: 1.6, act: 'defend' }, { t: 1.6, x: -6.324, z: 0.8, act: 'defend' }, { t: 3.6, x: -6.417, z: 0.25, act: 'defend' }, { t: 6.1, x: -6.417, z: 0.25, act: 'defend' }],
          b21: [{ t: 0, x: 0.93, z: 4.6, act: 'defend' }, { t: 1.6, x: -0.149, z: 2.4, act: 'defend' }, { t: 3.6, x: 4.929, z: 4.2, act: 'defend' }, { t: 6.1, x: 4.929, z: 4.2, act: 'defend' }],
          b44: [{ t: 0, x: -0.93, z: 3.6, act: 'defend' }, { t: 1.6, x: -0.651, z: 2.3, act: 'defend' }, { t: 3.6, x: -0.651, z: 2.3, act: 'defend' }, { t: 6.1, x: -0.651, z: 2.3, act: 'defend' }]
        },
        wing: {
          b1: [{ t: 0, x: -1.395, z: 6.8, act: 'defend' }, { t: 2.6, x: -0.977, z: 7.3, act: 'defend' }],
          b7: [{ t: 0, x: 2.232, z: 3.6, act: 'defend' }, { t: 2.6, x: 1.813, z: 4.1, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.7, act: 'defend' }],
          b21: [{ t: 0, x: 4.929, z: 4.2, act: 'defend' }, { t: 2.6, x: -1.023, z: 6.7, act: 'defend' }],
          b44: [{ t: 0, x: -0.651, z: 2.3, act: 'defend' }, { t: 2.6, x: -0.233, z: 2.8, act: 'defend' }]
        },
        slip: {
          b1: [{ t: 0, x: -1.395, z: 6.8, act: 'defend' }, { t: 2.6, x: -0.977, z: 7.3, act: 'defend' }],
          b7: [{ t: 0, x: 2.232, z: 3.6, act: 'defend' }, { t: 2.6, x: 1.814, z: 4.1, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.7, act: 'defend' }],
          b21: [{ t: 0, x: 4.929, z: 4.2, act: 'defend' }, { t: 2.6, x: 4.51, z: 4.7, act: 'defend' }],
          b44: [{ t: 0, x: -0.651, z: 2.3, act: 'defend' }, { t: 2.6, x: 5.394, z: 0.9, act: 'defend' }]
        }
      }
    }
  ]
};

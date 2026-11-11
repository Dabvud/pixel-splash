import type { Play } from '../types';

export const SLOB: Play = {
  id: 'slob', name: 'Seiteneinwurf (SLOB)', clockS: 4, deficit: [1,3],
  actors: ['r3', 'r11', 'r23', 'r32', 'r50', 'b1', 'b7', 'b15', 'b21', 'b44'],
  start: 'setup', inboundBy: 'r3',
  segments: {
    setup: {
      id: 'setup', handler: 'r3',
      paths: {
        r3: [{ t: 0, x: 7.3, z: 5.8, act: 'inbound' }, { t: 1.4, x: 7.3, z: 5.8, act: 'inbound' }, { t: 2.8, x: 7.3, z: 5.8, act: 'inbound' }, { t: 5.3, x: 7.3, z: 5.8, act: 'inbound' }],
        r11: [{ t: 0, x: -0.8, z: 1.3, act: 'run' }, { t: 1.4, x: 2.4, z: 3.8, act: 'run' }, { t: 2.8, x: 5.4, z: 4.3, act: 'run' }, { t: 5.3, x: 5.4, z: 4.3, act: 'run' }],
        r23: [{ t: 0, x: -6.8, z: 2, act: 'run' }, { t: 1.4, x: -6.8, z: 1.1, act: 'run' }, { t: 2.8, x: -6.9, z: 0.6, act: 'run' }, { t: 5.3, x: -6.9, z: 0.6, act: 'run' }],
        r32: [{ t: 0, x: -2, z: 3.8, act: 'run' }, { t: 1.4, x: -1, z: 4.6, act: 'screen' }, { t: 2.8, x: -1, z: 4.6, act: 'screen' }, { t: 5.3, x: -1, z: 4.6, act: 'screen' }],
        r50: [{ t: 0, x: 2.4, z: 4.2, act: 'screen' }, { t: 1.4, x: 2.4, z: 4.2, act: 'screen' }, { t: 1.5499999999999998, x: 2.4, z: 4.2, act: 'run' }, { t: 2.8, x: 0.6, z: 1.3, act: 'run' }, { t: 5.3, x: 0.6, z: 1.3, act: 'run' }]
      },
      decisionAt: 5.3, options: [{ kind: 'pass', to: 'r11', next: 'shot' }, { kind: 'pass', to: 'r50', next: 'lob', lob: true }]
    },
    shot: {
      id: 'shot', handler: 'r11',
      paths: {
        r3: [{ t: 0, x: 7.3, z: 5.8, act: 'run' }, { t: 2.6, x: 7.3, z: 6.3, act: 'run' }],
        r11: [{ t: 0, x: 5.4, z: 4.3, act: 'dribble' }, { t: 2.6, x: -1.1, z: 7, act: 'dribble' }],
        r23: [{ t: 0, x: -6.9, z: 0.6, act: 'run' }, { t: 2.6, x: -6.45, z: 1.1, act: 'run' }],
        r32: [{ t: 0, x: -1, z: 4.6, act: 'run' }, { t: 2.6, x: -1.45, z: 5.1, act: 'run' }],
        r50: [{ t: 0, x: 0.6, z: 1.3, act: 'run' }, { t: 2.6, x: 1.05, z: 1.8, act: 'run' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }, { kind: 'drive' }]
    },
    lob: {
      id: 'lob', handler: 'r50',
      paths: {
        r3: [{ t: 0, x: 7.3, z: 5.8, act: 'run' }, { t: 2.6, x: 7.3, z: 6.3, act: 'run' }],
        r11: [{ t: 0, x: 5.4, z: 4.3, act: 'run' }, { t: 2.6, x: 4.95, z: 4.8, act: 'run' }],
        r23: [{ t: 0, x: -6.9, z: 0.6, act: 'run' }, { t: 2.6, x: -6.45, z: 1.1, act: 'run' }],
        r32: [{ t: 0, x: -1, z: 4.6, act: 'run' }, { t: 2.6, x: -1.45, z: 5.1, act: 'run' }],
        r50: [{ t: 0, x: 0.6, z: 1.3, act: 'dribble' }, { t: 2.6, x: -0.8, z: 1.3, act: 'dribble' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }]
    }
  },
  variants: [
    {
      id: 'trail', weight: 3,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 6.789, z: 5.2, act: 'defend' }, { t: 1.4, x: 6.789, z: 5.2, act: 'defend' }, { t: 2.8, x: 6.789, z: 5.2, act: 'defend' }, { t: 5.3, x: 6.789, z: 5.2, act: 'defend' }],
          b7: [{ t: 0, x: -0.5, z: 1.9, act: 'defend' }, { t: 1.4, x: 1.8, z: 3, act: 'defend' }, { t: 2.8, x: 4.3, z: 3.6, act: 'defend' }, { t: 5.3, x: 4.3, z: 3.6, act: 'defend' }],
          b15: [{ t: 0, x: -6.324, z: 1.4, act: 'defend' }, { t: 1.4, x: -6.324, z: 0.5, act: 'defend' }, { t: 2.8, x: -6.417, z: 0.25, act: 'defend' }, { t: 5.3, x: -6.417, z: 0.25, act: 'defend' }],
          b21: [{ t: 0, x: -1.86, z: 3.2, act: 'defend' }, { t: 1.4, x: -0.93, z: 4, act: 'defend' }, { t: 2.8, x: -0.93, z: 4, act: 'defend' }, { t: 5.3, x: -0.93, z: 4, act: 'defend' }],
          b44: [{ t: 0, x: 2, z: 3.6, act: 'defend' }, { t: 1.4, x: 2, z: 3.4, act: 'defend' }, { t: 2.8, x: 1, z: 2.7, act: 'defend' }, { t: 5.3, x: 1, z: 2.7, act: 'defend' }]
        },
        shot: {
          b1: [{ t: 0, x: 6.789, z: 5.2, act: 'defend' }, { t: 2.6, x: 6.789, z: 5.7, act: 'defend' }],
          b7: [{ t: 0, x: 4.3, z: 3.6, act: 'defend' }, { t: 2.6, x: -1.023, z: 6.4, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.5, act: 'defend' }],
          b21: [{ t: 0, x: -0.93, z: 4, act: 'defend' }, { t: 2.6, x: -1.349, z: 4.5, act: 'defend' }],
          b44: [{ t: 0, x: 1, z: 2.7, act: 'defend' }, { t: 2.6, x: 0.977, z: 1.2, act: 'defend' }]
        },
        lob: {
          b1: [{ t: 0, x: 6.789, z: 5.2, act: 'defend' }, { t: 2.6, x: 6.789, z: 5.7, act: 'defend' }],
          b7: [{ t: 0, x: 4.3, z: 3.6, act: 'defend' }, { t: 2.6, x: 4.604, z: 4.2, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.5, act: 'defend' }],
          b21: [{ t: 0, x: -0.93, z: 4, act: 'defend' }, { t: 2.6, x: -1.349, z: 4.5, act: 'defend' }],
          b44: [{ t: 0, x: 1, z: 2.7, act: 'defend' }, { t: 2.6, x: -0.744, z: 0.7, act: 'defend' }]
        }
      }
    },
    {
      id: 'switch', weight: 2,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 6.789, z: 5.4, act: 'defend' }, { t: 1.4, x: 6.789, z: 5.4, act: 'defend' }, { t: 2.8, x: 6.789, z: 5.4, act: 'defend' }, { t: 5.3, x: 6.789, z: 5.4, act: 'defend' }],
          b7: [{ t: 0, x: -0.744, z: 0.9, act: 'defend' }, { t: 1.4, x: 2.232, z: 3.68, act: 'defend' }, { t: 1.5499999999999998, x: 2.299, z: 3.722, act: 'defend' }, { t: 2.8, x: 0.558, z: 0.9, act: 'defend' }, { t: 5.3, x: 0.558, z: 0.9, act: 'defend' }],
          b15: [{ t: 0, x: -6.324, z: 1.6, act: 'defend' }, { t: 1.4, x: -6.324, z: 0.7, act: 'defend' }, { t: 2.8, x: -6.417, z: 0.25, act: 'defend' }, { t: 5.3, x: -6.417, z: 0.25, act: 'defend' }],
          b21: [{ t: 0, x: -1.86, z: 3.4, act: 'defend' }, { t: 1.4, x: -0.93, z: 4.2, act: 'defend' }, { t: 2.8, x: -0.93, z: 4.2, act: 'defend' }, { t: 5.3, x: -0.93, z: 4.2, act: 'defend' }],
          b44: [{ t: 0, x: 2.232, z: 3.8, act: 'defend' }, { t: 1.4, x: 2.232, z: 3.52, act: 'defend' }, { t: 2.8, x: 5.022, z: 3.9, act: 'defend' }, { t: 5.3, x: 5.022, z: 3.9, act: 'defend' }]
        },
        shot: {
          b1: [{ t: 0, x: 6.789, z: 5.4, act: 'defend' }, { t: 2.6, x: 6.789, z: 5.9, act: 'defend' }],
          b7: [{ t: 0, x: 0.558, z: 0.9, act: 'defend' }, { t: 2.6, x: 0.977, z: 1.4, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.7, act: 'defend' }],
          b21: [{ t: 0, x: -0.93, z: 4.2, act: 'defend' }, { t: 2.6, x: -1.349, z: 4.7, act: 'defend' }],
          b44: [{ t: 0, x: 5.022, z: 3.9, act: 'defend' }, { t: 2.6, x: -1.023, z: 6.6, act: 'defend' }]
        },
        lob: {
          b1: [{ t: 0, x: 6.789, z: 5.4, act: 'defend' }, { t: 2.6, x: 6.789, z: 5.9, act: 'defend' }],
          b7: [{ t: 0, x: 0.558, z: 0.9, act: 'defend' }, { t: 2.6, x: -0.744, z: 0.9, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.7, act: 'defend' }],
          b21: [{ t: 0, x: -0.93, z: 4.2, act: 'defend' }, { t: 2.6, x: -1.349, z: 4.7, act: 'defend' }],
          b44: [{ t: 0, x: 5.022, z: 3.9, act: 'defend' }, { t: 2.6, x: 4.604, z: 4.4, act: 'defend' }]
        }
      }
    },
    {
      id: 'deny_shooter', weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 6.789, z: 5.2, act: 'defend' }, { t: 1.4, x: 6.789, z: 5.2, act: 'defend' }, { t: 2.8, x: 6.789, z: 5.2, act: 'defend' }, { t: 5.3, x: 6.789, z: 5.2, act: 'defend' }],
          b7: [{ t: 0, x: 0.1, z: 2, act: 'defend' }, { t: 1.4, x: 3, z: 4.6, act: 'defend' }, { t: 2.8, x: 6, z: 4.8, act: 'defend' }, { t: 5.3, x: 6, z: 4.8, act: 'defend' }],
          b15: [{ t: 0, x: -6.324, z: 1.4, act: 'defend' }, { t: 1.4, x: -6.324, z: 0.5, act: 'defend' }, { t: 2.8, x: -6.417, z: 0.25, act: 'defend' }, { t: 5.3, x: -6.417, z: 0.25, act: 'defend' }],
          b21: [{ t: 0, x: -1.86, z: 3.2, act: 'defend' }, { t: 1.4, x: -0.93, z: 4, act: 'defend' }, { t: 2.8, x: -0.93, z: 4, act: 'defend' }, { t: 5.3, x: -0.93, z: 4, act: 'defend' }],
          b44: [{ t: 0, x: 2, z: 3.6, act: 'defend' }, { t: 1.4, x: 2.4, z: 2.4, act: 'defend' }, { t: 2.8, x: 1.2, z: 0.4, act: 'defend' }, { t: 5.3, x: 1.2, z: 0.4, act: 'defend' }]
        },
        shot: {
          b1: [{ t: 0, x: 6.789, z: 5.2, act: 'defend' }, { t: 2.6, x: 6.789, z: 5.7, act: 'defend' }],
          b7: [{ t: 0, x: 6, z: 4.8, act: 'defend' }, { t: 2.6, x: -1.023, z: 6.4, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.5, act: 'defend' }],
          b21: [{ t: 0, x: -0.93, z: 4, act: 'defend' }, { t: 2.6, x: -1.349, z: 4.5, act: 'defend' }],
          b44: [{ t: 0, x: 1.2, z: 0.4, act: 'defend' }, { t: 2.6, x: 0.977, z: 1.2, act: 'defend' }]
        },
        lob: {
          b1: [{ t: 0, x: 6.789, z: 5.2, act: 'defend' }, { t: 2.6, x: 6.789, z: 5.7, act: 'defend' }],
          b7: [{ t: 0, x: 6, z: 4.8, act: 'defend' }, { t: 2.6, x: 4.604, z: 4.2, act: 'defend' }],
          b15: [{ t: 0, x: -6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: -5.999, z: 0.5, act: 'defend' }],
          b21: [{ t: 0, x: -0.93, z: 4, act: 'defend' }, { t: 2.6, x: -1.349, z: 4.5, act: 'defend' }],
          b44: [{ t: 0, x: 1.2, z: 0.4, act: 'defend' }, { t: 2.6, x: -0.744, z: 0.7, act: 'defend' }]
        }
      }
    }
  ]
};

import type { Play } from '../types';

export const THREEONTWO: Play = {
  id: 'threeontwo', name: '3-gegen-2 Konter', clockS: 8, deficit: 2,
  actors: ['r3', 'r11', 'r23', 'b1', 'b44'],
  start: 'setup',
  segments: {
    setup: {
      id: 'setup', handler: 'r3',
      paths: {
        r3: [{ t: 0, x: 0, z: 11.8, act: 'dribble' }, { t: 1.3, x: 0, z: 8, act: 'dribble' }, { t: 2.8, x: -0.3, z: 4.4, act: 'dribble' }],
        r11: [{ t: 0, x: -5.8, z: 10.6, act: 'run' }, { t: 1.3, x: -5.4, z: 6.6, act: 'run' }, { t: 2.8, x: -5, z: 4.8, act: 'run' }],
        r23: [{ t: 0, x: 4.6, z: 10.3, act: 'run' }, { t: 1.3, x: 3.2, z: 5.5, act: 'run' }, { t: 2.8, x: 1, z: 1.2, act: 'run' }]
      },
      decisionAt: 2.8,
      options: [{ kind: 'pass', to: 'r11', next: 'wing' }, { kind: 'shoot' }, { kind: 'pass', to: 'r23', next: 'lob', lob: true }]
    },
    wing: {
      id: 'wing', handler: 'r11',
      paths: {
        r3: [{ t: 0, x: -0.3, z: 4.4, act: 'run' }, { t: 2.6, x: 0.2, z: 4.9, act: 'run' }],
        r11: [{ t: 0, x: -5, z: 4.8, act: 'dribble' }, { t: 1.3, x: -2, z: 7.1, act: 'dribble' }, { t: 2.6, x: 2, z: 6.8, act: 'dribble' }],
        r23: [{ t: 0, x: 1, z: 1.2, act: 'run' }, { t: 2.6, x: 1, z: 1, act: 'run' }]
      },
      decisionAt: 2.6,
      options: [{ kind: 'shoot' }, { kind: 'drive' }, { kind: 'pass', to: 'r23', next: 'wing_lob', lob: true }]
    },
    lob: {
      id: 'lob', handler: 'r23',
      paths: {
        r3: [{ t: 0, x: -0.3, z: 4.4, act: 'run' }, { t: 2.6, x: 0.2, z: 4.9, act: 'run' }],
        r11: [{ t: 0, x: -5, z: 4.8, act: 'run' }, { t: 2.6, x: -4.5, z: 5.3, act: 'run' }],
        r23: [{ t: 0, x: 1, z: 1.2, act: 'dribble' }, { t: 2.6, x: -0.6, z: 1.2, act: 'dribble' }]
      },
      decisionAt: 2.6,
      options: [{ kind: 'shoot' }, { kind: 'drive' }]
    },
    wing_lob: {
      id: 'wing_lob', handler: 'r23',
      paths: {
        r3: [{ t: 0, x: 0.2, z: 4.9, act: 'run' }, { t: 2.6, x: -0.3, z: 5.4, act: 'run' }],
        r11: [{ t: 0, x: 2, z: 6.8, act: 'run' }, { t: 2.6, x: -2.9, z: 3.3, act: 'run' }],
        r23: [{ t: 0, x: 1, z: 1, act: 'dribble' }, { t: 2.6, x: -0.6, z: 1.2, act: 'dribble' }]
      },
      decisionAt: 2.6,
      options: [{ kind: 'shoot' }, { kind: 'drive' }]
    }
  },
  variants: [
    {
      id: 'stop_ball', weight: 3,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0, z: 7.2, act: 'defend' }, { t: 1.3, x: 0, z: 5.8, act: 'defend' }, { t: 2.8, x: -0.3, z: 3.8, act: 'defend' }],
          b44: [{ t: 0, x: 0.5, z: 3.8, act: 'defend' }, { t: 1.3, x: 1.6, z: 2.8, act: 'defend' }, { t: 2.8, x: 2.1, z: 1.3, act: 'defend' }]
        },
        wing: {
          b1: [{ t: 0, x: -0.3, z: 3.8, act: 'defend' }, { t: 2.6, x: 0.18, z: 4.25, act: 'defend' }],
          b44: [{ t: 0, x: 2.1, z: 1.3, act: 'defend' }, { t: 2.6, x: 1.8, z: 1, act: 'defend' }]
        },
        lob: {
          b1: [{ t: 0, x: -0.3, z: 3.8, act: 'defend' }, { t: 2.6, x: 0.18, z: 4.25, act: 'defend' }],
          b44: [{ t: 0, x: 2.1, z: 1.3, act: 'defend' }, { t: 2.6, x: 1.8, z: 1, act: 'defend' }]
        },
        wing_lob: {
          b1: [{ t: 0, x: 0.18, z: 4.25, act: 'defend' }, { t: 2.6, x: -0.27, z: 4.75, act: 'defend' }],
          b44: [{ t: 0, x: 1.8, z: 1, act: 'defend' }, { t: 2.6, x: 1.8, z: 1, act: 'defend' }]
        }
      }
    },
    {
      id: 'cover_wings', weight: 2,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -1, z: 7.2, act: 'defend' }, { t: 1.3, x: -3.1, z: 5.6, act: 'defend' }, { t: 2.8, x: -4.6, z: 4.2, act: 'defend' }],
          b44: [{ t: 0, x: 0.5, z: 3.8, act: 'defend' }, { t: 1.3, x: 1.6, z: 2.1, act: 'defend' }, { t: 2.8, x: 1, z: 0.6, act: 'defend' }]
        },
        wing: {
          b1: [{ t: 0, x: -4.6, z: 4.2, act: 'defend' }, { t: 2.6, x: 0.18, z: 4.25, act: 'defend' }],
          b44: [{ t: 0, x: 1, z: 0.6, act: 'defend' }, { t: 2.6, x: 0.7, z: 0.5, act: 'defend' }]
        },
        lob: {
          b1: [{ t: 0, x: -4.6, z: 4.2, act: 'defend' }, { t: 2.6, x: 0.18, z: 4.25, act: 'defend' }],
          b44: [{ t: 0, x: 1, z: 0.6, act: 'defend' }, { t: 2.6, x: 0.7, z: 0.5, act: 'defend' }]
        },
        wing_lob: {
          b1: [{ t: 0, x: 0.18, z: 4.25, act: 'defend' }, { t: 2.6, x: -0.27, z: 4.75, act: 'defend' }],
          b44: [{ t: 0, x: 0.7, z: 0.5, act: 'defend' }, { t: 2.6, x: 0.7, z: 0.5, act: 'defend' }]
        }
      }
    },
    {
      id: 'fake', weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0, z: 7.2, act: 'defend' }, { t: 1.3, x: -2.6, z: 5.4, act: 'defend' }, { t: 2.8, x: -0.2, z: 3, act: 'defend' }],
          b44: [{ t: 0, x: 0.5, z: 3.8, act: 'defend' }, { t: 1.3, x: 0.1, z: 2.3, act: 'defend' }, { t: 2.8, x: -0.7, z: 0.8, act: 'defend' }]
        },
        wing: {
          b1: [{ t: 0, x: -0.2, z: 3, act: 'defend' }, { t: 2.6, x: 0.18, z: 4.25, act: 'defend' }],
          b44: [{ t: 0, x: -0.7, z: 0.8, act: 'defend' }, { t: 2.6, x: 1.8, z: 1, act: 'defend' }]
        },
        lob: {
          b1: [{ t: 0, x: -0.2, z: 3, act: 'defend' }, { t: 2.6, x: 0.18, z: 4.25, act: 'defend' }],
          b44: [{ t: 0, x: -0.7, z: 0.8, act: 'defend' }, { t: 2.6, x: 1.8, z: 1, act: 'defend' }]
        },
        wing_lob: {
          b1: [{ t: 0, x: 0.18, z: 4.25, act: 'defend' }, { t: 2.6, x: -0.27, z: 4.75, act: 'defend' }],
          b44: [{ t: 0, x: 1.8, z: 1, act: 'defend' }, { t: 2.6, x: 1.8, z: 1, act: 'defend' }]
        }
      }
    }
  ]
};


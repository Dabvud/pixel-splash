import type { Play } from '../types';

export const ISO: Play = {
  id: 'iso', name: 'Isolation', clockS: 10, deficit: 2,
  actors: ['r3', 'r11', 'r23', 'r32', 'r50', 'b1', 'b7', 'b15', 'b21', 'b44'],
  start: 'setup',
  segments: {
    setup: {
      id: 'setup', handler: 'r3',
      paths: {
        r3: [{ t: 0, x: -4.2, z: 6, act: 'dribble' }, { t: 1.3, x: -3.2, z: 5.4, act: 'dribble' }, { t: 2.8, x: -4.4, z: 5.5, act: 'dribble' }],
        r11: [{ t: 0, x: 6.2, z: 2.2, act: 'run' }, { t: 1.3, x: 6.9, z: 1, act: 'run' }, { t: 2.8, x: 6.9, z: 0.5, act: 'run' }],
        r23: [{ t: 0, x: -3, z: 2, act: 'run' }, { t: 1.3, x: 0, z: 3.3, act: 'run' }, { t: 2.8, x: 3.5, z: 5.9, act: 'run' }],
        r32: [{ t: 0, x: -6.4, z: 0.5, act: 'run' }, { t: 1.3, x: -2.5, z: 1.5, act: 'run' }, { t: 2.8, x: 4.5, z: 3.3, act: 'run' }],
        r50: [{ t: 0, x: 0, z: 3, act: 'run' }, { t: 1.3, x: 1.8, z: 2.3, act: 'run' }, { t: 2.8, x: 2.2, z: 1.4, act: 'run' }]
      },
      decisionAt: 2.8,
      options: [{ kind: 'drive' }, { kind: 'shoot' }, { kind: 'pass', to: 'r11', next: 'kickout' }]
    },
    kickout: {
      id: 'kickout', handler: 'r11',
      paths: {
        r3: [{ t: 0, x: -4.4, z: 5.5, act: 'run' }, { t: 2.6, x: -3.9, z: 6, act: 'run' }],
        r11: [{ t: 0, x: 6.9, z: 0.5, act: 'dribble' }, { t: 1.3, x: 6.4, z: 4.2, act: 'dribble' }, { t: 2.6, x: 2.8, z: 6.9, act: 'dribble' }],
        r23: [{ t: 0, x: 3.5, z: 5.9, act: 'run' }, { t: 2.6, x: 3, z: 6.4, act: 'run' }],
        r32: [{ t: 0, x: 4.5, z: 3.3, act: 'run' }, { t: 2.6, x: 4, z: 3.8, act: 'run' }],
        r50: [{ t: 0, x: 2.2, z: 1.4, act: 'run' }, { t: 2.6, x: 1.7, z: 1.9, act: 'run' }]
      },
      decisionAt: 2.6,
      options: [{ kind: 'shoot' }, { kind: 'drive' }]
    }
  },
  variants: [
    {
      id: 'no_help', weight: 3,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -3.7, z: 5.5, act: 'defend' }, { t: 1.3, x: -2.7, z: 4.9, act: 'defend' }, { t: 2.8, x: -4, z: 5.1, act: 'defend' }],
          b7: [{ t: 0, x: 5.7, z: 2, act: 'defend' }, { t: 1.3, x: 6.2, z: 1, act: 'defend' }, { t: 2.8, x: 6.3, z: 0.5, act: 'defend' }],
          b15: [{ t: 0, x: 0, z: 3, act: 'defend' }, { t: 1.3, x: 1.6, z: 4.2, act: 'defend' }, { t: 2.8, x: 3, z: 5.4, act: 'defend' }],
          b21: [{ t: 0, x: -1, z: 1.8, act: 'defend' }, { t: 1.3, x: 2.5, z: 2, act: 'defend' }, { t: 2.8, x: 4, z: 3, act: 'defend' }],
          b44: [{ t: 0, x: 0.2, z: 2.5, act: 'defend' }, { t: 1.3, x: 1.5, z: 1.7, act: 'defend' }, { t: 2.8, x: 1.8, z: 1.2, act: 'defend' }]
        },
        kickout: {
          b1: [{ t: 0, x: -4, z: 5.1, act: 'defend' }, { t: 2.6, x: -3.51, z: 5.35, act: 'defend' }],
          b7: [{ t: 0, x: 6.3, z: 0.5, act: 'defend' }, { t: 2.6, x: 2.52, z: 6.25, act: 'defend' }],
          b15: [{ t: 0, x: 3, z: 5.4, act: 'defend' }, { t: 2.6, x: 2.7, z: 5.75, act: 'defend' }],
          b21: [{ t: 0, x: 4, z: 3, act: 'defend' }, { t: 2.6, x: 3.6, z: 3.15, act: 'defend' }],
          b44: [{ t: 0, x: 1.8, z: 1.2, act: 'defend' }, { t: 2.6, x: 1.53, z: 1.25, act: 'defend' }]
        }
      }
    },
    {
      id: 'help', weight: 2,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -3.7, z: 5.5, act: 'defend' }, { t: 1.3, x: -2.7, z: 4.9, act: 'defend' }, { t: 2.8, x: -4, z: 5.1, act: 'defend' }],
          b7: [{ t: 0, x: 5.7, z: 2, act: 'defend' }, { t: 1.3, x: 3.7, z: 1.6, act: 'defend' }, { t: 2.8, x: 0.6, z: 1, act: 'defend' }],
          b15: [{ t: 0, x: 0, z: 3, act: 'defend' }, { t: 1.3, x: 1.6, z: 4.2, act: 'defend' }, { t: 2.8, x: 3, z: 5.4, act: 'defend' }],
          b21: [{ t: 0, x: -1, z: 1.8, act: 'defend' }, { t: 1.3, x: 2.5, z: 2, act: 'defend' }, { t: 2.8, x: 4, z: 3, act: 'defend' }],
          b44: [{ t: 0, x: 0.2, z: 2.5, act: 'defend' }, { t: 1.3, x: 1.5, z: 1.7, act: 'defend' }, { t: 2.8, x: 1.8, z: 1.2, act: 'defend' }]
        },
        kickout: {
          b1: [{ t: 0, x: -4, z: 5.1, act: 'defend' }, { t: 2.6, x: -3.51, z: 5.35, act: 'defend' }],
          b7: [{ t: 0, x: 0.6, z: 1, act: 'defend' }, { t: 2.6, x: 2.52, z: 6.25, act: 'defend' }],
          b15: [{ t: 0, x: 3, z: 5.4, act: 'defend' }, { t: 2.6, x: 2.7, z: 5.75, act: 'defend' }],
          b21: [{ t: 0, x: 4, z: 3, act: 'defend' }, { t: 2.6, x: 3.6, z: 3.15, act: 'defend' }],
          b44: [{ t: 0, x: 1.8, z: 1.2, act: 'defend' }, { t: 2.6, x: 1.53, z: 1.25, act: 'defend' }]
        }
      }
    },
    {
      id: 'double', weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -3.7, z: 5.5, act: 'defend' }, { t: 1.3, x: -2.7, z: 4.9, act: 'defend' }, { t: 2.8, x: -4, z: 5.1, act: 'defend' }],
          b7: [{ t: 0, x: 5.7, z: 2, act: 'defend' }, { t: 1.3, x: 2, z: 3.2, act: 'defend' }, { t: 2.8, x: -3.4, z: 5.8, act: 'defend' }],
          b15: [{ t: 0, x: 0, z: 3, act: 'defend' }, { t: 1.3, x: 1.6, z: 4.2, act: 'defend' }, { t: 2.8, x: 3, z: 5.4, act: 'defend' }],
          b21: [{ t: 0, x: -1, z: 1.8, act: 'defend' }, { t: 1.3, x: 2.5, z: 2, act: 'defend' }, { t: 2.8, x: 4, z: 3, act: 'defend' }],
          b44: [{ t: 0, x: 0.2, z: 2.5, act: 'defend' }, { t: 1.3, x: 0.5, z: 1.7, act: 'defend' }, { t: 2.8, x: 0, z: 1, act: 'defend' }]
        },
        kickout: {
          b1: [{ t: 0, x: -4, z: 5.1, act: 'defend' }, { t: 2.6, x: -3.51, z: 5.35, act: 'defend' }],
          b7: [{ t: 0, x: -3.4, z: 5.8, act: 'defend' }, { t: 2.6, x: 2.52, z: 6.25, act: 'defend' }],
          b15: [{ t: 0, x: 3, z: 5.4, act: 'defend' }, { t: 2.6, x: 2.7, z: 5.75, act: 'defend' }],
          b21: [{ t: 0, x: 4, z: 3, act: 'defend' }, { t: 2.6, x: 3.6, z: 3.15, act: 'defend' }],
          b44: [{ t: 0, x: 0, z: 1, act: 'defend' }, { t: 2.6, x: 1.53, z: 1.25, act: 'defend' }]
        }
      }
    }
  ]
};


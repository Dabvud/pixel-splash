import type { Play } from '../types';

export const HAMMER: Play = {
  id: 'hammer', name: 'Hammer-Aktion', clockS: 12, deficit: 3,
  actors: ['r3', 'r11', 'r23', 'r32', 'r50', 'b1', 'b7', 'b15', 'b21', 'b44'],
  start: 'setup',
  segments: {
    setup: {
      id: 'setup', handler: 'r3',
      paths: {
        r3: [{ t: 0, x: -5, z: 5.2, act: 'dribble' }, { t: 1.3, x: -5.6, z: 2.5, act: 'dribble' }, { t: 2.8, x: -3, z: 0.1, act: 'dribble' }],
        r11: [{ t: 0, x: 4.6, z: 4.5, act: 'run' }, { t: 1.3, x: 5.8, z: 2.2, act: 'run' }, { t: 2.8, x: 6.9, z: 0.5, act: 'run' }],
        r50: [{ t: 0, x: 2.7, z: 1.5, act: 'run' }, { t: 1.3, x: 4.9, z: 1.9, act: 'screen' }, { t: 2.8, x: 4.9, z: 1.9, act: 'screen' }],
        r23: [{ t: 0, x: -4.5, z: 1.5, act: 'run' }, { t: 1.3, x: -4.7, z: 4, act: 'run' }, { t: 2.8, x: -4.5, z: 5.6, act: 'run' }],
        r32: [{ t: 0, x: 0, z: 5.5, act: 'run' }, { t: 1.3, x: 0.8, z: 6.4, act: 'run' }, { t: 2.8, x: 1.6, z: 6.9, act: 'run' }]
      },
      decisionAt: 2.8,
      options: [{ kind: 'pass', to: 'r11', next: 'corner' }, { kind: 'drive' }]
    },
    corner: {
      id: 'corner', handler: 'r11',
      paths: {
        r3: [{ t: 0, x: -3, z: 0.1, act: 'run' }, { t: 2.6, x: -2.5, z: 0.6, act: 'run' }],
        r11: [{ t: 0, x: 6.9, z: 0.5, act: 'dribble' }, { t: 1.3, x: 6.4, z: 4.2, act: 'dribble' }, { t: 2.6, x: 2.8, z: 6.9, act: 'dribble' }],
        r50: [{ t: 0, x: 4.9, z: 1.9, act: 'run' }, { t: 2.6, x: 4.4, z: 2.4, act: 'run' }],
        r23: [{ t: 0, x: -4.5, z: 5.6, act: 'run' }, { t: 2.6, x: -4, z: 6.1, act: 'run' }],
        r32: [{ t: 0, x: 1.6, z: 6.9, act: 'run' }, { t: 2.6, x: 1.1, z: 7.4, act: 'run' }]
      },
      decisionAt: 2.6,
      options: [{ kind: 'shoot' }, { kind: 'drive' }, { kind: 'pass', to: 'r32', next: 'extra_pass' }]
    },
    extra_pass: {
      id: 'extra_pass', handler: 'r32',
      paths: {
        r3: [{ t: 0, x: -2.5, z: 0.6, act: 'run' }, { t: 2.6, x: -2, z: 1.1, act: 'run' }],
        r11: [{ t: 0, x: 2.8, z: 6.9, act: 'run' }, { t: 2.6, x: 6.4, z: 3.5, act: 'run' }],
        r50: [{ t: 0, x: 4.4, z: 2.4, act: 'run' }, { t: 2.6, x: 3.9, z: 2.9, act: 'run' }],
        r23: [{ t: 0, x: -4, z: 6.1, act: 'run' }, { t: 2.6, x: -3.5, z: 6.6, act: 'run' }],
        r32: [{ t: 0, x: 1.1, z: 7.4, act: 'dribble' }, { t: 2.6, x: -0.5, z: 7, act: 'dribble' }]
      },
      decisionAt: 2.6,
      options: [{ kind: 'shoot' }, { kind: 'drive' }]
    }
  },
  variants: [
    {
      id: 'help', weight: 3,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -4.5, z: 4.7, act: 'defend' }, { t: 1.3, x: -5, z: 2.3, act: 'defend' }, { t: 2.8, x: -2.4, z: 0.5, act: 'defend' }],
          b7: [{ t: 0, x: 4.1, z: 4, act: 'defend' }, { t: 1.3, x: 4.8, z: 2.4, act: 'defend' }, { t: 2.8, x: 4.8, z: 1.5, act: 'defend' }],
          b15: [{ t: 0, x: -4, z: 1.3, act: 'defend' }, { t: 1.3, x: -4.2, z: 3.5, act: 'defend' }, { t: 2.8, x: -4, z: 5, act: 'defend' }],
          b21: [{ t: 0, x: 0, z: 5, act: 'defend' }, { t: 1.3, x: 0.7, z: 5.8, act: 'defend' }, { t: 2.8, x: 1.4, z: 6.3, act: 'defend' }],
          b44: [{ t: 0, x: 2.3, z: 1.1, act: 'defend' }, { t: 1.3, x: 1.1, z: 0.8, act: 'defend' }, { t: 2.8, x: 0, z: 0.6, act: 'defend' }]
        },
        corner: {
          b1: [{ t: 0, x: -2.4, z: 0.5, act: 'defend' }, { t: 2.6, x: -2.25, z: 0.4, act: 'defend' }],
          b7: [{ t: 0, x: 4.8, z: 1.5, act: 'defend' }, { t: 2.6, x: 2.52, z: 6.25, act: 'defend' }],
          b15: [{ t: 0, x: -4, z: 5, act: 'defend' }, { t: 2.6, x: -3.6, z: 5.45, act: 'defend' }],
          b21: [{ t: 0, x: 1.4, z: 6.3, act: 'defend' }, { t: 2.6, x: 0.99, z: 6.75, act: 'defend' }],
          b44: [{ t: 0, x: 0, z: 0.6, act: 'defend' }, { t: 2.6, x: 3.96, z: 1.75, act: 'defend' }]
        },
        extra_pass: {
          b1: [{ t: 0, x: -2.25, z: 0.4, act: 'defend' }, { t: 2.6, x: -1.8, z: 0.45, act: 'defend' }],
          b7: [{ t: 0, x: 2.52, z: 6.25, act: 'defend' }, { t: 2.6, x: 5.76, z: 2.85, act: 'defend' }],
          b15: [{ t: 0, x: -3.6, z: 5.45, act: 'defend' }, { t: 2.6, x: -3.15, z: 5.95, act: 'defend' }],
          b21: [{ t: 0, x: 0.99, z: 6.75, act: 'defend' }, { t: 2.6, x: -0.45, z: 6.35, act: 'defend' }],
          b44: [{ t: 0, x: 3.96, z: 1.75, act: 'defend' }, { t: 2.6, x: 3.51, z: 2.25, act: 'defend' }]
        }
      }
    },
    {
      id: 'stay_corner', weight: 2,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -4.5, z: 4.7, act: 'defend' }, { t: 1.3, x: -5, z: 2.3, act: 'defend' }, { t: 2.8, x: -2.4, z: 0.5, act: 'defend' }],
          b7: [{ t: 0, x: 4.1, z: 4, act: 'defend' }, { t: 1.3, x: 6, z: 2.4, act: 'defend' }, { t: 2.8, x: 6.4, z: 0.5, act: 'defend' }],
          b15: [{ t: 0, x: -4, z: 1.3, act: 'defend' }, { t: 1.3, x: -4.2, z: 3.5, act: 'defend' }, { t: 2.8, x: -4, z: 5, act: 'defend' }],
          b21: [{ t: 0, x: 0, z: 5, act: 'defend' }, { t: 1.3, x: 0.7, z: 5.8, act: 'defend' }, { t: 2.8, x: 1.4, z: 6.3, act: 'defend' }],
          b44: [{ t: 0, x: 2.3, z: 1.1, act: 'defend' }, { t: 1.3, x: 3, z: 1, act: 'defend' }, { t: 2.8, x: 4.2, z: 1.2, act: 'defend' }]
        },
        corner: {
          b1: [{ t: 0, x: -2.4, z: 0.5, act: 'defend' }, { t: 2.6, x: -2.25, z: 0.4, act: 'defend' }],
          b7: [{ t: 0, x: 6.4, z: 0.5, act: 'defend' }, { t: 2.6, x: 2.52, z: 6.25, act: 'defend' }],
          b15: [{ t: 0, x: -4, z: 5, act: 'defend' }, { t: 2.6, x: -3.6, z: 5.45, act: 'defend' }],
          b21: [{ t: 0, x: 1.4, z: 6.3, act: 'defend' }, { t: 2.6, x: 0.99, z: 6.75, act: 'defend' }],
          b44: [{ t: 0, x: 4.2, z: 1.2, act: 'defend' }, { t: 2.6, x: 3.96, z: 1.75, act: 'defend' }]
        },
        extra_pass: {
          b1: [{ t: 0, x: -2.25, z: 0.4, act: 'defend' }, { t: 2.6, x: -1.8, z: 0.45, act: 'defend' }],
          b7: [{ t: 0, x: 2.52, z: 6.25, act: 'defend' }, { t: 2.6, x: 5.76, z: 2.85, act: 'defend' }],
          b15: [{ t: 0, x: -3.6, z: 5.45, act: 'defend' }, { t: 2.6, x: -3.15, z: 5.95, act: 'defend' }],
          b21: [{ t: 0, x: 0.99, z: 6.75, act: 'defend' }, { t: 2.6, x: -0.45, z: 6.35, act: 'defend' }],
          b44: [{ t: 0, x: 3.96, z: 1.75, act: 'defend' }, { t: 2.6, x: 3.51, z: 2.25, act: 'defend' }]
        }
      }
    },
    {
      id: 'switch_screen', weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -4.5, z: 4.7, act: 'defend' }, { t: 1.3, x: -5, z: 2.3, act: 'defend' }, { t: 2.8, x: -2.4, z: 0.5, act: 'defend' }],
          b7: [{ t: 0, x: 4.1, z: 4, act: 'defend' }, { t: 1.3, x: 4.4, z: 2.3, act: 'defend' }, { t: 2.8, x: 4.5, z: 1.7, act: 'defend' }],
          b15: [{ t: 0, x: -4, z: 1.3, act: 'defend' }, { t: 1.3, x: -4.2, z: 3.5, act: 'defend' }, { t: 2.8, x: -4, z: 5, act: 'defend' }],
          b21: [{ t: 0, x: 0, z: 5, act: 'defend' }, { t: 1.3, x: 0.7, z: 5.8, act: 'defend' }, { t: 2.8, x: 1.4, z: 6.3, act: 'defend' }],
          b44: [{ t: 0, x: 2.3, z: 1.1, act: 'defend' }, { t: 1.3, x: 4.2, z: 1.2, act: 'defend' }, { t: 2.8, x: 6.1, z: 0.7, act: 'defend' }]
        },
        corner: {
          b1: [{ t: 0, x: -2.4, z: 0.5, act: 'defend' }, { t: 2.6, x: -2.25, z: 0.4, act: 'defend' }],
          b7: [{ t: 0, x: 4.5, z: 1.7, act: 'defend' }, { t: 2.6, x: 2.52, z: 6.25, act: 'defend' }],
          b15: [{ t: 0, x: -4, z: 5, act: 'defend' }, { t: 2.6, x: -3.6, z: 5.45, act: 'defend' }],
          b21: [{ t: 0, x: 1.4, z: 6.3, act: 'defend' }, { t: 2.6, x: 0.99, z: 6.75, act: 'defend' }],
          b44: [{ t: 0, x: 6.1, z: 0.7, act: 'defend' }, { t: 2.6, x: 3.96, z: 1.75, act: 'defend' }]
        },
        extra_pass: {
          b1: [{ t: 0, x: -2.25, z: 0.4, act: 'defend' }, { t: 2.6, x: -1.8, z: 0.45, act: 'defend' }],
          b7: [{ t: 0, x: 2.52, z: 6.25, act: 'defend' }, { t: 2.6, x: 5.76, z: 2.85, act: 'defend' }],
          b15: [{ t: 0, x: -3.6, z: 5.45, act: 'defend' }, { t: 2.6, x: -3.15, z: 5.95, act: 'defend' }],
          b21: [{ t: 0, x: 0.99, z: 6.75, act: 'defend' }, { t: 2.6, x: -0.45, z: 6.35, act: 'defend' }],
          b44: [{ t: 0, x: 3.96, z: 1.75, act: 'defend' }, { t: 2.6, x: 3.51, z: 2.25, act: 'defend' }]
        }
      }
    }
  ]
};


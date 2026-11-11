import type { Play } from '../types';

// Der Relaispass trennt Bodenpass und Lob auf denselben Cutter.
export const BACKDOOR: Play = {
  id: 'backdoor', name: 'Backdoor-Cut', clockS: 12, deficit: 2,
  actors: ['r3', 'r11', 'r23', 'r32', 'r50', 'b1', 'b7', 'b15', 'b21', 'b44'],
  start: 'setup',
  segments: {
    setup: {
      id: 'setup', handler: 'r3',
      paths: {
        r3: [{ t: 0, x: -1.5, z: 6, act: 'dribble' }, { t: 1.3, x: -1, z: 5.4, act: 'dribble' }, { t: 2.8, x: -1.2, z: 5, act: 'dribble' }],
        r23: [{ t: 0, x: -5.4, z: 4.6, act: 'run' }, { t: 1.3, x: -3.8, z: 3.8, act: 'run' }, { t: 2.8, x: -0.8, z: 1.1, act: 'run' }],
        r11: [{ t: 0, x: 5, z: 5.4, act: 'run' }, { t: 1.3, x: 4.5, z: 4.6, act: 'run' }, { t: 2.8, x: 3.6, z: 4.3, act: 'run' }],
        r32: [{ t: 0, x: -6.8, z: 0.5, act: 'run' }, { t: 1.3, x: -6.9, z: 1, act: 'run' }, { t: 2.8, x: -6.9, z: 2, act: 'run' }],
        r50: [{ t: 0, x: 1.6, z: 2.2, act: 'run' }, { t: 1.3, x: 2, z: 2, act: 'run' }, { t: 2.8, x: 2.6, z: 2, act: 'run' }]
      },
      decisionAt: 2.8,
      options: [{ kind: 'pass', to: 'r23', next: 'bounce_finish' }, { kind: 'pass', to: 'r11', next: 'relay' }]
    },
    bounce_finish: {
      id: 'bounce_finish', handler: 'r23',
      paths: {
        r3: [{ t: 0, x: -1.2, z: 5, act: 'run' }, { t: 2.6, x: -0.7, z: 5.5, act: 'run' }],
        r23: [{ t: 0, x: -0.8, z: 1.1, act: 'dribble' }, { t: 1.3, x: 0.2, z: 4.8, act: 'dribble' }, { t: 2.6, x: 3.9, z: 6.1, act: 'dribble' }],
        r11: [{ t: 0, x: 3.6, z: 4.3, act: 'run' }, { t: 2.6, x: 3.1, z: 4.8, act: 'run' }],
        r32: [{ t: 0, x: -6.9, z: 2, act: 'run' }, { t: 2.6, x: -6.4, z: 2.5, act: 'run' }],
        r50: [{ t: 0, x: 2.6, z: 2, act: 'run' }, { t: 2.6, x: 2.1, z: 2.5, act: 'run' }]
      },
      decisionAt: 2.6,
      options: [{ kind: 'shoot' }, { kind: 'drive' }, { kind: 'pass', to: 'r11', next: 'corner' }]
    },
    relay: {
      id: 'relay', handler: 'r11',
      paths: {
        r3: [{ t: 0, x: -1.2, z: 5, act: 'run' }, { t: 2.6, x: -0.7, z: 5.5, act: 'run' }],
        r23: [{ t: 0, x: -0.8, z: 1.1, act: 'run' }, { t: 2.6, x: 0.7, z: 1, act: 'run' }],
        r11: [{ t: 0, x: 3.6, z: 4.3, act: 'dribble' }, { t: 1.3, x: 0.4, z: 6.6, act: 'dribble' }, { t: 2.6, x: -3.6, z: 6.3, act: 'dribble' }],
        r32: [{ t: 0, x: -6.9, z: 2, act: 'run' }, { t: 2.6, x: -6.4, z: 2.5, act: 'run' }],
        r50: [{ t: 0, x: 2.6, z: 2, act: 'run' }, { t: 2.6, x: 2.1, z: 2.5, act: 'run' }]
      },
      decisionAt: 2.6,
      options: [{ kind: 'shoot' }, { kind: 'drive' }, { kind: 'pass', to: 'r23', next: 'lob_finish', lob: true }]
    },
    corner: {
      id: 'corner', handler: 'r11',
      paths: {
        r3: [{ t: 0, x: -0.7, z: 5.5, act: 'run' }, { t: 2.6, x: -0.2, z: 6, act: 'run' }],
        r23: [{ t: 0, x: 3.9, z: 6.1, act: 'run' }, { t: 2.6, x: 0.3, z: 1.7, act: 'run' }],
        r11: [{ t: 0, x: 3.1, z: 4.8, act: 'dribble' }, { t: 2.6, x: 6.8, z: 2, act: 'dribble' }],
        r32: [{ t: 0, x: -6.4, z: 2.5, act: 'run' }, { t: 2.6, x: -5.9, z: 3, act: 'run' }],
        r50: [{ t: 0, x: 2.1, z: 2.5, act: 'run' }, { t: 2.6, x: 1.6, z: 3, act: 'run' }]
      },
      decisionAt: 2.6,
      options: [{ kind: 'shoot' }, { kind: 'drive' }]
    },
    lob_finish: {
      id: 'lob_finish', handler: 'r23',
      paths: {
        r3: [{ t: 0, x: -0.7, z: 5.5, act: 'run' }, { t: 2.6, x: -0.2, z: 6, act: 'run' }],
        r23: [{ t: 0, x: 0.7, z: 1, act: 'dribble' }, { t: 2.6, x: -0.7, z: 1.2, act: 'dribble' }],
        r11: [{ t: 0, x: -3.6, z: 6.3, act: 'run' }, { t: 2.6, x: 4.3, z: 5.7, act: 'run' }],
        r32: [{ t: 0, x: -6.4, z: 2.5, act: 'run' }, { t: 2.6, x: -5.9, z: 3, act: 'run' }],
        r50: [{ t: 0, x: 2.1, z: 2.5, act: 'run' }, { t: 2.6, x: 1.6, z: 3, act: 'run' }]
      },
      decisionAt: 2.6,
      options: [{ kind: 'shoot' }, { kind: 'drive' }]
    }
  },
  variants: [
    {
      id: 'overplay', weight: 3,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -1.3, z: 5.4, act: 'defend' }, { t: 1.3, x: -0.8, z: 4.8, act: 'defend' }, { t: 2.8, x: -0.8, z: 4.4, act: 'defend' }],
          b7: [{ t: 0, x: 4.5, z: 4.9, act: 'defend' }, { t: 1.3, x: 4, z: 4, act: 'defend' }, { t: 2.8, x: 3.3, z: 3.7, act: 'defend' }],
          b15: [{ t: 0, x: -4.9, z: 5.2, act: 'defend' }, { t: 1.3, x: -4.4, z: 4.5, act: 'defend' }, { t: 2.8, x: -2.4, z: 3, act: 'defend' }],
          b21: [{ t: 0, x: -6.2, z: 0.6, act: 'defend' }, { t: 1.3, x: -6.2, z: 1, act: 'defend' }, { t: 2.8, x: -6.2, z: 1.8, act: 'defend' }],
          b44: [{ t: 0, x: 1.3, z: 1.8, act: 'defend' }, { t: 1.3, x: 1.5, z: 1.4, act: 'defend' }, { t: 2.8, x: 1.8, z: 1.4, act: 'defend' }]
        },
        bounce_finish: {
          b1: [{ t: 0, x: -0.8, z: 4.4, act: 'defend' }, { t: 2.6, x: -0.63, z: 4.85, act: 'defend' }],
          b7: [{ t: 0, x: 3.3, z: 3.7, act: 'defend' }, { t: 2.6, x: 2.79, z: 4.15, act: 'defend' }],
          b15: [{ t: 0, x: -2.4, z: 3, act: 'defend' }, { t: 2.6, x: 3.51, z: 5.45, act: 'defend' }],
          b21: [{ t: 0, x: -6.2, z: 1.8, act: 'defend' }, { t: 2.6, x: -5.76, z: 1.85, act: 'defend' }],
          b44: [{ t: 0, x: 1.8, z: 1.4, act: 'defend' }, { t: 2.6, x: 1.89, z: 1.85, act: 'defend' }]
        },
        relay: {
          b1: [{ t: 0, x: -0.8, z: 4.4, act: 'defend' }, { t: 2.6, x: -0.63, z: 4.85, act: 'defend' }],
          b7: [{ t: 0, x: 3.3, z: 3.7, act: 'defend' }, { t: 2.6, x: -3.24, z: 5.65, act: 'defend' }],
          b15: [{ t: 0, x: -2.4, z: 3, act: 'defend' }, { t: 2.6, x: -1.5, z: 2.6, act: 'defend' }],
          b21: [{ t: 0, x: -6.2, z: 1.8, act: 'defend' }, { t: 2.6, x: -5.76, z: 1.85, act: 'defend' }],
          b44: [{ t: 0, x: 1.8, z: 1.4, act: 'defend' }, { t: 2.6, x: 1.89, z: 1.85, act: 'defend' }]
        },
        corner: {
          b1: [{ t: 0, x: -0.63, z: 4.85, act: 'defend' }, { t: 2.6, x: -0.18, z: 5.35, act: 'defend' }],
          b7: [{ t: 0, x: 2.79, z: 4.15, act: 'defend' }, { t: 2.6, x: 6.12, z: 1.35, act: 'defend' }],
          b15: [{ t: 0, x: 3.51, z: 5.45, act: 'defend' }, { t: 2.6, x: 0.27, z: 1.05, act: 'defend' }],
          b21: [{ t: 0, x: -5.76, z: 1.85, act: 'defend' }, { t: 2.6, x: -5.31, z: 2.35, act: 'defend' }],
          b44: [{ t: 0, x: 1.89, z: 1.85, act: 'defend' }, { t: 2.6, x: 1.44, z: 2.35, act: 'defend' }]
        },
        lob_finish: {
          b1: [{ t: 0, x: -0.63, z: 4.85, act: 'defend' }, { t: 2.6, x: -0.18, z: 5.35, act: 'defend' }],
          b7: [{ t: 0, x: -3.24, z: 5.65, act: 'defend' }, { t: 2.6, x: 3.87, z: 5.05, act: 'defend' }],
          b15: [{ t: 0, x: 0.63, z: 0.4, act: 'defend' }, { t: 2.6, x: -0.63, z: 0.55, act: 'defend' }],
          b21: [{ t: 0, x: -5.76, z: 1.85, act: 'defend' }, { t: 2.6, x: -5.31, z: 2.35, act: 'defend' }],
          b44: [{ t: 0, x: 1.89, z: 1.85, act: 'defend' }, { t: 2.6, x: 1.44, z: 2.35, act: 'defend' }]
        }
      }
    },
    {
      id: 'stay', weight: 2,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -1.3, z: 5.4, act: 'defend' }, { t: 1.3, x: -0.8, z: 4.8, act: 'defend' }, { t: 2.8, x: -0.8, z: 4.4, act: 'defend' }],
          b7: [{ t: 0, x: 4.5, z: 4.9, act: 'defend' }, { t: 1.3, x: 4, z: 4, act: 'defend' }, { t: 2.8, x: 3.3, z: 3.7, act: 'defend' }],
          b15: [{ t: 0, x: -4.9, z: 4, act: 'defend' }, { t: 1.3, x: -3.1, z: 3, act: 'defend' }, { t: 2.8, x: -0.6, z: 0.6, act: 'defend' }],
          b21: [{ t: 0, x: -6.2, z: 0.6, act: 'defend' }, { t: 1.3, x: -6.2, z: 1, act: 'defend' }, { t: 2.8, x: -6.2, z: 1.8, act: 'defend' }],
          b44: [{ t: 0, x: 1.3, z: 1.8, act: 'defend' }, { t: 1.3, x: 1.5, z: 1.4, act: 'defend' }, { t: 2.8, x: 1.8, z: 1.4, act: 'defend' }]
        },
        bounce_finish: {
          b1: [{ t: 0, x: -0.8, z: 4.4, act: 'defend' }, { t: 2.6, x: -0.63, z: 4.85, act: 'defend' }],
          b7: [{ t: 0, x: 3.3, z: 3.7, act: 'defend' }, { t: 2.6, x: 2.79, z: 4.15, act: 'defend' }],
          b15: [{ t: 0, x: -0.6, z: 0.6, act: 'defend' }, { t: 2.6, x: 3.51, z: 5.45, act: 'defend' }],
          b21: [{ t: 0, x: -6.2, z: 1.8, act: 'defend' }, { t: 2.6, x: -5.76, z: 1.85, act: 'defend' }],
          b44: [{ t: 0, x: 1.8, z: 1.4, act: 'defend' }, { t: 2.6, x: 1.89, z: 1.85, act: 'defend' }]
        },
        relay: {
          b1: [{ t: 0, x: -0.8, z: 4.4, act: 'defend' }, { t: 2.6, x: -0.63, z: 4.85, act: 'defend' }],
          b7: [{ t: 0, x: 3.3, z: 3.7, act: 'defend' }, { t: 2.6, x: -3.24, z: 5.65, act: 'defend' }],
          b15: [{ t: 0, x: -0.6, z: 0.6, act: 'defend' }, { t: 2.6, x: 0.7, z: 0.6, act: 'defend' }],
          b21: [{ t: 0, x: -6.2, z: 1.8, act: 'defend' }, { t: 2.6, x: -5.76, z: 1.85, act: 'defend' }],
          b44: [{ t: 0, x: 1.8, z: 1.4, act: 'defend' }, { t: 2.6, x: 1.89, z: 1.85, act: 'defend' }]
        },
        corner: {
          b1: [{ t: 0, x: -0.63, z: 4.85, act: 'defend' }, { t: 2.6, x: -0.18, z: 5.35, act: 'defend' }],
          b7: [{ t: 0, x: 2.79, z: 4.15, act: 'defend' }, { t: 2.6, x: 6.12, z: 1.35, act: 'defend' }],
          b15: [{ t: 0, x: 3.51, z: 5.45, act: 'defend' }, { t: 2.6, x: 0.27, z: 1.05, act: 'defend' }],
          b21: [{ t: 0, x: -5.76, z: 1.85, act: 'defend' }, { t: 2.6, x: -5.31, z: 2.35, act: 'defend' }],
          b44: [{ t: 0, x: 1.89, z: 1.85, act: 'defend' }, { t: 2.6, x: 1.44, z: 2.35, act: 'defend' }]
        },
        lob_finish: {
          b1: [{ t: 0, x: -0.63, z: 4.85, act: 'defend' }, { t: 2.6, x: -0.18, z: 5.35, act: 'defend' }],
          b7: [{ t: 0, x: -3.24, z: 5.65, act: 'defend' }, { t: 2.6, x: 3.87, z: 5.05, act: 'defend' }],
          b15: [{ t: 0, x: 0.63, z: 0.4, act: 'defend' }, { t: 2.6, x: -0.63, z: 0.55, act: 'defend' }],
          b21: [{ t: 0, x: -5.76, z: 1.85, act: 'defend' }, { t: 2.6, x: -5.31, z: 2.35, act: 'defend' }],
          b44: [{ t: 0, x: 1.89, z: 1.85, act: 'defend' }, { t: 2.6, x: 1.44, z: 2.35, act: 'defend' }]
        }
      }
    },
    {
      id: 'rim_help', weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -1.3, z: 5.4, act: 'defend' }, { t: 1.3, x: -0.8, z: 4.8, act: 'defend' }, { t: 2.8, x: -0.8, z: 4.4, act: 'defend' }],
          b7: [{ t: 0, x: 4.5, z: 4.9, act: 'defend' }, { t: 1.3, x: 4, z: 4, act: 'defend' }, { t: 2.8, x: 3.3, z: 3.7, act: 'defend' }],
          b15: [{ t: 0, x: -4.9, z: 5.2, act: 'defend' }, { t: 1.3, x: -4.4, z: 4.5, act: 'defend' }, { t: 2.8, x: -2.4, z: 3, act: 'defend' }],
          b21: [{ t: 0, x: -6.2, z: 0.6, act: 'defend' }, { t: 1.3, x: -6.2, z: 1, act: 'defend' }, { t: 2.8, x: -6.2, z: 1.8, act: 'defend' }],
          b44: [{ t: 0, x: 1.3, z: 1.8, act: 'defend' }, { t: 1.3, x: 0.5, z: 1.2, act: 'defend' }, { t: 2.8, x: 0, z: 0.6, act: 'defend' }]
        },
        bounce_finish: {
          b1: [{ t: 0, x: -0.8, z: 4.4, act: 'defend' }, { t: 2.6, x: -0.63, z: 4.85, act: 'defend' }],
          b7: [{ t: 0, x: 3.3, z: 3.7, act: 'defend' }, { t: 2.6, x: 2.79, z: 4.15, act: 'defend' }],
          b15: [{ t: 0, x: -2.4, z: 3, act: 'defend' }, { t: 2.6, x: 3.51, z: 5.45, act: 'defend' }],
          b21: [{ t: 0, x: -6.2, z: 1.8, act: 'defend' }, { t: 2.6, x: -5.76, z: 1.85, act: 'defend' }],
          b44: [{ t: 0, x: 0, z: 0.6, act: 'defend' }, { t: 2.6, x: 1.89, z: 1.85, act: 'defend' }]
        },
        relay: {
          b1: [{ t: 0, x: -0.8, z: 4.4, act: 'defend' }, { t: 2.6, x: -0.63, z: 4.85, act: 'defend' }],
          b7: [{ t: 0, x: 3.3, z: 3.7, act: 'defend' }, { t: 2.6, x: -3.24, z: 5.65, act: 'defend' }],
          b15: [{ t: 0, x: -2.4, z: 3, act: 'defend' }, { t: 2.6, x: -1.5, z: 2.6, act: 'defend' }],
          b21: [{ t: 0, x: -6.2, z: 1.8, act: 'defend' }, { t: 2.6, x: -5.76, z: 1.85, act: 'defend' }],
          b44: [{ t: 0, x: 0, z: 0.6, act: 'defend' }, { t: 2.6, x: 0, z: 0.6, act: 'defend' }]
        },
        corner: {
          b1: [{ t: 0, x: -0.63, z: 4.85, act: 'defend' }, { t: 2.6, x: -0.18, z: 5.35, act: 'defend' }],
          b7: [{ t: 0, x: 2.79, z: 4.15, act: 'defend' }, { t: 2.6, x: 6.12, z: 1.35, act: 'defend' }],
          b15: [{ t: 0, x: 3.51, z: 5.45, act: 'defend' }, { t: 2.6, x: 0.27, z: 1.05, act: 'defend' }],
          b21: [{ t: 0, x: -5.76, z: 1.85, act: 'defend' }, { t: 2.6, x: -5.31, z: 2.35, act: 'defend' }],
          b44: [{ t: 0, x: 1.89, z: 1.85, act: 'defend' }, { t: 2.6, x: 1.44, z: 2.35, act: 'defend' }]
        },
        lob_finish: {
          b1: [{ t: 0, x: -0.63, z: 4.85, act: 'defend' }, { t: 2.6, x: -0.18, z: 5.35, act: 'defend' }],
          b7: [{ t: 0, x: -3.24, z: 5.65, act: 'defend' }, { t: 2.6, x: 3.87, z: 5.05, act: 'defend' }],
          b15: [{ t: 0, x: 0.63, z: 0.4, act: 'defend' }, { t: 2.6, x: -0.63, z: 0.55, act: 'defend' }],
          b21: [{ t: 0, x: -5.76, z: 1.85, act: 'defend' }, { t: 2.6, x: -5.31, z: 2.35, act: 'defend' }],
          b44: [{ t: 0, x: 1.89, z: 1.85, act: 'defend' }, { t: 2.6, x: 1.44, z: 2.35, act: 'defend' }]
        }
      }
    }
  ]
};


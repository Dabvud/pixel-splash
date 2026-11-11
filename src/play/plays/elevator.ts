import type { Play } from '../types';

// Der Wing besetzt den zweiten großen Slot, damit der vorhandene Kader tauschbar bleibt.
export const ELEVATOR: Play = {
  id: 'elevator', name: 'Elevator Doors', clockS: 13, deficit: 2,
  actors: ['r3', 'r11', 'r23', 'r32', 'r50', 'b1', 'b7', 'b15', 'b21', 'b44'],
  start: 'setup',
  segments: {
    setup: {
      id: 'setup', handler: 'r3',
      paths: {
        r3: [{ t: 0, x: -4.8, z: 6.4, act: 'dribble' }, { t: 1.5, x: -4.6, z: 6.1, act: 'dribble' }, { t: 3.4, x: -4.4, z: 5.8, act: 'dribble' }, { t: 5.9, x: -4.4, z: 5.8, act: 'dribble' }],
        r11: [{ t: 0, x: 0, z: 0.8, act: 'run' }, { t: 1.5, x: 0, z: 3.8, act: 'run' }, { t: 3.4, x: 0, z: 7.1, act: 'run' }, { t: 5.9, x: 0, z: 7.1, act: 'run' }],
        r23: [{ t: 0, x: 6.7, z: 1.8, act: 'run' }, { t: 1.5, x: 6.8, z: 1.1, act: 'run' }, { t: 3.4, x: 6.9, z: 0.6, act: 'run' }, { t: 5.9, x: 6.9, z: 0.6, act: 'run' }],
        r32: [{ t: 0, x: -1.5, z: 4.5, act: 'run' }, { t: 1.5, x: -1.3, z: 4.5, act: 'screen' }, { t: 1.65, x: -1.3, z: 4.5, act: 'run' }, { t: 3.4, x: -0.55, z: 4.5, act: 'screen' }, { t: 5.9, x: -0.55, z: 4.5, act: 'screen' }],
        r50: [{ t: 0, x: 1.5, z: 4.5, act: 'run' }, { t: 1.5, x: 1.3, z: 4.5, act: 'screen' }, { t: 1.65, x: 1.3, z: 4.5, act: 'run' }, { t: 3.4, x: 0.55, z: 4.5, act: 'screen' }, { t: 5.9, x: 0.55, z: 4.5, act: 'screen' }]
      },
      decisionAt: 5.9, options: [{ kind: 'pass', to: 'r11', next: 'three' }, { kind: 'pass', to: 'r23', next: 'outlet' }]
    },
    three: {
      id: 'three', handler: 'r11',
      paths: {
        r3: [{ t: 0, x: -4.4, z: 5.8, act: 'run' }, { t: 2.6, x: -3.95, z: 6.3, act: 'run' }],
        r11: [{ t: 0, x: 0, z: 7.1, act: 'dribble' }, { t: 2.6, x: 6.2, z: 3.7, act: 'dribble' }],
        r23: [{ t: 0, x: 6.9, z: 0.6, act: 'run' }, { t: 2.6, x: 7.3, z: 1.1, act: 'run' }],
        r32: [{ t: 0, x: -0.55, z: 4.5, act: 'run' }, { t: 2.6, x: -1, z: 5, act: 'run' }],
        r50: [{ t: 0, x: 0.55, z: 4.5, act: 'run' }, { t: 2.6, x: 1, z: 5, act: 'run' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }, { kind: 'pass', to: 'r23', next: 'outlet' }]
    },
    outlet: {
      id: 'outlet', handler: 'r23',
      paths: {
        r3: [{ t: 0, x: -4.4, z: 5.8, act: 'run' }, { t: 2.6, x: -3.95, z: 6.3, act: 'run' }],
        r11: [{ t: 0, x: 0, z: 7.1, act: 'run' }, { t: 2.6, x: -0.45, z: 7.6, act: 'run' }],
        r23: [{ t: 0, x: 6.9, z: 0.6, act: 'dribble' }, { t: 2.6, x: 3.1, z: 6.5, act: 'dribble' }],
        r32: [{ t: 0, x: -0.55, z: 4.5, act: 'run' }, { t: 2.6, x: -1, z: 5, act: 'run' }],
        r50: [{ t: 0, x: 0.55, z: 4.5, act: 'run' }, { t: 2.6, x: 1, z: 5, act: 'run' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }, { kind: 'drive' }]
    }
  },
  variants: [
    {
      id: 'caught_in_doors', weight: 3,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -4.464, z: 5.8, act: 'defend' }, { t: 1.5, x: -4.278, z: 5.5, act: 'defend' }, { t: 3.4, x: -4.092, z: 5.2, act: 'defend' }, { t: 5.9, x: -4.092, z: 5.2, act: 'defend' }],
          b7: [{ t: 0, x: 0, z: 1.5, act: 'defend' }, { t: 1.5, x: 0, z: 2.9, act: 'defend' }, { t: 3.4, x: 0, z: 3.7, act: 'defend' }, { t: 5.9, x: 0, z: 3.7, act: 'defend' }],
          b15: [{ t: 0, x: 6.231, z: 1.2, act: 'defend' }, { t: 1.5, x: 6.324, z: 0.5, act: 'defend' }, { t: 3.4, x: 6.417, z: 0.25, act: 'defend' }, { t: 5.9, x: 6.417, z: 0.25, act: 'defend' }],
          b21: [{ t: 0, x: -1.395, z: 3.9, act: 'defend' }, { t: 1.5, x: -1.209, z: 3.9, act: 'defend' }, { t: 1.65, x: -1.209, z: 3.9, act: 'defend' }, { t: 3.4, x: -0.512, z: 3.9, act: 'defend' }, { t: 5.9, x: -0.512, z: 3.9, act: 'defend' }],
          b44: [{ t: 0, x: 1.395, z: 3.9, act: 'defend' }, { t: 1.5, x: 1.209, z: 3.9, act: 'defend' }, { t: 1.65, x: 1.209, z: 3.9, act: 'defend' }, { t: 3.4, x: 0.512, z: 3.9, act: 'defend' }, { t: 5.9, x: 0.512, z: 3.9, act: 'defend' }]
        },
        three: {
          b1: [{ t: 0, x: -4.092, z: 5.2, act: 'defend' }, { t: 2.6, x: -3.674, z: 5.7, act: 'defend' }],
          b7: [{ t: 0, x: 0, z: 3.7, act: 'defend' }, { t: 2.6, x: 5.766, z: 3.1, act: 'defend' }],
          b15: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: 6.789, z: 0.5, act: 'defend' }],
          b21: [{ t: 0, x: -0.512, z: 3.9, act: 'defend' }, { t: 2.6, x: -0.93, z: 4.4, act: 'defend' }],
          b44: [{ t: 0, x: 0.512, z: 3.9, act: 'defend' }, { t: 2.6, x: 0.93, z: 4.4, act: 'defend' }]
        },
        outlet: {
          b1: [{ t: 0, x: -4.092, z: 5.2, act: 'defend' }, { t: 2.6, x: -3.674, z: 5.7, act: 'defend' }],
          b7: [{ t: 0, x: 0, z: 3.7, act: 'defend' }, { t: 2.6, x: -0.419, z: 7, act: 'defend' }],
          b15: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: 2.883, z: 5.9, act: 'defend' }],
          b21: [{ t: 0, x: -0.512, z: 3.9, act: 'defend' }, { t: 2.6, x: -0.93, z: 4.4, act: 'defend' }],
          b44: [{ t: 0, x: 0.512, z: 3.9, act: 'defend' }, { t: 2.6, x: 0.93, z: 4.4, act: 'defend' }]
        }
      }
    },
    {
      id: 'go_around', weight: 2,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -4.464, z: 5.8, act: 'defend' }, { t: 1.5, x: -4.278, z: 5.5, act: 'defend' }, { t: 3.4, x: -4.092, z: 5.2, act: 'defend' }, { t: 5.9, x: -4.092, z: 5.2, act: 'defend' }],
          b7: [{ t: 0, x: 0, z: 1.5, act: 'defend' }, { t: 1.5, x: 2.3, z: 4.1, act: 'defend' }, { t: 3.4, x: 1.3, z: 6.5, act: 'defend' }, { t: 5.9, x: 1.3, z: 6.5, act: 'defend' }],
          b15: [{ t: 0, x: 6.231, z: 1.2, act: 'defend' }, { t: 1.5, x: 6.324, z: 0.5, act: 'defend' }, { t: 3.4, x: 6.417, z: 0.25, act: 'defend' }, { t: 5.9, x: 6.417, z: 0.25, act: 'defend' }],
          b21: [{ t: 0, x: -1.395, z: 3.9, act: 'defend' }, { t: 1.5, x: -1.209, z: 3.9, act: 'defend' }, { t: 1.65, x: -1.209, z: 3.9, act: 'defend' }, { t: 3.4, x: -0.512, z: 3.9, act: 'defend' }, { t: 5.9, x: -0.512, z: 3.9, act: 'defend' }],
          b44: [{ t: 0, x: 1.395, z: 3.9, act: 'defend' }, { t: 1.5, x: 1.209, z: 3.9, act: 'defend' }, { t: 1.65, x: 1.209, z: 3.9, act: 'defend' }, { t: 3.4, x: 0.512, z: 3.9, act: 'defend' }, { t: 5.9, x: 0.512, z: 3.9, act: 'defend' }]
        },
        three: {
          b1: [{ t: 0, x: -4.092, z: 5.2, act: 'defend' }, { t: 2.6, x: -3.674, z: 5.7, act: 'defend' }],
          b7: [{ t: 0, x: 1.3, z: 6.5, act: 'defend' }, { t: 2.6, x: 5.766, z: 3.1, act: 'defend' }],
          b15: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: 6.789, z: 0.5, act: 'defend' }],
          b21: [{ t: 0, x: -0.512, z: 3.9, act: 'defend' }, { t: 2.6, x: -0.93, z: 4.4, act: 'defend' }],
          b44: [{ t: 0, x: 0.512, z: 3.9, act: 'defend' }, { t: 2.6, x: 0.93, z: 4.4, act: 'defend' }]
        },
        outlet: {
          b1: [{ t: 0, x: -4.092, z: 5.2, act: 'defend' }, { t: 2.6, x: -3.674, z: 5.7, act: 'defend' }],
          b7: [{ t: 0, x: 1.3, z: 6.5, act: 'defend' }, { t: 2.6, x: -0.419, z: 7, act: 'defend' }],
          b15: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: 2.883, z: 5.9, act: 'defend' }],
          b21: [{ t: 0, x: -0.512, z: 3.9, act: 'defend' }, { t: 2.6, x: -0.93, z: 4.4, act: 'defend' }],
          b44: [{ t: 0, x: 0.512, z: 3.9, act: 'defend' }, { t: 2.6, x: 0.93, z: 4.4, act: 'defend' }]
        }
      }
    },
    {
      id: 'switch', weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -4.464, z: 6, act: 'defend' }, { t: 1.5, x: -4.278, z: 5.7, act: 'defend' }, { t: 3.4, x: -4.092, z: 5.4, act: 'defend' }, { t: 5.9, x: -4.092, z: 5.4, act: 'defend' }],
          b7: [{ t: 0, x: 0, z: 0.4, act: 'defend' }, { t: 1.5, x: 0.907, z: 3.925, act: 'defend' }, { t: 1.65, x: 0.997, z: 4.023, act: 'defend' }, { t: 3.4, x: 0.512, z: 4.1, act: 'defend' }, { t: 5.9, x: 0.512, z: 4.1, act: 'defend' }],
          b15: [{ t: 0, x: 6.231, z: 1.4, act: 'defend' }, { t: 1.5, x: 6.324, z: 0.7, act: 'defend' }, { t: 3.4, x: 6.417, z: 0.25, act: 'defend' }, { t: 5.9, x: 6.417, z: 0.25, act: 'defend' }],
          b21: [{ t: 0, x: -1.395, z: 4.1, act: 'defend' }, { t: 1.5, x: -1.209, z: 4.1, act: 'defend' }, { t: 1.65, x: -1.209, z: 4.1, act: 'defend' }, { t: 3.4, x: -0.512, z: 4.1, act: 'defend' }, { t: 5.9, x: -0.512, z: 4.1, act: 'defend' }],
          b44: [{ t: 0, x: 1.395, z: 4.1, act: 'defend' }, { t: 1.5, x: 0.302, z: 3.575, act: 'defend' }, { t: 3.4, x: 0, z: 6.7, act: 'defend' }, { t: 5.9, x: 0, z: 6.7, act: 'defend' }]
        },
        three: {
          b1: [{ t: 0, x: -4.092, z: 5.4, act: 'defend' }, { t: 2.6, x: -3.674, z: 5.9, act: 'defend' }],
          b7: [{ t: 0, x: 0.512, z: 4.1, act: 'defend' }, { t: 2.6, x: 0.93, z: 4.6, act: 'defend' }],
          b15: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: 6.789, z: 0.7, act: 'defend' }],
          b21: [{ t: 0, x: -0.512, z: 4.1, act: 'defend' }, { t: 2.6, x: -0.93, z: 4.6, act: 'defend' }],
          b44: [{ t: 0, x: 0, z: 6.7, act: 'defend' }, { t: 2.6, x: 5.766, z: 3.3, act: 'defend' }]
        },
        outlet: {
          b1: [{ t: 0, x: -4.092, z: 5.4, act: 'defend' }, { t: 2.6, x: -3.674, z: 5.9, act: 'defend' }],
          b7: [{ t: 0, x: 0.512, z: 4.1, act: 'defend' }, { t: 2.6, x: 0.93, z: 4.6, act: 'defend' }],
          b15: [{ t: 0, x: 6.417, z: 0.25, act: 'defend' }, { t: 2.6, x: 2.883, z: 6.1, act: 'defend' }],
          b21: [{ t: 0, x: -0.512, z: 4.1, act: 'defend' }, { t: 2.6, x: -0.93, z: 4.6, act: 'defend' }],
          b44: [{ t: 0, x: 0, z: 6.7, act: 'defend' }, { t: 2.6, x: -0.418, z: 7.2, act: 'defend' }]
        }
      }
    }
  ]
};

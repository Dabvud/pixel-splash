import type { Play } from '../types';

// Der Wing besetzt den zweiten großen Slot, damit der vorhandene Kader tauschbar bleibt.
export const HORNS: Play = {
  id: 'horns', name: 'Horns', clockS: 16, deficit: 2,
  actors: ['r3', 'r11', 'r23', 'r32', 'r50', 'b1', 'b7', 'b15', 'b21', 'b44'],
  start: 'setup',
  segments: {
    setup: {
      id: 'setup', handler: 'r3',
      paths: {
        r3: [{ t: 0, x: 0, z: 8, act: 'dribble' }, { t: 1.5, x: 0, z: 7.4, act: 'dribble' }, { t: 3.4, x: 0, z: 7.1, act: 'dribble' }, { t: 5.9, x: 0, z: 7.1, act: 'dribble' }],
        r11: [{ t: 0, x: 4.5, z: 6.8, act: 'run' }, { t: 1.5, x: 2.6, z: 4.9, act: 'run' }, { t: 3.4, x: 4.8, z: 5, act: 'run' }, { t: 5.9, x: 4.8, z: 5, act: 'run' }],
        r23: [{ t: 0, x: -4.5, z: 6.8, act: 'run' }, { t: 1.5, x: -2.6, z: 4.9, act: 'run' }, { t: 3.4, x: -4.8, z: 5, act: 'run' }, { t: 5.9, x: -4.8, z: 5, act: 'run' }],
        r32: [{ t: 0, x: -2.4, z: 4.2, act: 'screen' }, { t: 0.15, x: -2.4, z: 4.2, act: 'run' }, { t: 1.5, x: -2.2, z: 4.2, act: 'screen' }, { t: 1.65, x: -2.2, z: 4.2, act: 'run' }, { t: 3.4, x: -3.4, z: 6.1, act: 'run' }, { t: 5.9, x: -3.4, z: 6.1, act: 'run' }],
        r50: [{ t: 0, x: 2.4, z: 4.2, act: 'screen' }, { t: 0.15, x: 2.4, z: 4.2, act: 'run' }, { t: 1.5, x: 2.2, z: 4.2, act: 'screen' }, { t: 1.65, x: 2.2, z: 4.2, act: 'run' }, { t: 3.4, x: 0.8, z: 1.3, act: 'run' }, { t: 5.9, x: 0.8, z: 1.3, act: 'run' }]
      },
      decisionAt: 5.9, options: [{ kind: 'pass', to: 'r23', next: 'pick_left' }, { kind: 'pass', to: 'r11', next: 'pick_right' }]
    },
    pick_left: {
      id: 'pick_left', handler: 'r23',
      paths: {
        r3: [{ t: 0, x: 0, z: 7.1, act: 'run' }, { t: 2.6, x: 0.45, z: 7.6, act: 'run' }],
        r11: [{ t: 0, x: 4.8, z: 5, act: 'run' }, { t: 2.6, x: 4.35, z: 5.5, act: 'run' }],
        r23: [{ t: 0, x: -4.8, z: 5, act: 'dribble' }, { t: 2.6, x: 1.2, z: 6.8, act: 'dribble' }],
        r32: [{ t: 0, x: -3.4, z: 6.1, act: 'run' }, { t: 2.6, x: -3.85, z: 6.6, act: 'run' }],
        r50: [{ t: 0, x: 0.8, z: 1.3, act: 'run' }, { t: 2.6, x: -0.8, z: 1.3, act: 'run' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }, { kind: 'drive' }, { kind: 'pass', to: 'r50', next: 'roll_left', lob: true }, { kind: 'pass', to: 'r32', next: 'pop_left' }]
    },
    pick_right: {
      id: 'pick_right', handler: 'r11',
      paths: {
        r3: [{ t: 0, x: 0, z: 7.1, act: 'run' }, { t: 2.6, x: 0.45, z: 7.6, act: 'run' }],
        r11: [{ t: 0, x: 4.8, z: 5, act: 'dribble' }, { t: 2.6, x: -1.2, z: 6.8, act: 'dribble' }],
        r23: [{ t: 0, x: -4.8, z: 5, act: 'run' }, { t: 2.6, x: -4.35, z: 5.5, act: 'run' }],
        r32: [{ t: 0, x: -3.4, z: 6.1, act: 'run' }, { t: 2.6, x: -3.85, z: 6.6, act: 'run' }],
        r50: [{ t: 0, x: 0.8, z: 1.3, act: 'run' }, { t: 2.6, x: -0.8, z: 1.3, act: 'run' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }, { kind: 'drive' }, { kind: 'pass', to: 'r50', next: 'roll_right', lob: true }, { kind: 'pass', to: 'r32', next: 'pop_right' }]
    },
    roll_left: {
      id: 'roll_left', handler: 'r50',
      paths: {
        r3: [{ t: 0, x: 0.45, z: 7.6, act: 'run' }, { t: 2.6, x: 0.9, z: 8.1, act: 'run' }],
        r11: [{ t: 0, x: 4.35, z: 5.5, act: 'run' }, { t: 2.6, x: 3.9, z: 6, act: 'run' }],
        r23: [{ t: 0, x: 1.2, z: 6.8, act: 'run' }, { t: 2.6, x: 1.65, z: 7.3, act: 'run' }],
        r32: [{ t: 0, x: -3.85, z: 6.6, act: 'run' }, { t: 2.6, x: -4.3, z: 7.1, act: 'run' }],
        r50: [{ t: 0, x: -0.8, z: 1.3, act: 'dribble' }, { t: 2.6, x: 0.8, z: 1.3, act: 'dribble' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }]
    },
    roll_right: {
      id: 'roll_right', handler: 'r50',
      paths: {
        r3: [{ t: 0, x: 0.45, z: 7.6, act: 'run' }, { t: 2.6, x: 0.9, z: 8.1, act: 'run' }],
        r11: [{ t: 0, x: -1.2, z: 6.8, act: 'run' }, { t: 2.6, x: -1.65, z: 7.3, act: 'run' }],
        r23: [{ t: 0, x: -4.35, z: 5.5, act: 'run' }, { t: 2.6, x: -3.9, z: 6, act: 'run' }],
        r32: [{ t: 0, x: -3.85, z: 6.6, act: 'run' }, { t: 2.6, x: -4.3, z: 7.1, act: 'run' }],
        r50: [{ t: 0, x: -0.8, z: 1.3, act: 'dribble' }, { t: 2.6, x: 0.8, z: 1.3, act: 'dribble' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }]
    },
    pop_left: {
      id: 'pop_left', handler: 'r32',
      paths: {
        r3: [{ t: 0, x: 0.45, z: 7.6, act: 'run' }, { t: 2.6, x: 0.9, z: 8.1, act: 'run' }],
        r11: [{ t: 0, x: 4.35, z: 5.5, act: 'run' }, { t: 2.6, x: 3.9, z: 6, act: 'run' }],
        r23: [{ t: 0, x: 1.2, z: 6.8, act: 'run' }, { t: 2.6, x: 1.65, z: 7.3, act: 'run' }],
        r32: [{ t: 0, x: -3.85, z: 6.6, act: 'dribble' }, { t: 2.6, x: -5.8, z: 3.8, act: 'dribble' }],
        r50: [{ t: 0, x: -0.8, z: 1.3, act: 'run' }, { t: 2.6, x: -0.35, z: 1.8, act: 'run' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }, { kind: 'drive' }]
    },
    pop_right: {
      id: 'pop_right', handler: 'r32',
      paths: {
        r3: [{ t: 0, x: 0.45, z: 7.6, act: 'run' }, { t: 2.6, x: 0.9, z: 8.1, act: 'run' }],
        r11: [{ t: 0, x: -1.2, z: 6.8, act: 'run' }, { t: 2.6, x: -1.65, z: 7.3, act: 'run' }],
        r23: [{ t: 0, x: -4.35, z: 5.5, act: 'run' }, { t: 2.6, x: -3.9, z: 6, act: 'run' }],
        r32: [{ t: 0, x: -3.85, z: 6.6, act: 'dribble' }, { t: 2.6, x: -5.8, z: 3.8, act: 'dribble' }],
        r50: [{ t: 0, x: -0.8, z: 1.3, act: 'run' }, { t: 2.6, x: -0.35, z: 1.8, act: 'run' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }, { kind: 'drive' }]
    }
  },
  variants: [
    {
      id: 'under', weight: 2,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0, z: 6.2, act: 'defend' }, { t: 1.5, x: 0, z: 5.6, act: 'defend' }, { t: 3.4, x: 0, z: 5.3, act: 'defend' }, { t: 5.9, x: 0, z: 5.3, act: 'defend' }],
          b7: [{ t: 0, x: 4.185, z: 5, act: 'defend' }, { t: 1.5, x: 2.418, z: 3.1, act: 'defend' }, { t: 3.4, x: 4.464, z: 3.2, act: 'defend' }, { t: 5.9, x: 4.464, z: 3.2, act: 'defend' }],
          b15: [{ t: 0, x: -4.185, z: 5, act: 'defend' }, { t: 1.5, x: -2.418, z: 3.1, act: 'defend' }, { t: 3.4, x: -4.464, z: 3.2, act: 'defend' }, { t: 5.9, x: -4.464, z: 3.2, act: 'defend' }],
          b21: [{ t: 0, x: -2.232, z: 2.4, act: 'defend' }, { t: 0.15, x: -2.232, z: 2.4, act: 'defend' }, { t: 1.5, x: -2.046, z: 2.4, act: 'defend' }, { t: 1.65, x: -2.046, z: 2.4, act: 'defend' }, { t: 3.4, x: -3.162, z: 4.3, act: 'defend' }, { t: 5.9, x: -3.162, z: 4.3, act: 'defend' }],
          b44: [{ t: 0, x: 2.232, z: 2.4, act: 'defend' }, { t: 0.15, x: 2.232, z: 2.4, act: 'defend' }, { t: 1.5, x: 2.046, z: 2.4, act: 'defend' }, { t: 1.65, x: 2.046, z: 2.4, act: 'defend' }, { t: 3.4, x: 0.744, z: 0.25, act: 'defend' }, { t: 5.9, x: 0.744, z: 0.25, act: 'defend' }]
        },
        pick_left: {
          b1: [{ t: 0, x: 0, z: 5.3, act: 'defend' }, { t: 2.6, x: 0.419, z: 5.8, act: 'defend' }],
          b7: [{ t: 0, x: 4.464, z: 3.2, act: 'defend' }, { t: 2.6, x: 4.045, z: 3.7, act: 'defend' }],
          b15: [{ t: 0, x: -4.464, z: 3.2, act: 'defend' }, { t: 2.6, x: 1.116, z: 5, act: 'defend' }],
          b21: [{ t: 0, x: -3.162, z: 4.3, act: 'defend' }, { t: 2.6, x: -3.581, z: 4.8, act: 'defend' }],
          b44: [{ t: 0, x: 0.744, z: 0.25, act: 'defend' }, { t: 2.6, x: -0.744, z: 0.25, act: 'defend' }]
        },
        pick_right: {
          b1: [{ t: 0, x: 0, z: 5.3, act: 'defend' }, { t: 2.6, x: 0.419, z: 5.8, act: 'defend' }],
          b7: [{ t: 0, x: 4.464, z: 3.2, act: 'defend' }, { t: 2.6, x: -1.116, z: 5, act: 'defend' }],
          b15: [{ t: 0, x: -4.464, z: 3.2, act: 'defend' }, { t: 2.6, x: -4.045, z: 3.7, act: 'defend' }],
          b21: [{ t: 0, x: -3.162, z: 4.3, act: 'defend' }, { t: 2.6, x: -3.581, z: 4.8, act: 'defend' }],
          b44: [{ t: 0, x: 0.744, z: 0.25, act: 'defend' }, { t: 2.6, x: -0.744, z: 0.25, act: 'defend' }]
        },
        roll_left: {
          b1: [{ t: 0, x: 0.419, z: 5.8, act: 'defend' }, { t: 2.6, x: 0.837, z: 6.3, act: 'defend' }],
          b7: [{ t: 0, x: 4.045, z: 3.7, act: 'defend' }, { t: 2.6, x: 3.627, z: 4.2, act: 'defend' }],
          b15: [{ t: 0, x: 1.116, z: 5, act: 'defend' }, { t: 2.6, x: 1.534, z: 5.5, act: 'defend' }],
          b21: [{ t: 0, x: -3.581, z: 4.8, act: 'defend' }, { t: 2.6, x: -3.999, z: 5.3, act: 'defend' }],
          b44: [{ t: 0, x: -0.744, z: 0.25, act: 'defend' }, { t: 2.6, x: 0.744, z: 0.25, act: 'defend' }]
        },
        roll_right: {
          b1: [{ t: 0, x: 0.419, z: 5.8, act: 'defend' }, { t: 2.6, x: 0.837, z: 6.3, act: 'defend' }],
          b7: [{ t: 0, x: -1.116, z: 5, act: 'defend' }, { t: 2.6, x: -1.534, z: 5.5, act: 'defend' }],
          b15: [{ t: 0, x: -4.045, z: 3.7, act: 'defend' }, { t: 2.6, x: -3.627, z: 4.2, act: 'defend' }],
          b21: [{ t: 0, x: -3.581, z: 4.8, act: 'defend' }, { t: 2.6, x: -3.999, z: 5.3, act: 'defend' }],
          b44: [{ t: 0, x: -0.744, z: 0.25, act: 'defend' }, { t: 2.6, x: 0.744, z: 0.25, act: 'defend' }]
        },
        pop_left: {
          b1: [{ t: 0, x: 0.419, z: 5.8, act: 'defend' }, { t: 2.6, x: 0.837, z: 6.3, act: 'defend' }],
          b7: [{ t: 0, x: 4.045, z: 3.7, act: 'defend' }, { t: 2.6, x: 3.627, z: 4.2, act: 'defend' }],
          b15: [{ t: 0, x: 1.116, z: 5, act: 'defend' }, { t: 2.6, x: 1.534, z: 5.5, act: 'defend' }],
          b21: [{ t: 0, x: -3.581, z: 4.8, act: 'defend' }, { t: 2.6, x: -5.394, z: 2, act: 'defend' }],
          b44: [{ t: 0, x: -0.744, z: 0.25, act: 'defend' }, { t: 2.6, x: -0.326, z: 0.25, act: 'defend' }]
        },
        pop_right: {
          b1: [{ t: 0, x: 0.419, z: 5.8, act: 'defend' }, { t: 2.6, x: 0.837, z: 6.3, act: 'defend' }],
          b7: [{ t: 0, x: -1.116, z: 5, act: 'defend' }, { t: 2.6, x: -1.534, z: 5.5, act: 'defend' }],
          b15: [{ t: 0, x: -4.045, z: 3.7, act: 'defend' }, { t: 2.6, x: -3.627, z: 4.2, act: 'defend' }],
          b21: [{ t: 0, x: -3.581, z: 4.8, act: 'defend' }, { t: 2.6, x: -5.394, z: 2, act: 'defend' }],
          b44: [{ t: 0, x: -0.744, z: 0.25, act: 'defend' }, { t: 2.6, x: -0.326, z: 0.25, act: 'defend' }]
        }
      }
    },
    {
      id: 'drop', weight: 3,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0, z: 7.4, act: 'defend' }, { t: 1.5, x: 0, z: 6.8, act: 'defend' }, { t: 3.4, x: 0, z: 6.5, act: 'defend' }, { t: 5.9, x: 0, z: 6.5, act: 'defend' }],
          b7: [{ t: 0, x: 4.185, z: 6.2, act: 'defend' }, { t: 1.5, x: 2.418, z: 4.3, act: 'defend' }, { t: 3.4, x: 4.464, z: 4.4, act: 'defend' }, { t: 5.9, x: 4.464, z: 4.4, act: 'defend' }],
          b15: [{ t: 0, x: -4.185, z: 6.2, act: 'defend' }, { t: 1.5, x: -2.418, z: 4.3, act: 'defend' }, { t: 3.4, x: -4.464, z: 4.4, act: 'defend' }, { t: 5.9, x: -4.464, z: 4.4, act: 'defend' }],
          b21: [{ t: 0, x: -1.8, z: 3.6, act: 'defend' }, { t: 1.5, x: -1.5, z: 3, act: 'defend' }, { t: 3.4, x: -1.8, z: 4.2, act: 'defend' }, { t: 5.9, x: -1.8, z: 4.2, act: 'defend' }],
          b44: [{ t: 0, x: 1.8, z: 3.6, act: 'defend' }, { t: 1.5, x: 1.5, z: 3, act: 'defend' }, { t: 3.4, x: 0, z: 1.7, act: 'defend' }, { t: 5.9, x: 0, z: 1.7, act: 'defend' }]
        },
        pick_left: {
          b1: [{ t: 0, x: 0, z: 6.5, act: 'defend' }, { t: 2.6, x: 0.419, z: 7, act: 'defend' }],
          b7: [{ t: 0, x: 4.464, z: 4.4, act: 'defend' }, { t: 2.6, x: 4.045, z: 4.9, act: 'defend' }],
          b15: [{ t: 0, x: -4.464, z: 4.4, act: 'defend' }, { t: 2.6, x: 1.116, z: 6.2, act: 'defend' }],
          b21: [{ t: 0, x: -1.8, z: 4.2, act: 'defend' }, { t: 2.6, x: -3.581, z: 6, act: 'defend' }],
          b44: [{ t: 0, x: 0, z: 1.7, act: 'defend' }, { t: 2.6, x: -0.744, z: 0.7, act: 'defend' }]
        },
        pick_right: {
          b1: [{ t: 0, x: 0, z: 6.5, act: 'defend' }, { t: 2.6, x: 0.419, z: 7, act: 'defend' }],
          b7: [{ t: 0, x: 4.464, z: 4.4, act: 'defend' }, { t: 2.6, x: -1.116, z: 6.2, act: 'defend' }],
          b15: [{ t: 0, x: -4.464, z: 4.4, act: 'defend' }, { t: 2.6, x: -4.045, z: 4.9, act: 'defend' }],
          b21: [{ t: 0, x: -1.8, z: 4.2, act: 'defend' }, { t: 2.6, x: -3.581, z: 6, act: 'defend' }],
          b44: [{ t: 0, x: 0, z: 1.7, act: 'defend' }, { t: 2.6, x: -0.744, z: 0.7, act: 'defend' }]
        },
        roll_left: {
          b1: [{ t: 0, x: 0.419, z: 7, act: 'defend' }, { t: 2.6, x: 0.837, z: 7.5, act: 'defend' }],
          b7: [{ t: 0, x: 4.045, z: 4.9, act: 'defend' }, { t: 2.6, x: 3.627, z: 5.4, act: 'defend' }],
          b15: [{ t: 0, x: 1.116, z: 6.2, act: 'defend' }, { t: 2.6, x: 1.534, z: 6.7, act: 'defend' }],
          b21: [{ t: 0, x: -3.581, z: 6, act: 'defend' }, { t: 2.6, x: -3.999, z: 6.5, act: 'defend' }],
          b44: [{ t: 0, x: -0.744, z: 0.7, act: 'defend' }, { t: 2.6, x: 0.744, z: 0.7, act: 'defend' }]
        },
        roll_right: {
          b1: [{ t: 0, x: 0.419, z: 7, act: 'defend' }, { t: 2.6, x: 0.837, z: 7.5, act: 'defend' }],
          b7: [{ t: 0, x: -1.116, z: 6.2, act: 'defend' }, { t: 2.6, x: -1.534, z: 6.7, act: 'defend' }],
          b15: [{ t: 0, x: -4.045, z: 4.9, act: 'defend' }, { t: 2.6, x: -3.627, z: 5.4, act: 'defend' }],
          b21: [{ t: 0, x: -3.581, z: 6, act: 'defend' }, { t: 2.6, x: -3.999, z: 6.5, act: 'defend' }],
          b44: [{ t: 0, x: -0.744, z: 0.7, act: 'defend' }, { t: 2.6, x: 0.744, z: 0.7, act: 'defend' }]
        },
        pop_left: {
          b1: [{ t: 0, x: 0.419, z: 7, act: 'defend' }, { t: 2.6, x: 0.837, z: 7.5, act: 'defend' }],
          b7: [{ t: 0, x: 4.045, z: 4.9, act: 'defend' }, { t: 2.6, x: 3.627, z: 5.4, act: 'defend' }],
          b15: [{ t: 0, x: 1.116, z: 6.2, act: 'defend' }, { t: 2.6, x: 1.534, z: 6.7, act: 'defend' }],
          b21: [{ t: 0, x: -3.581, z: 6, act: 'defend' }, { t: 2.6, x: -5.394, z: 3.2, act: 'defend' }],
          b44: [{ t: 0, x: -0.744, z: 0.7, act: 'defend' }, { t: 2.6, x: -0.326, z: 1.2, act: 'defend' }]
        },
        pop_right: {
          b1: [{ t: 0, x: 0.419, z: 7, act: 'defend' }, { t: 2.6, x: 0.837, z: 7.5, act: 'defend' }],
          b7: [{ t: 0, x: -1.116, z: 6.2, act: 'defend' }, { t: 2.6, x: -1.534, z: 6.7, act: 'defend' }],
          b15: [{ t: 0, x: -4.045, z: 4.9, act: 'defend' }, { t: 2.6, x: -3.627, z: 5.4, act: 'defend' }],
          b21: [{ t: 0, x: -3.581, z: 6, act: 'defend' }, { t: 2.6, x: -5.394, z: 3.2, act: 'defend' }],
          b44: [{ t: 0, x: -0.744, z: 0.7, act: 'defend' }, { t: 2.6, x: -0.326, z: 1.2, act: 'defend' }]
        }
      }
    },
    {
      id: 'switch', weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0, z: 7.6, act: 'defend' }, { t: 1.5, x: 0, z: 7, act: 'defend' }, { t: 3.4, x: 0, z: 6.7, act: 'defend' }, { t: 5.9, x: 0, z: 6.7, act: 'defend' }],
          b7: [{ t: 0, x: 4.185, z: 6.4, act: 'defend' }, { t: 0.15, x: 3.875, z: 6.029, act: 'defend' }, { t: 1.5, x: 2.139, z: 3.975, act: 'defend' }, { t: 1.65, x: 2.139, z: 3.924, act: 'defend' }, { t: 3.4, x: 0.744, z: 0.9, act: 'defend' }, { t: 5.9, x: 0.744, z: 0.9, act: 'defend' }],
          b15: [{ t: 0, x: -4.185, z: 6.4, act: 'defend' }, { t: 0.15, x: -3.875, z: 6.029, act: 'defend' }, { t: 1.5, x: -2.139, z: 3.975, act: 'defend' }, { t: 1.65, x: -2.139, z: 3.924, act: 'defend' }, { t: 3.4, x: -3.162, z: 5.7, act: 'defend' }, { t: 5.9, x: -3.162, z: 5.7, act: 'defend' }],
          b21: [{ t: 0, x: -2.232, z: 3.8, act: 'defend' }, { t: 1.5, x: -2.325, z: 4.325, act: 'defend' }, { t: 3.4, x: -4.464, z: 4.6, act: 'defend' }, { t: 5.9, x: -4.464, z: 4.6, act: 'defend' }],
          b44: [{ t: 0, x: 2.232, z: 3.8, act: 'defend' }, { t: 1.5, x: 2.325, z: 4.325, act: 'defend' }, { t: 3.4, x: 4.464, z: 4.6, act: 'defend' }, { t: 5.9, x: 4.464, z: 4.6, act: 'defend' }]
        },
        pick_left: {
          b1: [{ t: 0, x: 0, z: 6.7, act: 'defend' }, { t: 2.6, x: 0.419, z: 7.2, act: 'defend' }],
          b7: [{ t: 0, x: 0.744, z: 0.9, act: 'defend' }, { t: 2.6, x: -0.744, z: 0.9, act: 'defend' }],
          b15: [{ t: 0, x: -3.162, z: 5.7, act: 'defend' }, { t: 2.6, x: -3.58, z: 6.2, act: 'defend' }],
          b21: [{ t: 0, x: -4.464, z: 4.6, act: 'defend' }, { t: 2.6, x: 1.116, z: 6.4, act: 'defend' }],
          b44: [{ t: 0, x: 4.464, z: 4.6, act: 'defend' }, { t: 2.6, x: 4.045, z: 5.1, act: 'defend' }]
        },
        pick_right: {
          b1: [{ t: 0, x: 0, z: 6.7, act: 'defend' }, { t: 2.6, x: 0.419, z: 7.2, act: 'defend' }],
          b7: [{ t: 0, x: 0.744, z: 0.9, act: 'defend' }, { t: 2.6, x: -0.744, z: 0.9, act: 'defend' }],
          b15: [{ t: 0, x: -3.162, z: 5.7, act: 'defend' }, { t: 2.6, x: -3.581, z: 6.2, act: 'defend' }],
          b21: [{ t: 0, x: -4.464, z: 4.6, act: 'defend' }, { t: 2.6, x: -4.045, z: 5.1, act: 'defend' }],
          b44: [{ t: 0, x: 4.464, z: 4.6, act: 'defend' }, { t: 2.6, x: -1.116, z: 6.4, act: 'defend' }]
        },
        roll_left: {
          b1: [{ t: 0, x: 0.419, z: 7.2, act: 'defend' }, { t: 2.6, x: 0.837, z: 7.7, act: 'defend' }],
          b7: [{ t: 0, x: -0.744, z: 0.9, act: 'defend' }, { t: 2.6, x: 0.744, z: 0.9, act: 'defend' }],
          b15: [{ t: 0, x: -3.58, z: 6.2, act: 'defend' }, { t: 2.6, x: -3.999, z: 6.7, act: 'defend' }],
          b21: [{ t: 0, x: 1.116, z: 6.4, act: 'defend' }, { t: 2.6, x: 1.534, z: 6.9, act: 'defend' }],
          b44: [{ t: 0, x: 4.045, z: 5.1, act: 'defend' }, { t: 2.6, x: 3.627, z: 5.6, act: 'defend' }]
        },
        roll_right: {
          b1: [{ t: 0, x: 0.419, z: 7.2, act: 'defend' }, { t: 2.6, x: 0.837, z: 7.7, act: 'defend' }],
          b7: [{ t: 0, x: -0.744, z: 0.9, act: 'defend' }, { t: 2.6, x: 0.744, z: 0.9, act: 'defend' }],
          b15: [{ t: 0, x: -3.581, z: 6.2, act: 'defend' }, { t: 2.6, x: -3.999, z: 6.7, act: 'defend' }],
          b21: [{ t: 0, x: -4.045, z: 5.1, act: 'defend' }, { t: 2.6, x: -3.627, z: 5.6, act: 'defend' }],
          b44: [{ t: 0, x: -1.116, z: 6.4, act: 'defend' }, { t: 2.6, x: -1.535, z: 6.9, act: 'defend' }]
        },
        pop_left: {
          b1: [{ t: 0, x: 0.419, z: 7.2, act: 'defend' }, { t: 2.6, x: 0.837, z: 7.7, act: 'defend' }],
          b7: [{ t: 0, x: -0.744, z: 0.9, act: 'defend' }, { t: 2.6, x: -0.326, z: 1.4, act: 'defend' }],
          b15: [{ t: 0, x: -3.58, z: 6.2, act: 'defend' }, { t: 2.6, x: -5.394, z: 3.4, act: 'defend' }],
          b21: [{ t: 0, x: 1.116, z: 6.4, act: 'defend' }, { t: 2.6, x: 1.534, z: 6.9, act: 'defend' }],
          b44: [{ t: 0, x: 4.045, z: 5.1, act: 'defend' }, { t: 2.6, x: 3.627, z: 5.6, act: 'defend' }]
        },
        pop_right: {
          b1: [{ t: 0, x: 0.419, z: 7.2, act: 'defend' }, { t: 2.6, x: 0.837, z: 7.7, act: 'defend' }],
          b7: [{ t: 0, x: -0.744, z: 0.9, act: 'defend' }, { t: 2.6, x: -0.326, z: 1.4, act: 'defend' }],
          b15: [{ t: 0, x: -3.581, z: 6.2, act: 'defend' }, { t: 2.6, x: -5.394, z: 3.4, act: 'defend' }],
          b21: [{ t: 0, x: -4.045, z: 5.1, act: 'defend' }, { t: 2.6, x: -3.627, z: 5.6, act: 'defend' }],
          b44: [{ t: 0, x: -1.116, z: 6.4, act: 'defend' }, { t: 2.6, x: -1.534, z: 6.9, act: 'defend' }]
        }
      }
    }
  ]
};

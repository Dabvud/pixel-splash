import type { Play } from '../types';

// Der Wing besetzt den zweiten großen Slot, damit der vorhandene Kader tauschbar bleibt.
export const FLOPPY: Play = {
  id: 'floppy', name: 'Floppy', clockS: 13, deficit: 2,
  actors: ['r3', 'r11', 'r23', 'r32', 'r50', 'b1', 'b7', 'b15', 'b21', 'b44'],
  start: 'setup',
  segments: {
    setup: {
      id: 'setup', handler: 'r3',
      paths: {
        r3: [{ t: 0, x: 0, z: 8, act: 'dribble' }, { t: 1.5, x: 0.3, z: 7.7, act: 'dribble' }, { t: 3.4, x: 0, z: 7.4, act: 'dribble' }, { t: 5.9, x: 0, z: 7.4, act: 'dribble' }],
        r11: [{ t: 0, x: 0, z: -0.6, act: 'run' }, { t: 0.7, x: -2.4, z: 1.5, act: 'run' }, { t: 1.2, x: 0, z: 0.2, act: 'run' }, { t: 1.8, x: 2.4, z: 1.5, act: 'run' }, { t: 3.4, x: 5.8, z: 4, act: 'run' }, { t: 5.9, x: 5.8, z: 4, act: 'run' }],
        r23: [{ t: 0, x: -1, z: -0.5, act: 'run' }, { t: 1.5, x: -2.4, z: 1.4, act: 'run' }, { t: 3.4, x: -5.8, z: 4, act: 'run' }, { t: 5.9, x: -5.8, z: 4, act: 'run' }],
        r32: [{ t: 0, x: -2.5, z: 3, act: 'run' }, { t: 1.5, x: -2.8, z: 2.2, act: 'screen' }, { t: 3.4, x: -2.8, z: 2.2, act: 'screen' }, { t: 5.9, x: -2.8, z: 2.2, act: 'screen' }],
        r50: [{ t: 0, x: 2.5, z: 3, act: 'run' }, { t: 1.5, x: 2.8, z: 2.2, act: 'screen' }, { t: 3.4, x: 2.8, z: 2.2, act: 'screen' }, { t: 5.9, x: 2.8, z: 2.2, act: 'screen' }]
      },
      decisionAt: 5.9, options: [{ kind: 'pass', to: 'r23', next: 'catch_left' }, { kind: 'pass', to: 'r11', next: 'catch_right' }]
    },
    catch_left: {
      id: 'catch_left', handler: 'r23',
      paths: {
        r3: [{ t: 0, x: 0, z: 7.4, act: 'run' }, { t: 2.6, x: 0.45, z: 7.9, act: 'run' }],
        r11: [{ t: 0, x: 5.8, z: 4, act: 'run' }, { t: 2.6, x: 5.35, z: 4.5, act: 'run' }],
        r23: [{ t: 0, x: -5.8, z: 4, act: 'dribble' }, { t: 2.6, x: 0.8, z: 7, act: 'dribble' }],
        r32: [{ t: 0, x: -2.8, z: 2.2, act: 'run' }, { t: 2.6, x: -3.25, z: 2.7, act: 'run' }],
        r50: [{ t: 0, x: 2.8, z: 2.2, act: 'run' }, { t: 2.6, x: 3.25, z: 2.7, act: 'run' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }, { kind: 'drive' }]
    },
    catch_right: {
      id: 'catch_right', handler: 'r11',
      paths: {
        r3: [{ t: 0, x: 0, z: 7.4, act: 'run' }, { t: 2.6, x: 0.45, z: 7.9, act: 'run' }],
        r11: [{ t: 0, x: 5.8, z: 4, act: 'dribble' }, { t: 2.6, x: -0.8, z: 7, act: 'dribble' }],
        r23: [{ t: 0, x: -5.8, z: 4, act: 'run' }, { t: 2.6, x: -5.35, z: 4.5, act: 'run' }],
        r32: [{ t: 0, x: -2.8, z: 2.2, act: 'run' }, { t: 2.6, x: -3.25, z: 2.7, act: 'run' }],
        r50: [{ t: 0, x: 2.8, z: 2.2, act: 'run' }, { t: 2.6, x: 3.25, z: 2.7, act: 'run' }]
      },
      decisionAt: 2.6, options: [{ kind: 'shoot' }, { kind: 'drive' }]
    }
  },
  variants: [
    {
      id: 'trail', weight: 3,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0, z: 8.7, act: 'defend' }, { t: 1.5, x: 0.279, z: 8.4, act: 'defend' }, { t: 3.4, x: 0, z: 8.1, act: 'defend' }, { t: 5.9, x: 0, z: 8.1, act: 'defend' }],
          b7: [{ t: 0, x: 0, z: 0.25, act: 'defend' }, { t: 0.7, x: -2.232, z: 2.2, act: 'defend' }, { t: 1.2, x: 0, z: 0.9, act: 'defend' }, { t: 1.8, x: 2.232, z: 2.2, act: 'defend' }, { t: 3.4, x: 5.394, z: 4.7, act: 'defend' }, { t: 5.9, x: 5.394, z: 4.7, act: 'defend' }],
          b15: [{ t: 0, x: -0.93, z: 0.25, act: 'defend' }, { t: 1.5, x: -2.232, z: 2.1, act: 'defend' }, { t: 3.4, x: -5.394, z: 4.7, act: 'defend' }, { t: 5.9, x: -5.394, z: 4.7, act: 'defend' }],
          b21: [{ t: 0, x: -2.325, z: 3.7, act: 'defend' }, { t: 1.5, x: -2.604, z: 2.9, act: 'defend' }, { t: 3.4, x: -2.604, z: 2.9, act: 'defend' }, { t: 5.9, x: -2.604, z: 2.9, act: 'defend' }],
          b44: [{ t: 0, x: 2.325, z: 3.7, act: 'defend' }, { t: 1.5, x: 2.604, z: 2.9, act: 'defend' }, { t: 3.4, x: 2.604, z: 2.9, act: 'defend' }, { t: 5.9, x: 2.604, z: 2.9, act: 'defend' }]
        },
        catch_left: {
          b1: [{ t: 0, x: 0, z: 8.1, act: 'defend' }, { t: 2.6, x: 0.419, z: 8.6, act: 'defend' }],
          b7: [{ t: 0, x: 5.394, z: 4.7, act: 'defend' }, { t: 2.6, x: 4.976, z: 5.2, act: 'defend' }],
          b15: [{ t: 0, x: -5.394, z: 4.7, act: 'defend' }, { t: 2.6, x: 0.744, z: 7.7, act: 'defend' }],
          b21: [{ t: 0, x: -2.604, z: 2.9, act: 'defend' }, { t: 2.6, x: -3.022, z: 3.4, act: 'defend' }],
          b44: [{ t: 0, x: 2.604, z: 2.9, act: 'defend' }, { t: 2.6, x: 3.022, z: 3.4, act: 'defend' }]
        },
        catch_right: {
          b1: [{ t: 0, x: 0, z: 8.1, act: 'defend' }, { t: 2.6, x: 0.419, z: 8.6, act: 'defend' }],
          b7: [{ t: 0, x: 5.394, z: 4.7, act: 'defend' }, { t: 2.6, x: -0.744, z: 7.7, act: 'defend' }],
          b15: [{ t: 0, x: -5.394, z: 4.7, act: 'defend' }, { t: 2.6, x: -4.976, z: 5.2, act: 'defend' }],
          b21: [{ t: 0, x: -2.604, z: 2.9, act: 'defend' }, { t: 2.6, x: -3.022, z: 3.4, act: 'defend' }],
          b44: [{ t: 0, x: 2.604, z: 2.9, act: 'defend' }, { t: 2.6, x: 3.022, z: 3.4, act: 'defend' }]
        }
      }
    },
    {
      id: 'under', weight: 2,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0, z: 6.2, act: 'defend' }, { t: 1.5, x: 0.279, z: 5.9, act: 'defend' }, { t: 3.4, x: 0, z: 5.6, act: 'defend' }, { t: 5.9, x: 0, z: 5.6, act: 'defend' }],
          b7: [{ t: 0, x: 0, z: 0.25, act: 'defend' }, { t: 0.7, x: -2.232, z: 0.25, act: 'defend' }, { t: 1.2, x: 0, z: 0.25, act: 'defend' }, { t: 1.8, x: 2.232, z: 0.25, act: 'defend' }, { t: 3.4, x: 5.394, z: 2.2, act: 'defend' }, { t: 5.9, x: 5.394, z: 2.2, act: 'defend' }],
          b15: [{ t: 0, x: -0.93, z: 0.25, act: 'defend' }, { t: 1.5, x: -2.232, z: 0.25, act: 'defend' }, { t: 3.4, x: -5.394, z: 2.2, act: 'defend' }, { t: 5.9, x: -5.394, z: 2.2, act: 'defend' }],
          b21: [{ t: 0, x: -2.325, z: 1.2, act: 'defend' }, { t: 1.5, x: -2.604, z: 0.4, act: 'defend' }, { t: 3.4, x: -2.604, z: 0.4, act: 'defend' }, { t: 5.9, x: -2.604, z: 0.4, act: 'defend' }],
          b44: [{ t: 0, x: 2.325, z: 1.2, act: 'defend' }, { t: 1.5, x: 2.604, z: 0.4, act: 'defend' }, { t: 3.4, x: 2.604, z: 0.4, act: 'defend' }, { t: 5.9, x: 2.604, z: 0.4, act: 'defend' }]
        },
        catch_left: {
          b1: [{ t: 0, x: 0, z: 5.6, act: 'defend' }, { t: 2.6, x: 0.419, z: 6.1, act: 'defend' }],
          b7: [{ t: 0, x: 5.394, z: 2.2, act: 'defend' }, { t: 2.6, x: 4.976, z: 2.7, act: 'defend' }],
          b15: [{ t: 0, x: -5.394, z: 2.2, act: 'defend' }, { t: 2.6, x: 0.744, z: 5.2, act: 'defend' }],
          b21: [{ t: 0, x: -2.604, z: 0.4, act: 'defend' }, { t: 2.6, x: -3.022, z: 0.9, act: 'defend' }],
          b44: [{ t: 0, x: 2.604, z: 0.4, act: 'defend' }, { t: 2.6, x: 3.022, z: 0.9, act: 'defend' }]
        },
        catch_right: {
          b1: [{ t: 0, x: 0, z: 5.6, act: 'defend' }, { t: 2.6, x: 0.419, z: 6.1, act: 'defend' }],
          b7: [{ t: 0, x: 5.394, z: 2.2, act: 'defend' }, { t: 2.6, x: -0.744, z: 5.2, act: 'defend' }],
          b15: [{ t: 0, x: -5.394, z: 2.2, act: 'defend' }, { t: 2.6, x: -4.976, z: 2.7, act: 'defend' }],
          b21: [{ t: 0, x: -2.604, z: 0.4, act: 'defend' }, { t: 2.6, x: -3.022, z: 0.9, act: 'defend' }],
          b44: [{ t: 0, x: 2.604, z: 0.4, act: 'defend' }, { t: 2.6, x: 3.022, z: 0.9, act: 'defend' }]
        }
      }
    },
    {
      id: 'switch', weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0, z: 7.6, act: 'defend' }, { t: 1.5, x: 0.279, z: 7.3, act: 'defend' }, { t: 3.4, x: 0, z: 7, act: 'defend' }, { t: 5.9, x: 0, z: 7, act: 'defend' }],
          b7: [{ t: 0, x: 0, z: 0.4, act: 'defend' }, { t: 1.5, x: -2.4, z: 2, act: 'defend' }, { t: 3.4, x: 2.8, z: 1.8, act: 'defend' }, { t: 5.9, x: 2.8, z: 1.8, act: 'defend' }],
          b15: [{ t: 0, x: -0.93, z: 0.25, act: 'defend' }, { t: 1.5, x: -2.232, z: 1, act: 'defend' }, { t: 3.4, x: -5.394, z: 3.6, act: 'defend' }, { t: 5.9, x: -5.394, z: 3.6, act: 'defend' }],
          b21: [{ t: 0, x: -2.6, z: 1.8, act: 'defend' }, { t: 1.5, x: -3.6, z: 2.8, act: 'defend' }, { t: 3.4, x: -5.4, z: 3.6, act: 'defend' }, { t: 5.9, x: -5.4, z: 3.6, act: 'defend' }],
          b44: [{ t: 0, x: 2.325, z: 2.6, act: 'defend' }, { t: 0.7, x: 0.815, z: 1.832, act: 'defend' }, { t: 1.2, x: 1.019, z: 0.664, act: 'defend' }, { t: 1.8, x: 2.269, z: 1.17, act: 'defend' }, { t: 3.4, x: 5.394, z: 3.6, act: 'defend' }, { t: 5.9, x: 5.394, z: 3.6, act: 'defend' }]
        },
        catch_left: {
          b1: [{ t: 0, x: 0, z: 7, act: 'defend' }, { t: 2.6, x: 0.419, z: 7.5, act: 'defend' }],
          b7: [{ t: 0, x: 2.8, z: 1.8, act: 'defend' }, { t: 2.6, x: 3.022, z: 2.3, act: 'defend' }],
          b15: [{ t: 0, x: -5.394, z: 3.6, act: 'defend' }, { t: 2.6, x: 0.744, z: 6.6, act: 'defend' }],
          b21: [{ t: 0, x: -5.4, z: 3.6, act: 'defend' }, { t: 2.6, x: -3.022, z: 2.3, act: 'defend' }],
          b44: [{ t: 0, x: 5.394, z: 3.6, act: 'defend' }, { t: 2.6, x: 4.976, z: 4.1, act: 'defend' }]
        },
        catch_right: {
          b1: [{ t: 0, x: 0, z: 7, act: 'defend' }, { t: 2.6, x: 0.419, z: 7.5, act: 'defend' }],
          b7: [{ t: 0, x: 2.8, z: 1.8, act: 'defend' }, { t: 2.6, x: 3.022, z: 2.3, act: 'defend' }],
          b15: [{ t: 0, x: -5.394, z: 3.6, act: 'defend' }, { t: 2.6, x: -4.976, z: 4.1, act: 'defend' }],
          b21: [{ t: 0, x: -5.4, z: 3.6, act: 'defend' }, { t: 2.6, x: -3.022, z: 2.3, act: 'defend' }],
          b44: [{ t: 0, x: 5.394, z: 3.6, act: 'defend' }, { t: 2.6, x: -0.744, z: 6.6, act: 'defend' }]
        }
      }
    }
  ]
};

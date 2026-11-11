import type { Play } from '../types';

export const TWOONONE: Play = {
  id: 'twoonone', name: '2-gegen-1 Konter', clockS: 8, deficit: 2,
  actors: ['r3', 'r23', 'b1'],
  start: 'setup',
  segments: {
    setup: {
      id: 'setup', handler: 'r3',
      paths: {
        r3: [{ t: 0, x: 0.5, z: 11.8, act: 'dribble' }, { t: 1.3, x: 0.2, z: 7.2, act: 'dribble' }, { t: 2.8, x: -0.5, z: 3.5, act: 'dribble' }],
        r23: [{ t: 0, x: -4.5, z: 10.5, act: 'run' }, { t: 1.3, x: -3.7, z: 6, act: 'run' }, { t: 2.8, x: -1.8, z: 1.8, act: 'run' }]
      },
      decisionAt: 2.8,
      options: [{ kind: 'drive' }, { kind: 'pass', to: 'r23', next: 'finish' }]
    },
    finish: {
      id: 'finish', handler: 'r23',
      paths: {
        r3: [{ t: 0, x: -0.5, z: 3.5, act: 'run' }, { t: 2.6, x: 2.8, z: 2.5, act: 'run' }],
        r23: [{ t: 0, x: -1.8, z: 1.8, act: 'dribble' }, { t: 1.3, x: 0, z: 5.2, act: 'dribble' }, { t: 2.6, x: 4, z: 6.4, act: 'dribble' }]
      },
      decisionAt: 2.6,
      options: [{ kind: 'shoot' }, { kind: 'drive' }]
    }
  },
  variants: [
    {
      id: 'take_ball', weight: 3,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0, z: 6.8, act: 'defend' }, { t: 1.3, x: 0, z: 4.3, act: 'defend' }, { t: 2.8, x: -0.3, z: 2.7, act: 'defend' }]
        },
        finish: {
          b1: [{ t: 0, x: -0.3, z: 2.7, act: 'defend' }, { t: 2.6, x: 2.52, z: 1.85, act: 'defend' }]
        }
      }
    },
    {
      id: 'take_runner', weight: 2,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0, z: 6.8, act: 'defend' }, { t: 1.3, x: -1.5, z: 3.6, act: 'defend' }, { t: 2.8, x: -1.5, z: 1.3, act: 'defend' }]
        },
        finish: {
          b1: [{ t: 0, x: -1.5, z: 1.3, act: 'defend' }, { t: 2.6, x: 2.52, z: 1.85, act: 'defend' }]
        }
      }
    },
    {
      id: 'fake', weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0, z: 6.8, act: 'defend' }, { t: 1.3, x: -1.3, z: 4.1, act: 'defend' }, { t: 2.8, x: 0.5, z: 1.5, act: 'defend' }]
        },
        finish: {
          b1: [{ t: 0, x: 0.5, z: 1.5, act: 'defend' }, { t: 2.6, x: 2.52, z: 1.85, act: 'defend' }]
        }
      }
    }
  ]
};


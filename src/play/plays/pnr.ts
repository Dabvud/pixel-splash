import type { Play } from '../types';

export const PNR: Play = {
  id: "pnr",
  name: "Pick & Roll",
  clockS: 8,
  deficit: 2,
  actors: ["r3", "r50", "r11", "r23", "r32", "b1", "b7", "b15", "b21", "b44"],
  start: "setup",
  segments: {
    setup: {
      id: "setup",
      handler: "r3",
      paths: {
        r3: [{ t: 0, x: -4, z: 11, act: "dribble" }, { t: 1.4, x: -3, z: 9.4, act: "dribble" }, { t: 3.9, x: 0, z: 5.4, act: "dribble" }],
        r50: [{ t: 0, x: 0, z: 5.7, act: "screen" }, { t: 1.4, x: 0, z: 5.7, act: "run" }, { t: 3.9, x: 1.7, z: 1.8, act: "run" }],
        r11: [{ t: 0, x: 6.9, z: 0.5, act: "run" }, { t: 1.4, x: 5.2, z: 2.8, act: "run" }, { t: 3.9, x: 6.9, z: 0.5, act: "run" }],
        r23: [{ t: 0, x: -4, z: 3, act: "run" }, { t: 1.4, x: -5.5, z: 4.5, act: "run" }, { t: 3.9, x: -4, z: 3, act: "run" }],
        r32: [{ t: 0, x: -6, z: 1, act: "run" }, { t: 1.4, x: -6, z: 3, act: "run" }, { t: 3.9, x: -6, z: 1, act: "run" }]
      },
      decisionAt: 3.9,
      options: [{ kind: "shoot" }, { kind: "drive" }, { kind: "pass", to: "r50", next: "to_r50" }, { kind: "pass", to: "r11", next: "to_r11" }]
    },
    to_r50: {
      id: "to_r50",
      handler: "r50",
      paths: {
        r3: [{ t: 0, x: 0, z: 5.4, act: "run" }, { t: 3, x: 1.5, z: 3.9, act: "run" }],
        r50: [{ t: 0, x: 1.7, z: 1.8, act: "dribble" }, { t: 3, x: -4.3, z: 1.8, act: "dribble" }],
        r11: [{ t: 0, x: 6.9, z: 0.5, act: "run" }, { t: 3, x: 5.4, z: 2, act: "run" }],
        r23: [{ t: 0, x: -4, z: 3, act: "run" }, { t: 3, x: -2.5, z: 4.5, act: "run" }],
        r32: [{ t: 0, x: -6, z: 1, act: "run" }, { t: 3, x: -4.5, z: 2.5, act: "run" }]
      },
      decisionAt: 3,
      options: [{ kind: "shoot" }, { kind: "drive" }]
    },
    to_r11: {
      id: "to_r11",
      handler: "r11",
      paths: {
        r3: [{ t: 0, x: 0, z: 5.4, act: "run" }, { t: 3, x: 1.5, z: 3.9, act: "run" }],
        r50: [{ t: 0, x: 1.7, z: 1.8, act: "run" }, { t: 3, x: 0.2, z: 3.3, act: "run" }],
        r11: [{ t: 0, x: 6.9, z: 0.5, act: "dribble" }, { t: 3, x: 3.3, z: 5.3, act: "dribble" }],
        r23: [{ t: 0, x: -4, z: 3, act: "run" }, { t: 3, x: -2.5, z: 4.5, act: "run" }],
        r32: [{ t: 0, x: -6, z: 1, act: "run" }, { t: 3, x: -4.5, z: 2.5, act: "run" }]
      },
      decisionAt: 3,
      options: [{ kind: "shoot" }, { kind: "drive" }]
    }
  },
  variants: [
    {
      id: "under",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 1.6, z: 1.6, act: "defend" }, { t: 1.4, x: 1.4, z: 1.5, act: "defend" }, { t: 2.65, x: 0.4, z: 0.8, act: "defend" }, { t: 3.9, x: 0, z: 0.8, act: "defend" }],
          b7: [{ t: 0, x: 1.177, z: 2.215, act: "defend" }, { t: 1.4, x: 1.189, z: 2.18, act: "defend" }, { t: 2.65, x: 1.301, z: 1.862, act: "defend" }, { t: 3.9, x: 1.425, z: 1.509, act: "defend" }],
          b15: [{ t: 0, x: 6.164, z: 0.903, act: "defend" }, { t: 1.4, x: 6.181, z: 0.881, act: "defend" }, { t: 2.65, x: 6.332, z: 0.687, act: "defend" }, { t: 3.9, x: 6.501, z: 0.471, act: "defend" }],
          b21: [{ t: 0, x: -4.2, z: 10, act: "defend" }, { t: 1.4, x: -4.26, z: 9.9, act: "defend" }, { t: 2.65, x: -4.8, z: 9, act: "defend" }, { t: 3.9, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -4, z: 10, act: "defend" }, { t: 1.4, x: -4.06, z: 9.9, act: "defend" }, { t: 2.65, x: -4.6, z: 9, act: "defend" }, { t: 3.9, x: -5.2, z: 8, act: "defend" }]
        },
        to_r50: {
          b1: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 3, x: 1.5, z: 2.3, act: "defend" }],
          b7: [{ t: 0, x: 1.425, z: 1.509, act: "defend" }, { t: 3, x: -3.931, z: 1.646, act: "defend" }],
          b15: [{ t: 0, x: 6.501, z: 0.471, act: "defend" }, { t: 3, x: 5.001, z: 1.971, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 3, x: -3.9, z: 6.5, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 3, x: -3.7, z: 6.5, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 3, x: 1.5, z: 2.3, act: "defend" }],
          b7: [{ t: 0, x: 1.425, z: 1.509, act: "defend" }, { t: 3, x: -0.075, z: 3.009, act: "defend" }],
          b15: [{ t: 0, x: 6.501, z: 0.471, act: "defend" }, { t: 3, x: 3.089, z: 4.96, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 3, x: -3.9, z: 6.5, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 3, x: -3.7, z: 6.5, act: "defend" }]
        }
      }
    },
    {
      id: "hedge",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -2.841, z: 9.016, act: "defend" }, { t: 1.4, x: -2.699, z: 8.815, act: "defend" }, { t: 2.65, x: -1.421, z: 7.008, act: "defend" }, { t: 3.9, x: 0, z: 5, act: "defend" }],
          b7: [{ t: 0, x: 1.6, z: 1.6, act: "defend" }, { t: 1.4, x: 1.4, z: 1.5, act: "defend" }, { t: 2.65, x: 0.4, z: 0.8, act: "defend" }, { t: 3.9, x: 0, z: 0.8, act: "defend" }],
          b15: [{ t: 0, x: 6.164, z: 0.903, act: "defend" }, { t: 1.4, x: 6.181, z: 0.881, act: "defend" }, { t: 2.65, x: 6.332, z: 0.687, act: "defend" }, { t: 3.9, x: 6.501, z: 0.471, act: "defend" }],
          b21: [{ t: 0, x: -4.2, z: 10, act: "defend" }, { t: 1.4, x: -4.26, z: 9.9, act: "defend" }, { t: 2.65, x: -4.8, z: 9, act: "defend" }, { t: 3.9, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -4, z: 10, act: "defend" }, { t: 1.4, x: -4.06, z: 9.9, act: "defend" }, { t: 2.65, x: -4.6, z: 9, act: "defend" }, { t: 3.9, x: -5.2, z: 8, act: "defend" }]
        },
        to_r50: {
          b1: [{ t: 0, x: 0, z: 5, act: "defend" }, { t: 3, x: 1.5, z: 3.5, act: "defend" }],
          b7: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 3, x: -3.931, z: 1.646, act: "defend" }],
          b15: [{ t: 0, x: 6.501, z: 0.471, act: "defend" }, { t: 3, x: 5.001, z: 1.971, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 3, x: -3.9, z: 6.5, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 3, x: -3.7, z: 6.5, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: 0, z: 5, act: "defend" }, { t: 3, x: 1.5, z: 3.5, act: "defend" }],
          b7: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 3, x: 1.5, z: 2.3, act: "defend" }],
          b15: [{ t: 0, x: 6.501, z: 0.471, act: "defend" }, { t: 3, x: 3.089, z: 4.96, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 3, x: -3.9, z: 6.5, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 3, x: -3.7, z: 6.5, act: "defend" }]
        }
      }
    },
    {
      id: "switch",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -4, z: 10, act: "defend" }, { t: 1.4, x: -4.06, z: 9.9, act: "defend" }, { t: 2.65, x: -4.6, z: 9, act: "defend" }, { t: 3.9, x: -5.2, z: 8, act: "defend" }],
          b7: [{ t: 0, x: 1.177, z: 2.215, act: "defend" }, { t: 1.4, x: 1.189, z: 2.18, act: "defend" }, { t: 2.65, x: 1.301, z: 1.862, act: "defend" }, { t: 3.9, x: 1.425, z: 1.509, act: "defend" }],
          b15: [{ t: 0, x: 6.164, z: 0.903, act: "defend" }, { t: 1.4, x: 6.181, z: 0.881, act: "defend" }, { t: 2.65, x: 6.332, z: 0.687, act: "defend" }, { t: 3.9, x: 6.501, z: 0.471, act: "defend" }],
          b21: [{ t: 0, x: -4.2, z: 10, act: "defend" }, { t: 1.4, x: -4.26, z: 9.9, act: "defend" }, { t: 2.65, x: -4.8, z: 9, act: "defend" }, { t: 3.9, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -2.841, z: 9.016, act: "defend" }, { t: 1.4, x: -2.699, z: 8.815, act: "defend" }, { t: 2.65, x: -1.421, z: 7.008, act: "defend" }, { t: 3.9, x: 0, z: 5, act: "defend" }]
        },
        to_r50: {
          b1: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 3, x: -3.7, z: 6.5, act: "defend" }],
          b7: [{ t: 0, x: 1.425, z: 1.509, act: "defend" }, { t: 3, x: -3.931, z: 1.646, act: "defend" }],
          b15: [{ t: 0, x: 6.501, z: 0.471, act: "defend" }, { t: 3, x: 5.001, z: 1.971, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 3, x: -3.9, z: 6.5, act: "defend" }],
          b44: [{ t: 0, x: 0, z: 5, act: "defend" }, { t: 3, x: 1.5, z: 3.5, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 3, x: -3.7, z: 6.5, act: "defend" }],
          b7: [{ t: 0, x: 1.425, z: 1.509, act: "defend" }, { t: 3, x: -0.075, z: 3.009, act: "defend" }],
          b15: [{ t: 0, x: 6.501, z: 0.471, act: "defend" }, { t: 3, x: 3.089, z: 4.96, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 3, x: -3.9, z: 6.5, act: "defend" }],
          b44: [{ t: 0, x: 0, z: 5, act: "defend" }, { t: 3, x: 1.5, z: 3.5, act: "defend" }]
        }
      }
    },
    {
      id: "corner_help",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -2.841, z: 9.016, act: "defend" }, { t: 1.4, x: -2.699, z: 8.815, act: "defend" }, { t: 2.65, x: -1.421, z: 7.008, act: "defend" }, { t: 3.9, x: 0, z: 5, act: "defend" }],
          b7: [{ t: 0, x: 1.6, z: 1.6, act: "defend" }, { t: 1.4, x: 1.4, z: 1.5, act: "defend" }, { t: 2.65, x: 0.4, z: 0.8, act: "defend" }, { t: 3.9, x: 0, z: 0.8, act: "defend" }],
          b15: [{ t: 0, x: 1.177, z: 2.215, act: "defend" }, { t: 1.4, x: 1.189, z: 2.18, act: "defend" }, { t: 2.65, x: 1.301, z: 1.862, act: "defend" }, { t: 3.9, x: 1.425, z: 1.509, act: "defend" }],
          b21: [{ t: 0, x: -4.2, z: 10, act: "defend" }, { t: 1.4, x: -4.26, z: 9.9, act: "defend" }, { t: 2.65, x: -4.8, z: 9, act: "defend" }, { t: 3.9, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -4, z: 10, act: "defend" }, { t: 1.4, x: -4.06, z: 9.9, act: "defend" }, { t: 2.65, x: -4.6, z: 9, act: "defend" }, { t: 3.9, x: -5.2, z: 8, act: "defend" }]
        },
        to_r50: {
          b1: [{ t: 0, x: 0, z: 5, act: "defend" }, { t: 3, x: 1.5, z: 3.5, act: "defend" }],
          b7: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 3, x: 1.5, z: 2.3, act: "defend" }],
          b15: [{ t: 0, x: 1.425, z: 1.509, act: "defend" }, { t: 3, x: -3.931, z: 1.646, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 3, x: -3.9, z: 6.5, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 3, x: -3.7, z: 6.5, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: 0, z: 5, act: "defend" }, { t: 3, x: 1.5, z: 3.5, act: "defend" }],
          b7: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 3, x: 1.5, z: 2.3, act: "defend" }],
          b15: [{ t: 0, x: 1.425, z: 1.509, act: "defend" }, { t: 3, x: 3.089, z: 4.96, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 3, x: -3.9, z: 6.5, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 3, x: -3.7, z: 6.5, act: "defend" }]
        }
      }
    }
  ]
};

import type { Play } from '../types';

export const KICKOUT: Play = {
  id: "kickout",
  name: "Kick-out",
  clockS: 8,
  deficit: 2,
  actors: ["r23", "r11", "r3", "r32", "r50", "b1", "b7", "b15", "b21", "b44"],
  start: "setup",
  segments: {
    setup: {
      id: "setup",
      handler: "r23",
      paths: {
        r23: [{ t: 0, x: 4, z: 8, act: "dribble" }, { t: 1, x: 3, z: 6.6, act: "dribble" }, { t: 3.5, x: 0, z: 2.6, act: "dribble" }],
        r11: [{ t: 0, x: 6.9, z: 0.5, act: "run" }, { t: 1, x: 5.2, z: 2.8, act: "run" }, { t: 3.5, x: 6.9, z: 0.5, act: "run" }],
        r3: [{ t: 0, x: -4.8, z: 4.8, act: "run" }, { t: 1, x: -3, z: 6.8, act: "run" }, { t: 3.5, x: -4.8, z: 4.8, act: "run" }],
        r32: [{ t: 0, x: -6, z: 1, act: "run" }, { t: 1, x: -6, z: 3, act: "run" }, { t: 3.5, x: -6, z: 1, act: "run" }],
        r50: [{ t: 0, x: 2.8, z: 0.2, act: "run" }, { t: 1, x: 4.3, z: 2.2, act: "run" }, { t: 3.5, x: 2.8, z: 0.2, act: "run" }]
      },
      decisionAt: 3.5,
      options: [{ kind: "shoot" }, { kind: "drive" }, { kind: "pass", to: "r11", next: "to_r11" }, { kind: "pass", to: "r3", next: "to_r3" }]
    },
    to_r11: {
      id: "to_r11",
      handler: "r11",
      paths: {
        r23: [{ t: 0, x: 0, z: 2.6, act: "run" }, { t: 3, x: 1.5, z: 4.1, act: "run" }],
        r11: [{ t: 0, x: 6.9, z: 0.5, act: "dribble" }, { t: 3, x: 3.3, z: 5.3, act: "dribble" }],
        r3: [{ t: 0, x: -4.8, z: 4.8, act: "run" }, { t: 3, x: -3.3, z: 3.3, act: "run" }],
        r32: [{ t: 0, x: -6, z: 1, act: "run" }, { t: 3, x: -4.5, z: 2.5, act: "run" }],
        r50: [{ t: 0, x: 2.8, z: 0.2, act: "run" }, { t: 3, x: 1.3, z: 1.7, act: "run" }]
      },
      decisionAt: 3,
      options: [{ kind: "shoot" }, { kind: "drive" }]
    },
    to_r3: {
      id: "to_r3",
      handler: "r3",
      paths: {
        r23: [{ t: 0, x: 0, z: 2.6, act: "run" }, { t: 3, x: 1.5, z: 4.1, act: "run" }],
        r11: [{ t: 0, x: 6.9, z: 0.5, act: "run" }, { t: 3, x: 5.4, z: 2, act: "run" }],
        r3: [{ t: 0, x: -4.8, z: 4.8, act: "dribble" }, { t: 3, x: 1.2, z: 4.8, act: "dribble" }],
        r32: [{ t: 0, x: -6, z: 1, act: "run" }, { t: 3, x: -4.5, z: 2.5, act: "run" }],
        r50: [{ t: 0, x: 2.8, z: 0.2, act: "run" }, { t: 3, x: 1.3, z: 1.7, act: "run" }]
      },
      decisionAt: 3,
      options: [{ kind: "shoot" }, { kind: "drive" }]
    }
  },
  variants: [
    {
      id: "help",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 2.752, z: 6.239, act: "defend" }, { t: 1, x: 2.614, z: 6.037, act: "defend" }, { t: 2.25, x: 1.376, z: 4.22, act: "defend" }, { t: 3.5, x: 0, z: 2.2, act: "defend" }],
          b7: [{ t: 0, x: 1.6, z: 1.6, act: "defend" }, { t: 1, x: 1.4, z: 1.5, act: "defend" }, { t: 2.25, x: 0.4, z: 0.8, act: "defend" }, { t: 3.5, x: 0, z: 0.8, act: "defend" }],
          b15: [{ t: 0, x: -4.18, z: 4.895, act: "defend" }, { t: 1, x: -4.197, z: 4.877, act: "defend" }, { t: 2.25, x: -4.349, z: 4.706, act: "defend" }, { t: 3.5, x: -4.517, z: 4.517, act: "defend" }],
          b21: [{ t: 0, x: -4.2, z: 10, act: "defend" }, { t: 1, x: -4.26, z: 9.9, act: "defend" }, { t: 2.25, x: -4.8, z: 9, act: "defend" }, { t: 3.5, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -4, z: 10, act: "defend" }, { t: 1, x: -4.06, z: 9.9, act: "defend" }, { t: 2.25, x: -4.6, z: 9, act: "defend" }, { t: 3.5, x: -5.2, z: 8, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: 0, z: 2.2, act: "defend" }, { t: 3, x: 1.5, z: 3.7, act: "defend" }],
          b7: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 3, x: 3.089, z: 4.96, act: "defend" }],
          b15: [{ t: 0, x: -4.517, z: 4.517, act: "defend" }, { t: 3, x: -3.017, z: 3.017, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 3, x: -3.9, z: 6.5, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 3, x: -3.7, z: 6.5, act: "defend" }]
        },
        to_r3: {
          b1: [{ t: 0, x: 0, z: 2.2, act: "defend" }, { t: 3, x: 1.5, z: 3.7, act: "defend" }],
          b7: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 3, x: 1.5, z: 2.3, act: "defend" }],
          b15: [{ t: 0, x: -4.517, z: 4.517, act: "defend" }, { t: 3, x: 1.103, z: 4.412, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 3, x: -3.9, z: 6.5, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 3, x: -3.7, z: 6.5, act: "defend" }]
        }
      }
    },
    {
      id: "stay",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 2.752, z: 6.239, act: "defend" }, { t: 1, x: 2.614, z: 6.037, act: "defend" }, { t: 2.25, x: 1.376, z: 4.22, act: "defend" }, { t: 3.5, x: 0, z: 2.2, act: "defend" }],
          b7: [{ t: 0, x: 6.164, z: 0.903, act: "defend" }, { t: 1, x: 6.181, z: 0.881, act: "defend" }, { t: 2.25, x: 6.332, z: 0.687, act: "defend" }, { t: 3.5, x: 6.501, z: 0.471, act: "defend" }],
          b15: [{ t: 0, x: -4.18, z: 4.895, act: "defend" }, { t: 1, x: -4.197, z: 4.877, act: "defend" }, { t: 2.25, x: -4.349, z: 4.706, act: "defend" }, { t: 3.5, x: -4.517, z: 4.517, act: "defend" }],
          b21: [{ t: 0, x: -4.2, z: 10, act: "defend" }, { t: 1, x: -4.26, z: 9.9, act: "defend" }, { t: 2.25, x: -4.8, z: 9, act: "defend" }, { t: 3.5, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -4, z: 10, act: "defend" }, { t: 1, x: -4.06, z: 9.9, act: "defend" }, { t: 2.25, x: -4.6, z: 9, act: "defend" }, { t: 3.5, x: -5.2, z: 8, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: 0, z: 2.2, act: "defend" }, { t: 3, x: 1.5, z: 3.7, act: "defend" }],
          b7: [{ t: 0, x: 6.501, z: 0.471, act: "defend" }, { t: 3, x: 3.089, z: 4.96, act: "defend" }],
          b15: [{ t: 0, x: -4.517, z: 4.517, act: "defend" }, { t: 3, x: -3.017, z: 3.017, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 3, x: -3.9, z: 6.5, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 3, x: -3.7, z: 6.5, act: "defend" }]
        },
        to_r3: {
          b1: [{ t: 0, x: 0, z: 2.2, act: "defend" }, { t: 3, x: 1.5, z: 3.7, act: "defend" }],
          b7: [{ t: 0, x: 6.501, z: 0.471, act: "defend" }, { t: 3, x: 5.001, z: 1.971, act: "defend" }],
          b15: [{ t: 0, x: -4.517, z: 4.517, act: "defend" }, { t: 3, x: 1.103, z: 4.412, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 3, x: -3.9, z: 6.5, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 3, x: -3.7, z: 6.5, act: "defend" }]
        }
      }
    },
    {
      id: "fast_closeout",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 2.442, z: 5.289, act: "defend" }, { t: 1, x: 2.32, z: 5.134, act: "defend" }, { t: 2.25, x: 1.221, z: 3.744, act: "defend" }, { t: 3.5, x: 0, z: 2.2, act: "defend" }],
          b7: [{ t: 0, x: 1.6, z: 1.6, act: "defend" }, { t: 1, x: 1.4, z: 1.5, act: "defend" }, { t: 2.25, x: 0.4, z: 0.8, act: "defend" }, { t: 3.5, x: 0, z: 0.8, act: "defend" }],
          b15: [{ t: 0, x: 5.867, z: 0.846, act: "defend" }, { t: 1, x: 5.864, z: 0.825, act: "defend" }, { t: 2.25, x: 5.835, z: 0.633, act: "defend" }, { t: 3.5, x: 5.803, z: 0.42, act: "defend" }],
          b21: [{ t: 0, x: -4.2, z: 10, act: "defend" }, { t: 1, x: -4.26, z: 9.9, act: "defend" }, { t: 2.25, x: -4.8, z: 9, act: "defend" }, { t: 3.5, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -4.2, z: 7.8, act: "defend" }, { t: 1, x: -4.26, z: 7.7, act: "defend" }, { t: 2.25, x: -4.8, z: 6.8, act: "defend" }, { t: 3.5, x: -5.4, z: 5.8, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: 0, z: 2.2, act: "defend" }, { t: 3, x: 1.5, z: 3.7, act: "defend" }],
          b7: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 3, x: 3, z: 2.3, act: "defend" }],
          b15: [{ t: 0, x: 5.803, z: 0.42, act: "defend" }, { t: 3, x: 3.089, z: 4.96, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 3, x: -3.9, z: 6.5, act: "defend" }],
          b44: [{ t: 0, x: -5.4, z: 5.8, act: "defend" }, { t: 3, x: -3.9, z: 4.3, act: "defend" }]
        },
        to_r3: {
          b1: [{ t: 0, x: 0, z: 2.2, act: "defend" }, { t: 3, x: 1.5, z: 3.7, act: "defend" }],
          b7: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 3, x: 3, z: 2.3, act: "defend" }],
          b15: [{ t: 0, x: 5.803, z: 0.42, act: "defend" }, { t: 3, x: 4.303, z: 1.92, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 3, x: -3.9, z: 6.5, act: "defend" }],
          b44: [{ t: 0, x: -5.4, z: 5.8, act: "defend" }, { t: 3, x: 1.103, z: 4.412, act: "defend" }]
        }
      }
    }
  ]
};

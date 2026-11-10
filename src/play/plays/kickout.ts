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
        r23: [{ t: 0, x: 1, z: 7, act: "dribble" }, { t: 1, x: 0, z: 2.6, act: "dribble" }],
        r11: [{ t: 0, x: 6.9, z: 0.5, act: "stand" }, { t: 1, x: 6.9, z: 0.5, act: "stand" }],
        r3: [{ t: 0, x: -4.8, z: 4.8, act: "stand" }, { t: 1, x: -4.8, z: 4.8, act: "stand" }],
        r32: [{ t: 0, x: -6, z: 1, act: "stand" }, { t: 1, x: -6, z: 1, act: "stand" }],
        r50: [{ t: 0, x: 2.8, z: 0.2, act: "stand" }, { t: 1, x: 2.8, z: 0.2, act: "stand" }]
      },
      decisionAt: 1,
      options: [{ kind: "shoot" }, { kind: "drive" }, { kind: "pass", to: "r11", next: "to_r11" }, { kind: "pass", to: "r3", next: "to_r3" }]
    },
    to_r11: {
      id: "to_r11",
      handler: "r11",
      paths: {
        r23: [{ t: 0, x: 0, z: 2.6, act: "stand" }],
        r11: [{ t: 0, x: 6.9, z: 0.5, act: "stand" }],
        r3: [{ t: 0, x: -4.8, z: 4.8, act: "stand" }],
        r32: [{ t: 0, x: -6, z: 1, act: "stand" }],
        r50: [{ t: 0, x: 2.8, z: 0.2, act: "stand" }]
      },
      decisionAt: 0.4,
      options: [{ kind: "shoot" }, { kind: "drive" }]
    },
    to_r3: {
      id: "to_r3",
      handler: "r3",
      paths: {
        r23: [{ t: 0, x: 0, z: 2.6, act: "stand" }],
        r11: [{ t: 0, x: 6.9, z: 0.5, act: "stand" }],
        r3: [{ t: 0, x: -4.8, z: 4.8, act: "stand" }],
        r32: [{ t: 0, x: -6, z: 1, act: "stand" }],
        r50: [{ t: 0, x: 2.8, z: 0.2, act: "stand" }]
      },
      decisionAt: 0.4,
      options: [{ kind: "shoot" }, { kind: "drive" }]
    }
  },
  variants: [
    {
      id: "help",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0.2, z: 2.4, act: "defend" }, { t: 1, x: 0, z: 2.2, act: "defend" }],
          b7: [{ t: 0, x: 0.2, z: 1, act: "defend" }, { t: 1, x: 0, z: 0.8, act: "defend" }],
          b15: [{ t: 0, x: -4.317, z: 4.717, act: "defend" }, { t: 1, x: -4.517, z: 4.517, act: "defend" }],
          b21: [{ t: 0, x: -5.2, z: 8.2, act: "defend" }, { t: 1, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5, z: 8.2, act: "defend" }, { t: 1, x: -5.2, z: 8, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: 0, z: 2.2, act: "defend" }, { t: 1.4, x: 0, z: 2.2, act: "defend" }],
          b7: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 1.4, x: 0, z: 0.8, act: "defend" }],
          b15: [{ t: 0, x: -4.517, z: 4.517, act: "defend" }, { t: 1.4, x: -4.517, z: 4.517, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }]
        },
        to_r3: {
          b1: [{ t: 0, x: 0, z: 2.2, act: "defend" }, { t: 1.4, x: 0, z: 2.2, act: "defend" }],
          b7: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 1.4, x: 0, z: 0.8, act: "defend" }],
          b15: [{ t: 0, x: -4.517, z: 4.517, act: "defend" }, { t: 1.4, x: -4.517, z: 4.517, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }]
        }
      }
    },
    {
      id: "stay",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0.2, z: 2.4, act: "defend" }, { t: 1, x: 0, z: 2.2, act: "defend" }],
          b7: [{ t: 0, x: 6.701, z: 0.671, act: "defend" }, { t: 1, x: 6.501, z: 0.471, act: "defend" }],
          b15: [{ t: 0, x: -4.317, z: 4.717, act: "defend" }, { t: 1, x: -4.517, z: 4.517, act: "defend" }],
          b21: [{ t: 0, x: -5.2, z: 8.2, act: "defend" }, { t: 1, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5, z: 8.2, act: "defend" }, { t: 1, x: -5.2, z: 8, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: 0, z: 2.2, act: "defend" }, { t: 1.4, x: 0, z: 2.2, act: "defend" }],
          b7: [{ t: 0, x: 6.501, z: 0.471, act: "defend" }, { t: 1.4, x: 6.501, z: 0.471, act: "defend" }],
          b15: [{ t: 0, x: -4.517, z: 4.517, act: "defend" }, { t: 1.4, x: -4.517, z: 4.517, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }]
        },
        to_r3: {
          b1: [{ t: 0, x: 0, z: 2.2, act: "defend" }, { t: 1.4, x: 0, z: 2.2, act: "defend" }],
          b7: [{ t: 0, x: 6.501, z: 0.471, act: "defend" }, { t: 1.4, x: 6.501, z: 0.471, act: "defend" }],
          b15: [{ t: 0, x: -4.517, z: 4.517, act: "defend" }, { t: 1.4, x: -4.517, z: 4.517, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }]
        }
      }
    },
    {
      id: "fast_closeout",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0.2, z: 2.4, act: "defend" }, { t: 1, x: 0, z: 2.2, act: "defend" }],
          b7: [{ t: 0, x: 0.2, z: 1, act: "defend" }, { t: 1, x: 0, z: 0.8, act: "defend" }],
          b15: [{ t: 0, x: 5.803, z: 0.42, act: "defend" }],
          b21: [{ t: 0, x: -5.2, z: 8.2, act: "defend" }, { t: 1, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5.4, z: 5.8, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: 0, z: 2.2, act: "defend" }],
          b7: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 0.4, x: 3, z: 0.8, act: "defend" }],
          b15: [{ t: 0, x: 5.803, z: 0.42, act: "defend" }, { t: 0.4, x: 6.501, z: 0.471, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5.4, z: 5.8, act: "defend" }]
        },
        to_r3: {
          b1: [{ t: 0, x: 0, z: 2.2, act: "defend" }],
          b7: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 0.4, x: 3, z: 0.8, act: "defend" }],
          b15: [{ t: 0, x: 5.803, z: 0.42, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5.4, z: 5.8, act: "defend" }, { t: 0.4, x: -4.517, z: 4.517, act: "defend" }]
        }
      }
    }
  ]
};

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
        r3: [{ t: 0, x: -1, z: 7, act: "dribble" }, { t: 1.4, x: 0, z: 5.4, act: "dribble" }],
        r50: [{ t: 0, x: 0, z: 5.7, act: "screen" }, { t: 0.8, x: 0, z: 5.7, act: "run" }, { t: 1.4, x: 1.7, z: 1.8, act: "stand" }],
        r11: [{ t: 0, x: 6.9, z: 0.5, act: "stand" }, { t: 1.4, x: 6.9, z: 0.5, act: "stand" }],
        r23: [{ t: 0, x: -4, z: 3, act: "stand" }, { t: 1.4, x: -4, z: 3, act: "stand" }],
        r32: [{ t: 0, x: -6, z: 1, act: "stand" }, { t: 1.4, x: -6, z: 1, act: "stand" }]
      },
      decisionAt: 1.4,
      options: [{ kind: "shoot" }, { kind: "drive" }, { kind: "pass", to: "r50", next: "to_r50" }, { kind: "pass", to: "r11", next: "to_r11" }]
    },
    to_r50: {
      id: "to_r50",
      handler: "r50",
      paths: {
        r3: [{ t: 0, x: 0, z: 5.4, act: "stand" }],
        r50: [{ t: 0, x: 1.7, z: 1.8, act: "stand" }],
        r11: [{ t: 0, x: 6.9, z: 0.5, act: "stand" }],
        r23: [{ t: 0, x: -4, z: 3, act: "stand" }],
        r32: [{ t: 0, x: -6, z: 1, act: "stand" }]
      },
      decisionAt: 0.4,
      options: [{ kind: "shoot" }, { kind: "drive" }]
    },
    to_r11: {
      id: "to_r11",
      handler: "r11",
      paths: {
        r3: [{ t: 0, x: 0, z: 5.4, act: "stand" }],
        r50: [{ t: 0, x: 1.7, z: 1.8, act: "stand" }],
        r11: [{ t: 0, x: 6.9, z: 0.5, act: "stand" }],
        r23: [{ t: 0, x: -4, z: 3, act: "stand" }],
        r32: [{ t: 0, x: -6, z: 1, act: "stand" }]
      },
      decisionAt: 0.4,
      options: [{ kind: "shoot" }, { kind: "drive" }]
    }
  },
  variants: [
    {
      id: "under",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0.2, z: 1, act: "defend" }, { t: 1.4, x: 0, z: 0.8, act: "defend" }],
          b7: [{ t: 0, x: 1.625, z: 1.709, act: "defend" }, { t: 1.4, x: 1.425, z: 1.509, act: "defend" }],
          b15: [{ t: 0, x: 6.701, z: 0.671, act: "defend" }, { t: 1.4, x: 6.501, z: 0.471, act: "defend" }],
          b21: [{ t: 0, x: -5.2, z: 8.2, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5, z: 8.2, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }]
        },
        to_r50: {
          b1: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 1.4, x: 0, z: 0.8, act: "defend" }],
          b7: [{ t: 0, x: 1.425, z: 1.509, act: "defend" }, { t: 1.4, x: 1.425, z: 1.509, act: "defend" }],
          b15: [{ t: 0, x: 6.501, z: 0.471, act: "defend" }, { t: 1.4, x: 6.501, z: 0.471, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 1.4, x: 0, z: 0.8, act: "defend" }],
          b7: [{ t: 0, x: 1.425, z: 1.509, act: "defend" }, { t: 1.4, x: 1.425, z: 1.509, act: "defend" }],
          b15: [{ t: 0, x: 6.501, z: 0.471, act: "defend" }, { t: 1.4, x: 6.501, z: 0.471, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }]
        }
      }
    },
    {
      id: "hedge",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0.2, z: 5.2, act: "defend" }, { t: 1.4, x: 0, z: 5, act: "defend" }],
          b7: [{ t: 0, x: 0.2, z: 1, act: "defend" }, { t: 1.4, x: 0, z: 0.8, act: "defend" }],
          b15: [{ t: 0, x: 6.701, z: 0.671, act: "defend" }, { t: 1.4, x: 6.501, z: 0.471, act: "defend" }],
          b21: [{ t: 0, x: -5.2, z: 8.2, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5, z: 8.2, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }]
        },
        to_r50: {
          b1: [{ t: 0, x: 0, z: 5, act: "defend" }, { t: 1.4, x: 0, z: 5, act: "defend" }],
          b7: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 1.4, x: 0, z: 0.8, act: "defend" }],
          b15: [{ t: 0, x: 6.501, z: 0.471, act: "defend" }, { t: 1.4, x: 6.501, z: 0.471, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: 0, z: 5, act: "defend" }, { t: 1.4, x: 0, z: 5, act: "defend" }],
          b7: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 1.4, x: 0, z: 0.8, act: "defend" }],
          b15: [{ t: 0, x: 6.501, z: 0.471, act: "defend" }, { t: 1.4, x: 6.501, z: 0.471, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }]
        }
      }
    },
    {
      id: "switch",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -5, z: 8.2, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }],
          b7: [{ t: 0, x: 1.625, z: 1.709, act: "defend" }, { t: 1.4, x: 1.425, z: 1.509, act: "defend" }],
          b15: [{ t: 0, x: 6.701, z: 0.671, act: "defend" }, { t: 1.4, x: 6.501, z: 0.471, act: "defend" }],
          b21: [{ t: 0, x: -5.2, z: 8.2, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: 0.2, z: 5.2, act: "defend" }, { t: 1.4, x: 0, z: 5, act: "defend" }]
        },
        to_r50: {
          b1: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }],
          b7: [{ t: 0, x: 1.425, z: 1.509, act: "defend" }, { t: 1.4, x: 1.425, z: 1.509, act: "defend" }],
          b15: [{ t: 0, x: 6.501, z: 0.471, act: "defend" }, { t: 1.4, x: 6.501, z: 0.471, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: 0, z: 5, act: "defend" }, { t: 1.4, x: 0, z: 5, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }],
          b7: [{ t: 0, x: 1.425, z: 1.509, act: "defend" }, { t: 1.4, x: 1.425, z: 1.509, act: "defend" }],
          b15: [{ t: 0, x: 6.501, z: 0.471, act: "defend" }, { t: 1.4, x: 6.501, z: 0.471, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: 0, z: 5, act: "defend" }, { t: 1.4, x: 0, z: 5, act: "defend" }]
        }
      }
    },
    {
      id: "corner_help",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0.2, z: 5.2, act: "defend" }, { t: 1.4, x: 0, z: 5, act: "defend" }],
          b7: [{ t: 0, x: 0.2, z: 1, act: "defend" }, { t: 1.4, x: 0, z: 0.8, act: "defend" }],
          b15: [{ t: 0, x: 1.625, z: 1.709, act: "defend" }, { t: 1.4, x: 1.425, z: 1.509, act: "defend" }],
          b21: [{ t: 0, x: -5.2, z: 8.2, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5, z: 8.2, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }]
        },
        to_r50: {
          b1: [{ t: 0, x: 0, z: 5, act: "defend" }, { t: 1.4, x: 0, z: 5, act: "defend" }],
          b7: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 1.4, x: 0, z: 0.8, act: "defend" }],
          b15: [{ t: 0, x: 1.425, z: 1.509, act: "defend" }, { t: 1.4, x: 1.425, z: 1.509, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: 0, z: 5, act: "defend" }, { t: 1.4, x: 0, z: 5, act: "defend" }],
          b7: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 1.4, x: 0, z: 0.8, act: "defend" }],
          b15: [{ t: 0, x: 1.425, z: 1.509, act: "defend" }, { t: 1.4, x: 1.425, z: 1.509, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }]
        }
      }
    }
  ]
};

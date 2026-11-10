import type { Play } from '../types';

export const FASTBREAK: Play = {
  id: "fastbreak",
  name: "Fast Break",
  clockS: 6,
  deficit: 2,
  actors: ["r3", "r23", "r11", "b1", "b44"],
  start: "setup",
  segments: {
    setup: {
      id: "setup",
      handler: "r3",
      paths: {
        r3: [{ t: 0, x: 0, z: 12.425, act: "dribble" }, { t: 1.3, x: 0, z: 4.2, act: "dribble" }],
        r23: [{ t: 0, x: -4, z: 10, act: "run" }, { t: 1.3, x: -1.5, z: 3.7, act: "stand" }],
        r11: [{ t: 0, x: 4, z: 10, act: "run" }, { t: 1.3, x: 1.5, z: 3.7, act: "stand" }]
      },
      decisionAt: 1.3,
      options: [{ kind: "shoot" }, { kind: "drive" }, { kind: "pass", to: "r23", next: "to_r23" }, { kind: "pass", to: "r11", next: "to_r11" }]
    },
    to_r23: {
      id: "to_r23",
      handler: "r23",
      paths: {
        r3: [{ t: 0, x: 0, z: 4.2, act: "stand" }],
        r23: [{ t: 0, x: -1.5, z: 3.7, act: "stand" }],
        r11: [{ t: 0, x: 1.5, z: 3.7, act: "stand" }]
      },
      decisionAt: 0.4,
      options: [{ kind: "shoot" }, { kind: "drive" }]
    },
    to_r11: {
      id: "to_r11",
      handler: "r11",
      paths: {
        r3: [{ t: 0, x: 0, z: 4.2, act: "stand" }],
        r23: [{ t: 0, x: -1.5, z: 3.7, act: "stand" }],
        r11: [{ t: 0, x: 1.5, z: 3.7, act: "stand" }]
      },
      decisionAt: 0.4,
      options: [{ kind: "shoot" }, { kind: "drive" }]
    }
  },
  variants: [
    {
      id: "staggered",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -0.6, z: 3.3, act: "defend" }],
          b44: [{ t: 0, x: 0, z: 0.8, act: "defend" }]
        },
        to_r23: {
          b1: [{ t: 0, x: -0.6, z: 3.3, act: "defend" }],
          b44: [{ t: 0, x: 0, z: 0.8, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: -0.6, z: 3.3, act: "defend" }],
          b44: [{ t: 0, x: 0, z: 0.8, act: "defend" }]
        }
      }
    },
    {
      id: "split",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -0.6, z: 3.3, act: "defend" }],
          b44: [{ t: 0, x: 0.6, z: 3.3, act: "defend" }]
        },
        to_r23: {
          b1: [{ t: 0, x: -0.6, z: 3.3, act: "defend" }],
          b44: [{ t: 0, x: 0.6, z: 3.3, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: -0.6, z: 3.3, act: "defend" }],
          b44: [{ t: 0, x: 0.6, z: 3.3, act: "defend" }]
        }
      }
    },
    {
      id: "stop_ball",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0.6, z: 3.3, act: "defend" }],
          b44: [{ t: 0, x: 0, z: 0.8, act: "defend" }]
        },
        to_r23: {
          b1: [{ t: 0, x: 0.6, z: 3.3, act: "defend" }],
          b44: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 0.8, x: 2.6, z: 2.5, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: 0.6, z: 3.3, act: "defend" }],
          b44: [{ t: 0, x: 0, z: 0.8, act: "defend" }]
        }
      }
    }
  ]
};

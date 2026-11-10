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
        r3: [{ t: 0, x: 0, z: 12.425, act: "dribble" }, { t: 1.3, x: 0, z: 8.2, act: "dribble" }, { t: 2.55, x: 0, z: 5.7, act: "dribble" }, { t: 3.175, x: 1.1, z: 4.95, act: "dribble" }, { t: 3.8, x: 0, z: 4.2, act: "dribble" }],
        r23: [{ t: 0, x: -4, z: 10, act: "run" }, { t: 1.3, x: -4, z: 8, act: "run" }, { t: 2.55, x: -2, z: 6.4, act: "run" }, { t: 3.55, x: -0.9, z: 5.1, act: "run" }, { t: 3.8, x: -1.5, z: 3.7, act: "run" }],
        r11: [{ t: 0, x: 4, z: 10, act: "run" }, { t: 1.3, x: 4, z: 8, act: "run" }, { t: 2.55, x: 2, z: 6.4, act: "run" }, { t: 3.55, x: 0.9, z: 5.1, act: "run" }, { t: 3.8, x: 1.5, z: 3.7, act: "run" }]
      },
      decisionAt: 3.8,
      options: [{ kind: "shoot" }, { kind: "drive" }, { kind: "pass", to: "r23", next: "to_r23" }, { kind: "pass", to: "r11", next: "to_r11" }]
    },
    to_r23: {
      id: "to_r23",
      handler: "r23",
      paths: {
        r3: [{ t: 0, x: 0, z: 4.2, act: "run" }, { t: 3, x: 1.5, z: 2.7, act: "run" }],
        r23: [{ t: 0, x: -1.5, z: 3.7, act: "dribble" }, { t: 3, x: 4.5, z: 3.7, act: "dribble" }],
        r11: [{ t: 0, x: 1.5, z: 3.7, act: "run" }, { t: 3, x: 0, z: 5.2, act: "run" }]
      },
      decisionAt: 3,
      options: [{ kind: "shoot" }, { kind: "drive" }]
    },
    to_r11: {
      id: "to_r11",
      handler: "r11",
      paths: {
        r3: [{ t: 0, x: 0, z: 4.2, act: "run" }, { t: 3, x: 1.5, z: 2.7, act: "run" }],
        r23: [{ t: 0, x: -1.5, z: 3.7, act: "run" }, { t: 3, x: 0, z: 5.2, act: "run" }],
        r11: [{ t: 0, x: 1.5, z: 3.7, act: "dribble" }, { t: 3, x: -4.5, z: 3.7, act: "dribble" }]
      },
      decisionAt: 3,
      options: [{ kind: "shoot" }, { kind: "drive" }]
    }
  },
  variants: [
    {
      id: "staggered",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0, z: 6.5, act: "defend" }, { t: 1.3, x: -0.03, z: 6.34, act: "defend" }, { t: 2.55, x: -0.3, z: 4.9, act: "defend" }, { t: 3.8, x: -0.6, z: 3.3, act: "defend" }],
          b44: [{ t: 0, x: 1.6, z: 1.6, act: "defend" }, { t: 1.3, x: 1.4, z: 1.5, act: "defend" }, { t: 2.55, x: 0.4, z: 0.8, act: "defend" }, { t: 3.8, x: 0, z: 0.8, act: "defend" }]
        },
        to_r23: {
          b1: [{ t: 0, x: -0.6, z: 3.3, act: "defend" }, { t: 3, x: 4.191, z: 3.446, act: "defend" }],
          b44: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 3, x: 1.5, z: 2.3, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: -0.6, z: 3.3, act: "defend" }, { t: 3, x: -4.191, z: 3.446, act: "defend" }],
          b44: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 3, x: 1.5, z: 2.3, act: "defend" }]
        }
      }
    },
    {
      id: "split",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0, z: 6.5, act: "defend" }, { t: 1.3, x: -0.03, z: 6.34, act: "defend" }, { t: 2.55, x: -0.3, z: 4.9, act: "defend" }, { t: 3.8, x: -0.6, z: 3.3, act: "defend" }],
          b44: [{ t: 0, x: 0, z: 6.5, act: "defend" }, { t: 1.3, x: 0.03, z: 6.34, act: "defend" }, { t: 2.55, x: 0.3, z: 4.9, act: "defend" }, { t: 3.8, x: 0.6, z: 3.3, act: "defend" }]
        },
        to_r23: {
          b1: [{ t: 0, x: -0.6, z: 3.3, act: "defend" }, { t: 3, x: 4.191, z: 3.446, act: "defend" }],
          b44: [{ t: 0, x: 0.6, z: 3.3, act: "defend" }, { t: 3, x: -0.9, z: 4.8, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: -0.6, z: 3.3, act: "defend" }, { t: 3, x: 0.9, z: 4.8, act: "defend" }],
          b44: [{ t: 0, x: 0.6, z: 3.3, act: "defend" }, { t: 3, x: -4.191, z: 3.446, act: "defend" }]
        }
      }
    },
    {
      id: "stop_ball",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0, z: 6.5, act: "defend" }, { t: 1.3, x: 0.03, z: 6.34, act: "defend" }, { t: 2.55, x: 0.3, z: 4.9, act: "defend" }, { t: 3.8, x: 0.6, z: 3.3, act: "defend" }],
          b44: [{ t: 0, x: 1.6, z: 1.6, act: "defend" }, { t: 1.3, x: 1.4, z: 1.5, act: "defend" }, { t: 2.55, x: 0.4, z: 0.8, act: "defend" }, { t: 3.8, x: 0, z: 0.8, act: "defend" }]
        },
        to_r23: {
          b1: [{ t: 0, x: 0.6, z: 3.3, act: "defend" }, { t: 3, x: 4.191, z: 3.446, act: "defend" }],
          b44: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 3, x: 1.5, z: 2.3, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: 0.6, z: 3.3, act: "defend" }, { t: 3, x: -4.191, z: 3.446, act: "defend" }],
          b44: [{ t: 0, x: 0, z: 0.8, act: "defend" }, { t: 3, x: 1.5, z: 2.3, act: "defend" }]
        }
      }
    }
  ]
};

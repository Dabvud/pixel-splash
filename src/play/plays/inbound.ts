import type { Play } from '../types';

export const INBOUND: Play = {
  id: "inbound",
  name: "Inbound / Last Shot",
  clockS: 3,
  deficit: [1, 3],
  actors: ["r3", "r11", "r50", "r23", "r32", "b1", "b7", "b15", "b21", "b44"],
  start: "setup",
  segments: {
    setup: {
      id: "setup",
      handler: "r3",
      paths: {
        r3: [{ t: 0, x: -8, z: 3, act: "inbound" }, { t: 0.5, x: -8, z: 3, act: "inbound" }],
        r11: [{ t: 0, x: -4, z: 3, act: "run" }, { t: 0.5, x: -5.5, z: 4.3, act: "stand" }],
        r50: [{ t: 0, x: 0.2, z: 0.6, act: "stand" }, { t: 0.5, x: 0.2, z: 0.6, act: "stand" }],
        r23: [{ t: 0, x: 3, z: 3, act: "run" }, { t: 0.5, x: 2, z: 1.8, act: "stand" }],
        r32: [{ t: 0, x: -4.5, z: 3.4, act: "screen" }]
      },
      decisionAt: 0.5,
      options: [{ kind: "pass", to: "r11", next: "to_r11" }, { kind: "pass", to: "r50", next: "to_r50", lob: true }, { kind: "pass", to: "r23", next: "to_r23" }]
    },
    to_r11: {
      id: "to_r11",
      handler: "r11",
      paths: {
        r3: [{ t: 0, x: -8, z: 3, act: "stand" }],
        r11: [{ t: 0, x: -5.5, z: 4.3, act: "stand" }],
        r50: [{ t: 0, x: 0.2, z: 0.6, act: "stand" }],
        r23: [{ t: 0, x: 2, z: 1.8, act: "stand" }],
        r32: [{ t: 0, x: -4.5, z: 3.4, act: "stand" }]
      },
      decisionAt: 0.4,
      options: [{ kind: "shoot" }, { kind: "drive" }]
    },
    to_r50: {
      id: "to_r50",
      handler: "r50",
      paths: {
        r3: [{ t: 0, x: -8, z: 3, act: "stand" }],
        r11: [{ t: 0, x: -5.5, z: 4.3, act: "stand" }],
        r50: [{ t: 0, x: 0.2, z: 0.6, act: "stand" }],
        r23: [{ t: 0, x: 2, z: 1.8, act: "stand" }],
        r32: [{ t: 0, x: -4.5, z: 3.4, act: "stand" }]
      },
      decisionAt: 0.4,
      options: [{ kind: "shoot" }, { kind: "drive" }]
    },
    to_r23: {
      id: "to_r23",
      handler: "r23",
      paths: {
        r3: [{ t: 0, x: -8, z: 3, act: "stand" }],
        r11: [{ t: 0, x: -5.5, z: 4.3, act: "stand" }],
        r50: [{ t: 0, x: 0.2, z: 0.6, act: "stand" }],
        r23: [{ t: 0, x: 2, z: 1.8, act: "stand" }],
        r32: [{ t: 0, x: -4.5, z: 3.4, act: "stand" }]
      },
      decisionAt: 0.4,
      options: [{ kind: "shoot" }, { kind: "drive" }]
    }
  },
  variants: [
    {
      id: "switch",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -4.985, z: 4.254, act: "defend" }, { t: 0.5, x: -5.185, z: 4.054, act: "defend" }],
          b7: [{ t: 0, x: 1.903, z: 1.732, act: "defend" }, { t: 0.5, x: 1.703, z: 1.532, act: "defend" }],
          b15: [{ t: 0, x: -5.4, z: 8.2, act: "defend" }, { t: 0.5, x: -5.6, z: 8, act: "defend" }],
          b21: [{ t: 0, x: -5.2, z: 8.2, act: "defend" }, { t: 0.5, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5, z: 8.2, act: "defend" }, { t: 0.5, x: -5.2, z: 8, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: -5.185, z: 4.054, act: "defend" }, { t: 1.4, x: -5.185, z: 4.054, act: "defend" }],
          b7: [{ t: 0, x: 1.703, z: 1.532, act: "defend" }, { t: 1.4, x: 1.703, z: 1.532, act: "defend" }],
          b15: [{ t: 0, x: -5.6, z: 8, act: "defend" }, { t: 1.4, x: -5.6, z: 8, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }]
        },
        to_r50: {
          b1: [{ t: 0, x: -5.185, z: 4.054, act: "defend" }, { t: 1.4, x: -5.185, z: 4.054, act: "defend" }],
          b7: [{ t: 0, x: 1.703, z: 1.532, act: "defend" }, { t: 1.4, x: 1.703, z: 1.532, act: "defend" }],
          b15: [{ t: 0, x: -5.6, z: 8, act: "defend" }, { t: 1.4, x: -5.6, z: 8, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }]
        },
        to_r23: {
          b1: [{ t: 0, x: -5.185, z: 4.054, act: "defend" }, { t: 1.4, x: -5.185, z: 4.054, act: "defend" }],
          b7: [{ t: 0, x: 1.703, z: 1.532, act: "defend" }, { t: 1.4, x: 1.703, z: 1.532, act: "defend" }],
          b15: [{ t: 0, x: -5.6, z: 8, act: "defend" }, { t: 1.4, x: -5.6, z: 8, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }]
        }
      }
    },
    {
      id: "stuck",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0.274, z: 0.421, act: "defend" }, { t: 0.5, x: 0.074, z: 0.221, act: "defend" }],
          b7: [{ t: 0, x: 1.903, z: 1.732, act: "defend" }, { t: 0.5, x: 1.703, z: 1.532, act: "defend" }],
          b15: [{ t: 0, x: -5.4, z: 8.2, act: "defend" }, { t: 0.5, x: -5.6, z: 8, act: "defend" }],
          b21: [{ t: 0, x: -5.2, z: 8.2, act: "defend" }, { t: 0.5, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5, z: 8.2, act: "defend" }, { t: 0.5, x: -5.2, z: 8, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: 0.074, z: 0.221, act: "defend" }, { t: 1.4, x: 0.074, z: 0.221, act: "defend" }],
          b7: [{ t: 0, x: 1.703, z: 1.532, act: "defend" }, { t: 1.4, x: 1.703, z: 1.532, act: "defend" }],
          b15: [{ t: 0, x: -5.6, z: 8, act: "defend" }, { t: 1.4, x: -5.6, z: 8, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }]
        },
        to_r50: {
          b1: [{ t: 0, x: 0.074, z: 0.221, act: "defend" }, { t: 1.4, x: 0.074, z: 0.221, act: "defend" }],
          b7: [{ t: 0, x: 1.703, z: 1.532, act: "defend" }, { t: 1.4, x: 1.703, z: 1.532, act: "defend" }],
          b15: [{ t: 0, x: -5.6, z: 8, act: "defend" }, { t: 1.4, x: -5.6, z: 8, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }]
        },
        to_r23: {
          b1: [{ t: 0, x: 0.074, z: 0.221, act: "defend" }, { t: 1.4, x: 0.074, z: 0.221, act: "defend" }],
          b7: [{ t: 0, x: 1.703, z: 1.532, act: "defend" }, { t: 1.4, x: 1.703, z: 1.532, act: "defend" }],
          b15: [{ t: 0, x: -5.6, z: 8, act: "defend" }, { t: 1.4, x: -5.6, z: 8, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }]
        }
      }
    },
    {
      id: "double",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -4.985, z: 4.254, act: "defend" }, { t: 0.5, x: -5.185, z: 4.054, act: "defend" }],
          b7: [{ t: 0, x: 0.274, z: 0.421, act: "defend" }, { t: 0.5, x: 0.074, z: 0.221, act: "defend" }],
          b15: [{ t: 0, x: -5.1, z: 4, act: "defend" }, { t: 0.5, x: -5.3, z: 3.8, act: "defend" }],
          b21: [{ t: 0, x: -5.2, z: 8.2, act: "defend" }, { t: 0.5, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5, z: 8.2, act: "defend" }, { t: 0.5, x: -5.2, z: 8, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: -5.185, z: 4.054, act: "defend" }, { t: 1.4, x: -5.185, z: 4.054, act: "defend" }],
          b7: [{ t: 0, x: 0.074, z: 0.221, act: "defend" }, { t: 1.4, x: 0.074, z: 0.221, act: "defend" }],
          b15: [{ t: 0, x: -5.3, z: 3.8, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }]
        },
        to_r50: {
          b1: [{ t: 0, x: -5.185, z: 4.054, act: "defend" }, { t: 1.4, x: -5.185, z: 4.054, act: "defend" }],
          b7: [{ t: 0, x: 0.074, z: 0.221, act: "defend" }, { t: 1.4, x: 0.074, z: 0.221, act: "defend" }],
          b15: [{ t: 0, x: -5.3, z: 3.8, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }]
        },
        to_r23: {
          b1: [{ t: 0, x: -5.185, z: 4.054, act: "defend" }, { t: 1.4, x: -5.185, z: 4.054, act: "defend" }],
          b7: [{ t: 0, x: 0.074, z: 0.221, act: "defend" }, { t: 1.4, x: 0.074, z: 0.221, act: "defend" }],
          b15: [{ t: 0, x: -5.3, z: 3.8, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 1.4, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 1.4, x: -5.2, z: 8, act: "defend" }]
        }
      }
    }
  ],
  inboundBy: "r3"
};

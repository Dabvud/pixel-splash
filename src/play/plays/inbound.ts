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
        r3: [{ t: 0, x: -8, z: 9, act: "run" }, { t: 0.5, x: -8, z: 8, act: "run" }, { t: 3, x: -8, z: 3, act: "run" }],
        r11: [{ t: 0, x: -4, z: 3, act: "run" }, { t: 0.5, x: -3.5, z: 6.3, act: "run" }, { t: 3, x: -5.5, z: 4.3, act: "run" }],
        r50: [{ t: 0, x: 0.2, z: 0.6, act: "run" }, { t: 0.5, x: 1.8, z: 3, act: "run" }, { t: 3, x: 0.2, z: 0.6, act: "run" }],
        r23: [{ t: 0, x: 3, z: 3, act: "run" }, { t: 0.5, x: 4, z: 3.8, act: "run" }, { t: 3, x: 2, z: 1.8, act: "run" }],
        r32: [{ t: 0, x: -4.5, z: 3.4, act: "screen" }, { t: 0.5, x: -4.5, z: 5.4, act: "run" }, { t: 3, x: -4.5, z: 3.4, act: "run" }]
      },
      decisionAt: 3,
      options: [{ kind: "pass", to: "r11", next: "to_r11" }, { kind: "pass", to: "r50", next: "to_r50", lob: true }, { kind: "pass", to: "r23", next: "to_r23" }]
    },
    to_r11: {
      id: "to_r11",
      handler: "r11",
      paths: {
        r3: [{ t: 0, x: -8, z: 3, act: "run" }, { t: 3, x: -8, z: 5, act: "run" }],
        r11: [{ t: 0, x: -5.5, z: 4.3, act: "dribble" }, { t: 3, x: 0.5, z: 4.3, act: "dribble" }],
        r50: [{ t: 0, x: 0.2, z: 0.6, act: "run" }, { t: 3, x: -1.3, z: 2.1, act: "run" }],
        r23: [{ t: 0, x: 2, z: 1.8, act: "run" }, { t: 3, x: 0.5, z: 3.3, act: "run" }],
        r32: [{ t: 0, x: -4.5, z: 3.4, act: "run" }, { t: 3, x: -3, z: 4.9, act: "run" }]
      },
      decisionAt: 3,
      options: [{ kind: "shoot" }, { kind: "drive" }]
    },
    to_r50: {
      id: "to_r50",
      handler: "r50",
      paths: {
        r3: [{ t: 0, x: -8, z: 3, act: "run" }, { t: 3, x: -8, z: 5, act: "run" }],
        r11: [{ t: 0, x: -5.5, z: 4.3, act: "run" }, { t: 3, x: -4, z: 2.8, act: "run" }],
        r50: [{ t: 0, x: 0.2, z: 0.6, act: "dribble" }, { t: 3, x: -5.8, z: 0.6, act: "dribble" }],
        r23: [{ t: 0, x: 2, z: 1.8, act: "run" }, { t: 3, x: 0.5, z: 3.3, act: "run" }],
        r32: [{ t: 0, x: -4.5, z: 3.4, act: "run" }, { t: 3, x: -3, z: 4.9, act: "run" }]
      },
      decisionAt: 3,
      options: [{ kind: "shoot" }, { kind: "drive" }]
    },
    to_r23: {
      id: "to_r23",
      handler: "r23",
      paths: {
        r3: [{ t: 0, x: -8, z: 3, act: "run" }, { t: 3, x: -8, z: 5, act: "run" }],
        r11: [{ t: 0, x: -5.5, z: 4.3, act: "run" }, { t: 3, x: -4, z: 2.8, act: "run" }],
        r50: [{ t: 0, x: 0.2, z: 0.6, act: "run" }, { t: 3, x: -1.3, z: 2.1, act: "run" }],
        r23: [{ t: 0, x: 2, z: 1.8, act: "dribble" }, { t: 3, x: -4, z: 1.8, act: "dribble" }],
        r32: [{ t: 0, x: -4.5, z: 3.4, act: "run" }, { t: 3, x: -3, z: 4.9, act: "run" }]
      },
      decisionAt: 3,
      options: [{ kind: "shoot" }, { kind: "drive" }]
    }
  },
  variants: [
    {
      id: "switch",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -4.805, z: 4.428, act: "defend" }, { t: 0.5, x: -4.824, z: 4.41, act: "defend" }, { t: 1.75, x: -4.995, z: 4.241, act: "defend" }, { t: 3, x: -5.185, z: 4.054, act: "defend" }],
          b7: [{ t: 0, x: 2.105, z: 1.93, act: "defend" }, { t: 0.5, x: 2.085, z: 1.91, act: "defend" }, { t: 1.75, x: 1.904, z: 1.731, act: "defend" }, { t: 3, x: 1.703, z: 1.532, act: "defend" }],
          b15: [{ t: 0, x: -4.4, z: 10, act: "defend" }, { t: 0.5, x: -4.46, z: 9.9, act: "defend" }, { t: 1.75, x: -5, z: 9, act: "defend" }, { t: 3, x: -5.6, z: 8, act: "defend" }],
          b21: [{ t: 0, x: -4.2, z: 10, act: "defend" }, { t: 0.5, x: -4.26, z: 9.9, act: "defend" }, { t: 1.75, x: -4.8, z: 9, act: "defend" }, { t: 3, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -4, z: 10, act: "defend" }, { t: 0.5, x: -4.06, z: 9.9, act: "defend" }, { t: 1.75, x: -4.6, z: 9, act: "defend" }, { t: 3, x: -5.2, z: 8, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: -5.185, z: 4.054, act: "defend" }, { t: 3, x: 0.454, z: 3.903, act: "defend" }],
          b7: [{ t: 0, x: 1.703, z: 1.532, act: "defend" }, { t: 3, x: 0.203, z: 3.032, act: "defend" }],
          b15: [{ t: 0, x: -5.6, z: 8, act: "defend" }, { t: 3, x: -4.1, z: 6.5, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 3, x: -3.9, z: 6.5, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 3, x: -3.7, z: 6.5, act: "defend" }]
        },
        to_r50: {
          b1: [{ t: 0, x: -5.185, z: 4.054, act: "defend" }, { t: 3, x: -3.685, z: 2.554, act: "defend" }],
          b7: [{ t: 0, x: 1.703, z: 1.532, act: "defend" }, { t: 3, x: -5.402, z: 0.559, act: "defend" }],
          b15: [{ t: 0, x: -5.6, z: 8, act: "defend" }, { t: 3, x: -4.1, z: 6.5, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 3, x: -3.9, z: 6.5, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 3, x: -3.7, z: 6.5, act: "defend" }]
        },
        to_r23: {
          b1: [{ t: 0, x: -5.185, z: 4.054, act: "defend" }, { t: 3, x: -3.685, z: 2.554, act: "defend" }],
          b7: [{ t: 0, x: 1.703, z: 1.532, act: "defend" }, { t: 3, x: -3.635, z: 1.636, act: "defend" }],
          b15: [{ t: 0, x: -5.6, z: 8, act: "defend" }, { t: 3, x: -4.1, z: 6.5, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 3, x: -3.9, z: 6.5, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 3, x: -3.7, z: 6.5, act: "defend" }]
        }
      }
    },
    {
      id: "stuck",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: 0.331, z: 0.724, act: "defend" }, { t: 0.5, x: 0.318, z: 0.699, act: "defend" }, { t: 1.75, x: 0.202, z: 0.472, act: "defend" }, { t: 3, x: 0.074, z: 0.221, act: "defend" }],
          b7: [{ t: 0, x: 2.105, z: 1.93, act: "defend" }, { t: 0.5, x: 2.085, z: 1.91, act: "defend" }, { t: 1.75, x: 1.904, z: 1.731, act: "defend" }, { t: 3, x: 1.703, z: 1.532, act: "defend" }],
          b15: [{ t: 0, x: -4.4, z: 10, act: "defend" }, { t: 0.5, x: -4.46, z: 9.9, act: "defend" }, { t: 1.75, x: -5, z: 9, act: "defend" }, { t: 3, x: -5.6, z: 8, act: "defend" }],
          b21: [{ t: 0, x: -4.2, z: 10, act: "defend" }, { t: 0.5, x: -4.26, z: 9.9, act: "defend" }, { t: 1.75, x: -4.8, z: 9, act: "defend" }, { t: 3, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -4, z: 10, act: "defend" }, { t: 0.5, x: -4.06, z: 9.9, act: "defend" }, { t: 1.75, x: -4.6, z: 9, act: "defend" }, { t: 3, x: -5.2, z: 8, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: 0.074, z: 0.221, act: "defend" }, { t: 3, x: -1.426, z: 1.721, act: "defend" }],
          b7: [{ t: 0, x: 1.703, z: 1.532, act: "defend" }, { t: 3, x: 0.203, z: 3.032, act: "defend" }],
          b15: [{ t: 0, x: -5.6, z: 8, act: "defend" }, { t: 3, x: 0.454, z: 3.903, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 3, x: -3.9, z: 6.5, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 3, x: -3.7, z: 6.5, act: "defend" }]
        },
        to_r50: {
          b1: [{ t: 0, x: 0.074, z: 0.221, act: "defend" }, { t: 3, x: -5.402, z: 0.559, act: "defend" }],
          b7: [{ t: 0, x: 1.703, z: 1.532, act: "defend" }, { t: 3, x: 0.203, z: 3.032, act: "defend" }],
          b15: [{ t: 0, x: -5.6, z: 8, act: "defend" }, { t: 3, x: -4.1, z: 6.5, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 3, x: -3.9, z: 6.5, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 3, x: -3.7, z: 6.5, act: "defend" }]
        },
        to_r23: {
          b1: [{ t: 0, x: 0.074, z: 0.221, act: "defend" }, { t: 3, x: -1.426, z: 1.721, act: "defend" }],
          b7: [{ t: 0, x: 1.703, z: 1.532, act: "defend" }, { t: 3, x: -3.635, z: 1.636, act: "defend" }],
          b15: [{ t: 0, x: -5.6, z: 8, act: "defend" }, { t: 3, x: -4.1, z: 6.5, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 3, x: -3.9, z: 6.5, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 3, x: -3.7, z: 6.5, act: "defend" }]
        }
      }
    },
    {
      id: "double",
      weight: 1,
      defPaths: {
        setup: {
          b1: [{ t: 0, x: -4.805, z: 4.428, act: "defend" }, { t: 0.5, x: -4.824, z: 4.41, act: "defend" }, { t: 1.75, x: -4.995, z: 4.241, act: "defend" }, { t: 3, x: -5.185, z: 4.054, act: "defend" }],
          b7: [{ t: 0, x: 0.331, z: 0.724, act: "defend" }, { t: 0.5, x: 0.318, z: 0.699, act: "defend" }, { t: 1.75, x: 0.202, z: 0.472, act: "defend" }, { t: 3, x: 0.074, z: 0.221, act: "defend" }],
          b15: [{ t: 0, x: -4.233, z: 4.294, act: "defend" }, { t: 0.5, x: -4.286, z: 4.269, act: "defend" }, { t: 1.75, x: -4.766, z: 4.047, act: "defend" }, { t: 3, x: -5.3, z: 3.8, act: "defend" }],
          b21: [{ t: 0, x: -4.2, z: 10, act: "defend" }, { t: 0.5, x: -4.26, z: 9.9, act: "defend" }, { t: 1.75, x: -4.8, z: 9, act: "defend" }, { t: 3, x: -5.4, z: 8, act: "defend" }],
          b44: [{ t: 0, x: -4, z: 10, act: "defend" }, { t: 0.5, x: -4.06, z: 9.9, act: "defend" }, { t: 1.75, x: -4.6, z: 9, act: "defend" }, { t: 3, x: -5.2, z: 8, act: "defend" }]
        },
        to_r11: {
          b1: [{ t: 0, x: -5.185, z: 4.054, act: "defend" }, { t: 3, x: 0.454, z: 3.903, act: "defend" }],
          b7: [{ t: 0, x: 0.074, z: 0.221, act: "defend" }, { t: 3, x: -1.426, z: 1.721, act: "defend" }],
          b15: [{ t: 0, x: -5.3, z: 3.8, act: "defend" }, { t: 3, x: -3.8, z: 5.3, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 3, x: -3.9, z: 6.5, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 3, x: -3.7, z: 6.5, act: "defend" }]
        },
        to_r50: {
          b1: [{ t: 0, x: -5.185, z: 4.054, act: "defend" }, { t: 3, x: -3.685, z: 2.554, act: "defend" }],
          b7: [{ t: 0, x: 0.074, z: 0.221, act: "defend" }, { t: 3, x: -5.402, z: 0.559, act: "defend" }],
          b15: [{ t: 0, x: -5.3, z: 3.8, act: "defend" }, { t: 3, x: -3.8, z: 5.3, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 3, x: -3.9, z: 6.5, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 3, x: -3.7, z: 6.5, act: "defend" }]
        },
        to_r23: {
          b1: [{ t: 0, x: -5.185, z: 4.054, act: "defend" }, { t: 3, x: -3.685, z: 2.554, act: "defend" }],
          b7: [{ t: 0, x: 0.074, z: 0.221, act: "defend" }, { t: 3, x: -3.635, z: 1.636, act: "defend" }],
          b15: [{ t: 0, x: -5.3, z: 3.8, act: "defend" }, { t: 3, x: -3.8, z: 5.3, act: "defend" }],
          b21: [{ t: 0, x: -5.4, z: 8, act: "defend" }, { t: 3, x: -3.9, z: 6.5, act: "defend" }],
          b44: [{ t: 0, x: -5.2, z: 8, act: "defend" }, { t: 3, x: -3.7, z: 6.5, act: "defend" }]
        }
      }
    }
  ],
  inboundBy: "r3"
};

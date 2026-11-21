/**
 * SpriteSplit Studio - Universal Action & Pose Studio
 * Quản lý & sáng tạo thư viện tư thế (Static Poses) & chu kỳ chuyển động (Motion Cycles)
 * Chuẩn hóa hệ quy chiếu Canvas 400x1000 & xuất universal_actions.json cho Remotion Engine
 * Hỗ trợ xoay khớp xương (Rotate) VÀ co giãn tỉ lệ bộ phận (Scale X/Y: Thở phập phồng, Nhún, Squash & Stretch)
 */

(function () {
    'use strict';

    // 1. ĐỊNH NGHĨA KHUNG XƯƠNG CHUẨN CANVAS 400x1000 KÈM ĐIỂM PIVOT & ĐIỂM TAY CẦM GIZMO (HANDLE)
    const SKELETON_DEF = {
        torso:     { id: 'torso',     name: 'Thân người',        parent: null,        pivot: [200, 420], handle: [200, 335], color: '#3b82f6', category: 'body' },
        neck:      { id: 'neck',      name: 'Cổ',                parent: 'torso',     pivot: [200, 310], handle: [200, 275], color: '#6366f1', category: 'body' },
        head:      { id: 'head',      name: 'Đầu',               parent: 'neck',      pivot: [200, 270], handle: [200, 180], color: '#8b5cf6', category: 'body' },
        arm_L:     { id: 'arm_L',     name: 'Bắp tay trái',     parent: 'torso',     pivot: [160, 330], handle: [150, 410], color: '#06b6d4', category: 'arm_L' },
        forearm_L: { id: 'forearm_L', name: 'Cẳng tay trái',    parent: 'arm_L',     pivot: [150, 410], handle: [145, 480], color: '#0ea5e9', category: 'arm_L' },
        hand_L:    { id: 'hand_L',    name: 'Bàn tay trái',     parent: 'forearm_L', pivot: [145, 480], handle: [145, 515], color: '#38bdf8', category: 'arm_L' },
        arm_R:     { id: 'arm_R',     name: 'Bắp tay phải',     parent: 'torso',     pivot: [240, 330], handle: [250, 410], color: '#f97316', category: 'arm_R' },
        forearm_R: { id: 'forearm_R', name: 'Cẳng tay phải',    parent: 'arm_R',     pivot: [250, 410], handle: [255, 480], color: '#fb923c', category: 'arm_R' },
        hand_R:    { id: 'hand_R',    name: 'Bàn tay phải',     parent: 'forearm_R', pivot: [255, 480], handle: [255, 515], color: '#fdba74', category: 'arm_R' },
        leg_L:     { id: 'leg_L',     name: 'Đùi trái',          parent: 'torso',     pivot: [175, 520], handle: [175, 660], color: '#0284c7', category: 'leg_L' },
        shin_L:    { id: 'shin_L',    name: 'Cẳng chân trái',   parent: 'leg_L',     pivot: [175, 660], handle: [175, 780], color: '#0369a1', category: 'leg_L' },
        foot_L:    { id: 'foot_L',    name: 'Bàn chân trái',    parent: 'shin_L',    pivot: [175, 780], handle: [155, 808], color: '#075985', category: 'leg_L' },
        leg_R:     { id: 'leg_R',     name: 'Đùi phải',          parent: 'torso',     pivot: [225, 520], handle: [225, 660], color: '#ea580c', category: 'leg_R' },
        shin_R:    { id: 'shin_R',    name: 'Cẳng chân phải',   parent: 'leg_R',     pivot: [225, 660], handle: [225, 780], color: '#c2410c', category: 'leg_R' },
        foot_R:    { id: 'foot_R',    name: 'Bàn chân phải',    parent: 'shin_R',    pivot: [225, 780], handle: [245, 808], color: '#9a3412', category: 'leg_R' }
    };

    const JOINT_KEYS = Object.keys(SKELETON_DEF);

    // 2. KHO HÀNH ĐỘNG MẪU BẮT BUỘC (8 TƯ THẾ TĨNH + CÁC CHU KỲ CHUYỂN ĐỘNG & CO GIÃN SCALE)
    const DEFAULT_ACTIONS = {
        "standing": {
                "name": "Đứng tự nhiên (Standing Idle)",
                "type": "static",
                "angles": {
                        "torso": 0,
                        "neck": 0,
                        "head": 0,
                        "arm_L": 8,
                        "forearm_L": 5,
                        "hand_L": 0,
                        "arm_R": -8,
                        "forearm_R": -5,
                        "hand_R": 0,
                        "leg_L": 0,
                        "shin_L": 0,
                        "foot_L": 0,
                        "leg_R": 0,
                        "shin_R": 0,
                        "foot_R": 0
                },
                "scales": {
                        "torso": [
                                1.0,
                                1.0
                        ],
                        "head": [
                                1.0,
                                1.0
                        ]
                }
        },
        "sitting": {
                "name": "Ngồi ghế (Sitting)",
                "type": "static",
                "angles": {
                        "torso": 0,
                        "neck": 0,
                        "head": 0,
                        "leg_L": 90,
                        "shin_L": -90,
                        "foot_L": 0,
                        "leg_R": 90,
                        "shin_R": -90,
                        "foot_R": 0,
                        "arm_L": 20,
                        "forearm_L": -30,
                        "hand_L": 0,
                        "arm_R": -20,
                        "forearm_R": 30,
                        "hand_R": 0
                },
                "scales": {
                        "torso": [
                                1.0,
                                1.0
                        ]
                }
        },
        "squatting": {
                "name": "Ngồi xổm (Squatting)",
                "type": "static",
                "angles": {
                        "torso": 15,
                        "neck": -10,
                        "head": -5,
                        "leg_L": 110,
                        "shin_L": -125,
                        "foot_L": 15,
                        "leg_R": 110,
                        "shin_R": -125,
                        "foot_R": 15,
                        "arm_L": 40,
                        "forearm_L": -45,
                        "hand_L": 10,
                        "arm_R": -40,
                        "forearm_R": 45,
                        "hand_R": -10
                },
                "scales": {
                        "torso": [
                                1.05,
                                0.95
                        ]
                }
        },
        "kneeling": {
                "name": "Quỳ gối (Kneeling)",
                "type": "static",
                "angles": {
                        "torso": 0,
                        "neck": 0,
                        "head": 0,
                        "leg_L": 0,
                        "shin_L": -95,
                        "foot_L": 10,
                        "leg_R": 0,
                        "shin_R": -95,
                        "foot_R": 10,
                        "arm_L": 15,
                        "forearm_L": -20,
                        "hand_L": 0,
                        "arm_R": -15,
                        "forearm_R": 20,
                        "hand_R": 0
                }
        },
        "cowering": {
                "name": "Co rúm sợ hãi (Cowering)",
                "type": "static",
                "angles": {
                        "torso": 25,
                        "neck": 15,
                        "head": 10,
                        "leg_L": 35,
                        "shin_L": -40,
                        "foot_L": 5,
                        "leg_R": 25,
                        "shin_R": -30,
                        "foot_R": 5,
                        "arm_L": 75,
                        "forearm_L": -110,
                        "hand_L": -20,
                        "arm_R": -75,
                        "forearm_R": 110,
                        "hand_R": 20
                },
                "scales": {
                        "torso": [
                                0.95,
                                0.92
                        ]
                }
        },
        "collapsed": {
                "name": "Ngã gục bất tỉnh (Collapsed)",
                "type": "static",
                "angles": {
                        "torso": 80,
                        "neck": 10,
                        "head": 15,
                        "leg_L": 20,
                        "shin_L": -15,
                        "foot_L": 10,
                        "leg_R": -10,
                        "shin_R": -25,
                        "foot_R": 15,
                        "arm_L": 110,
                        "forearm_L": -30,
                        "hand_L": 0,
                        "arm_R": -70,
                        "forearm_R": 40,
                        "hand_R": 0
                }
        },
        "praying": {
                "name": "Chắp tay cầu nguyện (Praying)",
                "type": "static",
                "angles": {
                        "torso": 8,
                        "neck": 10,
                        "head": 8,
                        "arm_L": 45,
                        "forearm_L": -75,
                        "hand_L": -15,
                        "arm_R": -45,
                        "forearm_R": 75,
                        "hand_R": 15,
                        "leg_L": 0,
                        "shin_L": -95,
                        "foot_L": 5,
                        "leg_R": 0,
                        "shin_R": -95,
                        "foot_R": 5
                }
        },
        "holding_oil_lamp": {
                "name": "Cầm đèn dầu / Đồ vật (Holding Item)",
                "type": "static",
                "angles": {
                        "torso": 0,
                        "neck": -3,
                        "head": -3,
                        "arm_L": 10,
                        "forearm_L": 5,
                        "hand_L": 0,
                        "arm_R": -45,
                        "forearm_R": 85,
                        "hand_R": 10,
                        "leg_L": 0,
                        "shin_L": 0,
                        "foot_L": 0,
                        "leg_R": 0,
                        "shin_R": 0,
                        "foot_R": 0
                }
        },
        "pointing": {
                "name": "Chỉ tay phía trước (Pointing Forward)",
                "type": "static",
                "angles": {
                        "torso": -3,
                        "neck": 3,
                        "head": 2,
                        "arm_L": 12,
                        "forearm_L": 5,
                        "hand_L": 0,
                        "arm_R": -85,
                        "forearm_R": 5,
                        "hand_R": -5,
                        "leg_L": -6,
                        "shin_L": 0,
                        "foot_L": 0,
                        "leg_R": 8,
                        "shin_R": -5,
                        "foot_R": 0
                },
                "scales": {
                        "torso": [
                                1.02,
                                1.0
                        ]
                }
        },
        "thinking": {
                "name": "Đăm chiêu suy nghĩ (Thinking)",
                "type": "static",
                "angles": {
                        "torso": 3,
                        "neck": -8,
                        "head": -12,
                        "arm_L": 25,
                        "forearm_L": -45,
                        "hand_L": 10,
                        "arm_R": -65,
                        "forearm_R": 115,
                        "hand_R": 35,
                        "leg_L": -5,
                        "shin_L": 0,
                        "foot_L": 0,
                        "leg_R": 5,
                        "shin_R": -5,
                        "foot_R": 0
                }
        },
        "hands_on_hips": {
                "name": "Hai tay chống nạnh (Hands on Hips)",
                "type": "static",
                "angles": {
                        "torso": 0,
                        "neck": -3,
                        "head": -3,
                        "arm_L": 38,
                        "forearm_L": -85,
                        "hand_L": -25,
                        "arm_R": -38,
                        "forearm_R": 85,
                        "hand_R": 25,
                        "leg_L": -12,
                        "shin_L": 0,
                        "foot_L": 0,
                        "leg_R": 12,
                        "shin_R": 0,
                        "foot_R": 0
                },
                "scales": {
                        "torso": [
                                1.04,
                                1.0
                        ]
                }
        },
        "crossed_arms": {
                "name": "Khoanh tay trước ngực (Crossed Arms)",
                "type": "static",
                "angles": {
                        "torso": 0,
                        "neck": 0,
                        "head": 0,
                        "arm_L": 42,
                        "forearm_L": -98,
                        "hand_L": -15,
                        "arm_R": -42,
                        "forearm_R": 98,
                        "hand_R": 15,
                        "leg_L": -6,
                        "shin_L": 0,
                        "foot_L": 0,
                        "leg_R": 6,
                        "shin_R": 0,
                        "foot_R": 0
                }
        },
        "shocked": {
                "name": "Kinh ngạc hoảng hốt (Shocked)",
                "type": "static",
                "angles": {
                        "torso": -8,
                        "neck": 8,
                        "head": 5,
                        "arm_L": 68,
                        "forearm_L": -120,
                        "hand_L": -30,
                        "arm_R": -68,
                        "forearm_R": 120,
                        "hand_R": 30,
                        "leg_L": -15,
                        "shin_L": -12,
                        "foot_L": 5,
                        "leg_R": 10,
                        "shin_R": -10,
                        "foot_R": 5
                },
                "scales": {
                        "torso": [
                                0.96,
                                0.98
                        ],
                        "head": [
                                1.05,
                                1.05
                        ]
                }
        },
        "crying_weeping": {
                "name": "Gục mặt khóc nức nở (Crying Weeping)",
                "type": "static",
                "angles": {
                        "torso": 22,
                        "neck": 25,
                        "head": 15,
                        "arm_L": 60,
                        "forearm_L": -105,
                        "hand_L": -25,
                        "arm_R": -60,
                        "forearm_R": 105,
                        "hand_R": 25,
                        "leg_L": 8,
                        "shin_L": -12,
                        "foot_L": 4,
                        "leg_R": 8,
                        "shin_R": -12,
                        "foot_R": 4
                },
                "scales": {
                        "torso": [
                                0.96,
                                0.94
                        ]
                }
        },
        "breathing_gentle": {
                "name": "Thở nhẹ nhàng (Breathing Cycle)",
                "type": "cycle",
                "duration": 2000,
                "loop": true,
                "keyframes": [
                        {
                                "time": 0,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 0,
                                        "neck": 0,
                                        "head": 0,
                                        "arm_L": 8,
                                        "forearm_L": 5,
                                        "hand_L": 0,
                                        "arm_R": -8,
                                        "forearm_R": -5,
                                        "hand_R": 0,
                                        "leg_L": 0,
                                        "shin_L": 0,
                                        "foot_L": 0,
                                        "leg_R": 0,
                                        "shin_R": 0,
                                        "foot_R": 0
                                },
                                "scales": {
                                        "torso": [
                                                1.0,
                                                1.0
                                        ],
                                        "head": [
                                                1.0,
                                                1.0
                                        ]
                                }
                        },
                        {
                                "time": 1000,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": -3,
                                        "neck": 2,
                                        "head": -2,
                                        "arm_L": 14,
                                        "forearm_L": 8,
                                        "hand_L": 2,
                                        "arm_R": -14,
                                        "forearm_R": -8,
                                        "hand_R": -2,
                                        "leg_L": 0,
                                        "shin_L": 0,
                                        "foot_L": 0,
                                        "leg_R": 0,
                                        "shin_R": 0,
                                        "foot_R": 0
                                },
                                "scales": {
                                        "torso": [
                                                1.08,
                                                1.05
                                        ],
                                        "head": [
                                                1.02,
                                                1.02
                                        ]
                                }
                        },
                        {
                                "time": 2000,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 0,
                                        "neck": 0,
                                        "head": 0,
                                        "arm_L": 8,
                                        "forearm_L": 5,
                                        "hand_L": 0,
                                        "arm_R": -8,
                                        "forearm_R": -5,
                                        "hand_R": 0,
                                        "leg_L": 0,
                                        "shin_L": 0,
                                        "foot_L": 0,
                                        "leg_R": 0,
                                        "shin_R": 0,
                                        "foot_R": 0
                                },
                                "scales": {
                                        "torso": [
                                                1.0,
                                                1.0
                                        ],
                                        "head": [
                                                1.0,
                                                1.0
                                        ]
                                }
                        }
                ]
        },
        "bouncing_idle": {
                "name": "Nhún người nhẹ (Bouncing Bob)",
                "type": "cycle",
                "duration": 1200,
                "loop": true,
                "keyframes": [
                        {
                                "time": 0,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 0,
                                        "neck": 0,
                                        "head": 0,
                                        "arm_L": 8,
                                        "forearm_L": 5,
                                        "hand_L": 0,
                                        "arm_R": -8,
                                        "forearm_R": -5,
                                        "hand_R": 0,
                                        "leg_L": 0,
                                        "shin_L": 0,
                                        "foot_L": 0,
                                        "leg_R": 0,
                                        "shin_R": 0,
                                        "foot_R": 0
                                },
                                "scales": {
                                        "torso": [
                                                1.0,
                                                1.0
                                        ],
                                        "leg_L": [
                                                1.0,
                                                1.0
                                        ],
                                        "leg_R": [
                                                1.0,
                                                1.0
                                        ]
                                }
                        },
                        {
                                "time": 400,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 2,
                                        "neck": -1,
                                        "head": 0,
                                        "arm_L": 12,
                                        "forearm_L": 10,
                                        "hand_L": 0,
                                        "arm_R": -12,
                                        "forearm_R": -10,
                                        "hand_R": 0,
                                        "leg_L": 6,
                                        "shin_L": -10,
                                        "foot_L": 4,
                                        "leg_R": 6,
                                        "shin_R": -10,
                                        "foot_R": 4
                                },
                                "scales": {
                                        "torso": [
                                                1.06,
                                                0.92
                                        ],
                                        "leg_L": [
                                                1.02,
                                                0.94
                                        ],
                                        "leg_R": [
                                                1.02,
                                                0.94
                                        ]
                                }
                        },
                        {
                                "time": 800,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": -1,
                                        "neck": 1,
                                        "head": 0,
                                        "arm_L": 6,
                                        "forearm_L": 4,
                                        "hand_L": 0,
                                        "arm_R": -6,
                                        "forearm_R": -4,
                                        "hand_R": 0,
                                        "leg_L": -1,
                                        "shin_L": 0,
                                        "foot_L": 0,
                                        "leg_R": -1,
                                        "shin_R": 0,
                                        "foot_R": 0
                                },
                                "scales": {
                                        "torso": [
                                                0.96,
                                                1.05
                                        ],
                                        "leg_L": [
                                                0.98,
                                                1.02
                                        ],
                                        "leg_R": [
                                                0.98,
                                                1.02
                                        ]
                                }
                        },
                        {
                                "time": 1200,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 0,
                                        "neck": 0,
                                        "head": 0,
                                        "arm_L": 8,
                                        "forearm_L": 5,
                                        "hand_L": 0,
                                        "arm_R": -8,
                                        "forearm_R": -5,
                                        "hand_R": 0,
                                        "leg_L": 0,
                                        "shin_L": 0,
                                        "foot_L": 0,
                                        "leg_R": 0,
                                        "shin_R": 0,
                                        "foot_R": 0
                                },
                                "scales": {
                                        "torso": [
                                                1.0,
                                                1.0
                                        ],
                                        "leg_L": [
                                                1.0,
                                                1.0
                                        ],
                                        "leg_R": [
                                                1.0,
                                                1.0
                                        ]
                                }
                        }
                ]
        },
        "walking_natural": {
                "name": "Đi bộ tự nhiên (Walking Cycle)",
                "type": "cycle",
                "duration": 1200,
                "loop": true,
                "keyframes": [
                        {
                                "time": 0,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 2,
                                        "neck": -1,
                                        "head": -1,
                                        "leg_L": 25,
                                        "shin_L": -10,
                                        "foot_L": 0,
                                        "leg_R": -25,
                                        "shin_R": -35,
                                        "foot_R": 10,
                                        "arm_L": -25,
                                        "forearm_L": 20,
                                        "hand_L": 0,
                                        "arm_R": 25,
                                        "forearm_R": -20,
                                        "hand_R": 0
                                },
                                "scales": {
                                        "torso": [
                                                1.0,
                                                1.0
                                        ]
                                }
                        },
                        {
                                "time": 300,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 0,
                                        "neck": 0,
                                        "head": 0,
                                        "leg_L": 5,
                                        "shin_L": -30,
                                        "foot_L": 5,
                                        "leg_R": 0,
                                        "shin_R": -5,
                                        "foot_R": 0,
                                        "arm_L": -5,
                                        "forearm_L": 10,
                                        "hand_L": 0,
                                        "arm_R": 5,
                                        "forearm_R": -10,
                                        "hand_R": 0
                                },
                                "scales": {
                                        "torso": [
                                                1.02,
                                                0.97
                                        ]
                                }
                        },
                        {
                                "time": 600,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 2,
                                        "neck": -1,
                                        "head": -1,
                                        "leg_L": -25,
                                        "shin_L": -35,
                                        "foot_L": 10,
                                        "leg_R": 25,
                                        "shin_R": -10,
                                        "foot_R": 0,
                                        "arm_L": 25,
                                        "forearm_L": -20,
                                        "hand_L": 0,
                                        "arm_R": -25,
                                        "forearm_R": 20,
                                        "hand_R": 0
                                },
                                "scales": {
                                        "torso": [
                                                1.0,
                                                1.0
                                        ]
                                }
                        },
                        {
                                "time": 900,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 0,
                                        "neck": 0,
                                        "head": 0,
                                        "leg_L": 0,
                                        "shin_L": -5,
                                        "foot_L": 0,
                                        "leg_R": 5,
                                        "shin_R": -30,
                                        "foot_R": 5,
                                        "arm_L": 5,
                                        "forearm_L": -10,
                                        "hand_L": 0,
                                        "arm_R": -5,
                                        "forearm_R": 10,
                                        "hand_R": 0
                                },
                                "scales": {
                                        "torso": [
                                                1.02,
                                                0.97
                                        ]
                                }
                        },
                        {
                                "time": 1200,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 2,
                                        "neck": -1,
                                        "head": -1,
                                        "leg_L": 25,
                                        "shin_L": -10,
                                        "foot_L": 0,
                                        "leg_R": -25,
                                        "shin_R": -35,
                                        "foot_R": 10,
                                        "arm_L": -25,
                                        "forearm_L": 20,
                                        "hand_L": 0,
                                        "arm_R": 25,
                                        "forearm_R": -20,
                                        "hand_R": 0
                                },
                                "scales": {
                                        "torso": [
                                                1.0,
                                                1.0
                                        ]
                                }
                        }
                ]
        },
        "running_fast": {
                "name": "Chạy nhanh / Tháo chạy (Running Fast)",
                "type": "cycle",
                "duration": 800,
                "loop": true,
                "keyframes": [
                        {
                                "time": 0,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 18,
                                        "neck": -10,
                                        "head": -5,
                                        "leg_L": 50,
                                        "shin_L": -20,
                                        "foot_L": 5,
                                        "leg_R": -45,
                                        "shin_R": -70,
                                        "foot_R": 20,
                                        "arm_L": -65,
                                        "forearm_L": 80,
                                        "hand_L": 10,
                                        "arm_R": 55,
                                        "forearm_R": -75,
                                        "hand_R": -10
                                },
                                "scales": {
                                        "torso": [
                                                1.02,
                                                0.96
                                        ]
                                }
                        },
                        {
                                "time": 200,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 14,
                                        "neck": -8,
                                        "head": -4,
                                        "leg_L": 15,
                                        "shin_L": -50,
                                        "foot_L": 10,
                                        "leg_R": -10,
                                        "shin_R": -40,
                                        "foot_R": 15,
                                        "arm_L": -15,
                                        "forearm_L": 45,
                                        "hand_L": 5,
                                        "arm_R": 15,
                                        "forearm_R": -40,
                                        "hand_R": -5
                                },
                                "scales": {
                                        "torso": [
                                                0.98,
                                                1.04
                                        ]
                                }
                        },
                        {
                                "time": 400,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 18,
                                        "neck": -10,
                                        "head": -5,
                                        "leg_L": -45,
                                        "shin_L": -70,
                                        "foot_L": 20,
                                        "leg_R": 50,
                                        "shin_R": -20,
                                        "foot_R": 5,
                                        "arm_L": 55,
                                        "forearm_L": -75,
                                        "hand_L": -10,
                                        "arm_R": -65,
                                        "forearm_R": 80,
                                        "hand_R": 10
                                },
                                "scales": {
                                        "torso": [
                                                1.02,
                                                0.96
                                        ]
                                }
                        },
                        {
                                "time": 600,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 14,
                                        "neck": -8,
                                        "head": -4,
                                        "leg_L": -10,
                                        "shin_L": -40,
                                        "foot_L": 15,
                                        "leg_R": 15,
                                        "shin_R": -50,
                                        "foot_R": 10,
                                        "arm_L": 15,
                                        "forearm_L": -40,
                                        "hand_L": -5,
                                        "arm_R": -15,
                                        "forearm_R": 45,
                                        "hand_R": 5
                                },
                                "scales": {
                                        "torso": [
                                                0.98,
                                                1.04
                                        ]
                                }
                        },
                        {
                                "time": 800,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 18,
                                        "neck": -10,
                                        "head": -5,
                                        "leg_L": 50,
                                        "shin_L": -20,
                                        "foot_L": 5,
                                        "leg_R": -45,
                                        "shin_R": -70,
                                        "foot_R": 20,
                                        "arm_L": -65,
                                        "forearm_L": 80,
                                        "hand_L": 10,
                                        "arm_R": 55,
                                        "forearm_R": -75,
                                        "hand_R": -10
                                },
                                "scales": {
                                        "torso": [
                                                1.02,
                                                0.96
                                        ]
                                }
                        }
                ]
        },
        "sneaking": {
                "name": "Rón rén lén lút (Sneaking)",
                "type": "cycle",
                "duration": 1600,
                "loop": true,
                "keyframes": [
                        {
                                "time": 0,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 22,
                                        "neck": -12,
                                        "head": -8,
                                        "leg_L": 38,
                                        "shin_L": -55,
                                        "foot_L": 15,
                                        "leg_R": -20,
                                        "shin_R": -45,
                                        "foot_R": 20,
                                        "arm_L": -30,
                                        "forearm_L": 70,
                                        "hand_L": 15,
                                        "arm_R": 25,
                                        "forearm_R": 65,
                                        "hand_R": 15
                                },
                                "scales": {
                                        "torso": [
                                                1.04,
                                                0.92
                                        ]
                                }
                        },
                        {
                                "time": 400,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 20,
                                        "neck": -10,
                                        "head": -8,
                                        "leg_L": 10,
                                        "shin_L": -40,
                                        "foot_L": 10,
                                        "leg_R": 5,
                                        "shin_R": -50,
                                        "foot_R": 20,
                                        "arm_L": -10,
                                        "forearm_L": 60,
                                        "hand_L": 10,
                                        "arm_R": 10,
                                        "forearm_R": 60,
                                        "hand_R": 10
                                },
                                "scales": {
                                        "torso": [
                                                1.02,
                                                0.94
                                        ]
                                }
                        },
                        {
                                "time": 800,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 22,
                                        "neck": -12,
                                        "head": -8,
                                        "leg_L": -20,
                                        "shin_L": -45,
                                        "foot_L": 20,
                                        "leg_R": 38,
                                        "shin_R": -55,
                                        "foot_R": 15,
                                        "arm_L": 25,
                                        "forearm_L": 65,
                                        "hand_L": 15,
                                        "arm_R": -30,
                                        "forearm_R": 70,
                                        "hand_R": 15
                                },
                                "scales": {
                                        "torso": [
                                                1.04,
                                                0.92
                                        ]
                                }
                        },
                        {
                                "time": 1200,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 20,
                                        "neck": -10,
                                        "head": -8,
                                        "leg_L": 5,
                                        "shin_L": -50,
                                        "foot_L": 20,
                                        "leg_R": 10,
                                        "shin_R": -40,
                                        "foot_R": 10,
                                        "arm_L": 10,
                                        "forearm_L": 60,
                                        "hand_L": 10,
                                        "arm_R": -10,
                                        "forearm_R": 60,
                                        "hand_R": 10
                                },
                                "scales": {
                                        "torso": [
                                                1.02,
                                                0.94
                                        ]
                                }
                        },
                        {
                                "time": 1600,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 22,
                                        "neck": -12,
                                        "head": -8,
                                        "leg_L": 38,
                                        "shin_L": -55,
                                        "foot_L": 15,
                                        "leg_R": -20,
                                        "shin_R": -45,
                                        "foot_R": 20,
                                        "arm_L": -30,
                                        "forearm_L": 70,
                                        "hand_L": 15,
                                        "arm_R": 25,
                                        "forearm_R": 65,
                                        "hand_R": 15
                                },
                                "scales": {
                                        "torso": [
                                                1.04,
                                                0.92
                                        ]
                                }
                        }
                ]
        },
        "trembling_scared": {
                "name": "Run rẩy sợ hãi / Rét run (Trembling)",
                "type": "cycle",
                "duration": 400,
                "loop": true,
                "keyframes": [
                        {
                                "time": 0,
                                "easing": "linear",
                                "angles": {
                                        "torso": 25,
                                        "neck": 12,
                                        "head": 8,
                                        "leg_L": 20,
                                        "shin_L": -25,
                                        "foot_L": 5,
                                        "leg_R": 18,
                                        "shin_R": -22,
                                        "foot_R": 5,
                                        "arm_L": 55,
                                        "forearm_L": -95,
                                        "hand_L": -15,
                                        "arm_R": -55,
                                        "forearm_R": 95,
                                        "hand_R": 15
                                },
                                "scales": {
                                        "torso": [
                                                0.95,
                                                0.93
                                        ]
                                }
                        },
                        {
                                "time": 100,
                                "easing": "linear",
                                "angles": {
                                        "torso": 27,
                                        "neck": 15,
                                        "head": 11,
                                        "leg_L": 22,
                                        "shin_L": -28,
                                        "foot_L": 6,
                                        "leg_R": 20,
                                        "shin_R": -25,
                                        "foot_R": 6,
                                        "arm_L": 58,
                                        "forearm_L": -98,
                                        "hand_L": -18,
                                        "arm_R": -52,
                                        "forearm_R": 92,
                                        "hand_R": 12
                                },
                                "scales": {
                                        "torso": [
                                                0.97,
                                                0.95
                                        ]
                                }
                        },
                        {
                                "time": 200,
                                "easing": "linear",
                                "angles": {
                                        "torso": 24,
                                        "neck": 11,
                                        "head": 7,
                                        "leg_L": 19,
                                        "shin_L": -23,
                                        "foot_L": 4,
                                        "leg_R": 17,
                                        "shin_R": -21,
                                        "foot_R": 4,
                                        "arm_L": 53,
                                        "forearm_L": -92,
                                        "hand_L": -12,
                                        "arm_R": -57,
                                        "forearm_R": 97,
                                        "hand_R": 17
                                },
                                "scales": {
                                        "torso": [
                                                0.94,
                                                0.92
                                        ]
                                }
                        },
                        {
                                "time": 300,
                                "easing": "linear",
                                "angles": {
                                        "torso": 26,
                                        "neck": 14,
                                        "head": 10,
                                        "leg_L": 21,
                                        "shin_L": -27,
                                        "foot_L": 5,
                                        "leg_R": 19,
                                        "shin_R": -24,
                                        "foot_R": 5,
                                        "arm_L": 57,
                                        "forearm_L": -96,
                                        "hand_L": -16,
                                        "arm_R": -54,
                                        "forearm_R": 94,
                                        "hand_R": 14
                                },
                                "scales": {
                                        "torso": [
                                                0.96,
                                                0.94
                                        ]
                                }
                        },
                        {
                                "time": 400,
                                "easing": "linear",
                                "angles": {
                                        "torso": 25,
                                        "neck": 12,
                                        "head": 8,
                                        "leg_L": 20,
                                        "shin_L": -25,
                                        "foot_L": 5,
                                        "leg_R": 18,
                                        "shin_R": -22,
                                        "foot_R": 5,
                                        "arm_L": 55,
                                        "forearm_L": -95,
                                        "hand_L": -15,
                                        "arm_R": -55,
                                        "forearm_R": 95,
                                        "hand_R": 15
                                },
                                "scales": {
                                        "torso": [
                                                0.95,
                                                0.93
                                        ]
                                }
                        }
                ]
        },
        "waving_hand": {
                "name": "Vẫy tay chào (Waving Hand)",
                "type": "cycle",
                "duration": 1000,
                "loop": true,
                "keyframes": [
                        {
                                "time": 0,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": -2,
                                        "neck": 2,
                                        "head": 4,
                                        "arm_L": 8,
                                        "forearm_L": 5,
                                        "hand_L": 0,
                                        "arm_R": -125,
                                        "forearm_R": 60,
                                        "hand_R": 10,
                                        "leg_L": -4,
                                        "shin_L": 0,
                                        "foot_L": 0,
                                        "leg_R": 4,
                                        "shin_R": 0,
                                        "foot_R": 0
                                },
                                "scales": {
                                        "torso": [
                                                1.0,
                                                1.0
                                        ]
                                }
                        },
                        {
                                "time": 250,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": -3,
                                        "neck": 3,
                                        "head": 6,
                                        "arm_L": 8,
                                        "forearm_L": 5,
                                        "hand_L": 0,
                                        "arm_R": -120,
                                        "forearm_R": 85,
                                        "hand_R": 25,
                                        "leg_L": -4,
                                        "shin_L": 0,
                                        "foot_L": 0,
                                        "leg_R": 4,
                                        "shin_R": 0,
                                        "foot_R": 0
                                },
                                "scales": {
                                        "torso": [
                                                1.01,
                                                1.0
                                        ]
                                }
                        },
                        {
                                "time": 500,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": -2,
                                        "neck": 2,
                                        "head": 4,
                                        "arm_L": 8,
                                        "forearm_L": 5,
                                        "hand_L": 0,
                                        "arm_R": -125,
                                        "forearm_R": 50,
                                        "hand_R": -5,
                                        "leg_L": -4,
                                        "shin_L": 0,
                                        "foot_L": 0,
                                        "leg_R": 4,
                                        "shin_R": 0,
                                        "foot_R": 0
                                },
                                "scales": {
                                        "torso": [
                                                1.0,
                                                1.0
                                        ]
                                }
                        },
                        {
                                "time": 750,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": -3,
                                        "neck": 3,
                                        "head": 6,
                                        "arm_L": 8,
                                        "forearm_L": 5,
                                        "hand_L": 0,
                                        "arm_R": -120,
                                        "forearm_R": 85,
                                        "hand_R": 25,
                                        "leg_L": -4,
                                        "shin_L": 0,
                                        "foot_L": 0,
                                        "leg_R": 4,
                                        "shin_R": 0,
                                        "foot_R": 0
                                },
                                "scales": {
                                        "torso": [
                                                1.01,
                                                1.0
                                        ]
                                }
                        },
                        {
                                "time": 1000,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": -2,
                                        "neck": 2,
                                        "head": 4,
                                        "arm_L": 8,
                                        "forearm_L": 5,
                                        "hand_L": 0,
                                        "arm_R": -125,
                                        "forearm_R": 60,
                                        "hand_R": 10,
                                        "leg_L": -4,
                                        "shin_L": 0,
                                        "foot_L": 0,
                                        "leg_R": 4,
                                        "shin_R": 0,
                                        "foot_R": 0
                                },
                                "scales": {
                                        "torso": [
                                                1.0,
                                                1.0
                                        ]
                                }
                        }
                ]
        },
        "nodding_agree": {
                "name": "Gật đầu đồng ý (Nodding Agree)",
                "type": "cycle",
                "duration": 1200,
                "loop": true,
                "keyframes": [
                        {
                                "time": 0,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 0,
                                        "neck": 0,
                                        "head": -2,
                                        "arm_L": 10,
                                        "forearm_L": 15,
                                        "hand_L": 5,
                                        "arm_R": -10,
                                        "forearm_R": -15,
                                        "hand_R": -5,
                                        "leg_L": 0,
                                        "shin_L": 0,
                                        "foot_L": 0,
                                        "leg_R": 0,
                                        "shin_R": 0,
                                        "foot_R": 0
                                },
                                "scales": {
                                        "torso": [
                                                1.0,
                                                1.0
                                        ]
                                }
                        },
                        {
                                "time": 300,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 3,
                                        "neck": 6,
                                        "head": 18,
                                        "arm_L": 12,
                                        "forearm_L": 20,
                                        "hand_L": 5,
                                        "arm_R": -12,
                                        "forearm_R": -20,
                                        "hand_R": -5,
                                        "leg_L": 0,
                                        "shin_L": 0,
                                        "foot_L": 0,
                                        "leg_R": 0,
                                        "shin_R": 0,
                                        "foot_R": 0
                                },
                                "scales": {
                                        "torso": [
                                                1.01,
                                                0.99
                                        ]
                                }
                        },
                        {
                                "time": 600,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 0,
                                        "neck": -2,
                                        "head": -6,
                                        "arm_L": 10,
                                        "forearm_L": 15,
                                        "hand_L": 5,
                                        "arm_R": -10,
                                        "forearm_R": -15,
                                        "hand_R": -5,
                                        "leg_L": 0,
                                        "shin_L": 0,
                                        "foot_L": 0,
                                        "leg_R": 0,
                                        "shin_R": 0,
                                        "foot_R": 0
                                },
                                "scales": {
                                        "torso": [
                                                1.0,
                                                1.0
                                        ]
                                }
                        },
                        {
                                "time": 900,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 2,
                                        "neck": 4,
                                        "head": 14,
                                        "arm_L": 11,
                                        "forearm_L": 18,
                                        "hand_L": 5,
                                        "arm_R": -11,
                                        "forearm_R": -18,
                                        "hand_R": -5,
                                        "leg_L": 0,
                                        "shin_L": 0,
                                        "foot_L": 0,
                                        "leg_R": 0,
                                        "shin_R": 0,
                                        "foot_R": 0
                                },
                                "scales": {
                                        "torso": [
                                                1.01,
                                                0.99
                                        ]
                                }
                        },
                        {
                                "time": 1200,
                                "easing": "easeInOut",
                                "angles": {
                                        "torso": 0,
                                        "neck": 0,
                                        "head": -2,
                                        "arm_L": 10,
                                        "forearm_L": 15,
                                        "hand_L": 5,
                                        "arm_R": -10,
                                        "forearm_R": -15,
                                        "hand_R": -5,
                                        "leg_L": 0,
                                        "shin_L": 0,
                                        "foot_L": 0,
                                        "leg_R": 0,
                                        "shin_R": 0,
                                        "foot_R": 0
                                },
                                "scales": {
                                        "torso": [
                                                1.0,
                                                1.0
                                        ]
                                }
                        }
                ]
        }
};


    // 3. TRẠNG THÁI TOÀN CỤC CỦA ACTION STUDIO
    const state = {
        actions: JSON.parse(JSON.stringify(DEFAULT_ACTIONS)),
        currentActionId: 'standing',
        currentAngles: createZeroAngles(),
        currentScales: createDefaultScales(),
        aspectLocked: createDefaultAspectLocks(),
        
        filterType: 'all', // 'all', 'static', 'cycle'
        searchQuery: '',

        // Chế độ công cụ tương tác: 'rotate' (Xoay) hoặc 'scale' (Co giãn)
        activeGizmoTool: 'rotate',
        sliderPanelMode: 'rotate', // 'rotate', 'scale', 'all'

        // Cài đặt hiển thị Viewport
        zoom: 1.0,
        panX: 0,
        panY: 0,
        showGizmos: true,
        bgMode: 'dark',

        // Timeline & Phát hoạt họa
        isPlaying: false,
        currentTime: 0, // ms
        activeKeyframeIdx: 0,
        lastAnimTimestamp: 0,
        animReqId: null,

        // Kéo thả Gizmo tương tác trực tiếp
        activeDraggingJoint: null,
        dragStartAngle: 0,
        dragStartDist: 0,
        dragInitialJointAngle: 0,
        dragInitialScaleX: 1.0,
        dragInitialScaleY: 1.0
    };

    function createZeroAngles() {
        const a = {};
        JOINT_KEYS.forEach(k => { a[k] = 0; });
        return a;
    }

    function createDefaultScales() {
        const s = {};
        JOINT_KEYS.forEach(k => { s[k] = { x: 1.0, y: 1.0 }; });
        return s;
    }

    function createDefaultAspectLocks() {
        const l = {};
        JOINT_KEYS.forEach(k => { l[k] = true; }); // Mặc định khóa tỉ lệ X/Y
        return l;
    }

    function cloneAngles(src) {
        const a = {};
        JOINT_KEYS.forEach(k => { a[k] = (src && typeof src[k] === 'number') ? src[k] : 0; });
        return a;
    }

    function cloneScales(src) {
        const s = {};
        JOINT_KEYS.forEach(k => {
            if (src && src[k]) {
                if (Array.isArray(src[k])) {
                    s[k] = { x: src[k][0] ?? 1.0, y: src[k][1] ?? 1.0 };
                } else if (typeof src[k] === 'object') {
                    s[k] = { x: src[k].x ?? 1.0, y: src[k].y ?? 1.0 };
                } else if (typeof src[k] === 'number') {
                    s[k] = { x: src[k], y: src[k] };
                } else {
                    s[k] = { x: 1.0, y: 1.0 };
                }
            } else {
                s[k] = { x: 1.0, y: 1.0 };
            }
        });
        return s;
    }

    // ==========================================
    // KHỞI TẠO VÀ GẮN GIAO DIỆN
    // ==========================================
    function initActionStudio() {
        renderActionSidebarList();
        renderJointSliders();
        buildSvgPuppetDom();
        setupEventListeners();
        setupTabNavigation();
        setupTimelineScrubberDrag();
        loadActionIntoStudio('standing');
        fetchServerActions();
    }

    // 4. CHUYỂN TAB NAVBAR CHÍNH
    function setupTabNavigation() {
        const btnNav = document.getElementById('btnNavUniversalAction');
        const view = document.getElementById('universalActionView');
        if (!btnNav || !view) return;

        const otherBtnIds = ['btnNavAuto', 'btnNavManual', 'btnNavInspect', 'btnNavAnim', 'btnNavSvgAnim'];
        const otherViewIds = ['autoView', 'manualView', 'inspectView', 'animView', 'svgAnimView'];

        btnNav.addEventListener('click', () => {
            otherBtnIds.forEach(id => {
                const b = document.getElementById(id);
                if (b) b.classList.remove('active');
            });
            otherViewIds.forEach(id => {
                const v = document.getElementById(id);
                if (v) v.style.display = 'none';
            });

            btnNav.classList.add('active');
            view.style.display = 'flex';

            if (typeof window.stopAnimLoop === 'function') window.stopAnimLoop();
            if (typeof window.stopSvgAnimLoop === 'function') window.stopSvgAnimLoop();

            requestAnimationFrame(() => {
                fitPuppetToViewport();
                applyAnglesToPuppet();
            });
        });

        otherBtnIds.forEach(id => {
            const b = document.getElementById(id);
            if (b) {
                b.addEventListener('click', () => {
                    btnNav.classList.remove('active');
                    view.style.display = 'none';
                    stopCyclePlayback();
                });
            }
        });
    }

    // ==========================================
    // RENDER SVG PUPPET TRÊN CANVAS 400x1000
    // ==========================================
    function buildSvgPuppetDom() {
        const container = document.getElementById('actionPuppetSvgWrapper');
        if (!container) return;

        const svgHtml = `
        <svg id="actionPuppetSvg" viewBox="0 0 400 1000" width="400" height="1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="gradTorso" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#3b82f6"/>
                    <stop offset="100%" stop-color="#1d4ed8"/>
                </linearGradient>
                <linearGradient id="gradHead" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#8b5cf6"/>
                    <stop offset="100%" stop-color="#6d28d9"/>
                </linearGradient>
                <linearGradient id="gradLeftLimb" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#06b6d4"/>
                    <stop offset="100%" stop-color="#0284c7"/>
                </linearGradient>
                <linearGradient id="gradRightLimb" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#f97316"/>
                    <stop offset="100%" stop-color="#c2410c"/>
                </linearGradient>
                <filter id="glowGizmo" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#ffffff" flood-opacity="0.8"/>
                </filter>
            </defs>

            <!-- Khung lưới tọa độ Canvas 400x1000 & Sàn diễn -->
            <g id="gridGuides" opacity="0.4">
                <rect x="0" y="0" width="400" height="1000" fill="none" stroke="#475569" stroke-width="2" stroke-dasharray="6,4"/>
                <line x1="200" y1="0" x2="200" y2="1000" stroke="#334155" stroke-width="1" stroke-dasharray="4,4"/>
                <line x1="0" y1="500" x2="400" y2="500" stroke="#334155" stroke-width="1" stroke-dasharray="4,4"/>
                <line x1="30" y1="810" x2="370" y2="810" stroke="#f97316" stroke-width="2"/>
                <text x="200" y="830" text-anchor="middle" fill="#94a3b8" font-size="12" font-weight="600">Mặt sàn (Ground: Y = 810)</text>
                <text x="20" y="30" fill="#64748b" font-size="12" font-weight="bold">Remotion Canvas: 400 × 1000</text>
            </g>

            <!-- GỐC CƠ THỂ: TORSO (Root Node) -->
            <g id="node_torso" transform="translate(200, 420) rotate(0) scale(1, 1) translate(-200, -420)">
                <!-- Thân người Mannequin -->
                <path class="puppet-body-geom" d="M155,320 C155,310 245,310 245,320 L240,430 C240,480 230,520 220,525 L180,525 C170,520 160,480 160,430 Z" fill="url(#gradTorso)" stroke="#1e293b" stroke-width="2.5"/>
                <path d="M170,360 Q200,380 230,360" fill="none" stroke="#60a5fa" stroke-width="2" opacity="0.6"/>
                <circle cx="200" cy="420" r="4" fill="#93c5fd"/>

                <!-- CỔ (NECK) -->
                <g id="node_neck" transform="translate(200, 310) rotate(0) scale(1, 1) translate(-200, -310)">
                    <rect class="puppet-body-geom" x="188" y="270" width="24" height="42" rx="6" fill="#475569" stroke="#1e293b" stroke-width="2"/>

                    <!-- ĐẦU (HEAD) -->
                    <g id="node_head" transform="translate(200, 270) rotate(0) scale(1, 1) translate(-200, -270)">
                        <ellipse class="puppet-body-geom" cx="200" cy="210" rx="42" ry="54" fill="url(#gradHead)" stroke="#1e293b" stroke-width="2.5"/>
                        <path d="M168,205 Q200,225 232,205" fill="none" stroke="#a78bfa" stroke-width="4" stroke-linecap="round"/>
                        <circle cx="200" cy="270" r="3" fill="#c4b5fd"/>
                    </g>
                </g>

                <!-- TAY TRÁI (LEFT ARM) -->
                <g id="node_arm_L" transform="translate(160, 330) rotate(0) scale(1, 1) translate(-160, -330)">
                    <rect class="puppet-body-geom" x="146" y="325" width="28" height="85" rx="14" fill="url(#gradLeftLimb)" stroke="#1e293b" stroke-width="2"/>
                    <circle cx="160" cy="330" r="5" fill="#38bdf8"/>

                    <!-- CẲNG TAY TRÁI (LEFT FOREARM) -->
                    <g id="node_forearm_L" transform="translate(150, 410) rotate(0) scale(1, 1) translate(-150, -410)">
                        <rect class="puppet-body-geom" x="138" y="405" width="24" height="75" rx="12" fill="url(#gradLeftLimb)" stroke="#1e293b" stroke-width="2"/>
                        <circle cx="150" cy="410" r="4" fill="#7dd3fc"/>

                        <!-- BÀN TAY TRÁI (LEFT HAND) -->
                        <g id="node_hand_L" transform="translate(145, 480) rotate(0) scale(1, 1) translate(-145, -480)">
                            <ellipse class="puppet-body-geom" cx="145" cy="500" rx="11" ry="16" fill="#0284c7" stroke="#1e293b" stroke-width="2"/>
                            <path d="M140,490 Q133,495 137,502" fill="none" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
                        </g>
                    </g>
                </g>

                <!-- TAY PHẢI (RIGHT ARM) -->
                <g id="node_arm_R" transform="translate(240, 330) rotate(0) scale(1, 1) translate(-240, -330)">
                    <rect class="puppet-body-geom" x="226" y="325" width="28" height="85" rx="14" fill="url(#gradRightLimb)" stroke="#1e293b" stroke-width="2"/>
                    <circle cx="240" cy="330" r="5" fill="#fb923c"/>

                    <!-- CẲNG TAY PHẢI (RIGHT FOREARM) -->
                    <g id="node_forearm_R" transform="translate(250, 410) rotate(0) scale(1, 1) translate(-250, -410)">
                        <rect class="puppet-body-geom" x="238" y="405" width="24" height="75" rx="12" fill="url(#gradRightLimb)" stroke="#1e293b" stroke-width="2"/>
                        <circle cx="250" cy="410" r="4" fill="#fdba74"/>

                        <!-- BÀN TAY PHẢI (RIGHT HAND) -->
                        <g id="node_hand_R" transform="translate(255, 480) rotate(0) scale(1, 1) translate(-255, -480)">
                            <ellipse class="puppet-body-geom" cx="255" cy="500" rx="11" ry="16" fill="#ea580c" stroke="#1e293b" stroke-width="2"/>
                            <path d="M260,490 Q267,495 263,502" fill="none" stroke="#fdba74" stroke-width="3" stroke-linecap="round"/>
                        </g>
                    </g>
                </g>

                <!-- CHÂN TRÁI (LEFT LEG) -->
                <g id="node_leg_L" transform="translate(175, 520) rotate(0) scale(1, 1) translate(-175, -520)">
                    <rect class="puppet-body-geom" x="157" y="515" width="36" height="145" rx="16" fill="url(#gradLeftLimb)" stroke="#1e293b" stroke-width="2"/>
                    <circle cx="175" cy="520" r="5" fill="#38bdf8"/>

                    <!-- CẲNG CHÂN TRÁI (LEFT SHIN) -->
                    <g id="node_shin_L" transform="translate(175, 660) rotate(0) scale(1, 1) translate(-175, -660)">
                        <rect class="puppet-body-geom" x="160" y="655" width="30" height="125" rx="14" fill="url(#gradLeftLimb)" stroke="#1e293b" stroke-width="2"/>
                        <circle cx="175" cy="660" r="5" fill="#7dd3fc"/>

                        <!-- BÀN CHÂN TRÁI (LEFT FOOT) -->
                        <g id="node_foot_L" transform="translate(175, 780) rotate(0) scale(1, 1) translate(-175, -780)">
                            <path class="puppet-body-geom" d="M165,775 L190,775 L195,808 L155,808 Z" rx="4" fill="#0284c7" stroke="#1e293b" stroke-width="2"/>
                        </g>
                    </g>
                </g>

                <!-- CHÂN PHẢI (RIGHT LEG) -->
                <g id="node_leg_R" transform="translate(225, 520) rotate(0) scale(1, 1) translate(-225, -520)">
                    <rect class="puppet-body-geom" x="207" y="515" width="36" height="145" rx="16" fill="url(#gradRightLimb)" stroke="#1e293b" stroke-width="2"/>
                    <circle cx="225" cy="520" r="5" fill="#fb923c"/>

                    <!-- CẲNG CHÂN PHẢI (RIGHT SHIN) -->
                    <g id="node_shin_R" transform="translate(225, 660) rotate(0) scale(1, 1) translate(-225, -660)">
                        <rect class="puppet-body-geom" x="210" y="655" width="30" height="125" rx="14" fill="url(#gradRightLimb)" stroke="#1e293b" stroke-width="2"/>
                        <circle cx="225" cy="660" r="5" fill="#fdba74"/>

                        <!-- BÀN CHÂN PHẢI (RIGHT FOOT) -->
                        <g id="node_foot_R" transform="translate(225, 780) rotate(0) scale(1, 1) translate(-225, -780)">
                            <path class="puppet-body-geom" d="M210,775 L235,775 L245,808 L205,808 Z" rx="4" fill="#ea580c" stroke="#1e293b" stroke-width="2"/>
                        </g>
                    </g>
                </g>
            </g>

            <!-- LỚP GIZMO XOAY & SCALE TRỰC TIẾP -->
            <g id="gizmoOverlay"></g>
        </svg>
        `;

        container.innerHTML = svgHtml;
        setupGizmoHandles();
    }

    // ==========================================
    // TÍNH TOÁN TỌA ĐỘ TOÀN CỤC CHÍNH XÁC (FK MATRIX)
    // ==========================================
    function localToSvgPoint(element, localX, localY) {
        const svg = document.getElementById('actionPuppetSvg');
        if (!svg || !element) return { x: localX, y: localY };
        try {
            const pt = svg.createSVGPoint();
            pt.x = localX;
            pt.y = localY;
            const elemScreen = element.getScreenCTM();
            const svgScreen = svg.getScreenCTM();
            if (elemScreen && svgScreen) {
                return pt.matrixTransform(elemScreen).matrixTransform(svgScreen.inverse());
            }
        } catch (e) {
            console.warn('Matrix transform error:', e);
        }
        return { x: localX, y: localY };
    }

    function getJointWorldPivot(jointKey) {
        const svg = document.getElementById('actionPuppetSvg');
        const node = document.getElementById(`node_${jointKey}`);
        const def = SKELETON_DEF[jointKey];
        if (!svg || !node) return { x: def.pivot[0], y: def.pivot[1] };

        const parentEl = (node.parentElement && node.parentElement.tagName.toLowerCase() === 'g') 
            ? node.parentElement 
            : svg;
        return localToSvgPoint(parentEl, def.pivot[0], def.pivot[1]);
    }

    function getJointWorldHandle(jointKey) {
        const svg = document.getElementById('actionPuppetSvg');
        const node = document.getElementById(`node_${jointKey}`);
        const def = SKELETON_DEF[jointKey];
        if (!svg || !node) return { x: def.handle[0], y: def.handle[1] };

        return localToSvgPoint(node, def.handle[0], def.handle[1]);
    }

    // Thiết lập các điểm Gizmo tương tác trên từng khớp
    function setupGizmoHandles() {
        const overlay = document.getElementById('gizmoOverlay');
        const svg = document.getElementById('actionPuppetSvg');
        if (!overlay || !svg) return;

        overlay.innerHTML = '';

        JOINT_KEYS.forEach(jointKey => {
            const def = SKELETON_DEF[jointKey];
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', `gizmo-handle-group ${state.activeGizmoTool === 'scale' ? 'mode-scale' : ''}`);
            g.dataset.joint = jointKey;
            g.style.cursor = 'grab';

            // Đường nét đứt nối từ Pivot tâm xoay đến tay cầm
            const leverLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            leverLine.setAttribute('class', 'gizmo-lever-line');
            leverLine.setAttribute('stroke', def.color);
            leverLine.setAttribute('x1', '0');
            leverLine.setAttribute('y1', '0');
            leverLine.setAttribute('x2', '0');
            leverLine.setAttribute('y2', '0');

            // Chấm hiển thị tâm xoay Pivot
            const pivotDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            pivotDot.setAttribute('class', 'gizmo-pivot-dot');
            pivotDot.setAttribute('r', '4');
            pivotDot.setAttribute('fill', def.color);
            pivotDot.setAttribute('stroke', '#ffffff');
            pivotDot.setAttribute('stroke-width', '1.5');

            // Vòng tròn tay cầm ngoài
            const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            ring.setAttribute('r', '14');
            ring.setAttribute('fill', 'transparent');
            ring.setAttribute('stroke', def.color);
            ring.setAttribute('stroke-width', '2');
            ring.setAttribute('stroke-dasharray', '3,2');
            ring.setAttribute('class', 'gizmo-ring');

            // Chấm tay cầm giữa (hình tròn khi Rotate, hình thoi khi Scale)
            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            dot.setAttribute('x', '-5');
            dot.setAttribute('y', '-5');
            dot.setAttribute('width', '10');
            dot.setAttribute('height', '10');
            dot.setAttribute('rx', state.activeGizmoTool === 'scale' ? '1' : '5');
            dot.setAttribute('fill', '#ffffff');
            dot.setAttribute('stroke', def.color);
            dot.setAttribute('stroke-width', '2.5');
            dot.setAttribute('class', 'gizmo-dot');
            dot.setAttribute('filter', 'url(#glowGizmo)');

            g.appendChild(leverLine);
            g.appendChild(pivotDot);
            g.appendChild(ring);
            g.appendChild(dot);

            g.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                startDraggingGizmo(e, jointKey);
            });

            overlay.appendChild(g);
        });

        updateGizmoPositions();
    }

    function updateGizmoPositions() {
        const svg = document.getElementById('actionPuppetSvg');
        if (!svg) return;

        JOINT_KEYS.forEach(jointKey => {
            const handleEl = document.querySelector(`.gizmo-handle-group[data-joint="${jointKey}"]`);
            if (!handleEl) return;

            const handlePos = getJointWorldHandle(jointKey);
            const pivotPos = getJointWorldPivot(jointKey);

            handleEl.setAttribute('transform', `translate(${handlePos.x}, ${handlePos.y})`);

            const leverLine = handleEl.querySelector('.gizmo-lever-line');
            if (leverLine) {
                leverLine.setAttribute('x1', `${pivotPos.x - handlePos.x}`);
                leverLine.setAttribute('y1', `${pivotPos.y - handlePos.y}`);
                leverLine.setAttribute('x2', '0');
                leverLine.setAttribute('y2', '0');
            }

            const pivotDot = handleEl.querySelector('.gizmo-pivot-dot');
            if (pivotDot) {
                pivotDot.setAttribute('cx', `${pivotPos.x - handlePos.x}`);
                pivotDot.setAttribute('cy', `${pivotPos.y - handlePos.y}`);
            }
        });
    }

    // ==========================================
    // 5. KÉO THẢ TRỰC TIẾP: XOAY (ROTATE) HOẶC CO GIÃN (SCALE)
    // ==========================================
    function startDraggingGizmo(e, jointKey) {
        state.activeDraggingJoint = jointKey;
        state.dragInitialJointAngle = state.currentAngles[jointKey] || 0;
        const curScale = state.currentScales[jointKey] || { x: 1.0, y: 1.0 };
        state.dragInitialScaleX = curScale.x;
        state.dragInitialScaleY = curScale.y;

        const svg = document.getElementById('actionPuppetSvg');
        const mousePt = getSvgCoords(e, svg);
        const pivotWorld = getJointWorldPivot(jointKey);

        const dx = mousePt.x - pivotWorld.x;
        const dy = mousePt.y - pivotWorld.y;
        state.dragStartAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        state.dragStartDist = Math.max(10, Math.sqrt(dx * dx + dy * dy));

        document.body.style.cursor = 'grabbing';

        const def = SKELETON_DEF[jointKey];
        if (state.activeGizmoTool === 'rotate') {
            showGizmoTooltip(e.clientX, e.clientY, `${def.name}: ${state.dragInitialJointAngle}°`);
        } else {
            showGizmoTooltip(e.clientX, e.clientY, `${def.name}: Scale ${Math.round(state.dragInitialScaleX * 100)}%`);
        }

        function onMouseMove(moveEvent) {
            if (!state.activeDraggingJoint) return;

            const curMouse = getSvgCoords(moveEvent, svg);
            const curPivot = getJointWorldPivot(state.activeDraggingJoint);
            const curDx = curMouse.x - curPivot.x;
            const curDy = curMouse.y - curPivot.y;

            if (state.activeGizmoTool === 'rotate') {
                // Chế độ Xoay quanh tâm neo
                const curAngle = Math.atan2(curDy, curDx) * (180 / Math.PI);
                let delta = curAngle - state.dragStartAngle;
                if (delta > 180) delta -= 360;
                if (delta < -180) delta += 360;

                let newAngle = Math.round(state.dragInitialJointAngle + delta);
                newAngle = Math.max(-180, Math.min(180, newAngle));

                updateJointAngle(state.activeDraggingJoint, newAngle);
                showGizmoTooltip(moveEvent.clientX, moveEvent.clientY, `${def.name}: ${newAngle > 0 ? '+' : ''}${newAngle}°`);
            } else {
                // Chế độ Co Giãn Scale (Thở phập phồng / Nhún)
                const curDist = Math.max(5, Math.sqrt(curDx * curDx + curDy * curDy));
                const ratio = curDist / state.dragStartDist;

                let newSx = Math.max(0.5, Math.min(2.0, Math.round(state.dragInitialScaleX * ratio * 100) / 100));
                let newSy = Math.max(0.5, Math.min(2.0, Math.round(state.dragInitialScaleY * ratio * 100) / 100));

                updateJointScale(state.activeDraggingJoint, newSx, newSy);
                showGizmoTooltip(moveEvent.clientX, moveEvent.clientY, `${def.name}: Scale ${Math.round(newSx * 100)}% (X: ${newSx.toFixed(2)}, Y: ${newSy.toFixed(2)})`);
            }
        }

        function onMouseUp() {
            state.activeDraggingJoint = null;
            document.body.style.cursor = 'default';
            hideGizmoTooltip();
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);

            saveCurrentPoseToActiveKeyframe();
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }

    function getSvgCoords(e, svgEl) {
        const pt = svgEl.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const ctm = svgEl.getScreenCTM();
        if (ctm) {
            return pt.matrixTransform(ctm.inverse());
        }
        return { x: pt.x, y: pt.y };
    }

    function showGizmoTooltip(x, y, text) {
        let tip = document.getElementById('gizmoFloatingTooltip');
        if (!tip) {
            tip = document.createElement('div');
            tip.id = 'gizmoFloatingTooltip';
            tip.className = 'gizmo-floating-tooltip';
            document.body.appendChild(tip);
        }
        tip.textContent = text;
        tip.style.left = `${x + 14}px`;
        tip.style.top = `${y - 12}px`;
        tip.style.display = 'block';
    }

    function hideGizmoTooltip() {
        const tip = document.getElementById('gizmoFloatingTooltip');
        if (tip) tip.style.display = 'none';
    }

    // ==========================================
    // ÁP DỤNG BIẾN ĐỔI (XOAY & SCALE) LÊN CÂY KHỚP SVG
    // ==========================================
    function applyJointTransform(jointKey) {
        const node = document.getElementById(`node_${jointKey}`);
        const def = SKELETON_DEF[jointKey];
        if (!node || !def) return;

        const angle = state.currentAngles[jointKey] || 0;
        const scale = state.currentScales[jointKey] || { x: 1.0, y: 1.0 };
        const px = def.pivot[0];
        const py = def.pivot[1];

        // Biến đổi SVG: Dời về Pivot -> Xoay -> Co giãn -> Dời ngược lại
        node.setAttribute('transform', `translate(${px}, ${py}) rotate(${angle}) scale(${scale.x}, ${scale.y}) translate(${-px}, ${-py})`);
    }

    function updateJointAngle(jointKey, angle, updateUi = true) {
        state.currentAngles[jointKey] = angle;
        applyJointTransform(jointKey);
        updateGizmoPositions();

        if (updateUi) {
            const slider = document.getElementById(`sliderJoint_${jointKey}`);
            const numInput = document.getElementById(`numJoint_${jointKey}`);
            if (slider) slider.value = angle;
            if (numInput) numInput.value = angle;
        }

        const currentAction = state.actions[state.currentActionId];
        if (currentAction && currentAction.type === 'static') {
            if (!currentAction.angles) currentAction.angles = {};
            currentAction.angles[jointKey] = angle;
        }
    }

    function updateJointScale(jointKey, scaleX, scaleY, updateUi = true) {
        if (!state.currentScales[jointKey]) state.currentScales[jointKey] = { x: 1.0, y: 1.0 };
        state.currentScales[jointKey].x = Math.round(scaleX * 100) / 100;
        state.currentScales[jointKey].y = Math.round(scaleY * 100) / 100;

        applyJointTransform(jointKey);
        updateGizmoPositions();

        if (updateUi) {
            const sliderX = document.getElementById(`sliderScaleX_${jointKey}`);
            const numX = document.getElementById(`numScaleX_${jointKey}`);
            const sliderY = document.getElementById(`sliderScaleY_${jointKey}`);
            const numY = document.getElementById(`numScaleY_${jointKey}`);
            if (sliderX) sliderX.value = state.currentScales[jointKey].x;
            if (numX) numX.value = state.currentScales[jointKey].x.toFixed(2);
            if (sliderY) sliderY.value = state.currentScales[jointKey].y;
            if (numY) numY.value = state.currentScales[jointKey].y.toFixed(2);
        }

        const currentAction = state.actions[state.currentActionId];
        if (currentAction && currentAction.type === 'static') {
            if (!currentAction.scales) currentAction.scales = {};
            currentAction.scales[jointKey] = [state.currentScales[jointKey].x, state.currentScales[jointKey].y];
        }
    }

    function applyAnglesToPuppet() {
        JOINT_KEYS.forEach(k => {
            applyJointTransform(k);
        });
        updateGizmoPositions();
        updateSlidersUi();
    }

    function updateSlidersUi() {
        JOINT_KEYS.forEach(jKey => {
            const angle = state.currentAngles[jKey] || 0;
            const sliderA = document.getElementById(`sliderJoint_${jKey}`);
            const numA = document.getElementById(`numJoint_${jKey}`);
            if (sliderA) sliderA.value = angle;
            if (numA) numA.value = angle;

            const scale = state.currentScales[jKey] || { x: 1.0, y: 1.0 };
            const sliderX = document.getElementById(`sliderScaleX_${jKey}`);
            const numX = document.getElementById(`numScaleX_${jKey}`);
            const sliderY = document.getElementById(`sliderScaleY_${jKey}`);
            const numY = document.getElementById(`numScaleY_${jKey}`);
            if (sliderX) sliderX.value = scale.x;
            if (numX) numX.value = scale.x.toFixed(2);
            if (sliderY) sliderY.value = scale.y;
            if (numY) numY.value = scale.y.toFixed(2);
        });
    }

    // ==========================================
    // RENDER BẢNG THANH TRƯỢT GÓC XOAY & SCALE (RIGHT PANEL)
    // ==========================================
    function renderJointSliders() {
        const container = document.getElementById('actionSlidersContainer');
        if (!container) return;

        const groups = [
            { id: 'body', title: '👤 Thân & Đầu', joints: ['torso', 'neck', 'head'] },
            { id: 'arm_L', title: '🦾 Tay Trái (Limb L)', joints: ['arm_L', 'forearm_L', 'hand_L'] },
            { id: 'arm_R', title: '🦾 Tay Phải (Limb R)', joints: ['arm_R', 'forearm_R', 'hand_R'] },
            { id: 'leg_L', title: '🦵 Chân Trái (Limb L)', joints: ['leg_L', 'shin_L', 'foot_L'] },
            { id: 'leg_R', title: '🦵 Chân Phải (Limb R)', joints: ['leg_R', 'shin_R', 'foot_R'] }
        ];

        const mode = state.sliderPanelMode; // 'rotate', 'scale', 'all'

        let html = '';
        groups.forEach(grp => {
            html += `
            <div class="joint-slider-group">
                <div class="joint-group-header">
                    <span>${grp.title}</span>
                </div>
                <div class="joint-group-body">
            `;

            grp.joints.forEach(jKey => {
                const def = SKELETON_DEF[jKey];
                const angle = state.currentAngles[jKey] || 0;
                const scale = state.currentScales[jKey] || { x: 1.0, y: 1.0 };
                const isLocked = state.aspectLocked[jKey] !== false;

                const showRotate = (mode === 'rotate' || mode === 'all');
                const showScale = (mode === 'scale' || mode === 'all');

                html += `
                <div class="joint-control-item" data-joint="${jKey}" style="border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 4px;">
                    <div class="joint-label-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                        <span class="joint-name" style="border-left: 3px solid ${def.color}; padding-left: 6px;">${def.name}</span>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <code class="joint-code">${jKey}</code>
                            ${showScale ? `<button type="button" class="btn-aspect-lock ${isLocked ? 'locked' : ''}" id="btnLockAspect_${jKey}" title="${isLocked ? 'Đang khóa tỉ lệ X/Y (Đồng dạng)' : 'Tự do chỉnh riêng chiều X và Y'}">${isLocked ? '🔒 Khóa' : '🔓 Tự do'}</button>` : ''}
                            <button type="button" class="btn-joint-reset" id="btnResetAll_${jKey}" title="Reset cả Xoay & Scale">↺</button>
                        </div>
                    </div>
                `;

                // Thanh trượt Góc Xoay (Rotate)
                if (showRotate) {
                    html += `
                    <div class="joint-slider-row">
                        <span style="font-size: 10px; font-weight: 700; color: #475569; width: 34px;">Xoay:</span>
                        <div class="joint-control-col">
                            <input type="range" id="sliderJoint_${jKey}" class="action-range" min="-180" max="180" step="1" value="${angle}">
                            <div class="joint-num-wrap">
                                <input type="number" id="numJoint_${jKey}" class="action-num-input" min="-180" max="180" value="${angle}">
                                <span class="joint-unit">°</span>
                            </div>
                            <button type="button" class="btn-joint-reset" id="btnResetJoint_${jKey}" title="Reset góc xoay về 0°">0°</button>
                        </div>
                    </div>
                    `;
                }

                // Thanh trượt Co Giãn Scale X & Scale Y
                if (showScale) {
                    html += `
                    <div class="joint-scale-row">
                        <span class="scale-axis-label">SX</span>
                        <input type="range" id="sliderScaleX_${jKey}" class="action-scale-range" min="0.5" max="1.8" step="0.01" value="${scale.x}">
                        <div class="joint-num-wrap">
                            <input type="number" id="numScaleX_${jKey}" class="action-num-input" min="0.5" max="1.8" step="0.01" value="${scale.x.toFixed(2)}">
                            <span class="joint-unit">x</span>
                        </div>
                    </div>
                    <div class="joint-scale-row">
                        <span class="scale-axis-label">SY</span>
                        <input type="range" id="sliderScaleY_${jKey}" class="action-scale-range" min="0.5" max="1.8" step="0.01" value="${scale.y}">
                        <div class="joint-num-wrap">
                            <input type="number" id="numScaleY_${jKey}" class="action-num-input" min="0.5" max="1.8" step="0.01" value="${scale.y.toFixed(2)}">
                            <span class="joint-unit">x</span>
                        </div>
                        <button type="button" class="btn-joint-reset" id="btnResetScale_${jKey}" title="Reset Scale về 1.0x">1.0</button>
                    </div>
                    `;
                }

                html += `</div>`;
            });

            html += `
                </div>
            </div>
            `;
        });

        container.innerHTML = html;

        // Gắn sự kiện cho các điều khiển
        JOINT_KEYS.forEach(jKey => {
            // Sự kiện Rotate
            const sliderA = document.getElementById(`sliderJoint_${jKey}`);
            const numA = document.getElementById(`numJoint_${jKey}`);
            const btnResetA = document.getElementById(`btnResetJoint_${jKey}`);

            if (sliderA && numA) {
                sliderA.addEventListener('input', (e) => {
                    const val = parseInt(e.target.value, 10) || 0;
                    numA.value = val;
                    updateJointAngle(jKey, val, false);
                    saveCurrentPoseToActiveKeyframe();
                });

                numA.addEventListener('input', (e) => {
                    let val = parseInt(e.target.value, 10);
                    if (isNaN(val)) val = 0;
                    val = Math.max(-180, Math.min(180, val));
                    sliderA.value = val;
                    updateJointAngle(jKey, val, false);
                    saveCurrentPoseToActiveKeyframe();
                });

                if (btnResetA) {
                    btnResetA.addEventListener('click', () => {
                        sliderA.value = 0;
                        numA.value = 0;
                        updateJointAngle(jKey, 0, false);
                        saveCurrentPoseToActiveKeyframe();
                    });
                }
            }

            // Sự kiện Scale X & Y
            const sliderX = document.getElementById(`sliderScaleX_${jKey}`);
            const numX = document.getElementById(`numScaleX_${jKey}`);
            const sliderY = document.getElementById(`sliderScaleY_${jKey}`);
            const numY = document.getElementById(`numScaleY_${jKey}`);
            const btnLock = document.getElementById(`btnLockAspect_${jKey}`);
            const btnResetS = document.getElementById(`btnResetScale_${jKey}`);
            const btnResetAll = document.getElementById(`btnResetAll_${jKey}`);

            if (btnLock) {
                btnLock.addEventListener('click', () => {
                    state.aspectLocked[jKey] = !state.aspectLocked[jKey];
                    btnLock.classList.toggle('locked', state.aspectLocked[jKey]);
                    btnLock.textContent = state.aspectLocked[jKey] ? '🔒 Khóa' : '🔓 Tự do';
                    btnLock.title = state.aspectLocked[jKey] ? 'Đang khóa tỉ lệ X/Y (Đồng dạng)' : 'Tự do chỉnh riêng chiều X và Y';
                });
            }

            if (sliderX && numX && sliderY && numY) {
                sliderX.addEventListener('input', (e) => {
                    const valX = parseFloat(e.target.value) || 1.0;
                    numX.value = valX.toFixed(2);
                    let valY = state.currentScales[jKey]?.y || 1.0;
                    if (state.aspectLocked[jKey]) {
                        valY = valX;
                        sliderY.value = valY;
                        numY.value = valY.toFixed(2);
                    }
                    updateJointScale(jKey, valX, valY, false);
                    saveCurrentPoseToActiveKeyframe();
                });

                numX.addEventListener('input', (e) => {
                    let valX = parseFloat(e.target.value);
                    if (isNaN(valX)) valX = 1.0;
                    valX = Math.max(0.5, Math.min(1.8, valX));
                    sliderX.value = valX;
                    let valY = state.currentScales[jKey]?.y || 1.0;
                    if (state.aspectLocked[jKey]) {
                        valY = valX;
                        sliderY.value = valY;
                        numY.value = valY.toFixed(2);
                    }
                    updateJointScale(jKey, valX, valY, false);
                    saveCurrentPoseToActiveKeyframe();
                });

                sliderY.addEventListener('input', (e) => {
                    const valY = parseFloat(e.target.value) || 1.0;
                    numY.value = valY.toFixed(2);
                    let valX = state.currentScales[jKey]?.x || 1.0;
                    if (state.aspectLocked[jKey]) {
                        valX = valY;
                        sliderX.value = valX;
                        numX.value = valX.toFixed(2);
                    }
                    updateJointScale(jKey, valX, valY, false);
                    saveCurrentPoseToActiveKeyframe();
                });

                numY.addEventListener('input', (e) => {
                    let valY = parseFloat(e.target.value);
                    if (isNaN(valY)) valY = 1.0;
                    valY = Math.max(0.5, Math.min(1.8, valY));
                    sliderY.value = valY;
                    let valX = state.currentScales[jKey]?.x || 1.0;
                    if (state.aspectLocked[jKey]) {
                        valX = valY;
                        sliderX.value = valX;
                        numX.value = valX.toFixed(2);
                    }
                    updateJointScale(jKey, valX, valY, false);
                    saveCurrentPoseToActiveKeyframe();
                });
            }

            if (btnResetS) {
                btnResetS.addEventListener('click', () => {
                    updateJointScale(jKey, 1.0, 1.0, true);
                    saveCurrentPoseToActiveKeyframe();
                });
            }

            if (btnResetAll) {
                btnResetAll.addEventListener('click', () => {
                    updateJointAngle(jKey, 0, true);
                    updateJointScale(jKey, 1.0, 1.0, true);
                    saveCurrentPoseToActiveKeyframe();
                });
            }
        });
    }

    // ==========================================
    // QUẢN LÝ DANH MỤC HÀNH ĐỘNG (LEFT SIDEBAR)
    // ==========================================
    function renderActionSidebarList() {
        const listContainer = document.getElementById('actionSidebarList');
        const countBadge = document.getElementById('actionCountBadge');
        if (!listContainer) return;

        const actionKeys = Object.keys(state.actions);
        if (countBadge) countBadge.textContent = `${actionKeys.length} hành động`;

        const filter = state.filterType;
        const q = state.searchQuery.trim().toLowerCase();

        let filteredKeys = actionKeys.filter(key => {
            const action = state.actions[key];
            if (filter === 'static' && action.type !== 'static') return false;
            if (filter === 'cycle' && action.type !== 'cycle') return false;
            if (q) {
                const matchName = (action.name || '').toLowerCase().includes(q);
                const matchId = key.toLowerCase().includes(q);
                return matchName || matchId;
            }
            return true;
        });

        if (filteredKeys.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-action-notice">
                    <p>Không tìm thấy hành động nào phù hợp</p>
                </div>
            `;
            return;
        }

        let html = '';
        filteredKeys.forEach(key => {
            const action = state.actions[key];
            const isSelected = (key === state.currentActionId);
            const isCycle = (action.type === 'cycle');
            const typeBadge = isCycle 
                ? `<span class="badge-action-type cycle">🏃 Chu kỳ (${action.duration || 1000}ms)</span>`
                : `<span class="badge-action-type static">🧘 Tư thế Tĩnh</span>`;

            html += `
            <div class="action-item-card ${isSelected ? 'active' : ''}" data-id="${key}">
                <div class="action-card-header">
                    <div class="action-info-col">
                        <h4 class="action-title">${escapeHtml(action.name || key)}</h4>
                        <div class="action-meta-row">
                            <code class="action-id-tag">${key}</code>
                            ${typeBadge}
                        </div>
                    </div>
                </div>
                <div class="action-card-actions">
                    <button type="button" class="btn-action-tool btn-dup-action" data-id="${key}" title="Nhân bản hành động này">📋 Nhân bản</button>
                    <button type="button" class="btn-action-tool btn-rename-action" data-id="${key}" title="Đổi tên hành động">✏️ Đổi tên</button>
                    <button type="button" class="btn-action-tool btn-del-action" data-id="${key}" title="Xóa hành động">🗑️</button>
                </div>
            </div>
            `;
        });

        listContainer.innerHTML = html;

        listContainer.querySelectorAll('.action-item-card').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('.action-card-actions')) return;
                const id = el.dataset.id;
                loadActionIntoStudio(id);
            });
        });

        listContainer.querySelectorAll('.btn-dup-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                duplicateAction(btn.dataset.id);
            });
        });

        listContainer.querySelectorAll('.btn-rename-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openRenameModal(btn.dataset.id);
            });
        });

        listContainer.querySelectorAll('.btn-del-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteAction(btn.dataset.id);
            });
        });
    }

    function loadActionIntoStudio(actionId) {
        const action = state.actions[actionId];
        if (!action) return;

        stopCyclePlayback();
        state.currentActionId = actionId;

        document.querySelectorAll('#actionSidebarList .action-item-card').forEach(el => {
            el.classList.toggle('active', el.dataset.id === actionId);
        });

        const titleEl = document.getElementById('activeActionDisplayTitle');
        const badgeEl = document.getElementById('activeActionDisplayBadge');
        if (titleEl) titleEl.textContent = action.name || actionId;
        if (badgeEl) {
            badgeEl.textContent = action.type === 'cycle' ? `Chu kỳ: ${action.duration}ms` : 'Tư thế Tĩnh';
            badgeEl.className = `badge-action-type ${action.type}`;
        }

        const timelineContainer = document.getElementById('actionTimelineBar');

        if (action.type === 'static') {
            if (timelineContainer) timelineContainer.style.display = 'none';
            state.currentAngles = cloneAngles(action.angles || createZeroAngles());
            state.currentScales = cloneScales(action.scales || createDefaultScales());
            applyAnglesToPuppet();
        } else if (action.type === 'cycle') {
            if (timelineContainer) timelineContainer.style.display = 'flex';
            if (!action.keyframes || action.keyframes.length === 0) {
                action.keyframes = [
                    { time: 0, easing: 'easeInOut', angles: createZeroAngles(), scales: createDefaultScales() },
                    { time: action.duration || 1500, easing: 'easeInOut', angles: createZeroAngles(), scales: createDefaultScales() }
                ];
            }
            state.currentTime = 0;
            state.activeKeyframeIdx = 0;
            renderTimelineUi();
            loadKeyframePose(0);
        }
    }

    // ==========================================
    // TIMELINE & KEYFRAME CHO MOTION CYCLES
    // ==========================================
    function renderTimelineUi() {
        const action = state.actions[state.currentActionId];
        if (!action || action.type !== 'cycle') return;

        const durationInput = document.getElementById('inputCycleDuration');
        const loopCheck = document.getElementById('checkCycleLoop');
        const timeDisplay = document.getElementById('valTimelineCurrentTime');
        const totalDisplay = document.getElementById('valTimelineTotalDuration');
        const rulerEndDisplay = document.getElementById('valRulerEndDuration');
        const trackMarkers = document.getElementById('timelineKeyframeMarkers');
        const scrubberThumb = document.getElementById('timelineScrubberThumb');

        const dur = Math.max(100, action.duration || 1500);

        if (durationInput) durationInput.value = dur;
        if (loopCheck) loopCheck.checked = action.loop !== false;
        if (timeDisplay) timeDisplay.textContent = formatMs(state.currentTime);
        if (totalDisplay) totalDisplay.textContent = formatMs(dur);
        if (rulerEndDisplay) rulerEndDisplay.textContent = `100% (${dur}ms)`;

        if (trackMarkers) {
            trackMarkers.innerHTML = '';

            action.keyframes.forEach((kf, idx) => {
                const pct = Math.max(0, Math.min(100, (kf.time / dur) * 100));
                const diamond = document.createElement('div');
                diamond.className = `timeline-kf-diamond ${idx === state.activeKeyframeIdx ? 'active' : ''}`;
                diamond.style.left = `${pct}%`;
                diamond.title = `Keyframe ${idx + 1}: ${kf.time}ms [${kf.easing || 'easeInOut'}]`;
                diamond.dataset.index = idx;

                diamond.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    selectKeyframe(idx);
                });

                trackMarkers.appendChild(diamond);
            });
        }

        if (scrubberThumb) {
            const pct = Math.max(0, Math.min(100, (state.currentTime / dur) * 100));
            scrubberThumb.style.left = `${pct}%`;
        }

        const selectEasing = document.getElementById('selectKeyframeEasing');
        if (selectEasing && action.keyframes[state.activeKeyframeIdx]) {
            selectEasing.value = action.keyframes[state.activeKeyframeIdx].easing || 'easeInOut';
        }
    }

    function selectKeyframe(idx) {
        const action = state.actions[state.currentActionId];
        if (!action || !action.keyframes || !action.keyframes[idx]) return;

        stopCyclePlayback();
        state.activeKeyframeIdx = idx;
        state.currentTime = action.keyframes[idx].time;
        loadKeyframePose(idx);
        renderTimelineUi();
    }

    function loadKeyframePose(idx) {
        const action = state.actions[state.currentActionId];
        if (!action || !action.keyframes || !action.keyframes[idx]) return;

        state.currentAngles = cloneAngles(action.keyframes[idx].angles);
        state.currentScales = cloneScales(action.keyframes[idx].scales);
        applyAnglesToPuppet();
    }

    function saveCurrentPoseToActiveKeyframe() {
        const action = state.actions[state.currentActionId];
        if (!action || action.type !== 'cycle') return;

        const kf = action.keyframes[state.activeKeyframeIdx];
        if (kf) {
            kf.angles = cloneAngles(state.currentAngles);
            kf.scales = cloneScales(state.currentScales);
        }
    }

    function addKeyframeAtCurrentTime() {
        const action = state.actions[state.currentActionId];
        if (!action || action.type !== 'cycle') return;

        const curT = Math.round(state.currentTime);

        const existingKf = action.keyframes.find(k => Math.abs(k.time - curT) <= 20);
        if (existingKf) {
            existingKf.angles = cloneAngles(state.currentAngles);
            existingKf.scales = cloneScales(state.currentScales);
            state.activeKeyframeIdx = action.keyframes.indexOf(existingKf);
            showNotification(`Đã cập nhật góc & scale cho Keyframe tại ${existingKf.time}ms!`);
        } else {
            const newKf = {
                time: curT,
                easing: 'easeInOut',
                angles: cloneAngles(state.currentAngles),
                scales: cloneScales(state.currentScales)
            };
            action.keyframes.push(newKf);
            action.keyframes.sort((a, b) => a.time - b.time);
            state.activeKeyframeIdx = action.keyframes.indexOf(newKf);
            showNotification(`Đã thêm Keyframe mới tại ${curT}ms!`);
        }

        renderTimelineUi();
    }

    function deleteActiveKeyframe() {
        const action = state.actions[state.currentActionId];
        if (!action || action.type !== 'cycle') return;
        if (action.keyframes.length <= 1) {
            alert('Một chu kỳ chuyển động cần tối thiểu ít nhất 1 Keyframe!');
            return;
        }

        action.keyframes.splice(state.activeKeyframeIdx, 1);
        state.activeKeyframeIdx = Math.max(0, state.activeKeyframeIdx - 1);
        state.currentTime = action.keyframes[state.activeKeyframeIdx].time;
        loadKeyframePose(state.activeKeyframeIdx);
        renderTimelineUi();
        showNotification('Đã xóa Keyframe thành công!');
    }

    function stepPrevKeyframe() {
        const action = state.actions[state.currentActionId];
        if (!action || action.type !== 'cycle' || !action.keyframes.length) return;

        let nextIdx = state.activeKeyframeIdx - 1;
        if (nextIdx < 0) nextIdx = action.keyframes.length - 1;
        selectKeyframe(nextIdx);
    }

    function stepNextKeyframe() {
        const action = state.actions[state.currentActionId];
        if (!action || action.type !== 'cycle' || !action.keyframes.length) return;

        let nextIdx = state.activeKeyframeIdx + 1;
        if (nextIdx >= action.keyframes.length) nextIdx = 0;
        selectKeyframe(nextIdx);
    }

    // ==========================================
    // BỘ NỘI SUY HOẠT HỌA THEO EASING (ROTATE & SCALE ENGINE)
    // ==========================================
    function toggleCyclePlay() {
        if (state.isPlaying) {
            stopCyclePlayback();
        } else {
            startCyclePlayback();
        }
    }

    function startCyclePlayback() {
        const action = state.actions[state.currentActionId];
        if (!action || action.type !== 'cycle') return;

        state.isPlaying = true;
        state.lastAnimTimestamp = performance.now();

        const btnPlay = document.getElementById('btnActionPlayPause');
        if (btnPlay) {
            btnPlay.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
            `;
            btnPlay.classList.add('playing');
        }

        function loop(timestamp) {
            if (!state.isPlaying) return;

            const dt = timestamp - state.lastAnimTimestamp;
            state.lastAnimTimestamp = timestamp;

            const duration = Math.max(100, action.duration || 1500);
            state.currentTime += dt;

            if (state.currentTime >= duration) {
                if (action.loop !== false) {
                    state.currentTime = state.currentTime % duration;
                } else {
                    state.currentTime = duration;
                    stopCyclePlayback();
                    renderTimelineUi();
                    return;
                }
            }

            evaluateCycleAtTime(state.currentTime);
            updateScrubberOnly();

            state.animReqId = requestAnimationFrame(loop);
        }

        state.animReqId = requestAnimationFrame(loop);
    }

    function stopCyclePlayback() {
        state.isPlaying = false;
        if (state.animReqId) {
            cancelAnimationFrame(state.animReqId);
            state.animReqId = null;
        }
        const btnPlay = document.getElementById('btnActionPlayPause');
        if (btnPlay) {
            btnPlay.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
            `;
            btnPlay.classList.remove('playing');
        }
    }

    function evaluateCycleAtTime(t) {
        const action = state.actions[state.currentActionId];
        if (!action || !action.keyframes || action.keyframes.length === 0) return;

        const kfs = action.keyframes;
        if (kfs.length === 1) {
            state.currentAngles = cloneAngles(kfs[0].angles);
            state.currentScales = cloneScales(kfs[0].scales);
            applyAnglesToPuppet();
            return;
        }

        // Tìm 2 keyframe bao quanh t
        let prev = kfs[0];
        let next = kfs[kfs.length - 1];

        for (let i = 0; i < kfs.length - 1; i++) {
            if (t >= kfs[i].time && t <= kfs[i + 1].time) {
                prev = kfs[i];
                next = kfs[i + 1];
                break;
            }
        }

        const span = Math.max(1, next.time - prev.time);
        let progress = (t - prev.time) / span;
        progress = Math.max(0, Math.min(1, progress));

        const easing = prev.easing || 'easeInOut';
        const easedProgress = applyEasing(progress, easing);

        // Nội suy góc xoay & scale cho cả 15 khớp
        JOINT_KEYS.forEach(k => {
            // 1. Góc xoay (Angle)
            const a0 = prev.angles?.[k] || 0;
            const a1 = next.angles?.[k] || 0;
            state.currentAngles[k] = Math.round(a0 + (a1 - a0) * easedProgress);

            // 2. Co giãn Scale (Scale X & Y)
            const pScale = prev.scales?.[k] || [1.0, 1.0];
            const nScale = next.scales?.[k] || [1.0, 1.0];
            const psx = Array.isArray(pScale) ? pScale[0] : (pScale.x ?? 1.0);
            const psy = Array.isArray(pScale) ? pScale[1] : (pScale.y ?? 1.0);
            const nsx = Array.isArray(nScale) ? nScale[0] : (nScale.x ?? 1.0);
            const nsy = Array.isArray(nScale) ? nScale[1] : (nScale.y ?? 1.0);

            const sx = Math.round((psx + (nsx - psx) * easedProgress) * 100) / 100;
            const sy = Math.round((psy + (nsy - psy) * easedProgress) * 100) / 100;
            state.currentScales[k] = { x: sx, y: sy };

            applyJointTransform(k);
        });

        updateGizmoPositions();
        updateSlidersUi();
    }

    function applyEasing(t, type) {
        switch (type) {
            case 'linear':
                return t;
            case 'easeIn':
                return t * t;
            case 'easeOut':
                return t * (2 - t);
            case 'easeInOut':
            default:
                return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        }
    }

    function updateScrubberOnly() {
        const action = state.actions[state.currentActionId];
        if (!action) return;
        const dur = Math.max(100, action.duration || 1500);
        const scrubberThumb = document.getElementById('timelineScrubberThumb');
        const timeDisplay = document.getElementById('valTimelineCurrentTime');

        if (scrubberThumb) {
            const pct = Math.max(0, Math.min(100, (state.currentTime / dur) * 100));
            scrubberThumb.style.left = `${pct}%`;
        }
        if (timeDisplay) {
            timeDisplay.textContent = formatMs(state.currentTime);
        }
    }

    // ==========================================
    // KÉO THẢ SCRUBBER TRÊN TIMELINE (DRAG SCRUBBER)
    // ==========================================
    function setupTimelineScrubberDrag() {
        const track = document.getElementById('actionTimelineTrack');
        if (!track) return;

        function updateFromEvent(e) {
            const action = state.actions[state.currentActionId];
            if (!action || action.type !== 'cycle') return;

            const rect = track.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = Math.max(0, Math.min(1, clickX / rect.width));
            const dur = Math.max(100, action.duration || 1500);

            stopCyclePlayback();
            state.currentTime = pct * dur;
            evaluateCycleAtTime(state.currentTime);

            let nearestIdx = 0;
            let minDist = Infinity;
            action.keyframes.forEach((kf, idx) => {
                const dist = Math.abs(kf.time - state.currentTime);
                if (dist < minDist) {
                    minDist = dist;
                    nearestIdx = idx;
                }
            });
            state.activeKeyframeIdx = nearestIdx;
            renderTimelineUi();
        }

        let isDraggingScrubber = false;

        track.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isDraggingScrubber = true;
            updateFromEvent(e);

            function onMouseMove(moveEvent) {
                if (!isDraggingScrubber) return;
                updateFromEvent(moveEvent);
            }

            function onMouseUp() {
                isDraggingScrubber = false;
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            }

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });
    }

    // ==========================================
    // THAO TÁC TƯ THẾ NHANH (QUICK ACTIONS: ROTATE & SCALE)
    // ==========================================
    function resetAllJointsToZero() {
        JOINT_KEYS.forEach(k => {
            updateJointAngle(k, 0, true);
        });
        saveCurrentPoseToActiveKeyframe();
    }

    function applyTPose() {
        resetAllJointsToZero();
        updateJointAngle('arm_L', 90, true);
        updateJointAngle('arm_R', -90, true);
        saveCurrentPoseToActiveKeyframe();
    }

    function applyStandingPose() {
        const std = DEFAULT_ACTIONS.standing.angles;
        JOINT_KEYS.forEach(k => {
            updateJointAngle(k, std[k] || 0, true);
        });
        saveCurrentPoseToActiveKeyframe();
    }

    function mirrorLeftToRight() {
        updateJointAngle('arm_R', -(state.currentAngles['arm_L'] || 0), true);
        updateJointAngle('forearm_R', -(state.currentAngles['forearm_L'] || 0), true);
        updateJointAngle('hand_R', -(state.currentAngles['hand_L'] || 0), true);

        updateJointAngle('leg_R', -(state.currentAngles['leg_L'] || 0), true);
        updateJointAngle('shin_R', -(state.currentAngles['shin_L'] || 0), true);
        updateJointAngle('foot_R', -(state.currentAngles['foot_L'] || 0), true);

        saveCurrentPoseToActiveKeyframe();
    }

    function mirrorRightToLeft() {
        updateJointAngle('arm_L', -(state.currentAngles['arm_R'] || 0), true);
        updateJointAngle('forearm_L', -(state.currentAngles['forearm_R'] || 0), true);
        updateJointAngle('hand_L', -(state.currentAngles['hand_R'] || 0), true);

        updateJointAngle('leg_L', -(state.currentAngles['leg_R'] || 0), true);
        updateJointAngle('shin_L', -(state.currentAngles['shin_R'] || 0), true);
        updateJointAngle('foot_L', -(state.currentAngles['foot_R'] || 0), true);

        saveCurrentPoseToActiveKeyframe();
    }

    function invertPose() {
        JOINT_KEYS.forEach(k => {
            const current = state.currentAngles[k] || 0;
            updateJointAngle(k, -current, true);
        });
        saveCurrentPoseToActiveKeyframe();
    }

    // Các phím tắt nhanh Co Giãn Scale
    function resetAllScalesToOne() {
        JOINT_KEYS.forEach(k => {
            updateJointScale(k, 1.0, 1.0, true);
        });
        saveCurrentPoseToActiveKeyframe();
        showNotification('Đã reset Scale toàn bộ các khớp về 1.0x!');
    }

    function applyScaleBreathingPreset() {
        // Thở vào: lồng ngực phồng lên 8% chiều ngang, 4% chiều dọc
        updateJointScale('torso', 1.08, 1.04, true);
        updateJointScale('head', 1.02, 1.02, true);
        saveCurrentPoseToActiveKeyframe();
        showNotification('Đã áp dụng trạng thái Thở Vào (+8% ngực, +4% thân)!');
    }

    function applyScaleSquashPreset() {
        // Nhún xuống: thân người lùn đi 8%, bè ngang 6%
        updateJointScale('torso', 1.06, 0.92, true);
        updateJointScale('leg_L', 1.02, 0.95, true);
        updateJointScale('leg_R', 1.02, 0.95, true);
        saveCurrentPoseToActiveKeyframe();
        showNotification('Đã áp dụng trạng thái Nhún Xuống (Squash: Y 0.92x, X 1.06x)!');
    }

    function applyScaleStretchPreset() {
        // Vươn cao: thân người thon lại 5%, cao lên 8%
        updateJointScale('torso', 0.95, 1.08, true);
        updateJointScale('leg_L', 0.98, 1.03, true);
        updateJointScale('leg_R', 0.98, 1.03, true);
        saveCurrentPoseToActiveKeyframe();
        showNotification('Đã áp dụng trạng thái Vươn Cao (Stretch: Y 1.08x, X 0.95x)!');
    }

    function applyScaleMultiply(factor) {
        JOINT_KEYS.forEach(k => {
            const cur = state.currentScales[k] || { x: 1.0, y: 1.0 };
            const newX = Math.max(0.5, Math.min(2.0, Math.round(cur.x * factor * 100) / 100));
            const newY = Math.max(0.5, Math.min(2.0, Math.round(cur.y * factor * 100) / 100));
            updateJointScale(k, newX, newY, true);
        });
        saveCurrentPoseToActiveKeyframe();
    }

    // ==========================================
    // THÊM, NHÂN BẢN, ĐỔI TÊN, XÓA HÀNH ĐỘNG
    // ==========================================
    function createNewAction(id, name, type, duration = 1500, basePose = 'current') {
        const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        if (!cleanId) {
            alert('Vui lòng nhập Action ID hợp lệ (chữ cái thường, số, dấu gạch dưới)!');
            return false;
        }

        if (state.actions[cleanId]) {
            alert(`Hành động với ID "${cleanId}" đã tồn tại! Vui lòng chọn ID khác.`);
            return false;
        }

        let angles = createZeroAngles();
        let scales = createDefaultScales();
        if (basePose === 'current') {
            angles = cloneAngles(state.currentAngles);
            scales = cloneScales(state.currentScales);
        } else if (basePose === 'standing') {
            angles = cloneAngles(DEFAULT_ACTIONS.standing.angles);
            scales = cloneScales(DEFAULT_ACTIONS.standing.scales || createDefaultScales());
        }

        if (type === 'static') {
            state.actions[cleanId] = {
                name: name.trim() || cleanId,
                type: 'static',
                angles: angles,
                scales: scales
            };
        } else {
            state.actions[cleanId] = {
                name: name.trim() || cleanId,
                type: 'cycle',
                duration: duration,
                loop: true,
                keyframes: [
                    { time: 0, easing: 'easeInOut', angles: cloneAngles(angles), scales: cloneScales(scales) },
                    { time: Math.round(duration / 2), easing: 'easeInOut', angles: cloneAngles(angles), scales: cloneScales(scales) },
                    { time: duration, easing: 'easeInOut', angles: cloneAngles(angles), scales: cloneScales(scales) }
                ]
            };
        }

        renderActionSidebarList();
        loadActionIntoStudio(cleanId);
        showNotification(`Đã tạo mới hành động "${name || cleanId}"!`);
        return true;
    }

    function duplicateAction(actionId) {
        const src = state.actions[actionId];
        if (!src) return;

        let newId = `${actionId}_copy`;
        let counter = 1;
        while (state.actions[newId]) {
            newId = `${actionId}_copy${counter++}`;
        }

        const clone = JSON.parse(JSON.stringify(src));
        clone.name = `${src.name || actionId} (Bản sao)`;
        state.actions[newId] = clone;

        renderActionSidebarList();
        loadActionIntoStudio(newId);
        showNotification(`Đã nhân bản thành "${clone.name}"!`);
    }

    function deleteAction(actionId) {
        const action = state.actions[actionId];
        if (!action) return;

        const actionKeys = Object.keys(state.actions);
        if (actionKeys.length <= 1) {
            alert('Không thể xóa! Thư viện hành động cần có ít nhất 1 hành động.');
            return;
        }

        if (confirm(`Bạn có chắc muốn xóa hành động "${action.name || actionId}" (${actionId})?`)) {
            delete state.actions[actionId];
            renderActionSidebarList();

            if (state.currentActionId === actionId) {
                const remainingKey = Object.keys(state.actions)[0];
                loadActionIntoStudio(remainingKey);
            }
            showNotification(`Đã xóa hành động "${action.name || actionId}"!`);
        }
    }

    function openRenameModal(actionId) {
        const action = state.actions[actionId];
        if (!action) return;

        const modal = document.getElementById('modalRenameAction');
        const inputName = document.getElementById('inputRenameActionName');
        const inputId = document.getElementById('inputRenameActionId');
        if (!modal || !inputName) return;

        inputId.value = actionId;
        inputName.value = action.name || actionId;
        modal.style.display = 'flex';
    }

    // ==========================================
    // XUẤT & NẠP FILE JSON (UNIVERSAL ACTIONS)
    // ==========================================
    function buildUniversalActionsJson() {
        const cleanSkeleton = {};
        JOINT_KEYS.forEach(k => {
            const def = SKELETON_DEF[k];
            cleanSkeleton[k] = {
                parent: def.parent,
                pivot: def.pivot
            };
        });

        return {
            version: "1.0",
            canvas: "400x1000",
            skeleton: cleanSkeleton,
            actions: state.actions
        };
    }

    async function exportUniversalActions() {
        const payload = buildUniversalActionsJson();
        const jsonStr = JSON.stringify(payload, null, 2);

        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'universal_actions.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        try {
            const res = await fetch('/api/universal-actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: jsonStr
            });
            if (res.ok) {
                const data = await res.json();
                showNotification(`Đã xuất và lưu thư viện thành công vào ${data.path || 'universal_actions.json'}!`);
            } else {
                showNotification('Đã tải file JSON về máy thành công!');
            }
        } catch (e) {
            showNotification('Đã tải file JSON về máy thành công!');
        }
    }

    async function fetchServerActions() {
        try {
            const res = await fetch('/api/universal-actions');
            if (res.ok) {
                const data = await res.json();
                if (data && data.actions && Object.keys(data.actions).length > 0) {
                    state.actions = data.actions;
                    renderActionSidebarList();
                    const firstKey = Object.keys(state.actions)[0];
                    loadActionIntoStudio(firstKey);
                }
            }
        } catch (e) {
            console.log('Chưa có universal_actions.json từ server, sử dụng mẫu mặc định.');
        }
    }

    function importUniversalActionsFromFile(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.actions || typeof data.actions !== 'object') {
                    alert('File JSON không hợp lệ! Thiếu trường "actions".');
                    return;
                }

                state.actions = Object.assign({}, DEFAULT_ACTIONS, data.actions);
                renderActionSidebarList();
                const firstKey = Object.keys(state.actions)[0];
                loadActionIntoStudio(firstKey);
                showNotification(`Đã nạp thành công ${Object.keys(data.actions).length} hành động từ file!`);
            } catch (err) {
                alert(`Lỗi đọc file JSON: ${err.message}`);
            }
        };
        reader.readAsText(file);
    }

    // ==========================================
    // THIẾT LẬP SỰ KIỆN GIAO DIỆN CHÍNH
    // ==========================================
    function setupEventListeners() {
        // Nút lọc loại hành động
        document.querySelectorAll('.btn-filter-action-type').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-filter-action-type').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.filterType = btn.dataset.type;
                renderActionSidebarList();
            });
        });

        // Tìm kiếm hành động
        const searchInput = document.getElementById('inputSearchActions');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                state.searchQuery = e.target.value;
                renderActionSidebarList();
            });
        }

        // Nút Thêm hành động mới
        const btnAddAction = document.getElementById('btnAddActionModal');
        const modalAdd = document.getElementById('modalAddAction');
        if (btnAddAction && modalAdd) {
            btnAddAction.addEventListener('click', () => {
                modalAdd.style.display = 'flex';
                const idInput = document.getElementById('inputNewActionId');
                const nameInput = document.getElementById('inputNewActionName');
                if (idInput) idInput.value = '';
                if (nameInput) nameInput.value = '';
            });
        }

        document.querySelectorAll('.btn-modal-close-generic').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal-backdrop-generic').forEach(m => m.style.display = 'none');
            });
        });

        const btnConfirmAdd = document.getElementById('btnConfirmCreateAction');
        if (btnConfirmAdd) {
            btnConfirmAdd.addEventListener('click', () => {
                const id = document.getElementById('inputNewActionId').value;
                const name = document.getElementById('inputNewActionName').value;
                const typeRadio = document.querySelector('input[name="newActionType"]:checked');
                const type = typeRadio ? typeRadio.value : 'static';
                const dur = parseInt(document.getElementById('inputNewActionDuration').value, 10) || 1500;
                const basePoseRadio = document.querySelector('input[name="newActionBasePose"]:checked');
                const basePose = basePoseRadio ? basePoseRadio.value : 'current';

                if (createNewAction(id, name, type, dur, basePose)) {
                    document.getElementById('modalAddAction').style.display = 'none';
                }
            });
        }

        document.querySelectorAll('input[name="newActionType"]').forEach(r => {
            r.addEventListener('change', () => {
                const durRow = document.getElementById('newActionDurationRow');
                if (durRow) durRow.style.display = (r.value === 'cycle') ? 'flex' : 'none';
            });
        });

        const btnConfirmRename = document.getElementById('btnConfirmRenameAction');
        if (btnConfirmRename) {
            btnConfirmRename.addEventListener('click', () => {
                const id = document.getElementById('inputRenameActionId').value;
                const newName = document.getElementById('inputRenameActionName').value.trim();
                if (state.actions[id] && newName) {
                    state.actions[id].name = newName;
                    renderActionSidebarList();
                    if (state.currentActionId === id) {
                        const titleEl = document.getElementById('activeActionDisplayTitle');
                        if (titleEl) titleEl.textContent = newName;
                    }
                }
                document.getElementById('modalRenameAction').style.display = 'none';
            });
        }

        const btnExport = document.getElementById('btnExportUniversalActions');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                exportUniversalActions();
            });
        }

        const btnImport = document.getElementById('btnImportUniversalActions');
        const fileImport = document.getElementById('fileImportUniversalActions');
        if (btnImport && fileImport) {
            btnImport.addEventListener('click', () => fileImport.click());
            fileImport.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    importUniversalActionsFromFile(e.target.files[0]);
                    e.target.value = '';
                }
            });
        }

        // Chuyển chế độ công cụ Gizmo trên Viewport: Xoay (R) vs Scale (S)
        const btnGizmoRotate = document.getElementById('btnGizmoToolRotate');
        const btnGizmoScale = document.getElementById('btnGizmoToolScale');
        if (btnGizmoRotate && btnGizmoScale) {
            btnGizmoRotate.addEventListener('click', () => {
                setGizmoTool('rotate');
            });
            btnGizmoScale.addEventListener('click', () => {
                setGizmoTool('scale');
            });
        }

        // Chuyển Tab bảng điều khiển bên phải (Xoay, Co Giãn, Cả Hai)
        const btnModeRotate = document.getElementById('btnModeRotateTab');
        const btnModeScale = document.getElementById('btnModeScaleTab');
        const btnModeAll = document.getElementById('btnModeAllTab');
        const toolbarRotate = document.getElementById('quickRotateToolbar');
        const toolbarScale = document.getElementById('quickScaleToolbar');

        function setSliderMode(mode) {
            state.sliderPanelMode = mode;
            [btnModeRotate, btnModeScale, btnModeAll].forEach(b => {
                if (b) {
                    b.classList.toggle('active', b.dataset.mode === mode);
                    b.style.background = (b.dataset.mode === mode) ? '#ffffff' : 'transparent';
                    b.style.color = (b.dataset.mode === mode) ? 'var(--orange-primary)' : 'var(--text-secondary)';
                }
            });

            if (toolbarRotate) toolbarRotate.style.display = (mode === 'rotate' || mode === 'all') ? 'grid' : 'none';
            if (toolbarScale) toolbarScale.style.display = (mode === 'scale' || mode === 'all') ? 'grid' : 'none';

            renderJointSliders();
        }

        if (btnModeRotate) btnModeRotate.addEventListener('click', () => setSliderMode('rotate'));
        if (btnModeScale) btnModeScale.addEventListener('click', () => setSliderMode('scale'));
        if (btnModeAll) btnModeAll.addEventListener('click', () => setSliderMode('all'));

        // Phím tắt nhanh Rotate
        const btnZero = document.getElementById('btnQuickResetZero');
        const btnTPose = document.getElementById('btnQuickTPose');
        const btnStanding = document.getElementById('btnQuickStanding');
        const btnMirrorL2R = document.getElementById('btnQuickMirrorL2R');
        const btnMirrorR2L = document.getElementById('btnQuickMirrorR2L');
        const btnInvert = document.getElementById('btnQuickInvert');

        if (btnZero) btnZero.addEventListener('click', resetAllJointsToZero);
        if (btnTPose) btnTPose.addEventListener('click', applyTPose);
        if (btnStanding) btnStanding.addEventListener('click', applyStandingPose);
        if (btnMirrorL2R) btnMirrorL2R.addEventListener('click', mirrorLeftToRight);
        if (btnMirrorR2L) btnMirrorR2L.addEventListener('click', mirrorRightToLeft);
        if (btnInvert) btnInvert.addEventListener('click', invertPose);

        // Phím tắt nhanh Scale
        const btnScaleReset = document.getElementById('btnQuickScaleReset');
        const btnScaleBreathe = document.getElementById('btnQuickScaleBreathe');
        const btnScaleSquash = document.getElementById('btnQuickScaleSquash');
        const btnScaleStretch = document.getElementById('btnQuickScaleStretch');
        const btnScaleBigger = document.getElementById('btnQuickScaleBigger');
        const btnScaleSmaller = document.getElementById('btnQuickScaleSmaller');

        if (btnScaleReset) btnScaleReset.addEventListener('click', resetAllScalesToOne);
        if (btnScaleBreathe) btnScaleBreathe.addEventListener('click', applyScaleBreathingPreset);
        if (btnScaleSquash) btnScaleSquash.addEventListener('click', applyScaleSquashPreset);
        if (btnScaleStretch) btnScaleStretch.addEventListener('click', applyScaleStretchPreset);
        if (btnScaleBigger) btnScaleBigger.addEventListener('click', () => applyScaleMultiply(1.1));
        if (btnScaleSmaller) btnScaleSmaller.addEventListener('click', () => applyScaleMultiply(0.9));

        // Timeline Controls
        const btnPlay = document.getElementById('btnActionPlayPause');
        const btnRewind = document.getElementById('btnActionRewind');
        const btnPrevKf = document.getElementById('btnActionPrevKf');
        const btnNextKf = document.getElementById('btnActionNextKf');
        const btnAddKf = document.getElementById('btnAddKeyframe');
        const btnDelKf = document.getElementById('btnDeleteKeyframe');
        const selectEasing = document.getElementById('selectKeyframeEasing');
        const durationInput = document.getElementById('inputCycleDuration');
        const loopCheck = document.getElementById('checkCycleLoop');

        if (btnPlay) btnPlay.addEventListener('click', toggleCyclePlay);
        if (btnRewind) btnRewind.addEventListener('click', () => {
            state.currentTime = 0;
            state.activeKeyframeIdx = 0;
            evaluateCycleAtTime(0);
            renderTimelineUi();
        });
        if (btnPrevKf) btnPrevKf.addEventListener('click', stepPrevKeyframe);
        if (btnNextKf) btnNextKf.addEventListener('click', stepNextKeyframe);
        if (btnAddKf) btnAddKf.addEventListener('click', addKeyframeAtCurrentTime);
        if (btnDelKf) btnDelKf.addEventListener('click', deleteActiveKeyframe);

        if (selectEasing) {
            selectEasing.addEventListener('change', (e) => {
                const action = state.actions[state.currentActionId];
                if (action && action.keyframes && action.keyframes[state.activeKeyframeIdx]) {
                    action.keyframes[state.activeKeyframeIdx].easing = e.target.value;
                }
            });
        }

        if (durationInput) {
            durationInput.addEventListener('change', (e) => {
                const action = state.actions[state.currentActionId];
                if (action) {
                    action.duration = Math.max(200, parseInt(e.target.value, 10) || 1500);
                    renderTimelineUi();
                }
            });
        }

        if (loopCheck) {
            loopCheck.addEventListener('change', (e) => {
                const action = state.actions[state.currentActionId];
                if (action) action.loop = e.target.checked;
            });
        }

        // Viewport Zoom & Fit
        const btnZoomIn = document.getElementById('btnActionZoomIn');
        const btnZoomOut = document.getElementById('btnActionZoomOut');
        const btnZoomReset = document.getElementById('btnActionZoomReset');
        if (btnZoomIn) btnZoomIn.addEventListener('click', () => setPuppetZoom(state.zoom + 0.15));
        if (btnZoomOut) btnZoomOut.addEventListener('click', () => setPuppetZoom(state.zoom - 0.15));
        if (btnZoomReset) btnZoomReset.addEventListener('click', fitPuppetToViewport);

        const selectBg = document.getElementById('selectActionBgMode');
        if (selectBg) {
            selectBg.addEventListener('change', (e) => {
                const stage = document.getElementById('actionStageViewport');
                if (!stage) return;
                stage.className = `action-stage-viewport bg-${e.target.value}`;
            });
        }

        const checkGizmo = document.getElementById('checkShowActionGizmos');
        if (checkGizmo) {
            checkGizmo.addEventListener('change', (e) => {
                const overlay = document.getElementById('gizmoOverlay');
                if (overlay) overlay.style.display = e.target.checked ? 'block' : 'none';
            });
        }

        // Phím tắt bàn phím tiện lợi
        window.addEventListener('keydown', (e) => {
            const activeView = document.getElementById('universalActionView');
            if (!activeView || activeView.style.display === 'none') return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'r' || e.key === 'R') {
                setGizmoTool('rotate');
            } else if (e.key === 's' || e.key === 'S') {
                setGizmoTool('scale');
            } else if (e.code === 'Space') {
                e.preventDefault();
                toggleCyclePlay();
            }
        });
    }

    function setGizmoTool(tool) {
        state.activeGizmoTool = tool;
        const btnR = document.getElementById('btnGizmoToolRotate');
        const btnS = document.getElementById('btnGizmoToolScale');
        if (btnR) btnR.classList.toggle('active', tool === 'rotate');
        if (btnS) btnS.classList.toggle('active', tool === 'scale');

        document.querySelectorAll('.gizmo-handle-group').forEach(g => {
            g.classList.toggle('mode-scale', tool === 'scale');
            const dot = g.querySelector('.gizmo-dot');
            if (dot) dot.setAttribute('rx', tool === 'scale' ? '1' : '5');
        });

        showNotification(tool === 'scale' ? '📏 Đã kích hoạt chế độ Co Giãn (Scale X/Y)' : '🔄 Đã kích hoạt chế độ Xoay (Rotate)');
    }

    function setPuppetZoom(val) {
        state.zoom = Math.max(0.4, Math.min(2.5, val));
        const svg = document.getElementById('actionPuppetSvg');
        if (svg) {
            svg.style.transform = `scale(${state.zoom})`;
            svg.style.transformOrigin = '50% 50%';
        }
    }

    function fitPuppetToViewport() {
        const viewport = document.getElementById('actionStageViewport');
        const svg = document.getElementById('actionPuppetSvg');
        if (!viewport || !svg) return;

        const vpH = viewport.clientHeight - 60;
        const scale = Math.max(0.5, Math.min(1.2, vpH / 1000));
        setPuppetZoom(scale);
    }

    function formatMs(ms) {
        const sec = (ms / 1000).toFixed(2);
        return `${sec}s`;
    }

    function escapeHtml(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function showNotification(msg) {
        let toast = document.getElementById('actionStudioToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'actionStudioToast';
            toast.className = 'action-studio-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initActionStudio);
    } else {
        initActionStudio();
    }

})();

import os
import io
import re
import json
import math
import time
import uuid
import base64
import zipfile
import unicodedata
import cv2
import numpy as np
from PIL import Image
from core.psd_exporter import sanitize_filename


# ==============================================================================
# CHUẨN HÓA 17 TÊN BỘ PHẬN THEO HỆ THỐNG "FUNNY ANIMATION ASSISTANT"
# (Khớp 100% với D:\Funny Animation Assistant\src\constants\recommendedNames.ts)
# ==============================================================================
ROLE_TO_FUNNY_NAME = {
    "body": "Body",
    "head": "Head",
    "expression": "Expression",
    "face": "Face",
    "hair": "Hair",
    "arm_left": "Left Arm",
    "arm_right": "Right Arm",
    "arm_upper_left": "Left Upper Arm",
    "arm_lower_left": "Left Lower Arm",
    "arm_upper_right": "Right Upper Arm",
    "arm_lower_right": "Right Lower Arm",
    "leg_left": "Left Leg",
    "leg_right": "Right Leg",
    "leg_thigh_left": "Left Thigh",
    "leg_calf_left": "Left Calf",
    "leg_thigh_right": "Right Thigh",
    "leg_calf_right": "Right Calf",
    "leg_upper_left": "Left Thigh",
    "leg_lower_left": "Left Calf",
    "leg_upper_right": "Right Thigh",
    "leg_lower_right": "Right Calf",
}

FUNNY_NAME_TO_ROLE = {v.lower(): k for k, v in ROLE_TO_FUNNY_NAME.items()}


# ==============================================================================
# DANH MỤC 18 PRESET ANIMATION TỪ "FUNNY ANIMATION ASSISTANT" + TALK / CUSTOM
# (Khớp chính xác thông số Keyframe & EffectTrack của presetAnimationCatalog.ts)
# ==============================================================================
FUNNY_PRESET_CATALOG = {
    # --- 1. NHÓM DI CHUYỂN (LOCOMOTION) ---
    "walk": {
        "id": "preset_walk",
        "name": "Đi bộ (Walk)",
        "name_en": "Walk",
        "category": "locomotion",
        "duration": 800,
        "loopMode": "loop",
        "requiredParts": ["Body", "Left Leg", "Right Leg"],
        "optionalParts": ["Left Arm", "Right Arm", "Head"],
        "tracks": [
            {
                "targetName": "Body",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "y": 0, "easing": "easeInOut"},
                    {"time": 200, "y": -6, "easing": "easeInOut"},
                    {"time": 400, "y": 0, "easing": "easeInOut"},
                    {"time": 600, "y": -6, "easing": "easeInOut"},
                    {"time": 800, "y": 0},
                ],
            },
            {
                "targetName": "Left Leg",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 25, "easing": "easeInOut"},
                    {"time": 400, "rotation": -25, "easing": "easeInOut"},
                    {"time": 800, "rotation": 25},
                ],
            },
            {
                "targetName": "Right Leg",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": -25, "easing": "easeInOut"},
                    {"time": 400, "rotation": 25, "easing": "easeInOut"},
                    {"time": 800, "rotation": -25},
                ],
            },
            {
                "targetName": "Left Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": -18, "easing": "easeInOut"},
                    {"time": 400, "rotation": 18, "easing": "easeInOut"},
                    {"time": 800, "rotation": -18},
                ],
            },
            {
                "targetName": "Right Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 18, "easing": "easeInOut"},
                    {"time": 400, "rotation": -18, "easing": "easeInOut"},
                    {"time": 800, "rotation": 18},
                ],
            },
            {
                "targetName": "Head",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "y": 0, "easing": "easeInOut"},
                    {"time": 200, "y": -3, "easing": "easeInOut"},
                    {"time": 400, "y": 0, "easing": "easeInOut"},
                    {"time": 600, "y": -3, "easing": "easeInOut"},
                    {"time": 800, "y": 0},
                ],
            },
        ],
    },
    "run": {
        "id": "preset_run",
        "name": "Chạy (Run)",
        "name_en": "Run",
        "category": "locomotion",
        "duration": 500,
        "loopMode": "loop",
        "requiredParts": ["Body", "Left Leg", "Right Leg"],
        "optionalParts": ["Left Arm", "Right Arm", "Head"],
        "tracks": [
            {
                "targetName": "Body",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "y": 0, "rotation": 8, "easing": "easeInOut"},
                    {"time": 125, "y": -14, "rotation": 8, "easing": "easeInOut"},
                    {"time": 250, "y": 0, "rotation": 8, "easing": "easeInOut"},
                    {"time": 375, "y": -14, "rotation": 8, "easing": "easeInOut"},
                    {"time": 500, "y": 0, "rotation": 8},
                ],
            },
            {
                "targetName": "Left Leg",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 42, "easing": "easeInOut"},
                    {"time": 250, "rotation": -42, "easing": "easeInOut"},
                    {"time": 500, "rotation": 42},
                ],
            },
            {
                "targetName": "Right Leg",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": -42, "easing": "easeInOut"},
                    {"time": 250, "rotation": 42, "easing": "easeInOut"},
                    {"time": 500, "rotation": -42},
                ],
            },
            {
                "targetName": "Left Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": -38, "easing": "easeInOut"},
                    {"time": 250, "rotation": 38, "easing": "easeInOut"},
                    {"time": 500, "rotation": -38},
                ],
            },
            {
                "targetName": "Right Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 38, "easing": "easeInOut"},
                    {"time": 250, "rotation": -38, "easing": "easeInOut"},
                    {"time": 500, "rotation": 38},
                ],
            },
            {
                "targetName": "Head",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "y": 0, "rotation": 4, "easing": "easeInOut"},
                    {"time": 125, "y": -5, "rotation": 4, "easing": "easeInOut"},
                    {"time": 250, "y": 0, "rotation": 4, "easing": "easeInOut"},
                    {"time": 375, "y": -5, "rotation": 4, "easing": "easeInOut"},
                    {"time": 500, "y": 0, "rotation": 4},
                ],
            },
        ],
    },
    "walk_detailed": {
        "id": "preset_walk_detailed",
        "name": "Đi bộ 2 khớp (Walk Detailed)",
        "name_en": "Walk (Detailed)",
        "category": "locomotion",
        "duration": 800,
        "loopMode": "loop",
        "requiredParts": ["Body", "Left Thigh", "Left Calf", "Right Thigh", "Right Calf"],
        "optionalParts": ["Left Upper Arm", "Left Lower Arm", "Right Upper Arm", "Right Lower Arm", "Head"],
        "tracks": [
            {
                "targetName": "Body",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "y": 0, "easing": "easeInOut"},
                    {"time": 200, "y": -6, "easing": "easeInOut"},
                    {"time": 400, "y": 0, "easing": "easeInOut"},
                    {"time": 600, "y": -6, "easing": "easeInOut"},
                    {"time": 800, "y": 0},
                ],
            },
            {
                "targetName": "Left Thigh",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 22, "easing": "easeInOut"},
                    {"time": 200, "rotation": 5, "easing": "easeInOut"},
                    {"time": 400, "rotation": -20, "easing": "easeInOut"},
                    {"time": 600, "rotation": 0, "easing": "easeInOut"},
                    {"time": 800, "rotation": 22},
                ],
            },
            {
                "targetName": "Left Calf",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": -5, "easing": "easeInOut"},
                    {"time": 200, "rotation": -30, "easing": "easeInOut"},
                    {"time": 400, "rotation": -8, "easing": "easeInOut"},
                    {"time": 600, "rotation": 0, "easing": "easeInOut"},
                    {"time": 800, "rotation": -5},
                ],
            },
            {
                "targetName": "Right Thigh",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": -20, "easing": "easeInOut"},
                    {"time": 200, "rotation": 0, "easing": "easeInOut"},
                    {"time": 400, "rotation": 22, "easing": "easeInOut"},
                    {"time": 600, "rotation": 5, "easing": "easeInOut"},
                    {"time": 800, "rotation": -20},
                ],
            },
            {
                "targetName": "Right Calf",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": -8, "easing": "easeInOut"},
                    {"time": 200, "rotation": 0, "easing": "easeInOut"},
                    {"time": 400, "rotation": -5, "easing": "easeInOut"},
                    {"time": 600, "rotation": -30, "easing": "easeInOut"},
                    {"time": 800, "rotation": -8},
                ],
            },
            {
                "targetName": "Left Upper Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": -15, "easing": "easeInOut"},
                    {"time": 400, "rotation": 15, "easing": "easeInOut"},
                    {"time": 800, "rotation": -15},
                ],
            },
            {
                "targetName": "Left Lower Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": -10, "easing": "easeInOut"},
                    {"time": 400, "rotation": -25, "easing": "easeInOut"},
                    {"time": 800, "rotation": -10},
                ],
            },
            {
                "targetName": "Right Upper Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 15, "easing": "easeInOut"},
                    {"time": 400, "rotation": -15, "easing": "easeInOut"},
                    {"time": 800, "rotation": 15},
                ],
            },
            {
                "targetName": "Right Lower Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": -25, "easing": "easeInOut"},
                    {"time": 400, "rotation": -10, "easing": "easeInOut"},
                    {"time": 800, "rotation": -25},
                ],
            },
            {
                "targetName": "Head",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "y": 0, "easing": "easeInOut"},
                    {"time": 200, "y": -3, "easing": "easeInOut"},
                    {"time": 400, "y": 0, "easing": "easeInOut"},
                    {"time": 600, "y": -3, "easing": "easeInOut"},
                    {"time": 800, "y": 0},
                ],
            },
        ],
    },
    "run_detailed": {
        "id": "preset_run_detailed",
        "name": "Chạy 2 khớp (Run Detailed)",
        "name_en": "Run (Detailed)",
        "category": "locomotion",
        "duration": 500,
        "loopMode": "loop",
        "requiredParts": ["Body", "Left Thigh", "Left Calf", "Right Thigh", "Right Calf"],
        "optionalParts": ["Left Upper Arm", "Left Lower Arm", "Right Upper Arm", "Right Lower Arm", "Head"],
        "tracks": [
            {
                "targetName": "Body",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "y": 0, "rotation": 8, "easing": "easeInOut"},
                    {"time": 125, "y": -14, "rotation": 8, "easing": "easeInOut"},
                    {"time": 250, "y": 0, "rotation": 8, "easing": "easeInOut"},
                    {"time": 375, "y": -14, "rotation": 8, "easing": "easeInOut"},
                    {"time": 500, "y": 0, "rotation": 8},
                ],
            },
            {
                "targetName": "Left Thigh",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 38, "easing": "easeInOut"},
                    {"time": 125, "rotation": 10, "easing": "easeInOut"},
                    {"time": 250, "rotation": -35, "easing": "easeInOut"},
                    {"time": 375, "rotation": 5, "easing": "easeInOut"},
                    {"time": 500, "rotation": 38},
                ],
            },
            {
                "targetName": "Left Calf",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": -10, "easing": "easeInOut"},
                    {"time": 125, "rotation": -55, "easing": "easeInOut"},
                    {"time": 250, "rotation": -15, "easing": "easeInOut"},
                    {"time": 375, "rotation": 0, "easing": "easeInOut"},
                    {"time": 500, "rotation": -10},
                ],
            },
            {
                "targetName": "Right Thigh",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": -35, "easing": "easeInOut"},
                    {"time": 125, "rotation": 5, "easing": "easeInOut"},
                    {"time": 250, "rotation": 38, "easing": "easeInOut"},
                    {"time": 375, "rotation": 10, "easing": "easeInOut"},
                    {"time": 500, "rotation": -35},
                ],
            },
            {
                "targetName": "Right Calf",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": -15, "easing": "easeInOut"},
                    {"time": 125, "rotation": 0, "easing": "easeInOut"},
                    {"time": 250, "rotation": -10, "easing": "easeInOut"},
                    {"time": 375, "rotation": -55, "easing": "easeInOut"},
                    {"time": 500, "rotation": -15},
                ],
            },
            {
                "targetName": "Left Upper Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": -32, "easing": "easeInOut"},
                    {"time": 250, "rotation": 32, "easing": "easeInOut"},
                    {"time": 500, "rotation": -32},
                ],
            },
            {
                "targetName": "Left Lower Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": -20, "easing": "easeInOut"},
                    {"time": 250, "rotation": -45, "easing": "easeInOut"},
                    {"time": 500, "rotation": -20},
                ],
            },
            {
                "targetName": "Right Upper Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 32, "easing": "easeInOut"},
                    {"time": 250, "rotation": -32, "easing": "easeInOut"},
                    {"time": 500, "rotation": 32},
                ],
            },
            {
                "targetName": "Right Lower Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": -45, "easing": "easeInOut"},
                    {"time": 250, "rotation": -20, "easing": "easeInOut"},
                    {"time": 500, "rotation": -45},
                ],
            },
            {
                "targetName": "Head",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "y": 0, "rotation": 4, "easing": "easeInOut"},
                    {"time": 125, "y": -5, "rotation": 4, "easing": "easeInOut"},
                    {"time": 250, "y": 0, "rotation": 4, "easing": "easeInOut"},
                    {"time": 375, "y": -5, "rotation": 4, "easing": "easeInOut"},
                    {"time": 500, "y": 0, "rotation": 4},
                ],
            },
        ],
    },
    # --- 2. NHÓM CỬ CHỈ (GESTURE) ---
    "wave": {
        "id": "preset_wave_right",
        "name": "Vẫy tay phải (Wave Right)",
        "name_en": "Wave Right Hand",
        "category": "gesture",
        "duration": 1200,
        "loopMode": "loop",
        "requiredParts": ["Right Arm"],
        "optionalParts": ["Body", "Head"],
        "tracks": [
            {
                "targetName": "Right Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "easing": "easeOut"},
                    {"time": 250, "rotation": -120, "easing": "easeInOut"},
                    {"time": 450, "rotation": -95, "easing": "easeInOut"},
                    {"time": 650, "rotation": -125, "easing": "easeInOut"},
                    {"time": 850, "rotation": -95, "easing": "easeInOut"},
                    {"time": 1000, "rotation": -115, "easing": "easeIn"},
                    {"time": 1200, "rotation": 0},
                ],
            },
            {
                "targetName": "Body",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "easing": "easeInOut"},
                    {"time": 250, "rotation": -2, "easing": "easeInOut"},
                    {"time": 650, "rotation": -3, "easing": "easeInOut"},
                    {"time": 1200, "rotation": 0},
                ],
            },
            {
                "targetName": "Head",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "easing": "easeInOut"},
                    {"time": 300, "rotation": 5, "easing": "easeInOut"},
                    {"time": 700, "rotation": 3, "easing": "easeInOut"},
                    {"time": 1200, "rotation": 0},
                ],
            },
        ],
    },
    "wave_left": {
        "id": "preset_wave_left",
        "name": "Vẫy tay trái (Wave Left)",
        "name_en": "Wave Left Hand",
        "category": "gesture",
        "duration": 1200,
        "loopMode": "loop",
        "requiredParts": ["Left Arm"],
        "optionalParts": ["Body", "Head"],
        "tracks": [
            {
                "targetName": "Left Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "easing": "easeOut"},
                    {"time": 250, "rotation": 120, "easing": "easeInOut"},
                    {"time": 450, "rotation": 95, "easing": "easeInOut"},
                    {"time": 650, "rotation": 125, "easing": "easeInOut"},
                    {"time": 850, "rotation": 95, "easing": "easeInOut"},
                    {"time": 1000, "rotation": 115, "easing": "easeIn"},
                    {"time": 1200, "rotation": 0},
                ],
            },
            {
                "targetName": "Body",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "easing": "easeInOut"},
                    {"time": 250, "rotation": 2, "easing": "easeInOut"},
                    {"time": 650, "rotation": 3, "easing": "easeInOut"},
                    {"time": 1200, "rotation": 0},
                ],
            },
            {
                "targetName": "Head",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "easing": "easeInOut"},
                    {"time": 300, "rotation": -5, "easing": "easeInOut"},
                    {"time": 700, "rotation": -3, "easing": "easeInOut"},
                    {"time": 1200, "rotation": 0},
                ],
            },
        ],
    },
    "point_right": {
        "id": "preset_point_right",
        "name": "Chỉ tay phải (Point Right)",
        "name_en": "Point Right Hand",
        "category": "gesture",
        "duration": 600,
        "loopMode": "forwards",
        "requiredParts": ["Right Arm"],
        "optionalParts": ["Body", "Head"],
        "tracks": [
            {
                "targetName": "Right Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "easing": "easeOut"},
                    {"time": 350, "rotation": -95, "easing": "easeInOut"},
                    {"time": 600, "rotation": -85},
                ],
            },
            {
                "targetName": "Body",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "easing": "easeOut"},
                    {"time": 600, "rotation": -2},
                ],
            },
            {
                "targetName": "Head",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "easing": "easeOut"},
                    {"time": 600, "rotation": 3},
                ],
            },
        ],
    },
    "hands_up": {
        "id": "preset_hands_up",
        "name": "Giơ 2 tay欢呼 (Raise Hands)",
        "name_en": "Raise Both Hands",
        "category": "gesture",
        "duration": 800,
        "loopMode": "forwards",
        "requiredParts": ["Left Arm", "Right Arm"],
        "optionalParts": ["Body", "Head"],
        "tracks": [
            {
                "targetName": "Left Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "easing": "easeOut"},
                    {"time": 500, "rotation": 150, "easing": "easeInOut"},
                    {"time": 800, "rotation": 140},
                ],
            },
            {
                "targetName": "Right Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "easing": "easeOut"},
                    {"time": 500, "rotation": -150, "easing": "easeInOut"},
                    {"time": 800, "rotation": -140},
                ],
            },
            {
                "targetName": "Body",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "y": 0, "easing": "easeOut"},
                    {"time": 500, "y": -8, "easing": "easeInOut"},
                    {"time": 800, "y": -4},
                ],
            },
            {
                "targetName": "Head",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "y": 0, "easing": "easeOut"},
                    {"time": 500, "y": -5, "easing": "easeInOut"},
                    {"time": 800, "y": -3},
                ],
            },
        ],
    },
    "nod": {
        "id": "preset_nod",
        "name": "Gật đầu (Nod)",
        "name_en": "Nod",
        "category": "gesture",
        "duration": 800,
        "loopMode": "loop",
        "requiredParts": ["Head"],
        "optionalParts": [],
        "tracks": [
            {
                "targetName": "Head",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "y": 0, "rotation": 0, "easing": "easeInOut"},
                    {"time": 200, "y": 8, "rotation": 8, "easing": "easeInOut"},
                    {"time": 400, "y": -2, "rotation": -2, "easing": "easeInOut"},
                    {"time": 600, "y": 6, "rotation": 6, "easing": "easeInOut"},
                    {"time": 800, "y": 0, "rotation": 0},
                ],
            },
        ],
    },
    "shake_head": {
        "id": "preset_shake_head",
        "name": "Lắc đầu (Shake Head)",
        "name_en": "Shake Head",
        "category": "gesture",
        "duration": 800,
        "loopMode": "loop",
        "requiredParts": ["Head"],
        "optionalParts": [],
        "tracks": [
            {
                "targetName": "Head",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "x": 0, "rotation": 0, "easing": "easeInOut"},
                    {"time": 160, "x": -10, "rotation": -6, "easing": "easeInOut"},
                    {"time": 360, "x": 10, "rotation": 6, "easing": "easeInOut"},
                    {"time": 560, "x": -8, "rotation": -4, "easing": "easeInOut"},
                    {"time": 700, "x": 6, "rotation": 3, "easing": "easeInOut"},
                    {"time": 800, "x": 0, "rotation": 0},
                ],
            },
        ],
    },
    "bow": {
        "id": "preset_bow",
        "name": "Cúi chào (Bow)",
        "name_en": "Bow",
        "category": "gesture",
        "duration": 1200,
        "loopMode": "loop",
        "requiredParts": ["Body", "Head"],
        "optionalParts": ["Left Arm", "Right Arm"],
        "tracks": [
            {
                "targetName": "Body",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "y": 0, "easing": "easeInOut"},
                    {"time": 400, "rotation": 25, "y": 12, "easing": "easeInOut"},
                    {"time": 800, "rotation": 25, "y": 12, "easing": "easeInOut"},
                    {"time": 1200, "rotation": 0, "y": 0},
                ],
            },
            {
                "targetName": "Head",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "y": 0, "easing": "easeInOut"},
                    {"time": 400, "rotation": 35, "y": 18, "easing": "easeInOut"},
                    {"time": 800, "rotation": 35, "y": 18, "easing": "easeInOut"},
                    {"time": 1200, "rotation": 0, "y": 0},
                ],
            },
            {
                "targetName": "Left Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "easing": "easeInOut"},
                    {"time": 400, "rotation": 15, "easing": "easeInOut"},
                    {"time": 800, "rotation": 15, "easing": "easeInOut"},
                    {"time": 1200, "rotation": 0},
                ],
            },
            {
                "targetName": "Right Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "easing": "easeInOut"},
                    {"time": 400, "rotation": -15, "easing": "easeInOut"},
                    {"time": 800, "rotation": -15, "easing": "easeInOut"},
                    {"time": 1200, "rotation": 0},
                ],
            },
        ],
    },
    "jump": {
        "id": "preset_jump",
        "name": "Nhảy lên (Jump)",
        "name_en": "Jump",
        "category": "gesture",
        "duration": 900,
        "loopMode": "loop",
        "requiredParts": ["Body"],
        "optionalParts": ["Left Leg", "Right Leg", "Left Arm", "Right Arm", "Head"],
        "tracks": [
            {
                "targetName": "Body",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "y": 0, "scaleY": 1, "easing": "easeIn"},
                    {"time": 180, "y": 14, "scaleY": 0.92, "easing": "easeOut"},
                    {"time": 450, "y": -60, "scaleY": 1.06, "easing": "easeIn"},
                    {"time": 720, "y": 10, "scaleY": 0.94, "easing": "easeOut"},
                    {"time": 900, "y": 0, "scaleY": 1},
                ],
            },
            {
                "targetName": "Left Leg",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "easing": "easeIn"},
                    {"time": 180, "rotation": 15, "easing": "easeOut"},
                    {"time": 450, "rotation": -20, "easing": "easeIn"},
                    {"time": 720, "rotation": 10, "easing": "easeOut"},
                    {"time": 900, "rotation": 0},
                ],
            },
            {
                "targetName": "Right Leg",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "easing": "easeIn"},
                    {"time": 180, "rotation": -15, "easing": "easeOut"},
                    {"time": 450, "rotation": 20, "easing": "easeIn"},
                    {"time": 720, "rotation": -10, "easing": "easeOut"},
                    {"time": 900, "rotation": 0},
                ],
            },
            {
                "targetName": "Left Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "easing": "easeOut"},
                    {"time": 180, "rotation": -20, "easing": "easeOut"},
                    {"time": 450, "rotation": 130, "easing": "easeIn"},
                    {"time": 720, "rotation": 15, "easing": "easeOut"},
                    {"time": 900, "rotation": 0},
                ],
            },
            {
                "targetName": "Right Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "easing": "easeOut"},
                    {"time": 180, "rotation": 20, "easing": "easeOut"},
                    {"time": 450, "rotation": -130, "easing": "easeIn"},
                    {"time": 720, "rotation": -15, "easing": "easeOut"},
                    {"time": 900, "rotation": 0},
                ],
            },
            {
                "targetName": "Head",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "y": 0, "easing": "easeIn"},
                    {"time": 180, "y": 8, "easing": "easeOut"},
                    {"time": 450, "y": -65, "easing": "easeIn"},
                    {"time": 720, "y": 6, "easing": "easeOut"},
                    {"time": 900, "y": 0},
                ],
            },
        ],
    },
    # --- 3. NHÓM TRẠNG THÁI NGHỈ (IDLE) ---
    "idle": {
        "id": "preset_breathe",
        "name": "Đứng thở (Breathe)",
        "name_en": "Breathe",
        "category": "idle",
        "duration": 2000,
        "loopMode": "loop",
        "requiredParts": ["Body"],
        "optionalParts": ["Head"],
        "tracks": [
            {
                "targetName": "Body",
                "type": "effect",
                "effect": {
                    "type": "breathe",
                    "intensity": 0.025,
                    "speed": 1,
                },
            },
            {
                "targetName": "Head",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "y": 0, "easing": "easeInOut"},
                    {"time": 1000, "y": -2, "easing": "easeInOut"},
                    {"time": 2000, "y": 0},
                ],
            },
        ],
    },
    "float": {
        "id": "preset_float",
        "name": "Lơ lửng (Float)",
        "name_en": "Float",
        "category": "idle",
        "duration": 2000,
        "loopMode": "loop",
        "requiredParts": ["Body"],
        "optionalParts": ["Left Arm", "Right Arm"],
        "tracks": [
            {
                "targetName": "Body",
                "type": "effect",
                "effect": {
                    "type": "float",
                    "amplitude": 8,
                    "speed": 1,
                },
            },
            {
                "targetName": "Left Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": -5, "easing": "easeInOut"},
                    {"time": 1000, "rotation": 5, "easing": "easeInOut"},
                    {"time": 2000, "rotation": -5},
                ],
            },
            {
                "targetName": "Right Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 5, "easing": "easeInOut"},
                    {"time": 1000, "rotation": -5, "easing": "easeInOut"},
                    {"time": 2000, "rotation": 5},
                ],
            },
        ],
    },
    "head_sway": {
        "id": "preset_sway",
        "name": "Đung đưa (Sway)",
        "name_en": "Sway",
        "category": "idle",
        "duration": 2400,
        "loopMode": "loop",
        "requiredParts": ["Body"],
        "optionalParts": ["Head"],
        "tracks": [
            {
                "targetName": "Body",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": -3, "x": -4, "easing": "easeInOut"},
                    {"time": 1200, "rotation": 3, "x": 4, "easing": "easeInOut"},
                    {"time": 2400, "rotation": -3, "x": -4},
                ],
            },
            {
                "targetName": "Head",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": -5, "easing": "easeInOut"},
                    {"time": 1200, "rotation": 5, "easing": "easeInOut"},
                    {"time": 2400, "rotation": -5},
                ],
            },
        ],
    },
    # --- 4. NHÓM CẢM XÚC & THOẠI (EMOTION & TALK) ---
    "tremble": {
        "id": "preset_tremble",
        "name": "Run rẩy (Tremble)",
        "name_en": "Tremble",
        "category": "emotion",
        "duration": 300,
        "loopMode": "loop",
        "requiredParts": ["Body"],
        "optionalParts": ["Head", "Left Arm", "Right Arm"],
        "tracks": [
            {
                "targetName": "Body",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "x": -4, "y": 0, "easing": "linear"},
                    {"time": 75, "x": 4, "y": -1, "easing": "linear"},
                    {"time": 150, "x": -3, "y": 1, "easing": "linear"},
                    {"time": 225, "x": 3, "y": 0, "easing": "linear"},
                    {"time": 300, "x": -4, "y": 0},
                ],
            },
            {
                "targetName": "Head",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "x": -5, "rotation": -2, "easing": "linear"},
                    {"time": 75, "x": 5, "rotation": 2, "easing": "linear"},
                    {"time": 150, "x": -4, "rotation": -3, "easing": "linear"},
                    {"time": 225, "x": 4, "rotation": 3, "easing": "linear"},
                    {"time": 300, "x": -5, "rotation": -2},
                ],
            },
            {
                "targetName": "Left Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": -4, "easing": "linear"},
                    {"time": 150, "rotation": 4, "easing": "linear"},
                    {"time": 300, "rotation": -4},
                ],
            },
            {
                "targetName": "Right Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 4, "easing": "linear"},
                    {"time": 150, "rotation": -4, "easing": "linear"},
                    {"time": 300, "rotation": 4},
                ],
            },
        ],
    },
    "shock": {
        "id": "preset_shock",
        "name": "Giật mình (Shock)",
        "name_en": "Shock",
        "category": "emotion",
        "duration": 700,
        "loopMode": "loop",
        "requiredParts": ["Body", "Head"],
        "optionalParts": ["Left Arm", "Right Arm", "Left Leg", "Right Leg"],
        "tracks": [
            {
                "targetName": "Body",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "y": 0, "scaleX": 1, "scaleY": 1, "easing": "easeOut"},
                    {"time": 150, "y": -18, "scaleX": 1.12, "scaleY": 1.12, "easing": "easeInOut"},
                    {"time": 350, "y": 4, "scaleX": 0.96, "scaleY": 0.96, "easing": "easeOut"},
                    {"time": 500, "y": -4, "scaleX": 1.03, "scaleY": 1.03, "easing": "easeInOut"},
                    {"time": 700, "y": 0, "scaleX": 1, "scaleY": 1},
                ],
            },
            {
                "targetName": "Head",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "y": 0, "scaleX": 1, "scaleY": 1, "easing": "easeOut"},
                    {"time": 150, "y": -22, "scaleX": 1.15, "scaleY": 1.15, "easing": "easeInOut"},
                    {"time": 400, "y": 2, "scaleX": 0.97, "scaleY": 0.97, "easing": "easeOut"},
                    {"time": 700, "y": 0, "scaleX": 1, "scaleY": 1},
                ],
            },
            {
                "targetName": "Left Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "easing": "easeOut"},
                    {"time": 150, "rotation": 60, "easing": "easeInOut"},
                    {"time": 500, "rotation": -5, "easing": "easeOut"},
                    {"time": 700, "rotation": 0},
                ],
            },
            {
                "targetName": "Right Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "easing": "easeOut"},
                    {"time": 150, "rotation": -60, "easing": "easeInOut"},
                    {"time": 500, "rotation": 5, "easing": "easeOut"},
                    {"time": 700, "rotation": 0},
                ],
            },
            {
                "targetName": "Left Leg",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "easing": "easeOut"},
                    {"time": 150, "rotation": -12, "easing": "easeInOut"},
                    {"time": 700, "rotation": 0},
                ],
            },
            {
                "targetName": "Right Leg",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "easing": "easeOut"},
                    {"time": 150, "rotation": 12, "easing": "easeInOut"},
                    {"time": 700, "rotation": 0},
                ],
            },
        ],
    },
    "collapsed": {
        "id": "preset_collapsed",
        "name": "Ngã quỵ / Suy sụp (Collapsed)",
        "name_en": "Collapsed",
        "category": "emotion",
        "duration": 900,
        "loopMode": "forwards",
        "requiredParts": ["Body", "Head"],
        "optionalParts": ["Left Arm", "Right Arm", "Left Leg", "Right Leg"],
        "tracks": [
            {
                "targetName": "Body",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "y": 0, "scaleY": 1, "rotation": 0, "easing": "easeIn"},
                    {"time": 500, "y": 35, "scaleY": 0.85, "rotation": 8, "easing": "easeOut"},
                    {"time": 700, "y": 28, "scaleY": 0.9, "rotation": 5, "easing": "easeInOut"},
                    {"time": 900, "y": 30, "scaleY": 0.88, "rotation": 6},
                ],
            },
            {
                "targetName": "Head",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "y": 0, "rotation": 0, "easing": "easeIn"},
                    {"time": 500, "y": 45, "rotation": 20, "easing": "easeOut"},
                    {"time": 900, "y": 40, "rotation": 18},
                ],
            },
            {
                "targetName": "Left Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "y": 0, "easing": "easeIn"},
                    {"time": 500, "rotation": 25, "y": 30, "easing": "easeOut"},
                    {"time": 900, "rotation": 20, "y": 28},
                ],
            },
            {
                "targetName": "Right Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "y": 0, "easing": "easeIn"},
                    {"time": 500, "rotation": -25, "y": 30, "easing": "easeOut"},
                    {"time": 900, "rotation": -20, "y": 28},
                ],
            },
            {
                "targetName": "Left Leg",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "scaleY": 1, "y": 0, "easing": "easeIn"},
                    {"time": 500, "scaleY": 0.75, "y": 15, "easing": "easeOut"},
                    {"time": 900, "scaleY": 0.78, "y": 12},
                ],
            },
            {
                "targetName": "Right Leg",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "scaleY": 1, "y": 0, "easing": "easeIn"},
                    {"time": 500, "scaleY": 0.75, "y": 15, "easing": "easeOut"},
                    {"time": 900, "scaleY": 0.78, "y": 12},
                ],
            },
        ],
    },
    "talk": {
        "id": "preset_talk",
        "name": "Nói chuyện (Talk & Lip-Sync)",
        "name_en": "Talk",
        "category": "emotion",
        "duration": 1200,
        "loopMode": "loop",
        "requiredParts": ["Body", "Head"],
        "optionalParts": ["Left Arm", "Right Arm"],
        "tracks": [
            {
                "targetName": "Body",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "y": 0, "rotation": 0, "easing": "easeInOut"},
                    {"time": 300, "y": -3, "rotation": -1.5, "easing": "easeInOut"},
                    {"time": 600, "y": 0, "rotation": 1.2, "easing": "easeInOut"},
                    {"time": 900, "y": -2.5, "rotation": -1.0, "easing": "easeInOut"},
                    {"time": 1200, "y": 0, "rotation": 0},
                ],
            },
            {
                "targetName": "Head",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "y": 0, "rotation": 0, "easing": "easeInOut"},
                    {"time": 300, "y": 2, "rotation": 4.5, "easing": "easeInOut"},
                    {"time": 600, "y": -2, "rotation": -3.5, "easing": "easeInOut"},
                    {"time": 900, "y": 1.5, "rotation": 3.0, "easing": "easeInOut"},
                    {"time": 1200, "y": 0, "rotation": 0},
                ],
            },
            {
                "targetName": "Left Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "easing": "easeInOut"},
                    {"time": 400, "rotation": 22, "easing": "easeInOut"},
                    {"time": 800, "rotation": 8, "easing": "easeInOut"},
                    {"time": 1200, "rotation": 0},
                ],
            },
            {
                "targetName": "Right Arm",
                "type": "transform",
                "keyframes": [
                    {"time": 0, "rotation": 0, "easing": "easeInOut"},
                    {"time": 400, "rotation": -16, "easing": "easeInOut"},
                    {"time": 800, "rotation": -4, "easing": "easeInOut"},
                    {"time": 1200, "rotation": 0},
                ],
            },
        ],
    },
}

# Ánh xạ bí danh tên preset (giữ tương thích cả id có/không có tiền tố preset_)
PRESET_KEY_ALIASES = {
    "breathe": "idle",
    "preset_breathe": "idle",
    "sway": "head_sway",
    "preset_sway": "head_sway",
    "wave_right": "wave",
    "preset_wave_right": "wave",
    "preset_wave_left": "wave_left",
    "preset_walk": "walk",
    "preset_run": "run",
    "preset_walk_detailed": "walk_detailed",
    "preset_run_detailed": "run_detailed",
    "preset_point_right": "point_right",
    "preset_hands_up": "hands_up",
    "preset_nod": "nod",
    "preset_shake_head": "shake_head",
    "preset_bow": "bow",
    "preset_jump": "jump",
    "preset_float": "float",
    "preset_tremble": "tremble",
    "preset_shock": "shock",
    "preset_collapsed": "collapsed",
    "preset_talk": "talk",
}


def normalize_token(text: str) -> str:
    """Chuyển tên layer tiếng Việt có dấu thành chữ thường không dấu để nhận diện vai trò."""
    if not text:
        return ""
    text = text.replace("đ", "d").replace("Đ", "D")
    norm = unicodedata.normalize("NFD", text)
    clean = "".join(c for c in norm if unicodedata.category(c) != "Mn")
    return clean.lower().strip()


def detect_layer_role(name: str, x: int = 0, y: int = 0, w: int = 100, h: int = 100, canvas_w: int = 1024) -> str:
    """
    Tự động nhận diện vai trò bộ phận từ tên layer trong file PSD (tách theo từ chuẩn xác,
    hỗ trợ đầy đủ 17 chuẩn tên bộ phận của Funny Animation Assistant + tiếng Việt / tiếng Anh / tiếng Trung).
    """
    if not name:
        return "custom"

    # Kiểm tra khớp trực tiếp với 17 chuẩn tên của Funny Animation Assistant
    clean_exact = name.strip().lower()
    if clean_exact in FUNNY_NAME_TO_ROLE:
        return FUNNY_NAME_TO_ROLE[clean_exact]

    # Hỗ trợ một số tên tiếng Trung phổ biến từ Funny Animation Assistant
    zh_map = {
        "身体": "body", "躯干": "body",
        "头": "head", "头部": "head",
        "表情": "expression", "五官": "expression",
        "脸": "face", "脸部": "face",
        "头发": "hair", "发型": "hair",
        "左大臂": "arm_upper_left", "左小臂": "arm_lower_left",
        "右大臂": "arm_upper_right", "右小臂": "arm_lower_right",
        "左臂": "arm_left", "左手": "arm_left",
        "右臂": "arm_right", "右手": "arm_right",
        "左大腿": "leg_thigh_left", "左小腿": "leg_calf_left",
        "右大腿": "leg_thigh_right", "右小腿": "leg_calf_right",
        "左腿": "leg_left", "左脚": "leg_left",
        "右腿": "leg_right", "右脚": "leg_right",
    }
    for zh_k, role_val in zh_map.items():
        if zh_k in name:
            return role_val

    tok = normalize_token(name)
    words = [w_tok for w_tok in re.split(r"[^a-z0-9]+", tok) if w_tok]
    word_set = set(words)

    # 1. Miệng (Mouth)
    if (word_set & {"mieng", "mouth", "moi", "lip", "rang"}) or ("can_rang" in tok) or ("can rang" in tok):
        if (word_set & {"dong", "ong", "ngam", "close", "closed", "normal", "mim"}) or ("binh_thuong" in tok) or ("binh thuong" in tok):
            return "mouth_closed"
        if (word_set & {"vua", "nhep", "half", "mid", "he"}) or ("can_rang" in tok) or ("can rang" in tok):
            return "mouth_half"
        if (word_set & {"to", "mo", "open", "wide", "het"}) or ("cuoi_to" in tok) or ("ngac_nhien" in tok):
            return "mouth_open"
        return "mouth_closed"

    # 2. Biểu cảm tổng hợp (Expression)
    if word_set & {"expression", "bieucam"} or ("bieu_cam" in tok) or ("bieu cam" in tok):
        return "expression"

    # 3. Mắt (Eye) - Lưu ý phân biệt "khuôn mặt" (head/face) với "con mắt" (eye)
    is_face_head = ("khuon_mat" in tok) or ("khuon mat" in tok) or ("guong_mat" in tok) or ("guong mat" in tok)
    if not is_face_head and (word_set & {"mat", "eye", "eyes", "blink", "chop"}):
        if word_set & {"nham", "chop", "close", "closed", "blink", "buon", "ngu"} or ("cuoi_tit" in tok):
            return "eye_closed"
        if (word_set & {"gian", "khoc", "surprised", "surprise", "angry", "extra", "phu", "liem"}) or ("bat_ngo" in tok) or ("bat ngo" in tok) or ("ngac_nhien" in tok):
            return "eye_extra"
        return "eye_open"

    # 4. Phụ kiện đầu / mặt (giọt mồ hôi, lông mày, mũi, kính, tai...)
    if (word_set & {"sweat", "giot", "eyebrow", "mui", "nose", "kinh", "glass", "glasses", "tai", "ear", "blush", "no", "bow", "kem", "kep"}) or any(
        p in tok for p in ["mo_hoi", "mo hoi", "long_may", "long may", "ma_hong", "ma hong", "phu_kien", "phu kien"]
    ):
        return "head_prop"

    # Xác định bên Trái / Phải
    is_left = bool((word_set & {"trai", "left", "t", "l"}) or ("_l" in tok) or ("l_" in tok))
    is_right = bool((word_set & {"phai", "right", "p", "r"}) or ("_r" in tok) or ("r_" in tok))
    center_x = x + w / 2.0

    def pick_side(left_role: str, right_role: str) -> str:
        if is_left and not is_right:
            return left_role
        if is_right and not is_left:
            return right_role
        return left_role if center_x <= (canvas_w / 2.0) else right_role

    # 5. Chân 2 khớp (Đùi / Bắp chân - Thigh / Calf) & Chân nguyên (Leg) - Kiểm tra TRƯỚC Thân
    is_thigh = bool((word_set & {"dui", "thigh", "upperleg"}) or ("bap_dui" in tok) or ("upper_leg" in tok))
    is_calf = bool((word_set & {"calf", "shin", "lowerleg"}) or ("bap_chan" in tok) or ("bap chan" in tok) or ("ong_chan" in tok) or ("ong chan" in tok) or ("lower_leg" in tok))
    if is_thigh:
        return pick_side("leg_thigh_left", "leg_thigh_right")
    if is_calf:
        return pick_side("leg_calf_left", "leg_calf_right")

    if (word_set & {"chan", "leg", "legs", "foot", "feet", "quan", "vay"}) or ("ban_chan" in tok) or ("ban chan" in tok):
        return pick_side("leg_left", "leg_right")

    # 6. Tay 2 khớp (Bắp tay trên / Cẳng tay dưới - Upper Arm / Lower Arm) & Tay nguyên (Arm) - Kiểm tra TRƯỚC Thân
    is_upper_arm = bool((word_set & {"baptay", "upperarm", "bicep"}) or ("bap_tay" in tok) or ("bap tay" in tok) or ("upper_arm" in tok) or ("upper arm" in tok) or ("tay_tren" in tok) or ("tay tren" in tok))
    is_lower_arm = bool((word_set & {"cangtay", "lowerarm", "forearm"}) or ("cang_tay" in tok) or ("cang tay" in tok) or ("lower_arm" in tok) or ("lower arm" in tok) or ("tay_duoi" in tok) or ("tay duoi" in tok))
    if is_upper_arm:
        return pick_side("arm_upper_left", "arm_upper_right")
    if is_lower_arm:
        return pick_side("arm_lower_left", "arm_lower_right")

    if (word_set & {"tay", "arm", "arms", "hand", "hands"}) or ("canh_tay" in tok) or ("canh tay" in tok) or ("ban_tay" in tok):
        return pick_side("arm_left", "arm_right")

    # 7. Tóc / Mũ (Hair / Hat)
    if word_set & {"toc", "hair", "mu", "non", "hat", "bangs", "mai", "bun", "buoc"}:
        return "hair"

    # 8. Khuôn mặt riêng (Face) hoặc Đầu (Head)
    if word_set == {"face"} or ("face_base" in tok):
        return "face"
    if is_face_head or (word_set & {"dau", "head", "face", "au"}):
        return "head"

    # 9. Thân (Body / Torso) - So khớp từ nguyên vẹn ("than", "ao", "nguc", "bung", "body", "torso")
    if (word_set & {"than", "body", "torso", "ao", "nguc", "bung", "shirt", "chest", "co", "vai", "lung", "dam"}) or ("co_the" in tok) or ("co the" in tok):
        return "body"

    return "custom"


def get_default_pivot_for_role(role: str, w: int, h: int) -> tuple:
    """
    Trả về tọa độ điểm neo (pivot_x, pivot_y) tính theo pixel bên trong layer (0..w, 0..h)
    sao cho phù hợp nhất với khớp chuyển động tự nhiên của từng bộ phận.
    """
    w = max(1, int(w))
    h = max(1, int(h))

    if role in ("head", "face"):
        # Đầu xoay quanh khớp cổ (ở chính giữa cạnh dưới của đầu)
        return (round(w * 0.5), round(h * 0.88))
    elif role == "body":
        # Thân nhún/nghiêng quanh phần hông/eo dưới
        return (round(w * 0.5), round(h * 0.82))
    elif role in ("arm_left", "arm_upper_left"):
        # Cánh tay / Bắp tay ở bên trái màn hình: khớp vai nằm ở góc trên bên phải
        return (round(w * 0.72), round(h * 0.14))
    elif role == "arm_lower_left":
        # Cẳng tay dưới bên trái: khớp khuỷu tay nằm ở phía trên
        return (round(w * 0.62), round(h * 0.12))
    elif role in ("arm_right", "arm_upper_right"):
        # Cánh tay / Bắp tay ở bên phải màn hình: khớp vai nằm ở góc trên bên trái
        return (round(w * 0.28), round(h * 0.14))
    elif role == "arm_lower_right":
        # Cẳng tay dưới bên phải: khớp khuỷu tay nằm ở phía trên
        return (round(w * 0.38), round(h * 0.12))
    elif role in ("leg_left", "leg_right", "leg_thigh_left", "leg_thigh_right", "leg_calf_left", "leg_calf_right"):
        # Chân / Đùi / Bắp chân xoay quanh khớp hông hoặc đầu gối (chính giữa phía trên)
        return (round(w * 0.5), round(h * 0.12))
    elif role == "hair":
        # Tóc gắn quanh đỉnh đầu
        return (round(w * 0.5), round(h * 0.25))
    elif role in ("expression", "eye_open", "eye_closed", "eye_extra", "mouth_closed", "mouth_half", "mouth_open", "mouth_extra", "head_prop"):
        # Biểu cảm, mắt, miệng co giãn/xoay quanh chính giữa tâm bộ phận
        return (round(w * 0.5), round(h * 0.5))
    else:
        return (round(w * 0.5), round(h * 0.5))


def compute_spacious_stage_for_layers(raw_layers: list, psd_w: int, psd_h: int) -> tuple:
    """
    Mở rộng khung sân khấu (Stage) lớn gấp nhiều lần kích thước khung PSD gốc (vốn thường nhỏ
    hoặc chỉ bao vừa 1 bộ phận), đồng thời căn giữa toàn bộ các layer vào giữa sân khấu rộng rãi.
    """
    if not raw_layers:
        stage_w = max(1800, int(psd_w or 1024) * 2)
        stage_h = max(1400, int(psd_h or 765) * 2)
        return [], stage_w, stage_h

    min_x = min(int(l.get("x", 0)) for l in raw_layers)
    min_y = min(int(l.get("y", 0)) for l in raw_layers)
    max_x = max(int(l.get("x", 0)) + max(1, int(l.get("w", 100))) for l in raw_layers)
    max_y = max(int(l.get("y", 0)) + max(1, int(l.get("h", 100))) for l in raw_layers)

    bbox_w = max(100, max_x - min_x)
    bbox_h = max(100, max_y - min_y)

    max_part_w = max(max(1, int(l.get("w", 100))) for l in raw_layers)
    max_part_h = max(max(1, int(l.get("h", 100))) for l in raw_layers)
    sum_part_h = sum(max(1, int(l.get("h", 100))) for l in raw_layers)

    stage_w = max(2000, int(psd_w) * 3, int(bbox_w * 3.5), int(max_part_w * 6))
    stage_h = max(1600, int(psd_h) * 3, int(bbox_h * 3.5), int(max_part_h * 5), min(3200, int(sum_part_h * 1.4)))

    if stage_w % 2 != 0:
        stage_w += 1
    if stage_h % 2 != 0:
        stage_h += 1

    shift_x = int(round((stage_w - bbox_w) / 2.0 - min_x))
    shift_y = int(round((stage_h - bbox_h) / 2.0 - min_y))

    centered_layers = []
    for l in raw_layers:
        item = dict(l)
        orig_x = int(item.get("x", 0)) + shift_x
        orig_y = int(item.get("y", 0)) + shift_y
        item["x"] = orig_x
        item["y"] = orig_y
        if "pos_x" in item:
            item["pos_x"] = float(item["pos_x"]) + shift_x
        else:
            item["pos_x"] = float(orig_x)
        if "pos_y" in item:
            item["pos_y"] = float(item["pos_y"]) + shift_y
        else:
            item["pos_y"] = float(orig_y)
        centered_layers.append(item)

    enriched = enrich_layers_with_rig_defaults(centered_layers, stage_w, stage_h)
    return enriched, stage_w, stage_h


def enrich_layers_with_rig_defaults(raw_layers: list, canvas_w: int, canvas_h: int) -> list:
    """
    Bổ sung đầy đủ thông số Rigging (role, funny_name, pivot_x, pivot_y, parent_id, pos_x, pos_y, motion)
    cho danh sách layer được nạp từ file PSD.
    """
    enriched = []
    for idx, lyr in enumerate(raw_layers):
        w = int(lyr.get("w", 100))
        h = int(lyr.get("h", 100))
        x = int(lyr.get("x", 0))
        y = int(lyr.get("y", 0))
        role = lyr.get("role") or detect_layer_role(lyr.get("name", ""), x, y, w, h, canvas_w)
        px, py = get_default_pivot_for_role(role, w, h)

        item = {
            "id": int(lyr["id"]),
            "name": lyr.get("name", f"Layer_{idx + 1}"),
            "x": x,
            "y": y,
            "pos_x": float(lyr.get("pos_x", x)),
            "pos_y": float(lyr.get("pos_y", y)),
            "w": w,
            "h": h,
            "role": role,
            "funny_name": ROLE_TO_FUNNY_NAME.get(role, ""),
            "pivot_x": float(lyr.get("pivot_x", px)),
            "pivot_y": float(lyr.get("pivot_y", py)),
            "parent_id": lyr.get("parent_id", None),
            "visible": bool(lyr.get("visible", True)),
            "opacity": int(lyr.get("opacity", 255)),
            "z_index": int(lyr.get("z_index", idx)),
            "image": lyr["image"],
            "motion": lyr.get("motion") or {
                "base_rot": 0.0,
                "swing_rot": 0.0,
                "speed_mult": 1.0,
                "phase_deg": 0.0,
                "move_x": 0.0,
                "move_y": 0.0,
                "scale_x": 1.0,
                "scale_y": 1.0
            }
        }
        enriched.append(item)

    # Tự động liên kết khớp Cha - Con (Hierarchy) hỗ trợ cả tay/chân 1 khớp và 2 khớp:
    body_id = next((l["id"] for l in enriched if l["role"] == "body"), None)
    head_id = next((l["id"] for l in enriched if l["role"] == "head"), None)
    upper_arm_l_id = next((l["id"] for l in enriched if l["role"] == "arm_upper_left"), None)
    upper_arm_r_id = next((l["id"] for l in enriched if l["role"] == "arm_upper_right"), None)
    thigh_l_id = next((l["id"] for l in enriched if l["role"] == "leg_thigh_left"), None)
    thigh_r_id = next((l["id"] for l in enriched if l["role"] == "leg_thigh_right"), None)

    for l in enriched:
        role = l["role"]
        if l["parent_id"] is None:
            if role == "arm_lower_left" and (upper_arm_l_id or body_id):
                l["parent_id"] = upper_arm_l_id or body_id
            elif role == "arm_lower_right" and (upper_arm_r_id or body_id):
                l["parent_id"] = upper_arm_r_id or body_id
            elif role == "leg_calf_left" and (thigh_l_id or body_id):
                l["parent_id"] = thigh_l_id or body_id
            elif role == "leg_calf_right" and (thigh_r_id or body_id):
                l["parent_id"] = thigh_r_id or body_id
            elif role in ("head", "arm_left", "arm_right", "arm_upper_left", "arm_upper_right", "leg_left", "leg_right", "leg_thigh_left", "leg_thigh_right") and body_id and l["id"] != body_id:
                l["parent_id"] = body_id
            elif role in ("face", "expression", "eye_open", "eye_closed", "eye_extra", "mouth_closed", "mouth_half", "mouth_open", "mouth_extra", "hair", "head_prop") and head_id and l["id"] != head_id:
                l["parent_id"] = head_id

    return enriched


def apply_easing(t: float, easing: str = "linear") -> float:
    """Hàm nội suy Easing khớp 100% với AnimationComposition.ts của Funny Animation Assistant."""
    t = max(0.0, min(1.0, float(t)))
    if easing == "easeIn":
        return t * t
    elif easing == "easeOut":
        return t * (2.0 - t)
    elif easing == "easeInOut":
        return 2.0 * t * t if t < 0.5 else -1.0 + (4.0 - 2.0 * t) * t
    return t


def interpolate_prop(keyframes: list, prop: str, local_ms: float, default_val: float) -> float:
    """Nội suy giá trị thuộc tính (x, y, rotation, scaleX, scaleY) trên danh sách Keyframe."""
    pts = [kf for kf in keyframes if prop in kf and kf[prop] is not None]
    if not pts:
        return default_val
    if local_ms <= pts[0]["time"]:
        return float(pts[0][prop])
    if local_ms >= pts[-1]["time"]:
        return float(pts[-1][prop])

    for i in range(len(pts) - 1):
        k0 = pts[i]
        k1 = pts[i + 1]
        t0 = float(k0["time"])
        t1 = float(k1["time"])
        if t0 <= local_ms <= t1:
            span = t1 - t0
            if span <= 1e-6:
                return float(k1[prop])
            raw_p = (local_ms - t0) / span
            eased_p = apply_easing(raw_p, k0.get("easing", "linear"))
            v0 = float(k0[prop])
            v1 = float(k1[prop])
            return v0 + (v1 - v0) * eased_p
    return float(pts[-1][prop])


def resolve_preset_track_for_role(preset_def: dict, role: str) -> list:
    """
    Tìm các Track trong preset_def khớp với role của layer.
    Hỗ trợ đầy đủ cơ chế Fallback 2 chiều của Funny Animation Assistant (presetAnimationMapper.ts):
    - Preset đơn giản (Left Arm / Left Leg) tự động áp dụng cho Upper Arm / Thigh nếu nhân vật chia 2 khớp.
    - Preset chi tiết 2 khớp (Walk Detailed / Run Detailed) tự động áp dụng cho Left Arm / Left Leg nếu nhân vật 1 khớp.
    """
    funny_name = ROLE_TO_FUNNY_NAME.get(role)
    if not funny_name:
        return []

    tracks = preset_def.get("tracks", [])
    direct = [tr for tr in tracks if tr.get("targetName") == funny_name]
    if direct:
        return direct

    # Fallback chiều 1: Nhân vật chia 2 khớp nhưng dùng preset đơn giản (Left Arm -> Left Upper Arm)
    coarse_map = {
        "Left Upper Arm": "Left Arm",
        "Right Upper Arm": "Right Arm",
        "Left Thigh": "Left Leg",
        "Right Thigh": "Right Leg",
    }
    if funny_name in coarse_map:
        fallback_name = coarse_map[funny_name]
        return [tr for tr in tracks if tr.get("targetName") == fallback_name]

    # Fallback chiều 2: Nhân vật 1 khớp nhưng chọn xem preset Detailed (Left Arm <- Left Upper Arm)
    fine_map = {
        "Left Arm": "Left Upper Arm",
        "Right Arm": "Right Upper Arm",
        "Left Leg": "Left Thigh",
        "Right Leg": "Right Thigh",
    }
    if funny_name in fine_map:
        fallback_name = fine_map[funny_name]
        return [tr for tr in tracks if tr.get("targetName") == fallback_name]

    # Fallback chiều 3: Chuyển động phụ tự nhiên cho Cẳng tay (Forearm) & Bắp chân (Calf)
    # khi dùng các Preset 1 khớp (Walk, Run, Wave, Point, Raise Hands, Jump)
    secondary_limb_map = {
        "Left Lower Arm": "Left Arm",
        "Right Lower Arm": "Right Arm",
        "Left Calf": "Left Leg",
        "Right Calf": "Right Leg",
    }
    if funny_name in secondary_limb_map:
        parent_target = secondary_limb_map[funny_name]
        parent_tracks = [tr for tr in tracks if tr.get("targetName") == parent_target and tr.get("type") == "transform"]
        if parent_tracks:
            pid = str(preset_def.get("id", ""))
            is_calf = ("Calf" in funny_name)
            is_wave_or_point = any(k in pid for k in ("wave", "point", "hands"))
            factor = 0.45 if is_wave_or_point else 0.35
            sec_tracks = []
            for pt in parent_tracks:
                sec_kfs = []
                for kf in pt.get("keyframes", []):
                    nkf = dict(kf)
                    nkf.pop("x", None)
                    nkf.pop("y", None)
                    if "rotation" in nkf and nkf["rotation"] is not None:
                        r_val = float(nkf["rotation"])
                        if is_calf:
                            nkf["rotation"] = round(r_val * 0.45 if r_val > 0 else -abs(r_val) * 0.3, 2)
                        else:
                            nkf["rotation"] = round(r_val * factor, 2)
                    sec_kfs.append(nkf)
                sec_tracks.append({
                    "targetName": funny_name,
                    "type": "transform",
                    "keyframes": sec_kfs,
                })
            return sec_tracks

    return []


def make_transform_matrix(px: float, py: float, dx: float, dy: float, rot_deg: float, sx: float, sy: float) -> np.ndarray:
    """
    Tạo ma trận biến đổi 2D đồng nhất 3x3 quanh điểm neo (px, py) trên mặt phẳng sân khấu:
    M = T(px + dx, py + dy) * R(rot_deg) * S(sx, sy) * T(-px, -py)
    """
    rad = math.radians(rot_deg)
    cos_a = math.cos(rad)
    sin_a = math.sin(rad)

    a = cos_a * sx
    b = -sin_a * sy
    c = sin_a * sx
    d = cos_a * sy

    tx = px + dx - (a * px + b * py)
    ty = py + dy - (c * px + d * py)

    return np.array([
        [a, b, tx],
        [c, d, ty],
        [0.0, 0.0, 1.0]
    ], dtype=np.float64)


def compute_layer_local_pose(
    layer: dict,
    t: float,
    anim_cfg: dict,
    active_eye_id: int,
    active_mouth_id: int,
    single_eye_mode: bool,
    single_mouth_mode: bool,
    is_blinking: bool,
    talk_phase: float
) -> dict:
    """
    Tính toán biến đổi cục bộ (dx, dy, rot, sx, sy, visible) cho 1 layer tại thời điểm t (giây).
    Sử dụng trực tiếp hệ thống 18 Preset Keyframe & EffectTrack của Funny Animation Assistant,
    khớp 100% với hàm computeLayerLocalPose trong app.js.
    """
    role = layer.get("role", "custom")
    if not layer.get("visible", True):
        return {"dx": 0.0, "dy": 0.0, "rot": 0.0, "sx": 1.0, "sy": 1.0, "render_visible": False}

    raw_preset = str(anim_cfg.get("preset", "idle"))
    preset = PRESET_KEY_ALIASES.get(raw_preset, raw_preset)
    speed = float(anim_cfg.get("speed", 1.0))
    intensity = float(anim_cfg.get("intensity", 1.0))
    auto_blink = bool(anim_cfg.get("auto_blink", True))
    lip_sync = bool(anim_cfg.get("lip_sync", False)) or (preset == "talk")
    head_sway = bool(anim_cfg.get("head_sway", False))
    sway_amp = float(anim_cfg.get("head_sway_amp", 6.0))

    # Kiểm tra ẩn/hiện tráo đổi layer cho nhóm Mắt và Miệng
    if role in ("eye_open", "eye_closed", "eye_extra"):
        if not single_eye_mode and active_eye_id is not None:
            if layer["id"] != active_eye_id:
                return {"dx": 0.0, "dy": 0.0, "rot": 0.0, "sx": 1.0, "sy": 1.0, "render_visible": False}

    if role in ("mouth_closed", "mouth_half", "mouth_open", "mouth_extra"):
        if not single_mouth_mode and active_mouth_id is not None:
            if layer["id"] != active_mouth_id:
                return {"dx": 0.0, "dy": 0.0, "rot": 0.0, "sx": 1.0, "sy": 1.0, "render_visible": False}

    dx = 0.0
    dy = 0.0
    rot = 0.0
    sx = 1.0
    sy = 1.0

    omega = 2.0 * math.pi * speed
    time_ms = t * 1000.0 * speed

    # 1. Nội suy chuyển động từ Catalog 18 Preset của Funny Animation Assistant
    preset_def = FUNNY_PRESET_CATALOG.get(preset)
    if preset_def and preset != "custom":
        dur_ms = max(1.0, float(preset_def.get("duration", 1000)))
        loop_mode = preset_def.get("loopMode", "loop")
        if loop_mode == "forwards":
            # Khi preview trên sân khấu lặp lại sau mỗi chu kỳ nghỉ ngắn để dễ quan sát, hoặc giữ nguyên ở cuối
            cycle_ms = dur_ms + 500.0
            local_ms = min(dur_ms, time_ms % cycle_ms)
        else:
            local_ms = time_ms % dur_ms

        matched_tracks = resolve_preset_track_for_role(preset_def, role)
        for tr in matched_tracks:
            tr_type = tr.get("type", "transform")
            if tr_type == "transform":
                kfs = tr.get("keyframes", [])
                tx = interpolate_prop(kfs, "x", local_ms, 0.0)
                ty = interpolate_prop(kfs, "y", local_ms, 0.0)
                trot = interpolate_prop(kfs, "rotation", local_ms, 0.0)
                tsx = interpolate_prop(kfs, "scaleX", local_ms, 1.0)
                tsy = interpolate_prop(kfs, "scaleY", local_ms, 1.0)

                dx += tx * intensity
                dy += ty * intensity
                rot += trot * intensity
                sx *= (1.0 + (tsx - 1.0) * intensity)
                sy *= (1.0 + (tsy - 1.0) * intensity)
            elif tr_type == "effect":
                eff = tr.get("effect", {})
                eff_type = eff.get("type", "")
                if eff_type == "breathe":
                    eff_int = float(eff.get("intensity", 0.025)) * intensity
                    eff_spd = float(eff.get("speed", 1.0))
                    wave = math.sin(time_ms * 0.003 * eff_spd)
                    sy *= (1.0 + wave * eff_int)
                    sx *= (1.0 - wave * eff_int * 0.4)
                    dy += wave * 2.5 * intensity
                elif eff_type == "float":
                    amp = float(eff.get("amplitude", 8.0)) * intensity
                    eff_spd = float(eff.get("speed", 1.0))
                    dy += math.sin(time_ms * 0.002 * eff_spd) * amp

    # 2. Hiệu ứng Rung rinh nhẹ đầu cộng thêm (Head Sway Additive)
    if head_sway and preset != "head_sway" and role == "head":
        rot += math.sin(omega * t * 0.9) * sway_amp * intensity

    # 3. Hiệu ứng Chớp mắt khi chỉ có 1 layer mắt (Squash scaleY)
    if auto_blink and single_eye_mode and role in ("eye_open", "expression") and is_blinking:
        sy *= 0.12

    # 4. Hiệu ứng Nhép miệng khi chỉ có 1 layer miệng (ScaleY theo nhịp nói)
    if lip_sync and single_mouth_mode and role in ("mouth_closed", "mouth_half", "mouth_open"):
        sy *= (0.65 + 0.65 * talk_phase)
        sx *= (1.0 - 0.08 * talk_phase)

    # 5. Cộng thêm tinh chỉnh riêng của người dùng cho từng Layer (Per-Layer Motion Customizer)
    m = layer.get("motion") or {}
    base_rot = float(m.get("base_rot", 0.0))
    swing_rot = float(m.get("swing_rot", 0.0))
    speed_mult = float(m.get("speed_mult", 1.0))
    phase_rad = math.radians(float(m.get("phase_deg", 0.0)))
    move_x = float(m.get("move_x", 0.0))
    move_y = float(m.get("move_y", 0.0))
    lyr_scale = float(layer.get("scale", m.get("scale_x", 1.0)))

    custom_wave = math.sin(omega * speed_mult * t + phase_rad)
    rot += base_rot + swing_rot * custom_wave
    dx += move_x * custom_wave
    dy += move_y * custom_wave
    sx *= lyr_scale
    sy *= lyr_scale

    return {
        "dx": dx,
        "dy": dy,
        "rot": rot,
        "sx": sx,
        "sy": sy,
        "render_visible": True
    }


def resolve_facial_states(layers: list, t: float, anim_cfg: dict) -> tuple:
    """
    Tính toán trạng thái chớp mắt & nhép miệng tại thời điểm t:
    Trả về (active_eye_id, active_mouth_id, single_eye_mode, single_mouth_mode, is_blinking, talk_phase)
    """
    auto_blink = bool(anim_cfg.get("auto_blink", True))
    blink_interval = max(0.8, float(anim_cfg.get("blink_interval", 2.8)))
    blink_duration = 0.16

    raw_preset = str(anim_cfg.get("preset", "idle"))
    preset = PRESET_KEY_ALIASES.get(raw_preset, raw_preset)
    lip_sync = bool(anim_cfg.get("lip_sync", False)) or (preset == "talk")
    speed = max(0.2, float(anim_cfg.get("speed", 1.0)))

    cycle_pos = t % blink_interval
    is_blinking = auto_blink and (cycle_pos > (blink_interval - blink_duration))

    talk_phase = 0.0
    if lip_sync:
        phrase_cycle = (t * speed) % 2.4
        if phrase_cycle < 1.7:
            syll_freq = 2.4 * math.pi * speed
            wave = math.sin(syll_freq * t) * 0.7 + math.sin(syll_freq * 0.5 * t) * 0.3
            talk_phase = max(0.0, min(1.0, (wave + 0.15) * 1.3))
        else:
            talk_phase = 0.0

    eye_open_layers = [l for l in layers if l.get("visible", True) and l.get("role") == "eye_open"]
    eye_closed_layers = [l for l in layers if l.get("visible", True) and l.get("role") == "eye_closed"]
    all_eye_layers = eye_open_layers + eye_closed_layers

    single_eye_mode = (len(eye_closed_layers) == 0)
    active_eye_id = None
    if not single_eye_mode and all_eye_layers:
        if is_blinking and eye_closed_layers:
            active_eye_id = eye_closed_layers[0]["id"]
        elif eye_open_layers:
            active_eye_id = eye_open_layers[0]["id"]
        else:
            active_eye_id = all_eye_layers[0]["id"]

    mouth_closed = [l for l in layers if l.get("visible", True) and l.get("role") == "mouth_closed"]
    mouth_half = [l for l in layers if l.get("visible", True) and l.get("role") == "mouth_half"]
    mouth_open = [l for l in layers if l.get("visible", True) and l.get("role") == "mouth_open"]
    all_mouths = mouth_closed + mouth_half + mouth_open

    single_mouth_mode = (len(all_mouths) <= 1)
    active_mouth_id = None
    if not single_mouth_mode and all_mouths:
        if not lip_sync or talk_phase < 0.15:
            target_list = mouth_closed or mouth_half or mouth_open
        elif talk_phase < 0.65:
            target_list = mouth_half or mouth_open or mouth_closed
        else:
            target_list = mouth_open or mouth_half or mouth_closed
        active_mouth_id = target_list[0]["id"]

    return active_eye_id, active_mouth_id, single_eye_mode, single_mouth_mode, is_blinking, talk_phase


def render_animation_frame(layers: list, decoded_images: dict, canvas_w: int, canvas_h: int, t: float, anim_cfg: dict) -> np.ndarray:
    """
    Render một khung hình (Frame) RGBA kích thước (canvas_h, canvas_w, 4) tại thời điểm t (giây).
    Hỗ trợ đầy đủ phân cấp Cha - Con (Parent-Child Bone Hierarchy) và xoay quanh điểm neo Pivot.
    """
    frame_rgba = np.zeros((canvas_h, canvas_w, 4), dtype=np.uint8)

    active_eye_id, active_mouth_id, single_eye_mode, single_mouth_mode, is_blinking, talk_phase = resolve_facial_states(layers, t, anim_cfg)

    layer_map = {l["id"]: l for l in layers}
    local_poses = {}
    local_matrices = {}

    body_layer_id = next((l["id"] for l in layers if l.get("role") == "body"), None)
    for lyr in layers:
        lid = lyr["id"]
        pose = compute_layer_local_pose(
            lyr, t, anim_cfg,
            active_eye_id, active_mouth_id,
            single_eye_mode, single_mouth_mode,
            is_blinking, talk_phase
        )
        local_poses[lid] = pose

    # Khử dịch chuyển/xoay kép trên các khớp con khi đã gắn vào khung xương Cha (Body)
    body_pose = local_poses.get(body_layer_id) if body_layer_id is not None else None
    local_trans_only_matrices = {}
    for lyr in layers:
        lid = lyr["id"]
        pose = local_poses[lid]
        pid = lyr.get("parent_id")
        role = lyr.get("role", "custom")
        if pid and pid in layer_map and pid != lid:
            if role == "head" and pid == body_layer_id and body_pose:
                if abs(body_pose["dx"]) > 0.01 or abs(body_pose["dy"]) > 0.01 or abs(body_pose["rot"]) > 0.01:
                    pose["dx"] = 0.0
                    pose["dy"] = 0.0
                    if body_pose["rot"] * pose["rot"] > 0:
                        pose["rot"] = pose["rot"] - body_pose["rot"]
            elif role != "head":
                pose["dx"] = 0.0
                pose["dy"] = 0.0

        px = float(lyr.get("pos_x", lyr.get("x", 0))) + float(lyr.get("pivot_x", 0))
        py = float(lyr.get("pos_y", lyr.get("y", 0))) + float(lyr.get("pivot_y", 0))
        local_matrices[lid] = make_transform_matrix(
            px, py,
            pose["dx"], pose["dy"],
            pose["rot"],
            pose["sx"], pose["sy"]
        )
        local_trans_only_matrices[lid] = make_transform_matrix(
            px, py,
            pose["dx"], pose["dy"],
            0.0,
            pose["sx"], pose["sy"]
        )

    world_matrices = {}
    leg_root_roles = ("leg_left", "leg_right", "leg_thigh_left", "leg_thigh_right", "leg_upper_left", "leg_upper_right")

    def get_world_matrix(lid: int, depth: int = 0) -> np.ndarray:
        if lid in world_matrices:
            return world_matrices[lid]
        lyr = layer_map.get(lid)
        if not lyr or depth > 6:
            return np.eye(3, dtype=np.float64)
        m_local = local_matrices[lid]
        pid = lyr.get("parent_id")
        if pid and pid in layer_map and pid != lid:
            if lyr.get("role") in leg_root_roles and pid == body_layer_id:
                m_parent = local_trans_only_matrices[pid]
            else:
                m_parent = get_world_matrix(pid, depth + 1)
            m_world = m_parent @ m_local
        else:
            m_world = m_local
        world_matrices[lid] = m_world
        return m_world

    sorted_layers = sorted(layers, key=lambda item: int(item.get("z_index", 0)))

    for lyr in sorted_layers:
        lid = lyr["id"]
        pose = local_poses[lid]
        if not pose["render_visible"]:
            continue

        src_rgba = decoded_images.get(lid)
        if src_rgba is None or src_rgba.size == 0:
            continue

        m_world = get_world_matrix(lid)
        pos_x = float(lyr.get("pos_x", lyr.get("x", 0)))
        pos_y = float(lyr.get("pos_y", lyr.get("y", 0)))

        t_pos = np.array([
            [1.0, 0.0, pos_x],
            [0.0, 1.0, pos_y],
            [0.0, 0.0, 1.0]
        ], dtype=np.float64)
        m_final = m_world @ t_pos

        affine_2x3 = m_final[:2, :].astype(np.float32)
        warped = cv2.warpAffine(
            src_rgba,
            affine_2x3,
            (canvas_w, canvas_h),
            flags=cv2.INTER_LINEAR,
            borderMode=cv2.BORDER_CONSTANT,
            borderValue=(0, 0, 0, 0)
        )

        opacity_factor = float(lyr.get("opacity", 255)) / 255.0
        src_a = (warped[:, :, 3].astype(np.float32) / 255.0) * opacity_factor
        mask = src_a > 0.003
        if not np.any(mask):
            continue

        dst_a = frame_rgba[:, :, 3].astype(np.float32) / 255.0
        out_a = src_a + dst_a * (1.0 - src_a)

        for c in range(3):
            src_c = warped[:, :, c].astype(np.float32)
            dst_c = frame_rgba[:, :, c].astype(np.float32)
            blended = np.where(
                out_a > 1e-5,
                (src_c * src_a + dst_c * dst_a * (1.0 - src_a)) / np.maximum(out_a, 1e-5),
                0.0
            )
            frame_rgba[:, :, c] = np.clip(blended, 0, 255).astype(np.uint8)

        frame_rgba[:, :, 3] = np.clip(out_a * 255.0, 0, 255).astype(np.uint8)

    return frame_rgba


def export_funny_animation_package(
    layers: list,
    decoded_images: dict,
    anim_cfg: dict,
    output_dir: str,
    safe_base: str,
    thumbnail_rgba: np.ndarray = None
) -> dict:
    """
    Xuất trọn bộ dự án chuẩn "Funny Animation Assistant" (D:\\Funny Animation Assistant):
    1. Thư mục `funny_animation_project/` chứa:
       - `<safe_base>.anime`: File dự án chuẩn ver 2.0.0 mở trực tiếp trong Funny Animation Assistant,
         chứa sẵn CompositeCharacter (gắn đầy đủ 17 tên chuẩn alias, tâm xoay transformOriginX/Y,
         và toàn bộ 18 Preset Animation trong Action Library), Expressions (Lip-Sync nhép miệng),
         ActorConfig và 1 Scene mẫu đã đặt sẵn nhân vật trên sân khấu (3360, 1400).
       - `config.json`: File cấu hình Composite ver2.0.0 để bấm nút `📥 Import` trực tiếp trong
         CompositeCharacterEditor / SceneTemplateEditor của Funny Animation Assistant.
       - `assets/characters/<safe_base>/...`: Toàn bộ ảnh PNG bộ phận nhân vật & biểu cảm.
    2. File đóng gói `<safe_base>_funny_animation.paulto` (định dạng gói dự án gốc của Funny Animation Assistant).
    """
    proj_dir = os.path.join(output_dir, "funny_animation_project")
    char_asset_rel_dir = f"assets/characters/{safe_base}"
    expr_asset_rel_dir = f"assets/expressions/{safe_base}"
    char_asset_abs_dir = os.path.join(proj_dir, "assets", "characters", safe_base)
    expr_asset_abs_dir = os.path.join(proj_dir, "assets", "expressions", safe_base)
    os.makedirs(char_asset_abs_dir, exist_ok=True)
    os.makedirs(expr_asset_abs_dir, exist_ok=True)

    # Dọn dẹp file PNG cũ (nếu xuất đè vào cùng thư mục sau khi đã xóa bớt layer không dùng)
    for clean_dir in (char_asset_abs_dir, expr_asset_abs_dir):
        for old_f in os.listdir(clean_dir):
            old_p = os.path.join(clean_dir, old_f)
            if os.path.isfile(old_p):
                try:
                    os.remove(old_p)
                except OSError:
                    pass

    now_iso = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
    uid_prefix = uuid.uuid4().hex[:8]

    # Chỉ lấy các layer còn lại và đang bật hiển thị, sắp xếp theo z_index từ dưới lên trên
    sorted_layers = [
        l for l in sorted(layers, key=lambda item: int(item.get("z_index", 0)))
        if l.get("visible", True)
    ]

    # Xác định các layer hiển thị ở trạng thái nghỉ ban đầu:
    # Nếu có nhiều mắt/miệng, chỉ bật mặc định eye_open đầu tiên và mouth_closed đầu tiên
    eye_open_ids = [l["id"] for l in sorted_layers if l.get("visible", True) and l.get("role") == "eye_open"]
    mouth_closed_ids = [l["id"] for l in sorted_layers if l.get("visible", True) and l.get("role") == "mouth_closed"]
    primary_eye_id = eye_open_ids[0] if eye_open_ids else None
    primary_mouth_id = mouth_closed_ids[0] if mouth_closed_ids else None

    def is_layer_default_visible(lyr: dict) -> bool:
        if not lyr.get("visible", True):
            return False
        r = lyr.get("role", "custom")
        if r in ("eye_open", "eye_closed", "eye_extra") and primary_eye_id is not None:
            return lyr["id"] == primary_eye_id
        if r in ("mouth_closed", "mouth_half", "mouth_open", "mouth_extra") and primary_mouth_id is not None:
            return lyr["id"] == primary_mouth_id
        return True

    active_layers = [l for l in sorted_layers if is_layer_default_visible(l)]
    ref_layers = active_layers if active_layers else sorted_layers

    if ref_layers:
        min_x = min(float(l.get("pos_x", l.get("x", 0))) for l in ref_layers)
        min_y = min(float(l.get("pos_y", l.get("y", 0))) for l in ref_layers)
        max_x = max(float(l.get("pos_x", l.get("x", 0))) + max(1.0, float(l.get("w", 100))) for l in ref_layers)
        max_y = max(float(l.get("pos_y", l.get("y", 0))) + max(1.0, float(l.get("h", 100))) for l in ref_layers)
        char_cx = (min_x + max_x) / 2.0
        char_cy = (min_y + max_y) / 2.0
    else:
        char_cx = 512.0
        char_cy = 512.0

    # Lưu ảnh thumbnail của nhân vật
    thumb_rel_path = f"{char_asset_rel_dir}/thumbnail.png"
    thumb_abs_path = os.path.join(char_asset_abs_dir, "thumbnail.png")
    if thumbnail_rgba is not None and thumbnail_rgba.size > 0:
        Image.fromarray(thumbnail_rgba, "RGBA").save(thumb_abs_path, format="PNG")
    else:
        if decoded_images:
            first_img = next(iter(decoded_images.values()))
            Image.fromarray(first_img, "RGBA").save(thumb_abs_path, format="PNG")
        else:
            Image.new("RGBA", (256, 256), (0, 0, 0, 0)).save(thumb_abs_path, format="PNG")

    prop_assets = []
    part_objects = []
    config_children = []
    used_recommended_names = set()
    role_to_part_id = {}
    funny_name_to_part_info = {}

    used_filenames = set()

    for idx, lyr in enumerate(sorted_layers):
        lid = lyr["id"]
        raw_name = str(lyr.get("name", f"part_{idx + 1}")).strip() or f"part_{idx + 1}"
        role = lyr.get("role", "custom")
        w = max(1, int(lyr.get("w", 100)))
        h = max(1, int(lyr.get("h", 100)))
        pos_x = float(lyr.get("pos_x", lyr.get("x", 0)))
        pos_y = float(lyr.get("pos_y", lyr.get("y", 0)))
        pivot_x = float(lyr.get("pivot_x", w / 2.0))
        pivot_y = float(lyr.get("pivot_y", h / 2.0))

        # Lưu file PNG bộ phận
        safe_part_slug = sanitize_filename(raw_name) or f"part_{idx + 1}"
        fname = f"{idx + 1:02d}_{safe_part_slug}.png"
        if fname in used_filenames:
            fname = f"{idx + 1:02d}_{safe_part_slug}_{lid}.png"
        used_filenames.add(fname)

        part_abs_path = os.path.join(char_asset_abs_dir, fname)
        part_rel_path = f"{char_asset_rel_dir}/{fname}"

        src_rgba = decoded_images.get(lid)
        if src_rgba is not None and src_rgba.size > 0:
            Image.fromarray(src_rgba, "RGBA").save(part_abs_path, format="PNG")
        else:
            Image.new("RGBA", (w, h), (0, 0, 0, 0)).save(part_abs_path, format="PNG")

        prop_id = f"prop_{uid_prefix}_{idx + 1}"
        obj_id = f"part_{uid_prefix}_{idx + 1}"

        prop_assets.append({
            "id": prop_id,
            "name": raw_name,
            "url": part_rel_path,
            "path": part_rel_path,
            "category": "character_part",
            "type": "static",
            "width": w,
            "height": h,
        })

        # Gán tên chuẩn (RecommendedName) cho alias để vượt qua 100% kiểm tra Name Check của Funny Animation
        std_name = ROLE_TO_FUNNY_NAME.get(role, "")
        is_vis = is_layer_default_visible(lyr)

        # Nếu chưa có layer nào nhận alias "Expression", ưu tiên gán cho layer miệng hoặc mắt chính
        if not std_name and is_vis and "Expression" not in used_recommended_names:
            if role in ("mouth_closed", "eye_open"):
                std_name = "Expression"

        # Tương thích hoàn toàn với cả Preset 1 khớp (Left Arm / Left Leg) và 2 khớp (Walk Detailed / Run Detailed)
        # của Paul To Animation (presetAnimationCatalog.ts luôn tìm 'Left Arm'/'Right Arm'/'Left Leg'/'Right Leg' cho khớp trên):
        coarse_alias_map = {
            "Left Upper Arm": "Left Arm",
            "Right Upper Arm": "Right Arm",
            "Left Thigh": "Left Leg",
            "Right Thigh": "Right Leg",
        }
        has_direct_coarse = {
            "Left Arm": any(l.get("role") == "arm_left" and is_layer_default_visible(l) for l in sorted_layers),
            "Right Arm": any(l.get("role") == "arm_right" and is_layer_default_visible(l) for l in sorted_layers),
            "Left Leg": any(l.get("role") == "leg_left" and is_layer_default_visible(l) for l in sorted_layers),
            "Right Leg": any(l.get("role") == "leg_right" and is_layer_default_visible(l) for l in sorted_layers),
        }

        if std_name and is_vis and std_name not in used_recommended_names:
            mapped_coarse = coarse_alias_map.get(std_name)
            if mapped_coarse and not has_direct_coarse.get(mapped_coarse) and mapped_coarse not in used_recommended_names:
                alias_name = mapped_coarse
                display_name = std_name
                used_recommended_names.add(mapped_coarse)
                used_recommended_names.add(std_name)
            else:
                alias_name = std_name
                display_name = std_name
                used_recommended_names.add(std_name)
        else:
            alias_name = raw_name
            display_name = raw_name

        # Tọa độ tâm bộ phận so với tâm nhân vật (chuẩn hệ tọa độ CompositeObject của Funny Animation)
        part_cx = pos_x + w / 2.0
        part_cy = pos_y + h / 2.0
        local_cx = round(part_cx - char_cx, 2)
        local_cy = round(part_cy - char_cy, 2)

        # Độ lệch tâm xoay (transformOriginX, transformOriginY) tính bằng pixel từ tâm ảnh (w/2, h/2)
        origin_x = round(pivot_x - (w / 2.0), 2)
        origin_y = round(pivot_y - (h / 2.0), 2)

        mat_id = f"mat_{uid_prefix}_{idx + 1}"
        part_obj = {
            "id": obj_id,
            "name": display_name,
            "alias": alias_name,
            "type": "symbol",
            "refId": "",
            "materials": [
                {
                    "id": mat_id,
                    "name": "default",
                    "type": "static",
                    "url": part_rel_path,
                }
            ],
            "currentMaterialId": mat_id,
            "x": local_cx,
            "y": local_cy,
            "width": w,
            "height": h,
            "scaleX": 1.0,
            "scaleY": 1.0,
            "rotation": 0,
            "alpha": round(float(lyr.get("opacity", 255)) / 255.0, 3),
            "flipX": False,
            "visible": bool(is_vis),
            "zIndex": idx + 1,
            "parentId": f"comp_root_{uid_prefix}",
            "transformOriginX": origin_x,
            "transformOriginY": origin_y,
            "symbolRef": {
                "propId": prop_id,
                "assetPath": part_rel_path,
                "width": w,
                "height": h,
            },
        }
        part_objects.append(part_obj)

        if is_vis:
            if role not in role_to_part_id:
                role_to_part_id[role] = obj_id
            if alias_name in ROLE_TO_FUNNY_NAME.values() and alias_name not in funny_name_to_part_info:
                funny_name_to_part_info[alias_name] = {
                    "id": obj_id,
                    "origin_x": origin_x,
                    "origin_y": origin_y,
                    "w": w,
                    "h": h,
                }

        # Đóng gói node cho file config.json (ver2.0.0) dùng cho nút `📥 Import` trong CompositeCharacterEditor
        # Khớp 100% chuẩn ConfigSymbolNode của Funny Animation Assistant
        config_children.append({
            "id": obj_id,
            "name": alias_name,
            "alias": alias_name,
            "type": "symbol",
            "elementType": "symbol",
            "frameCount": 1,
            "scaleFactor": 1,
            "alpha": round(float(lyr.get("opacity", 255)) / 255.0, 3),
            "transformOriginX": origin_x,
            "transformOriginY": origin_y,
            "visible": bool(is_vis),
            "frames": [
                {
                    "frame": 1,
                    "keyframe": 0,
                    "label": None,
                    "path": f"{char_asset_rel_dir}/{fname}",
                    "type": "single",
                }
            ],
            "instanceTransform": {
                "width": w,
                "height": h,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 0,
                "transformOriginX": origin_x,
                "transformOriginY": origin_y,
                "registrationPoint": {
                    "parentX": round(pos_x + pivot_x, 2),
                    "parentY": round(pos_y + pivot_y, 2),
                    "localX": round(pivot_x, 2),
                    "localY": round(pivot_y, 2),
                },
            },
        })

    # Tạo bộ Biểu cảm (Expressions) chuẩn Funny Animation Assistant (Record<string, Expression>)
    expressions_dict = {}
    mouth_roles = ["mouth_closed", "mouth_half", "mouth_open"]
    mouth_layers = [l for l in sorted_layers if l.get("role") in mouth_roles]
    default_expr_id = None
    if mouth_layers:
        speaking_frames = []
        default_frame_obj = None
        for m_idx, m_lyr in enumerate(mouth_layers):
            m_rgba = decoded_images.get(m_lyr["id"])
            if m_rgba is None or m_rgba.size == 0:
                continue
            ef_name = f"expr_mouth_{m_idx + 1}_{m_lyr.get('role', 'mouth')}.png"
            ef_abs = os.path.join(expr_asset_abs_dir, ef_name)
            ef_rel = f"{expr_asset_rel_dir}/{ef_name}"
            Image.fromarray(m_rgba, "RGBA").save(ef_abs, format="PNG")
            frame_item = {
                "id": f"frame_{uid_prefix}_{m_idx + 1}",
                "url": ef_rel,
            }
            if m_lyr.get("role") == "mouth_closed" and default_frame_obj is None:
                default_frame_obj = frame_item
            speaking_frames.append(frame_item)

        if speaking_frames:
            if not default_frame_obj:
                default_frame_obj = speaking_frames[0]
            default_expr_id = f"expr_{uid_prefix}_default"
            expressions_dict[default_expr_id] = {
                "id": default_expr_id,
                "name": f"{safe_base} - Nói chuyện (Lip-sync)",
                "tags": ["Talk", "LipSync"],
                "defaultFrame": default_frame_obj,
                "speakingFrames": speaking_frames,
                "anchor": {"x": 0.5, "y": 0.5},
                "speakingFps": 8,
                "speakingLoop": True,
                "flipHorizontal": False,
                "blendMode": "normal",
                "createdAt": int(time.time() * 1000),
            }

    # Lập bản đồ tra cứu ID đối tượng theo vai trò (role) để tự động sinh VisibilityTrack (Chớp mắt & Nhép miệng)
    role_to_obj_ids = {}
    for lyr, p_obj in zip(sorted_layers, part_objects):
        r = lyr.get("role")
        if r:
            role_to_obj_ids.setdefault(r, []).append(p_obj["id"])

    eye_open_id = role_to_obj_ids.get("eye_open", [None])[0]
    eye_closed_id = role_to_obj_ids.get("eye_closed", [None])[0]
    mouth_closed_id = role_to_obj_ids.get("mouth_closed", [None])[0]
    mouth_half_id = role_to_obj_ids.get("mouth_half", [None])[0]
    mouth_open_id = role_to_obj_ids.get("mouth_open", [None])[0]

    # Khởi tạo toàn bộ các Preset Animation tương thích vào `rootComposite.animations`
    # để khi mở nhân vật trong Funny Animation Assistant, thư viện Action Library đã có sẵn tất cả hành động!
    def resolve_part_for_preset_target(target_name: str):
        if target_name in funny_name_to_part_info:
            return funny_name_to_part_info[target_name]
        # Fallback tương tự presetAnimationMapper.ts
        fallback_lookup = {
            "Left Upper Arm": "Left Arm",
            "Left Lower Arm": "Left Arm",
            "Right Upper Arm": "Right Arm",
            "Right Lower Arm": "Right Arm",
            "Left Thigh": "Left Leg",
            "Left Calf": "Left Leg",
            "Right Thigh": "Right Leg",
            "Right Calf": "Right Leg",
            "Left Arm": "Left Upper Arm",
            "Right Arm": "Right Upper Arm",
            "Left Leg": "Left Thigh",
            "Right Leg": "Right Thigh",
        }
        fb = fallback_lookup.get(target_name)
        if fb and fb in funny_name_to_part_info:
            return funny_name_to_part_info[fb]
        return None

    mounted_animations = {}
    raw_selected_preset = str(anim_cfg.get("preset", "idle"))
    selected_preset_key = PRESET_KEY_ALIASES.get(raw_selected_preset, raw_selected_preset)
    speed_cfg = max(0.2, float(anim_cfg.get("speed", 1.0)))
    intensity_cfg = max(0.1, float(anim_cfg.get("intensity", 1.0)))

    primary_anim_id = None

    # Sắp xếp để preset đang chọn được khởi tạo đầu tiên
    ordered_preset_keys = [selected_preset_key] + [k for k in FUNNY_PRESET_CATALOG.keys() if k != selected_preset_key]

    # Chuẩn bị cây phân cấp Cha - Con (Forward Kinematics) cho toàn bộ các layer trong sorted_layers
    # Vì Paul To Animation quản lý các bộ phận dưới dạng phẳng (flat siblings trong comp_root),
    # việc tính toán sẵn Forward Kinematics (x, y, rotation, scaleX, scaleY) cho từng bộ phận con
    # giúp cẳng tay, bắp chân, bàn chân, đầu, mắt, miệng, tóc luôn bám chặt 100% vào khớp cha khi diễn hoạt!
    fk_layer_map = {l["id"]: l for l in sorted_layers}
    fk_body_id = next((l["id"] for l in sorted_layers if l.get("role") == "body"), None)
    fk_head_id = next((l["id"] for l in sorted_layers if l.get("role") == "head"), None)
    fk_uarm_l_id = next((l["id"] for l in sorted_layers if l.get("role") in ("arm_upper_left", "arm_left")), None)
    fk_uarm_r_id = next((l["id"] for l in sorted_layers if l.get("role") in ("arm_upper_right", "arm_right")), None)
    fk_thigh_l_id = next((l["id"] for l in sorted_layers if l.get("role") in ("leg_thigh_left", "leg_upper_left", "leg_left")), None)
    fk_thigh_r_id = next((l["id"] for l in sorted_layers if l.get("role") in ("leg_thigh_right", "leg_upper_right", "leg_right")), None)
    fk_calf_l_id = next((l["id"] for l in sorted_layers if l.get("role") in ("leg_calf_left", "leg_lower_left")), None)
    fk_calf_r_id = next((l["id"] for l in sorted_layers if l.get("role") in ("leg_calf_right", "leg_lower_right")), None)

    fk_parent_ids = {}
    for lyr in sorted_layers:
        lid = lyr["id"]
        pid = lyr.get("parent_id")
        role = lyr.get("role", "custom")
        if pid is not None and pid in fk_layer_map and pid != lid:
            fk_parent_ids[lid] = pid
        else:
            if role == "arm_lower_left" and (fk_uarm_l_id or fk_body_id):
                fk_parent_ids[lid] = fk_uarm_l_id or fk_body_id
            elif role == "arm_lower_right" and (fk_uarm_r_id or fk_body_id):
                fk_parent_ids[lid] = fk_uarm_r_id or fk_body_id
            elif role in ("leg_calf_left", "leg_lower_left") and (fk_thigh_l_id or fk_body_id):
                fk_parent_ids[lid] = fk_thigh_l_id or fk_body_id
            elif role in ("leg_calf_right", "leg_lower_right") and (fk_thigh_r_id or fk_body_id):
                fk_parent_ids[lid] = fk_thigh_r_id or fk_body_id
            elif role == "foot_left" and (fk_calf_l_id or fk_thigh_l_id or fk_body_id):
                fk_parent_ids[lid] = fk_calf_l_id or fk_thigh_l_id or fk_body_id
            elif role == "foot_right" and (fk_calf_r_id or fk_thigh_r_id or fk_body_id):
                fk_parent_ids[lid] = fk_calf_r_id or fk_thigh_r_id or fk_body_id
            elif role in ("head", "arm_left", "arm_right", "arm_upper_left", "arm_upper_right", "leg_left", "leg_right", "leg_thigh_left", "leg_thigh_right", "leg_upper_left", "leg_upper_right") and fk_body_id and lid != fk_body_id:
                fk_parent_ids[lid] = fk_body_id
            elif role in ("face", "expression", "eye_open", "eye_closed", "eye_extra", "mouth_closed", "mouth_half", "mouth_open", "mouth_extra", "hair", "head_prop") and fk_head_id and lid != fk_head_id:
                fk_parent_ids[lid] = fk_head_id
            else:
                fk_parent_ids[lid] = None

    fk_leg_root_roles = ("leg_left", "leg_right", "leg_thigh_left", "leg_thigh_right", "leg_upper_left", "leg_upper_right")

    for p_key in ordered_preset_keys:
        p_def = FUNNY_PRESET_CATALOG.get(p_key)
        if not p_def:
            continue

        is_selected = (p_key == selected_preset_key)
        spd_factor = speed_cfg if is_selected else 1.0
        int_factor = intensity_cfg if is_selected else 1.0
        orig_dur = max(1.0, float(p_def.get("duration", 1000)))
        dur_scaled = max(100, int(round(orig_dur / spd_factor)))

        # Tập hợp các mốc thời gian chuẩn hóa u in [0.0, 1.0] (lưới 16 bước + tất cả mốc keyframe gốc)
        time_set = {round(i / 16.0, 4) for i in range(17)}
        for tr in p_def.get("tracks", []):
            for kf in tr.get("keyframes", []):
                if "time" in kf:
                    u_val = round(max(0.0, min(1.0, float(kf["time"]) / orig_dur)), 4)
                    time_set.add(u_val)
        norm_times = sorted(time_set)

        # Lưu trữ chuỗi Keyframe thế giới (FK World Keyframes) cho từng layer
        layer_kf_series = {lyr["id"]: [] for lyr in sorted_layers}

        for u_norm in norm_times:
            local_ms = u_norm * orig_dur
            step_poses = {}

            for lyr in sorted_layers:
                lid = lyr["id"]
                role = lyr.get("role", "custom")
                dx = 0.0
                dy = 0.0
                rot = 0.0
                sx = 1.0
                sy = 1.0

                matched_tracks = resolve_preset_track_for_role(p_def, role)
                for tr in matched_tracks:
                    tr_type = tr.get("type", "transform")
                    if tr_type == "transform":
                        kfs = tr.get("keyframes", [])
                        tx = interpolate_prop(kfs, "x", local_ms, 0.0)
                        ty = interpolate_prop(kfs, "y", local_ms, 0.0)
                        trot = interpolate_prop(kfs, "rotation", local_ms, 0.0)
                        tsx = interpolate_prop(kfs, "scaleX", local_ms, 1.0)
                        tsy = interpolate_prop(kfs, "scaleY", local_ms, 1.0)
                        dx += tx * int_factor
                        dy += ty * int_factor
                        rot += trot * int_factor
                        sx *= (1.0 + (tsx - 1.0) * int_factor)
                        sy *= (1.0 + (tsy - 1.0) * int_factor)
                    elif tr_type == "effect":
                        eff = tr.get("effect", {})
                        eff_type = eff.get("type", "")
                        wave = math.sin(u_norm * 2.0 * math.pi)
                        if eff_type == "breathe":
                            eff_int = float(eff.get("intensity", 0.025)) * int_factor
                            sy *= (1.0 + wave * eff_int)
                            sx *= (1.0 - wave * eff_int * 0.4)
                            dy += wave * 2.5 * int_factor
                        elif eff_type == "float":
                            amp = float(eff.get("amplitude", 8.0)) * int_factor
                            dy += wave * amp

                if is_selected:
                    m = lyr.get("motion") or {}
                    base_rot = float(m.get("base_rot", 0.0))
                    swing_rot = float(m.get("swing_rot", 0.0))
                    speed_mult = float(m.get("speed_mult", 1.0))
                    phase_rad = math.radians(float(m.get("phase_deg", 0.0)))
                    move_x = float(m.get("move_x", 0.0))
                    move_y = float(m.get("move_y", 0.0))
                    custom_wave = math.sin(2.0 * math.pi * speed_mult * u_norm + phase_rad)
                    rot += base_rot + swing_rot * custom_wave
                    dx += move_x * custom_wave
                    dy += move_y * custom_wave

                step_poses[lid] = {"dx": dx, "dy": dy, "rot": rot, "sx": sx, "sy": sy}

            # Khử dịch chuyển/xoay kép trên các bộ phận con đã gắn vào Body
            body_pose = step_poses.get(fk_body_id) if fk_body_id is not None else None
            step_local_mats = {}
            step_trans_only_mats = {}
            for lyr in sorted_layers:
                lid = lyr["id"]
                pose = step_poses[lid]
                pid = fk_parent_ids.get(lid)
                role = lyr.get("role", "custom")
                if pid is not None and pid in fk_layer_map and pid != lid:
                    if role == "head" and pid == fk_body_id and body_pose:
                        if abs(body_pose["dx"]) > 0.01 or abs(body_pose["dy"]) > 0.01 or abs(body_pose["rot"]) > 0.01:
                            pose["dx"] = 0.0
                            pose["dy"] = 0.0
                            if body_pose["rot"] * pose["rot"] > 0:
                                pose["rot"] = pose["rot"] - body_pose["rot"]
                    elif role != "head":
                        pose["dx"] = 0.0
                        pose["dy"] = 0.0

                w_l = max(1, int(lyr.get("w", 100)))
                h_l = max(1, int(lyr.get("h", 100)))
                pos_x = float(lyr.get("pos_x", lyr.get("x", 0)))
                pos_y = float(lyr.get("pos_y", lyr.get("y", 0)))
                pivot_x = float(lyr.get("pivot_x", w_l / 2.0))
                pivot_y = float(lyr.get("pivot_y", h_l / 2.0))
                px = pos_x + pivot_x
                py = pos_y + pivot_y

                step_local_mats[lid] = make_transform_matrix(px, py, pose["dx"], pose["dy"], pose["rot"], pose["sx"], pose["sy"])
                step_trans_only_mats[lid] = make_transform_matrix(px, py, pose["dx"], pose["dy"], 0.0, pose["sx"], pose["sy"])

            step_world_mats = {}

            def get_step_world_mat(lid_val: int, depth: int = 0) -> np.ndarray:
                if lid_val in step_world_mats:
                    return step_world_mats[lid_val]
                lyr_item = fk_layer_map.get(lid_val)
                if not lyr_item or depth > 6:
                    return np.eye(3, dtype=np.float64)
                m_loc = step_local_mats[lid_val]
                pid_val = fk_parent_ids.get(lid_val)
                if pid_val is not None and pid_val in fk_layer_map and pid_val != lid_val:
                    if lyr_item.get("role") in fk_leg_root_roles and pid_val == fk_body_id:
                        m_par = step_trans_only_mats[pid_val]
                    else:
                        m_par = get_step_world_mat(pid_val, depth + 1)
                    m_w = m_par @ m_loc
                else:
                    m_w = m_loc
                step_world_mats[lid_val] = m_w
                return m_w

            for lyr in sorted_layers:
                lid = lyr["id"]
                w_l = max(1, int(lyr.get("w", 100)))
                h_l = max(1, int(lyr.get("h", 100)))
                pos_x = float(lyr.get("pos_x", lyr.get("x", 0)))
                pos_y = float(lyr.get("pos_y", lyr.get("y", 0)))
                pivot_x = float(lyr.get("pivot_x", w_l / 2.0))
                pivot_y = float(lyr.get("pivot_y", h_l / 2.0))
                px = pos_x + pivot_x
                py = pos_y + pivot_y

                m_w = get_step_world_mat(lid)
                w_px = m_w[0, 0] * px + m_w[0, 1] * py + m_w[0, 2]
                w_py = m_w[1, 0] * px + m_w[1, 1] * py + m_w[1, 2]
                world_dx = w_px - px
                world_dy = w_py - py

                a, b, c, d = m_w[0, 0], m_w[0, 1], m_w[1, 0], m_w[1, 1]
                world_rot_rad = math.atan2(c, a)
                world_sx = math.hypot(a, c)
                world_sy = math.hypot(b, d)

                # Unwrap góc xoay radian liên tục theo thời gian
                prev_series = layer_kf_series[lid]
                if prev_series:
                    prev_rot = prev_series[-1]["rotation"]
                    while world_rot_rad - prev_rot > math.pi:
                        world_rot_rad -= 2.0 * math.pi
                    while world_rot_rad - prev_rot < -math.pi:
                        world_rot_rad += 2.0 * math.pi

                # Nếu chỉ có 1 layer mắt (không có eye_closed), tự động nhúng nhịp chớp mắt bằng scaleY
                role = lyr.get("role", "custom")
                if role == "eye_open" and not eye_closed_id and (0.68 <= u_norm <= 0.76):
                    world_sy *= 0.15

                # Nếu chỉ có 1 layer miệng và đang ở preset talk, nhúng nhịp nhép miệng bằng scaleY
                if role == "mouth_closed" and p_key == "talk" and not (mouth_open_id or mouth_half_id):
                    talk_w = 0.5 + 0.5 * math.sin(u_norm * 6.0 * math.pi)
                    world_sy *= (0.65 + 0.75 * talk_w)

                kf_entry = {
                    "time": u_norm,
                    "x": round(world_dx, 2),
                    "y": round(world_dy, 2),
                    "rotation": round(world_rot_rad, 4),
                    "scaleX": round(world_sx, 4),
                    "scaleY": round(world_sy, 4),
                }
                layer_kf_series[lid].append(kf_entry)

        inst_tracks = []
        t_counter = 0
        for lyr, p_obj in zip(sorted_layers, part_objects):
            lid = lyr["id"]
            kfs = layer_kf_series.get(lid, [])
            if not kfs:
                continue
            has_dx = any(abs(k["x"]) > 0.05 for k in kfs)
            has_dy = any(abs(k["y"]) > 0.05 for k in kfs)
            has_rot = any(abs(k["rotation"]) > 0.0005 for k in kfs)
            has_sx = any(abs(k["scaleX"] - 1.0) > 0.001 for k in kfs)
            has_sy = any(abs(k["scaleY"] - 1.0) > 0.001 for k in kfs)

            if not (has_dx or has_dy or has_rot or has_sx or has_sy):
                continue

            # Tinh gọn các thuộc tính không đổi để JSON gọn nhẹ và mượt mà
            compact_kfs = []
            for k in kfs:
                ck = {"time": k["time"]}
                if has_dx or has_dy:
                    ck["x"] = k["x"]
                    ck["y"] = k["y"]
                if has_rot:
                    ck["rotation"] = k["rotation"]
                if has_sx:
                    ck["scaleX"] = k["scaleX"]
                if has_sy:
                    ck["scaleY"] = k["scaleY"]
                compact_kfs.append(ck)

            t_counter += 1
            inst_tracks.append({
                "id": f"trk_{uid_prefix}_{p_key}_{t_counter}",
                "trackType": "transform",
                "displayName": p_obj.get("name", "Track"),
                "targetObjectId": p_obj["id"],
                "targetName": p_obj.get("alias") or p_obj.get("name"),
                "duration": dur_scaled,
                "easing": "linear",
                "space": "local",
                "pivot": {
                    "x": p_obj["transformOriginX"],
                    "y": p_obj["transformOriginY"],
                },
                "keyframes": compact_kfs,
            })

        # Tự động gắn VisibilityTrack cho Chớp mắt (Blink) trên mọi Action nếu có đủ 2 layer mắt
        if eye_open_id and eye_closed_id:
            inst_tracks.append({
                "id": f"trk_{uid_prefix}_{p_key}_eye_open",
                "trackType": "visibility",
                "displayName": "Eye Open (Auto Blink)",
                "targetObjectId": eye_open_id,
                "duration": dur_scaled,
                "easing": "linear",
                "keyframes": [
                    {"time": 0.0, "alpha": 1.0},
                    {"time": 0.65, "alpha": 1.0},
                    {"time": 0.70, "alpha": 0.0},
                    {"time": 0.78, "alpha": 0.0},
                    {"time": 0.82, "alpha": 1.0},
                    {"time": 1.0, "alpha": 1.0},
                ],
            })
            inst_tracks.append({
                "id": f"trk_{uid_prefix}_{p_key}_eye_closed",
                "trackType": "visibility",
                "displayName": "Eye Closed (Auto Blink)",
                "targetObjectId": eye_closed_id,
                "duration": dur_scaled,
                "easing": "linear",
                "keyframes": [
                    {"time": 0.0, "alpha": 0.0},
                    {"time": 0.65, "alpha": 0.0},
                    {"time": 0.70, "alpha": 1.0},
                    {"time": 0.78, "alpha": 1.0},
                    {"time": 0.82, "alpha": 0.0},
                    {"time": 1.0, "alpha": 0.0},
                ],
            })

        # Tự động gắn VisibilityTrack cho Nhép miệng (Lip-sync):
        # Khi action là "talk": luân phiên các layer miệng để mấp máy nói chuyện.
        # Khi action khác: giữ miệng đóng (mouth_closed = 1, mouth_open/half = 0).
        if mouth_closed_id:
            if p_key == "talk" and (mouth_open_id or mouth_half_id):
                active_open_id = mouth_open_id or mouth_half_id
                inst_tracks.append({
                    "id": f"trk_{uid_prefix}_{p_key}_mouth_closed",
                    "trackType": "visibility",
                    "displayName": "Mouth Closed (Lip-sync)",
                    "targetObjectId": mouth_closed_id,
                    "duration": dur_scaled,
                    "easing": "linear",
                    "keyframes": [
                        {"time": 0.0, "alpha": 1.0},
                        {"time": 0.15, "alpha": 0.0},
                        {"time": 0.35, "alpha": 0.0},
                        {"time": 0.50, "alpha": 1.0},
                        {"time": 0.65, "alpha": 0.0},
                        {"time": 0.85, "alpha": 0.0},
                        {"time": 1.0, "alpha": 1.0},
                    ],
                })
                inst_tracks.append({
                    "id": f"trk_{uid_prefix}_{p_key}_mouth_open",
                    "trackType": "visibility",
                    "displayName": "Mouth Open (Lip-sync)",
                    "targetObjectId": active_open_id,
                    "duration": dur_scaled,
                    "easing": "linear",
                    "keyframes": [
                        {"time": 0.0, "alpha": 0.0},
                        {"time": 0.15, "alpha": 1.0},
                        {"time": 0.35, "alpha": 1.0},
                        {"time": 0.50, "alpha": 0.0},
                        {"time": 0.65, "alpha": 1.0},
                        {"time": 0.85, "alpha": 1.0},
                        {"time": 1.0, "alpha": 0.0},
                    ],
                })
                if mouth_half_id and mouth_open_id:
                    inst_tracks.append({
                        "id": f"trk_{uid_prefix}_{p_key}_mouth_half",
                        "trackType": "visibility",
                        "displayName": "Mouth Half (Lip-sync)",
                        "targetObjectId": mouth_half_id,
                        "duration": dur_scaled,
                        "easing": "linear",
                        "keyframes": [
                            {"time": 0.0, "alpha": 0.0},
                            {"time": 0.10, "alpha": 1.0},
                            {"time": 0.20, "alpha": 0.0},
                            {"time": 0.40, "alpha": 1.0},
                            {"time": 0.60, "alpha": 0.0},
                            {"time": 0.80, "alpha": 1.0},
                            {"time": 1.0, "alpha": 0.0},
                        ],
                    })
            else:
                inst_tracks.append({
                    "id": f"trk_{uid_prefix}_{p_key}_mouth_closed",
                    "trackType": "visibility",
                    "displayName": "Mouth Closed",
                    "targetObjectId": mouth_closed_id,
                    "duration": dur_scaled,
                    "easing": "linear",
                    "keyframes": [
                        {"time": 0.0, "alpha": 1.0},
                        {"time": 1.0, "alpha": 1.0},
                    ],
                })
                if mouth_open_id:
                    inst_tracks.append({
                        "id": f"trk_{uid_prefix}_{p_key}_mouth_open",
                        "trackType": "visibility",
                        "displayName": "Mouth Open Off",
                        "targetObjectId": mouth_open_id,
                        "duration": dur_scaled,
                        "easing": "linear",
                        "keyframes": [
                            {"time": 0.0, "alpha": 0.0},
                            {"time": 1.0, "alpha": 0.0},
                        ],
                    })
                if mouth_half_id:
                    inst_tracks.append({
                        "id": f"trk_{uid_prefix}_{p_key}_mouth_half",
                        "trackType": "visibility",
                        "displayName": "Mouth Half Off",
                        "targetObjectId": mouth_half_id,
                        "duration": dur_scaled,
                        "easing": "linear",
                        "keyframes": [
                            {"time": 0.0, "alpha": 0.0},
                            {"time": 1.0, "alpha": 0.0},
                        ],
                    })

        if inst_tracks:
            anim_id = f"anim_{uid_prefix}_{p_key}"
            mounted_animations[anim_id] = {
                "type": "track",
                "id": anim_id,
                "name": p_def.get("name_en", p_def.get("name", p_key)),
                "duration": dur_scaled,
                "loop": True,
                "origin": "user",
                "createdAt": int(time.time() * 1000),
                "updatedAt": int(time.time() * 1000),
                "tracks": inst_tracks,
            }
            if is_selected or primary_anim_id is None:
                primary_anim_id = anim_id

    root_comp_id = f"comp_root_{uid_prefix}"
    child_ids = [obj["id"] for obj in part_objects]

    root_comp_obj = {
        "id": root_comp_id,
        "name": safe_base,
        "type": "composite",
        "refId": "",
        "x": 0,
        "y": 0,
        "width": 0,
        "height": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "visible": True,
        "alpha": 1,
        "zIndex": 0,
        "compositeMode": "entity",
        "compositeLocked": True,
        "childIds": child_ids,
        "renderChain": child_ids,
        "animations": mounted_animations,
    }

    comp_char_id = f"char_{uid_prefix}"
    composite_character = {
        "id": comp_char_id,
        "name": safe_base,
        "description": "Nhân vật xuất từ SpriteSplit Studio (chuẩn Rig & Pivot 2.0)",
        "category": "character",
        "tags": ["SpriteSplitStudio", "Rigged"],
        "objects": [root_comp_obj] + part_objects,
        "rootCompositeId": root_comp_id,
        "editorAnchor": {"x": 3360, "y": 1400},
        "thumbnailPath": thumb_rel_path,
        "createdAt": now_iso,
        "updatedAt": now_iso,
    }

    # Tạo bản sao nhân vật đặt sẵn trên sân khấu Scene 1 tại tâm chuẩn (3360, 1400) của Funny Animation
    scene_root_obj = dict(root_comp_obj)
    scene_root_obj["x"] = 3360
    scene_root_obj["y"] = 1400
    scene_root_obj["sourceCompositeCharId"] = comp_char_id
    if primary_anim_id:
        scene_root_obj["initialAnimations"] = [primary_anim_id]

    scene_objects = [scene_root_obj] + [dict(obj) for obj in part_objects]

    project_anime_data = {
        "meta": {
            "name": f"{safe_base} - Animation Project",
            "version": "2.0.0",
            "created": now_iso,
            "modified": now_iso,
            "author": "SpriteSplit Studio",
            "description": f"Dự án nhân vật {safe_base} xuất từ SpriteSplit Studio dành cho Funny Animation Assistant",
        },
        "settings": {
            "resolution": {"width": 1920, "height": 1080},
            "fps": 30,
            "masterVolume": 1,
        },
        "assets": {
            "scenes": [],
            "props": prop_assets,
            "effects": [],
            "sounds": [],
        },
        "expressions": expressions_dict,
        "compositeCharacters": [composite_character],
        "sceneTemplates": [],
        "actors": [
            {
                "id": f"actor_{uid_prefix}",
                "name": safe_base,
                "color": "#f97316",
                "compositeCharId": comp_char_id,
                "expressions": {},
                "actions": {},
            }
        ],
        "episodes": [
            {
                "id": f"ep_{uid_prefix}_1",
                "name": "Tập 1 - Sân khấu Nhân vật",
                "order": 1,
                "scenes": [
                    {
                        "id": f"sc_{uid_prefix}_1",
                        "name": f"Cảnh 1 - {safe_base}",
                        "setup": {
                            "background": "",
                            "backgroundWidth": 6720,
                            "backgroundHeight": 2800,
                            "objects": scene_objects,
                            "camera": {
                                "x": 3360,
                                "y": 1400,
                                "zoom": 1,
                                "rotation": 0,
                            },
                            "lighting": {
                                "ambient": {"color": "#ffffff", "intensity": 1},
                                "lights": [],
                            },
                        },
                        "timeline": [],
                        "Transition": "none",
                    }
                ],
                "created": now_iso,
                "modified": now_iso,
            }
        ],
    }

    anime_file_path = os.path.join(proj_dir, f"{safe_base}.anime")
    with open(anime_file_path, "w", encoding="utf-8") as f:
        json.dump(project_anime_data, f, ensure_ascii=False, indent=2)

    # Tạo danh sách tài nguyên ảnh nhúng kèm base64 để hỗ trợ 1-click import trực tiếp vào Paul To Animation
    import io, base64
    character_asset_list = []
    for idx_lyr, lyr_item in enumerate(sorted_layers):
        lid_val = lyr_item["id"]
        raw_n = str(lyr_item.get("name", f"part_{idx_lyr + 1}")).strip() or f"part_{idx_lyr + 1}"
        safe_slug = sanitize_filename(raw_n) or f"part_{idx_lyr + 1}"
        fname_val = f"{idx_lyr + 1:02d}_{safe_slug}.png"
        part_rel_p = f"{char_asset_rel_dir}/{fname_val}"
        src_img = decoded_images.get(lid_val)
        if src_img is not None and src_img.size > 0:
            buf = io.BytesIO()
            Image.fromarray(src_img, "RGBA").save(buf, format="PNG")
            b64_val = base64.b64encode(buf.getvalue()).decode("ascii")
            character_asset_list.append({
                "path": part_rel_p,
                "data": f"data:image/png;base64,{b64_val}"
            })

    # Thumbnail asset
    if thumbnail_rgba is not None and thumbnail_rgba.size > 0:
        buf = io.BytesIO()
        Image.fromarray(thumbnail_rgba, "RGBA").save(buf, format="PNG")
        b64_t = base64.b64encode(buf.getvalue()).decode("ascii")
        character_asset_list.append({
            "path": thumb_rel_path,
            "data": f"data:image/png;base64,{b64_t}"
        })

    # File nhân vật độc lập <safe_base>.character.json (chứa trọn bộ CompositeCharacter và 18 Animations)
    standalone_character_data = dict(composite_character)
    standalone_character_data["assets"] = character_asset_list

    char_json_path = os.path.join(proj_dir, f"{safe_base}.character.json")
    with open(char_json_path, "w", encoding="utf-8") as f:
        json.dump(standalone_character_data, f, ensure_ascii=False, indent=2)

    root_char_json_path = os.path.join(output_dir, f"{safe_base}.character.json")
    with open(root_char_json_path, "w", encoding="utf-8") as f:
        json.dump(standalone_character_data, f, ensure_ascii=False, indent=2)

    # Lưu thêm file config.json chuẩn ver2.0.0 để hỗ trợ nút `📥 Import` trong CompositeCharacterEditor
    config_json_data = {
        "version": "ver2.0.0",
        "type": "composite",
        "name": safe_base,
        "elementType": "composite",
        "children": config_children,
        "animations": mounted_animations,
        "character": standalone_character_data,
        "assets": character_asset_list,
    }
    config_json_path = os.path.join(proj_dir, "config.json")
    with open(config_json_path, "w", encoding="utf-8") as f:
        json.dump(config_json_data, f, ensure_ascii=False, indent=2)

    # Đóng gói toàn bộ thư mục funny_animation_project thành gói `<safe_base>_funny_animation.paulto`
    paulto_path = os.path.join(output_dir, f"{safe_base}_funny_animation.paulto")
    with zipfile.ZipFile(paulto_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for root_dir, _, files in os.walk(proj_dir):
            for file_item in files:
                abs_f = os.path.join(root_dir, file_item)
                rel_f = os.path.relpath(abs_f, proj_dir).replace("\\", "/")
                zf.write(abs_f, arcname=rel_f)

    return {
        "project_dir": proj_dir,
        "anime_file": anime_file_path,
        "config_json": config_json_path,
        "paulto_file": paulto_path,
        "mounted_presets_count": len(mounted_animations),
        "standardized_parts": sorted(list(used_recommended_names)),
    }


def export_character_animation(
    layers: list,
    canvas_w: int,
    canvas_h: int,
    anim_cfg: dict,
    output_dir: str,
    base_name: str = "character_anim"
) -> dict:
    """
    Xuất toàn bộ chuỗi chuyển động của nhân vật ra đa định dạng để import vào các phần mềm khác:
    1. Dự án chuẩn Funny Animation Assistant (`funny_animation_project/<base>.anime`, `config.json`, `<base>_funny_animation.paulto`).
    2. Thư mục `png_sequence/` chứa từng frame PNG nền trong suốt (frame_0001.png, ...).
    3. File Sprite Sheet (`<base>_spritesheet.png` + `<base>_spritesheet.json`).
    4. File ảnh động GIF nền trong suốt (`<base>_animation.gif`).
    5. File Video MP4 (`<base>_animation.mp4`).
    6. File cấu hình Rig & Pivot (`<base>_rig_project.json`).
    7. File nén trọn gói (`<base>_animation_pack.zip`).
    """
    os.makedirs(output_dir, exist_ok=True)
    seq_dir = os.path.join(output_dir, "png_sequence")
    os.makedirs(seq_dir, exist_ok=True)

    safe_base = sanitize_filename(base_name or "character_anim")
    duration = max(0.5, min(15.0, float(anim_cfg.get("duration", 3.0))))
    fps = max(6, min(60, int(anim_cfg.get("fps", 24))))
    total_frames = max(2, int(round(duration * fps)))

    decoded_images = {}
    for lyr in layers:
        try:
            img_str = lyr.get("image", "")
            if "," in img_str:
                _, encoded = img_str.split(",", 1)
            else:
                encoded = img_str
            img_bytes = base64.b64decode(encoded)
            pil = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
            decoded_images[lyr["id"]] = np.array(pil)
        except Exception as e:
            print(f"Error decoding layer {lyr.get('id')}: {e}")

    visible_layers = [l for l in layers if l.get("visible", True)]
    if visible_layers:
        min_lx = min(float(l.get("pos_x", l.get("x", 0))) for l in visible_layers)
        min_ly = min(float(l.get("pos_y", l.get("y", 0))) for l in visible_layers)
        max_lx = max(float(l.get("pos_x", l.get("x", 0))) + float(l.get("w", 100)) for l in visible_layers)
        max_ly = max(float(l.get("pos_y", l.get("y", 0))) + float(l.get("h", 100)) for l in visible_layers)
        max_dim = max(max(float(l.get("w", 100)), float(l.get("h", 100))) for l in visible_layers)
        pad = max(90, int(round(max_dim * 0.35)))

        export_w = max(256, int(math.ceil((max_lx - min_lx) + pad * 2)))
        export_h = max(256, int(math.ceil((max_ly - min_ly) + pad * 2)))
        if export_w % 2 != 0:
            export_w += 1
        if export_h % 2 != 0:
            export_h += 1

        shift_ex = pad - min_lx
        shift_ey = pad - min_ly
        render_layers = []
        for l in layers:
            lc = dict(l)
            lc["pos_x"] = float(l.get("pos_x", l.get("x", 0))) + shift_ex
            lc["pos_y"] = float(l.get("pos_y", l.get("y", 0))) + shift_ey
            render_layers.append(lc)
        canvas_w = export_w
        canvas_h = export_h
    else:
        render_layers = layers

    frames_rgba = []
    png_files = []

    for idx in range(total_frames):
        t = idx / float(fps)
        frame = render_animation_frame(render_layers, decoded_images, canvas_w, canvas_h, t, anim_cfg)
        frames_rgba.append(frame)

        frame_fname = f"frame_{idx + 1:04d}.png"
        frame_path = os.path.join(seq_dir, frame_fname)
        Image.fromarray(frame, "RGBA").save(frame_path, format="PNG")
        png_files.append(frame_path)

    # 0. Xuất gói dự án chuẩn cho "Funny Animation Assistant" (.anime + .paulto + config.json)
    funny_pkg = export_funny_animation_package(
        layers=layers,
        decoded_images=decoded_images,
        anim_cfg=anim_cfg,
        output_dir=output_dir,
        safe_base=safe_base,
        thumbnail_rgba=frames_rgba[0] if frames_rgba else None,
    )

    # 1. Tạo Sprite Sheet (.png + .json)
    cols = min(8, max(1, int(math.ceil(math.sqrt(total_frames)))))
    rows = int(math.ceil(total_frames / float(cols)))

    max_sheet_dim = 8192
    scale_sheet = min(1.0, max_sheet_dim / float(max(cols * canvas_w, rows * canvas_h)))
    cell_w = max(1, int(round(canvas_w * scale_sheet)))
    cell_h = max(1, int(round(canvas_h * scale_sheet)))

    sheet_rgba = np.zeros((rows * cell_h, cols * cell_w, 4), dtype=np.uint8)
    sheet_meta = {
        "app": "SpriteSplit Studio",
        "base_name": safe_base,
        "fps": fps,
        "duration": duration,
        "total_frames": total_frames,
        "frame_width": cell_w,
        "frame_height": cell_h,
        "columns": cols,
        "rows": rows,
        "frames": []
    }

    for idx, frm in enumerate(frames_rgba):
        r = idx // cols
        c = idx % cols
        if scale_sheet < 0.999:
            cell_img = cv2.resize(frm, (cell_w, cell_h), interpolation=cv2.INTER_AREA)
        else:
            cell_img = frm
        y0 = r * cell_h
        x0 = c * cell_w
        sheet_rgba[y0:y0 + cell_h, x0:x0 + cell_w] = cell_img
        sheet_meta["frames"].append({
            "frame": idx + 1,
            "x": x0,
            "y": y0,
            "w": cell_w,
            "h": cell_h,
            "time": round(idx / float(fps), 4)
        })

    spritesheet_png_path = os.path.join(output_dir, f"{safe_base}_spritesheet.png")
    spritesheet_json_path = os.path.join(output_dir, f"{safe_base}_spritesheet.json")
    Image.fromarray(sheet_rgba, "RGBA").save(spritesheet_png_path, format="PNG")
    with open(spritesheet_json_path, "w", encoding="utf-8") as f:
        json.dump(sheet_meta, f, ensure_ascii=False, indent=2)

    # 2. Tạo ảnh động GIF nền trong suốt (.gif)
    gif_path = os.path.join(output_dir, f"{safe_base}_animation.gif")
    pil_frames = [Image.fromarray(f, "RGBA") for f in frames_rgba]
    frame_duration_ms = max(20, int(round(1000.0 / fps)))
    pil_frames[0].save(
        gif_path,
        save_all=True,
        append_images=pil_frames[1:],
        duration=frame_duration_ms,
        loop=0,
        disposal=2
    )

    # 3. Tạo Video MP4 (.mp4)
    mp4_path = os.path.join(output_dir, f"{safe_base}_animation.mp4")
    bg_mode = anim_cfg.get("export_bg", "dark")
    if bg_mode == "green":
        bg_color = np.array([0, 255, 0], dtype=np.float32)
    elif bg_mode == "white":
        bg_color = np.array([255, 255, 255], dtype=np.float32)
    else:
        bg_color = np.array([24, 24, 27], dtype=np.float32)

    vid_w = canvas_w if canvas_w % 2 == 0 else canvas_w + 1
    vid_h = canvas_h if canvas_h % 2 == 0 else canvas_h + 1
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    vw = cv2.VideoWriter(mp4_path, fourcc, float(fps), (vid_w, vid_h))

    for frm in frames_rgba:
        alpha = (frm[:, :, 3:4].astype(np.float32)) / 255.0
        rgb = frm[:, :, :3].astype(np.float32)
        comp_rgb = (rgb * alpha + bg_color * (1.0 - alpha)).astype(np.uint8)
        comp_bgr = cv2.cvtColor(comp_rgb, cv2.COLOR_RGB2BGR)
        if comp_bgr.shape[1] != vid_w or comp_bgr.shape[0] != vid_h:
            comp_bgr = cv2.resize(comp_bgr, (vid_w, vid_h), interpolation=cv2.INTER_LINEAR)
        vw.write(comp_bgr)
    vw.release()

    # 4. Lưu file cấu hình Rig & Pivot (.json)
    rig_json_path = os.path.join(output_dir, f"{safe_base}_rig_project.json")
    rig_export_data = {
        "app": "SpriteSplit Studio Rig & Pivot Project",
        "version": "2.0",
        "canvas_width": canvas_w,
        "canvas_height": canvas_h,
        "animation_config": anim_cfg,
        "layers": [
            {
                "id": l["id"],
                "name": l["name"],
                "role": l.get("role", "custom"),
                "funny_name": ROLE_TO_FUNNY_NAME.get(l.get("role", "custom"), ""),
                "pos_x": l.get("pos_x", l.get("x", 0)),
                "pos_y": l.get("pos_y", l.get("y", 0)),
                "w": l["w"],
                "h": l["h"],
                "pivot_x": l.get("pivot_x", 0),
                "pivot_y": l.get("pivot_y", 0),
                "parent_id": l.get("parent_id", None),
                "z_index": l.get("z_index", 0),
                "visible": l.get("visible", True),
                "opacity": l.get("opacity", 255),
                "motion": l.get("motion", {})
            }
            for l in layers
        ]
    }
    with open(rig_json_path, "w", encoding="utf-8") as f:
        json.dump(rig_export_data, f, ensure_ascii=False, indent=2)

    # 5. Đóng gói tất cả vào 1 file ZIP tổng hợp
    zip_path = os.path.join(output_dir, f"{safe_base}_animation_pack.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(spritesheet_png_path, arcname=os.path.basename(spritesheet_png_path))
        zf.write(spritesheet_json_path, arcname=os.path.basename(spritesheet_json_path))
        zf.write(gif_path, arcname=os.path.basename(gif_path))
        if os.path.exists(mp4_path):
            zf.write(mp4_path, arcname=os.path.basename(mp4_path))
        zf.write(rig_json_path, arcname=os.path.basename(rig_json_path))
        if os.path.exists(funny_pkg["paulto_file"]):
            zf.write(funny_pkg["paulto_file"], arcname=os.path.basename(funny_pkg["paulto_file"]))
        for p in png_files:
            zf.write(p, arcname=f"png_sequence/{os.path.basename(p)}")

    return {
        "status": "success",
        "output_dir": output_dir,
        "total_frames": total_frames,
        "fps": fps,
        "duration": duration,
        "spritesheet_png": spritesheet_png_path,
        "spritesheet_json": spritesheet_json_path,
        "gif_file": gif_path,
        "mp4_file": mp4_path,
        "rig_json": rig_json_path,
        "zip_file": zip_path,
        "funny_anime_file": funny_pkg["anime_file"],
        "funny_config_json": funny_pkg["config_json"],
        "funny_paulto_file": funny_pkg["paulto_file"],
        "funny_project_dir": funny_pkg["project_dir"],
        "funny_presets_count": funny_pkg["mounted_presets_count"],
        "funny_standardized_parts": funny_pkg["standardized_parts"],
    }

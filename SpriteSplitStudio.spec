# -*- mode: python ; coding: utf-8 -*-
import sys
import os

block_cipher = None

datas = [
    ('static', 'static'),
    ('example', 'example'),
    ('sample.png', '.'),
    ('icon.ico', '.'),
    ('icon.png', '.'),
]

hiddenimports = [
    'uvicorn',
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.lifespan',
    'uvicorn.lifespan.on',
    'fastapi',
    'starlette',
    'starlette.routing',
    'starlette.responses',
    'starlette.staticfiles',
    'pydantic',
    'pytoshop',
    'pytoshop.core',
    'pytoshop.layers',
    'pytoshop.enums',
    'pytoshop.image_resources',
    'psd_tools',
    'six',
    'cv2',
    'PIL',
    'PIL.Image',
    'numpy',
    'webview',
    'clr_loader',
    'pythonnet',
    'tkinter',
    'tkinter.filedialog',
    'core.animator',
    'core.psd_exporter',
    'core.segmenter',
]

a = Analysis(
    ['main.py'],
    pathex=['.'],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='SpriteSplitStudio',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False, # Không hiện cửa sổ console đen, chỉ hiện giao diện app đẹp
    icon='icon.ico', # Biểu tượng desktop tùy chỉnh cho ứng dụng
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='SpriteSplitStudio',
)

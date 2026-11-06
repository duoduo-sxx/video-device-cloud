#!/usr/bin/env python3
"""
生成应用图标（不依赖 Electron 自带图标）
---------------------------------------------------------------------------
设计：渐变圆角方块 + 白色 N 字标 + 右下角播放三角，主色沿用系统 #4B5BF5。

产物：
    build/icon.png   512×512，用于窗口/关于页/文档
    build/icon.ico   16~256 多尺寸，供 electron-builder 打包 Windows exe

用法：
    python3 scripts/make-icon.py            # 输出到 build/
    python3 scripts/make-icon.py /tmp/out   # 输出到指定目录

依赖：Pillow（pip install pillow）
"""

from __future__ import annotations

import pathlib
import sys

from PIL import Image, ImageDraw, ImageFilter

# 与 src/styles/tokens.css 中的主色体系保持一致
GRAD_TOP = (79, 92, 246)      # #4F5CF6
GRAD_BOTTOM = (139, 92, 246)  # #8B5CF6
WHITE = (255, 255, 255, 255)

ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]
SS = 4  # 超采样倍数，保证小尺寸边缘干净


def _lerp(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def _rounded_mask(size: int, radius_ratio: float = 0.225) -> Image.Image:
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, size - 1, size - 1], radius=int(size * radius_ratio), fill=255
    )
    return mask


def _background(size: int) -> Image.Image:
    """斜向渐变底 + 左上柔和高光。"""
    grad = Image.new('RGB', (size, size))
    gd = ImageDraw.Draw(grad)
    # 用对角线投影做渐变，比纯垂直更有体积感
    for y in range(size):
        t = y / max(size - 1, 1)
        gd.line([(0, y), (size, y)], fill=_lerp(GRAD_TOP, GRAD_BOTTOM, t))

    shade = Image.new('L', (size, size), 0)
    ImageDraw.Draw(shade).ellipse(
        [-int(size * 0.45), -int(size * 0.65), int(size * 0.75), int(size * 0.45)], fill=70
    )
    shade = shade.filter(ImageFilter.GaussianBlur(size * 0.12))
    highlight = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    highlight.putalpha(shade)

    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    img.paste(grad, (0, 0))
    img = Image.alpha_composite(img, highlight)

    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), _rounded_mask(size))
    return out


def _draw_mark(img: Image.Image) -> Image.Image:
    """白色 N 字标：左右竖笔 + 斜笔，转角略有圆角。"""
    size = img.size[0]
    u = size / 100.0
    layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    x_left, x_right = 22 * u, 72 * u
    y_top, y_bottom = 21 * u, 67 * u
    stroke = 11.5 * u
    radius = stroke * 0.42

    # 左右两根竖笔
    for x in (x_left, x_right - stroke):
        d.rounded_rectangle([x, y_top, x + stroke, y_bottom], radius=radius, fill=WHITE)

    # 斜笔：从左上竖笔内侧连到右下竖笔内侧
    # 端点下/上各内缩 1.5u，避免方形端点在竖笔圆角处露出一个小尖角
    inset = 1.5 * u
    d.polygon(
        [
            (x_left + stroke, y_top + inset),
            (x_left + stroke + 9 * u, y_top + inset),
            (x_right, y_bottom - inset),
            (x_right - 9 * u, y_bottom - inset),
        ],
        fill=WHITE,
    )

    img = Image.alpha_composite(img, layer)
    return img


def _draw_play_badge(img: Image.Image) -> Image.Image:
    """右下角播放三角徽标，暗示「可交付/运行」。"""
    size = img.size[0]
    u = size / 100.0
    layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    cx, cy, r = 74.5 * u, 74.5 * u, 14.5 * u

    # 先画一圈半透明暗环：把徽标与字母笔画在视觉上分开，避免糊成一体
    d.ellipse(
        [cx - r - 3 * u, cy - r - 3 * u, cx + r + 3 * u, cy + r + 3 * u],
        fill=(38, 24, 122, 70),
    )
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 255, 255, 255))

    # 三角略微右移，视觉重心居中
    tri = [
        (cx - 4.2 * u, cy - 6.5 * u),
        (cx + 6.5 * u, cy),
        (cx - 4.2 * u, cy + 6.5 * u),
    ]
    d.polygon(tri, fill=(91, 88, 246, 255))

    return Image.alpha_composite(img, layer)


def render(size: int) -> Image.Image:
    big = size * SS
    img = _draw_mark(_background(big))
    img = _draw_play_badge(img)
    # 回到目标尺寸前再裁一次圆角，避免外扩元素溢出圆角
    alpha = Image.composite(img.getchannel('A'), Image.new('L', (big, big), 0), _rounded_mask(big))
    img.putalpha(alpha)
    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    out_dir = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'build')
    out_dir.mkdir(parents=True, exist_ok=True)

    frames = {s: render(s) for s in ICO_SIZES}
    frames[512] = render(512)

    frames[512].save(out_dir / 'icon.png')
    frames[256].save(out_dir / 'icon.ico', format='ICO', sizes=[(s, s) for s in ICO_SIZES])

    for s in (16, 32, 64):
        frames[s].save(out_dir / f'preview-{s}.png')

    print(f'已生成：{out_dir / "icon.png"}（512）、{out_dir / "icon.ico"}（{len(ICO_SIZES)} 个尺寸）')


if __name__ == '__main__':
    main()

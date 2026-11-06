"""
应用图标生成脚本 —— 视频清晰度增强系统（VidClear Studio）

设计说明：
  底色沿用产品主色渐变（#4F7CFF → #22D3A6，135°），与 Web 端 UI 的
  --gradient 令牌完全一致，保证"图标 - 界面"是同一套视觉语言。
  图形部分用「四角取景框 + 中心锐化星芒」表达"把模糊画面框出来、提锐增强"，
  全部为几何图形，不依赖字体，16px 下依然可辨。

用法：
  python3 scripts/gen-icon.py
产物：
  build/icon.png     1024×1024，用于 Linux / 文档 / 商店
  build/icon.ico     16~256 多尺寸，electron-builder 打 Windows 用
  public/favicon.png 256×256，Web 端标签页图标
"""

import math
import os

from PIL import Image, ImageDraw

SS = 4  # 超采样倍数，先画大图再缩，边缘才干净
BASE = 1024
S = BASE * SS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

C_FROM = (79, 124, 255)   # --primary
C_TO = (34, 211, 166)     # --success
WHITE = (255, 255, 255)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def diagonal_gradient(size):
    """135° 线性渐变：左上偏蓝，右下偏青。先用 64×64 画再放大，取插值平滑。"""
    small = Image.new("RGB", (64, 64))
    px = small.load()
    for y in range(64):
        for x in range(64):
            px[x, y] = lerp(C_FROM, C_TO, (x + y) / 126)
    return small.resize((size, size), Image.BICUBIC)


def rounded_mask(size, radius):
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return mask


def polyline_bracket(draw, pts, stroke):
    """沿路径密集盖章圆形笔刷：无缝、自带圆帽，不会出现接缝毛边。"""
    r = stroke / 2
    dense = []
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        seg = math.hypot(x2 - x1, y2 - y1)
        n = max(1, int(seg / (r * 0.5)))
        for i in range(n):
            t = i / n
            dense.append((x1 + (x2 - x1) * t, y1 + (y2 - y1) * t))
    dense.append(pts[-1])
    for (cx, cy) in dense:
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=WHITE)


def bracket(draw, x, y, sx, sy, arm, stroke, radius):
    """画一个取景框直角：拐角圆弧过渡，两臂等长。

    (x, y) 为框角点，sx/sy 指明两臂延伸方向（+1 向右/向下，-1 向左/向上）。
    """
    r = radius
    ccx = x + r * sx
    ccy = y + r * sy

    # 水平臂末端
    hx = x + sx * (r + arm)
    # 竖直臂末端
    vy = y + sy * (r + arm)

    pts = [(hx, y), (x + sx * r, y)]
    # 拐角圆弧：从指向水平臂的角度扫到指向竖直臂的角度（走 90° 短弧）
    a_from = math.atan2(y - ccy, (x + sx * r) - ccx)
    a_to = math.atan2((y + sy * r) - ccy, x - ccx)
    delta = a_to - a_from
    while delta > math.pi:
        delta -= 2 * math.pi
    while delta < -math.pi:
        delta += 2 * math.pi
    steps = 12
    for i in range(1, steps):
        t = a_from + delta * i / steps
        pts.append((ccx + r * math.cos(t), ccy + r * math.sin(t)))
    pts.append((x, y + sy * r))
    pts.append((x, vy))
    polyline_bracket(draw, pts, stroke)


def sparkle(draw, cx, cy, radius, inner_ratio=0.16):
    """四角星芒 ✦：外尖 + 内凹的 8 点多边形，边缘平直，任何尺寸都锐利。"""
    R = radius
    w = radius * inner_ratio
    pts = [
        (cx, cy - R), (cx + w, cy - w),
        (cx + R, cy), (cx + w, cy + w),
        (cx, cy + R), (cx - w, cy + w),
        (cx - R, cy), (cx - w, cy - w),
    ]
    draw.polygon(pts, fill=WHITE)


def main():
    canvas = diagonal_gradient(S)
    canvas = canvas.convert("RGBA")

    # 左上角一层极淡的高光，避免整块纯渐变显得平
    glow = Image.new("L", (S, S), 0)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-S * 0.35, -S * 0.55, S * 0.85, S * 0.55], fill=46)
    glow = glow.filter(__import__("PIL.ImageFilter", fromlist=["GaussianBlur"]).GaussianBlur(S * 0.12))
    canvas = Image.composite(Image.new("RGBA", (S, S), (255, 255, 255, 255)), canvas, glow)

    # 底部极淡的压暗，增加体积感
    shade = Image.new("L", (S, S), 0)
    sd = ImageDraw.Draw(shade)
    sd.ellipse([-S * 0.2, S * 0.55, S * 1.2, S * 1.35], fill=34)
    shade = shade.filter(__import__("PIL.ImageFilter", fromlist=["GaussianBlur"]).GaussianBlur(S * 0.14))
    canvas = Image.composite(Image.new("RGBA", (S, S), (10, 20, 40, 255)), canvas, shade)

    draw = ImageDraw.Draw(canvas)

    # 4:3 取景框（视频画幅），四角留缺口，中心放星芒
    left, top, right, bottom = 232 * SS, 316 * SS, 792 * SS, 708 * SS
    stroke = 50 * SS
    arm = 118 * SS
    corner_r = 40 * SS
    for sx, x in ((1, left), (-1, right)):
        for sy, y in ((1, top), (-1, bottom)):
            bracket(draw, x, y, sx, sy, arm, stroke, corner_r)

    # 中心主星芒
    sparkle(draw, 512 * SS, 512 * SS, 168 * SS)

    art = canvas.resize((BASE, BASE), Image.LANCZOS)
    art.putalpha(rounded_mask(BASE, 228))

    # 内描边：让圆角边缘在浅色桌面上也不"糊"
    edge = Image.new("RGBA", (BASE, BASE), (0, 0, 0, 0))
    ImageDraw.Draw(edge).rounded_rectangle(
        [2, 2, BASE - 3, BASE - 3], radius=226, outline=(255, 255, 255, 38), width=4
    )
    art = Image.alpha_composite(art, edge)

    os.makedirs(os.path.join(ROOT, "build"), exist_ok=True)
    os.makedirs(os.path.join(ROOT, "public"), exist_ok=True)

    png = os.path.join(ROOT, "build", "icon.png")
    art.save(png)

    ico = os.path.join(ROOT, "build", "icon.ico")
    art.save(ico, sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])

    art.resize((256, 256), Image.LANCZOS).save(os.path.join(ROOT, "public", "favicon.png"))

    print(f"icon.png  {png}")
    print(f"icon.ico  {ico}")
    print(f"favicon   {os.path.join(ROOT, 'public', 'favicon.png')}")


if __name__ == "__main__":
    main()

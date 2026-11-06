"""生成「云枢 DataRelay」应用图标（无第三方图库依赖，仅用 Pillow）。

产物：
  build/icon.png  512x512 透明底主图标
  build/icon.ico  多尺寸 Windows 图标（16/24/32/48/64/128/256）
  build/icon.svg  矢量源文件（便于二次修改）

设计：品牌蓝渐变圆角方块 + 白色云体，云内以负空间切出双向箭头，表达「云端双向中继」。
"""
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path

S = 2048                     # 超采样画布
OUT = Path(__file__).resolve().parent.parent / "build"
OUT.mkdir(parents=True, exist_ok=True)

TOP = (46, 123, 255)         # #2E7BFF
BOTTOM = (11, 63, 168)       # #0B3FA8


def vertical_gradient(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        t = y / (size - 1)
        # 轻微缓动，让上半部更亮
        t = t ** 0.92
        c = tuple(round(TOP[i] + (BOTTOM[i] - TOP[i]) * t) for i in range(3))
        for x in range(size):
            px[x, y] = c
    return img


def rounded_mask(size: int, radius_ratio: float = 0.225) -> Image.Image:
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * radius_ratio), fill=255)
    return m


def cloud_mask(size: int) -> Image.Image:
    """云体剪影：三个圆 + 底部圆角矩形，坐标按 1024 基准等比缩放。"""
    k = size / 1024
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)

    def ell(cx, cy, r):
        d.ellipse([(cx - r) * k, (cy - r) * k, (cx + r) * k, (cy + r) * k], fill=255)

    ell(400, 470, 148)        # 左肩
    ell(566, 408, 186)        # 主峰
    ell(716, 500, 126)        # 右肩
    d.rounded_rectangle([252 * k, 470 * k, 842 * k, 686 * k], radius=108 * k, fill=255)
    return m


def arrow_mask(size: int) -> Image.Image:
    """双向箭头（云内负空间）。"""
    k = size / 1024
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    t = 40  # 杆厚度（1024 基准）

    # 上箭头：向右
    d.rounded_rectangle([360 * k, (536 - t / 2) * k, 636 * k, (536 + t / 2) * k], radius=t / 2 * k, fill=255)
    d.polygon([(612 * k, 480 * k), (730 * k, 536 * k), (612 * k, 592 * k)], fill=255)
    # 下箭头：向左
    d.rounded_rectangle([388 * k, (620 - t / 2) * k, 664 * k, (620 + t / 2) * k], radius=t / 2 * k, fill=255)
    d.polygon([(412 * k, 564 * k), (294 * k, 620 * k), (412 * k, 676 * k)], fill=255)
    return m


def build_master() -> Image.Image:
    grad = vertical_gradient(S).convert("RGBA")
    base = Image.new("RGBA", (S, S), (0, 0, 0, 0))

    # 顶部高光，增加体积感
    glow = Image.new("L", (S, S), 0)
    ImageDraw.Draw(glow).ellipse([-S * 0.25, -S * 0.55, S * 1.05, S * 0.45], fill=90)
    glow = glow.filter(ImageFilter.GaussianBlur(S * 0.09))
    grad = Image.composite(Image.new("RGBA", (S, S), (255, 255, 255, 255)), grad, glow.point(lambda v: int(v * 0.35)))

    base.paste(grad, (0, 0), rounded_mask(S))

    # 云体减去箭头区域
    cloud = cloud_mask(S)
    arrows = arrow_mask(S)
    cloud = Image.composite(Image.new("L", (S, S), 0), cloud, arrows)

    white = Image.new("RGBA", (S, S), (255, 255, 255, 255))
    base.paste(white, (0, 0), cloud)
    return base


def main() -> None:
    master = build_master()
    png512 = master.resize((512, 512), Image.LANCZOS)
    png512.save(OUT / "icon.png")

    sizes = [16, 24, 32, 48, 64, 128, 256]
    frames = [master.resize((s, s), Image.LANCZOS) for s in sizes]
    frames[-1].save(OUT / "icon.ico", format="ICO",
                    sizes=[(s, s) for s in sizes], append_images=frames[:-1])

    svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2E7BFF"/>
      <stop offset="1" stop-color="#0B3FA8"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="115" fill="url(#bg)"/>
  <path fill="#fff" fill-rule="evenodd" d="
    M200 343h198a63 63 0 0 0 4-126 93 93 0 0 0-177-27 74 74 0 0 0-25 153z
    M180 268h138v20H180z M300 240l60 28-60 28z
    M194 310h138v20H194z M232 282l-60 28 60 28z"/>
</svg>
"""
    (OUT / "icon.svg").write_text(svg, encoding="utf-8")
    print("icon.png / icon.ico / icon.svg generated ->", OUT)


if __name__ == "__main__":
    main()

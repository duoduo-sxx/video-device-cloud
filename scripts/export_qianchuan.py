"""把千川账户列表 xlsx 导出为项目内的规范化 JSON / CSV / TS 数据文件。

- 账户 ID 保留字符串（16 位，不能转 number）
- 带千分位的金额文本统一去掉逗号后转 number
- 原表没有日期、曝光、点击、转化、计划、创意字段，导出文件不补造
"""
import json
import csv
from pathlib import Path

from openpyxl import load_workbook

SRC = Path("/Users/sxx/Downloads/营销投放数据-巨量千川-竞价(全域投放)-账户列表-1795076531959_25248772.xlsx")
PROJECT = Path(__file__).resolve().parents[1]

HEADERS = [
    "关注状态", "账户ID", "账户名称", "一级行业名称", "二级行业名称", "账户组",
    "总余额", "消耗", "整体成交订单数", "整体支付ROI", "整体成交订单成本",
    "整体成交金额", "赠款余额", "非赠款余额", "转账金额", "转账次数",
]

NUMERIC = {"总余额", "消耗", "整体成交订单数", "整体支付ROI", "整体成交订单成本",
           "整体成交金额", "赠款余额", "非赠款余额", "转账金额", "转账次数"}


def normalize(raw):
    if raw is None:
        return "" if not isinstance(raw, (int, float)) else raw
    if isinstance(raw, (int, float)):
        return raw
    text = str(raw).strip().replace(",", "")
    if not text:
        return ""
    try:
        return float(text) if "." in text else int(text)
    except ValueError:
        return str(raw).strip()


def main():
    wb = load_workbook(SRC, read_only=True, data_only=True)
    ws = wb[wb.sheetnames[0]]
    # 源文件的 dimension 元数据写成了 A1:A1，强制重算后再按固定列数读取
    ws.reset_dimensions()
    rows = list(ws.iter_rows(min_row=1, max_col=len(HEADERS), values_only=True))
    assert list(rows[0]) == HEADERS, (rows[0], HEADERS)

    records = []
    for raw in rows[1:]:
        if not any(v is not None and str(v).strip() for v in raw):
            continue
        rec = {}
        for key, value in zip(HEADERS, raw):
            rec[key] = normalize(value) if key in NUMERIC else str(value).strip() if value is not None else ""
        rec["账户ID"] = str(rec["账户ID"]).replace(".0", "")
        records.append(rec)
    wb.close()

    assert len(records) == 595, len(records)
    assert len({r["账户ID"] for r in records}) == 595
    for r in records:
        assert abs(r["总余额"] - r["赠款余额"] - r["非赠款余额"]) < 0.02, r
        if r["消耗"] > 0:
            assert abs(r["整体支付ROI"] - r["整体成交金额"] / r["消耗"]) < 0.02, r
            assert abs(r["整体成交订单成本"] - r["消耗"] / r["整体成交订单数"]) < 0.02, r

    out_dir = PROJECT / "scripts"
    json_path = out_dir / "qianchuan_accounts.json"
    csv_path = out_dir / "qianchuan_accounts.csv"
    json_path.write_text(json.dumps(records, ensure_ascii=False), encoding="utf-8")
    with csv_path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=HEADERS)
        writer.writeheader()
        writer.writerows(records)

    active = [r for r in records if r["消耗"] > 0]
    print(f"rows={len(records)} active={len(active)}")
    print(f"spend={sum(r['消耗'] for r in records):.2f}")
    print(f"gmv={sum(r['整体成交金额'] for r in records):.2f}")
    print(f"orders={sum(r['整体成交订单数'] for r in records)}")
    print(f"roi={sum(r['整体成交金额'] for r in records) / sum(r['消耗'] for r in records):.4f}")
    print(json_path)
    print(csv_path)


if __name__ == "__main__":
    main()

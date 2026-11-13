"""修改 TSV 文案后运行此脚本；官网直接加载生成的 en.js。"""
import json
from pathlib import Path

root = Path(__file__).resolve().parent
translations = {}
for name in ('site', 'chart'):
    translations[name] = dict(line.split('\t', 1) for line in (root / f'{name}-en.tsv').read_text().splitlines())
(root / 'en.js').write_text('// 展示层英文词典；专业术语与原文一一对应。\nwindow.GuaguaEnglish = ' + json.dumps(translations, ensure_ascii=False, indent=2) + ';\n')

"""Build static GeoNames search shards and IANA time transitions (Python 3.9+).
Usage: python3 build-global-data.py cities500.zip admin1CodesASCII.txt output-dir [compiled-zoneinfo-dir]
Uses the installed TZif database; never downloads or sends birth information.
"""
import sys, json, zipfile, re, unicodedata
from pathlib import Path
from datetime import datetime, timezone
from zoneinfo import ZoneInfo, available_timezones, reset_tzpath
from zoneinfo._common import load_data

source, admin_file, output = sys.argv[1:4]
zone_root = Path(sys.argv[4]) if len(sys.argv) > 4 else Path('/usr/share/zoneinfo')
reset_tzpath([str(zone_root.resolve())])
out = Path(output)
(out / 'cities').mkdir(parents=True, exist_ok=True)
admins = {a[0]: a[1] for line in Path(admin_file).read_text().splitlines() if len(a := line.split('\t')) >= 2}
def normalize(s):
    return re.sub(r'[^a-z0-9\u3400-\u9fff ]', '', ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if unicodedata.category(c) != 'Mn')).strip()
def bucket(s):
    return s[0] if s[0].isascii() and s[0].isalnum() else 'han'
shards, zones, count = {}, set(), 0
with zipfile.ZipFile(source) as z:
    for line in z.read('cities500.txt').decode().splitlines():
        a = line.split('\t')
        if len(a) < 19 or not a[17]: continue
        names = {normalize(a[1]), normalize(a[2])}
        for name in a[3].split(','):
            if (re.fullmatch(r'[A-Za-z][A-Za-z .’\x27-]{2,79}', name) or re.fullmatch(r'[\u3400-\u9fff]{2,20}', name)):
                names.add(normalize(name))
        names.discard('')
        by_bucket = {}
        for name in sorted(names): by_bucket.setdefault(bucket(name), []).append(name)
        base = [int(a[0]), a[1], a[8], admins.get(a[8]+'.'+a[10], a[10]), float(a[4]), float(a[5]), a[17], int(a[14] or 0)]
        for key, aliases in by_bucket.items(): shards.setdefault(key, []).append(base + [aliases])
        zones.add(a[17]); count += 1
for key, rows in shards.items():
    (out / 'cities' / (key+'.json')).write_text(json.dumps(rows, ensure_ascii=False, separators=(',', ':')))
print('City records:', count, '; shards:', len(shards), flush=True)

start = int(datetime(1899,12,30,tzinfo=timezone.utc).timestamp())
end = int(datetime(2101,1,3,tzinfo=timezone.utc).timestamp())
zone_data = {}
zones.update(available_timezones())
for name in sorted(zones):
    zone = ZoneInfo(name)
    def state(t):
        dt = datetime.fromtimestamp(t, timezone.utc).astimezone(zone)
        return [int(dt.utcoffset().total_seconds()), int(bool(dt.dst().total_seconds())), dt.tzname()]
    with open(zone_root / name, 'rb') as f:
        ids, times, offsets, dst, abbr, tail = load_data(f)
    records = [[start, *state(start)]]
    for t in times:
        if start < t < end:
            entry = [t, *state(t)]
            if entry[1:] != records[-1][1:]: records.append(entry)
    # TZif POSIX尾部规则由ZoneInfo展开，避免2038年之后误用最后一个冬令时。
    if tail and b',' in tail:
        t = max(start, times[-1] if times else start)
        previous = state(t)
        while t < end:
            nxt = min(t + 86400, end)
            current = state(nxt)
            if current != previous:
                lo, hi = t, nxt
                while hi-lo > 1:
                    mid = (lo+hi)//2
                    if state(mid) == previous: lo=mid
                    else: hi=mid
                if hi < end: records.append([hi, *state(hi)])
            previous, t = current, nxt
    zone_data[name] = records
version_file = zone_root / '+VERSION'
version = version_file.read_text().strip()
(out / 'timezones.json').write_text(json.dumps({'version':version, 'start':start, 'end':end, 'zones':zone_data}, separators=(',', ':')))
(out / 'manifest.json').write_text(json.dumps({'cityCount':count,'tzVersion':version,'startYear':1900,'endYear':2100,'source':'GeoNames cities500 / IANA TZDB','shards':sorted(shards)},indent=2))
print('Time zones:', len(zone_data), '; IANA', version, flush=True)

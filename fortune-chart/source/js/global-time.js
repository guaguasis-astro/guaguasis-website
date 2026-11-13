// 读取随站点发布的IANA历史规则；不依赖访客设备时区，也不推测夏令时。
export function offsetAt(records, instant) {
    let lo = 0, hi = records.length;
    while (lo + 1 < hi) {
        const mid = (lo + hi) >> 1;
        if (records[mid][0] <= instant) lo = mid; else hi = mid;
    }
    const [, seconds, daylight, abbreviation] = records[lo];
    return { seconds, daylight: Boolean(daylight), abbreviation };
}

export function resolveZonedTime(data, zoneId, database, occurrence = '') {
    const records = database.zones[zoneId];
    if (!records) return { mode: 'unsupported', candidates: [] };
    const wall = Date.UTC(data.year, data.month - 1, data.day, data.hour, data.minute || 0, data.second || 0) / 1000;
    if (!Number.isFinite(wall) || data.year < 1900 || data.year > 2100) return { mode: 'out-of-range', candidates: [] };
    const candidates = [...new Set(records.map(row => row[1]))].map(seconds => {
        const instant = wall - seconds;
        const state = offsetAt(records, instant);
        return state.seconds === seconds ? { instant, timezone: seconds / 3600, ...state } : null;
    }).filter(Boolean).sort((a, b) => a.instant - b.instant);
    if (!candidates.length) return { mode: 'invalid', candidates };
    if (candidates.length > 1 && !['earlier', 'later'].includes(occurrence)) return { mode: 'ambiguous', candidates };
    const chosen = occurrence === 'later' ? candidates.at(-1) : candidates[0];
    return { mode: 'resolved', ...chosen, zoneId, repeated: candidates.length > 1, candidates };
}

export function formatUTC(hours) {
    const totalSeconds = Math.round(Math.abs(hours) * 3600);
    const h = Math.floor(totalSeconds / 3600), m = Math.floor(totalSeconds % 3600 / 60), s = totalSeconds % 60;
    return `UTC${hours < 0 ? '−' : '+'}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}${s ? ':' + String(s).padStart(2, '0') : ''}`;
}

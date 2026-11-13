// 中国大陆1986—1991年全国夏时制，按出生记录上的钟表时间判断。
// 1986年通知推迟至5月4日开始；切换时刻见官方通知及 IANA tzdb asia。
import { getCityLatLng } from './cities.js';

export const MAINLAND_DST_DATES = {
    1986: { start: '05-04', end: '09-14' },
    1987: { start: '04-12', end: '09-13' },
    1988: { start: '04-10', end: '09-11' },
    1989: { start: '04-16', end: '09-17' },
    1990: { start: '04-15', end: '09-16' },
    1991: { start: '04-14', end: '09-15' },
};

export function isMainlandPlace(place) {
    const query = (place || '').trim();
    if (!query || /香港|澳门|澳門|台湾|台灣|臺灣|台北|臺北/.test(query)) return false;
    const city = getCityLatLng(query);
    if (city) return /省|市|自治区/.test(city.province) && !/香港|澳门|台湾/.test(city.province);
    // 支持带大陆省份的县乡名称，不通过经纬度矩形猜测国界。
    return /^(?:中国|中國|中国大陆)?(?:北京市?|上海市?|天津市?|重庆市?|河北|山西|辽宁|吉林|黑龙江|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|海南|四川|贵州|云南|陕西|甘肃|青海|内蒙古|广西|西藏|宁夏|新疆)/.test(query);
}

export function resolveMainlandTime({ year, month, day, hour, minute = 0, place, dstOccurrence = '' }) {
    if (!isMainlandPlace(place)) return { mode: 'unmanaged', timezone: null };
    const dates = MAINLAND_DST_DATES[year];
    if (!dates) return { mode: 'standard', timezone: 8 };
    const date = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const minutes = hour * 60 + minute;
    // 开始日02:00直接跳到03:00，该小时没有对应的实际时刻。
    if (date === dates.start && minutes >= 120 && minutes < 180) {
        return { mode: 'invalid', timezone: null };
    }
    // 结束日02:00拨回01:00，01:00—01:59出现两次，需由出生记录区分。
    if (date === dates.end && minutes >= 60 && minutes < 120) {
        if (!['daylight', 'standard'].includes(dstOccurrence)) return { mode: 'ambiguous', timezone: null };
        return { mode: dstOccurrence, timezone: dstOccurrence === 'daylight' ? 9 : 8, repeated: true };
    }
    const daylight = (date > dates.start && date < dates.end)
        || (date === dates.start && minutes >= 180)
        || (date === dates.end && minutes < 60);
    return { mode: daylight ? 'daylight' : 'standard', timezone: daylight ? 9 : 8 };
}

// 只改计算使用的时区，保留出生记录的日期、小时和分钟，避免重复减一小时。
export function applyMainlandTime(birthData) {
    // 已按IANA历史时区或用户明确手动指定，不再被旧大陆兼容逻辑覆盖。
    if (birthData.timezoneResolved) return birthData;
    const result = resolveMainlandTime(birthData);
    if (result.mode === 'invalid') throw new Error('夏令时开始当天02:00直接跳到03:00，请核对出生记录上的时间。');
    if (result.mode === 'ambiguous') throw new Error('夏令时结束当天这个时间出现过两次，请选择拨表前或拨表后。');
    if (result.mode === 'unmanaged') return birthData;
    return { ...birthData, timezone: result.timezone, daylightSaving: result.mode === 'daylight', dstRepeated: !!result.repeated };
}

import { cityShard, findCities } from './global-cities.js';
import { resolveZonedTime, formatUTC } from './global-time.js';
const byId = id => document.getElementById(id);
const en = () => window.GuaguaI18n?.language === 'en';
const tr = (zh, english) => en() ? english : zh;
const shards = new Map();
let timezonePromise;
function loadJSON(path) {
    return fetch(new URL('./data/' + path, location.href)).then(response => {
        if (!response.ok) throw new Error('Location data unavailable');
        return response.json();
    });
}
function loadTimezones() {
    if (!timezonePromise) timezonePromise = loadJSON('timezones.json').catch(error => { timezonePromise = null; throw error; });
    return timezonePromise;
}
export function initLocationForm() {
    const place = byId('birthPlace'), results = byId('cityResults'), hint = byId('locationHint');
    const manual = byId('manualLocation'), tzSelect = byId('timezone'), timeHint = byId('timezoneHint');
    const occurrence = byId('dstOccurrence'), group = byId('dstOccurrenceGroup');
    let selected = null, database = null, resolved = null, timer, generation = 0;
    const data = () => {
        const [year, month, day] = byId('birthDate').value.split('-').map(Number);
        const [hour, minute] = byId('birthTime').value.split(':').map(Number);
        return { year, month, day, hour, minute };
    };
    function setOffset(value) {
        // 历史偏移可精确到秒，不能四舍五入到最近的预设时区。
        let option = [...tzSelect.options].find(option => Number(option.value) === value);
        if (!option) { option = new Option(formatUTC(value), String(value)); tzSelect.add(option); }
        option.textContent = formatUTC(value) + (selected ? ` · ${selected[6]}` : '');
        tzSelect.value = option.value;
    }
    function sync(resetChoice = false) {
        if (resetChoice) occurrence.value = '';
        byId('birthTime').setCustomValidity('');
        group.hidden = true; occurrence.required = false; resolved = null;
        if (manual.checked) {
            if (tzSelect.selectedIndex < 0) tzSelect.value = '8';
            timeHint.textContent = tr('手动模式：请填写出生当天实际使用的UTC偏移，包含夏令时。', 'Manual mode: enter the UTC offset actually used on the birth date, including daylight saving time.');
            return;
        }
        if (!selected || !database) {
            tzSelect.selectedIndex = -1;
            timeHint.textContent = tr('选择城市后，按出生日期自动计算时区。', 'Choose a city to calculate the historical UTC offset.');
            return;
        }
        resolved = resolveZonedTime(data(), selected[6], database, occurrence.value);
        const prefix = `${selected[6]} · `;
        if (resolved.mode === 'ambiguous' || resolved.repeated) {
            group.hidden = false; occurrence.required = true;
            occurrence.options[1].textContent = tr('第一次出现，拨表前', 'First occurrence, before the clock change') + ' · ' + formatUTC(resolved.candidates[0].timezone);
            occurrence.options[2].textContent = tr('第二次出现，拨表后', 'Second occurrence, after the clock change') + ' · ' + formatUTC(resolved.candidates.at(-1).timezone);
        }
        if (resolved.mode === 'invalid') {
            const message = tr('这个当地时间因拨表而不存在，请核对出生记录。', 'This local time did not occur because the clocks moved forward. Please check the birth record.');
            timeHint.textContent = prefix + message; byId('birthTime').setCustomValidity(message);
        } else if (resolved.mode === 'ambiguous') {
            timeHint.textContent = prefix + tr('这个当地时间出现过两次，请选择拨表前或拨表后。', 'This local time occurred twice. Choose before or after the clock change.');
        } else if (resolved.mode === 'resolved') {
            setOffset(resolved.timezone);
            timeHint.textContent = prefix + formatUTC(resolved.timezone) + ' · ' + (resolved.daylight ? tr('夏令时', 'Daylight saving time') : tr('标准时', 'Standard time'))
                + tr('；已按出生当天的历史规则计算。', '; calculated using the rules on the birth date.')
                + (data().year < 1970 ? tr(' 1970年前的地方记录可能不完整，请与出生记录核对。', ' Local records before 1970 may be incomplete; verify against the birth record.') : '');
        } else {
            timeHint.textContent = tr('暂不支持该日期或时区，请改用手动模式（自动模式支持1900—2100年）。', 'Date or time zone unavailable. Use manual mode. Automatic mode supports 1900–2100.');
        }
    }
    async function choose(row) {
        const token = ++generation;
        selected = null; resolved = null; results.replaceChildren();
        hint.textContent = tr('正在读取历史时区规则…', 'Loading historical time-zone rules…');
        try {
            database = await loadTimezones();
            if (token !== generation || manual.checked) return;
            selected = row;
            place.value = row[1];
            byId('latitude').value = row[4]; byId('longitude').value = row[5];
            const country = new Intl.DisplayNames([en() ? 'en' : 'zh-CN'], { type: 'region' }).of(row[2]);
            hint.textContent = `${row[1]} · ${row[3]} · ${country}`;
            sync(true);
        } catch (_) {
            if (token === generation) hint.textContent = tr('城市数据加载失败，请重试，或使用手动模式。', 'Could not load location data. Try again or use manual mode.');
        }
    }
    async function search() {
        const token = ++generation;
        selected = null; resolved = null; sync(true); results.replaceChildren();
        const query = place.value.trim();
        if (manual.checked || query.length < 2) { hint.textContent = tr('输入城市名后，从列表中确认地点。', 'Enter a city name, then confirm a location from the list.'); return; }
        hint.textContent = tr('正在搜索全球城市…', 'Searching cities worldwide…');
        try {
            const key = cityShard(query);
            if (!shards.has(key)) shards.set(key, loadJSON('cities/' + key + '.json').catch(error => { shards.delete(key); throw error; }));
            const rows = await shards.get(key);
            if (token !== generation || manual.checked) return;
            const matches = findCities(rows, query, en() ? 'en' : 'zh-CN');
            hint.textContent = matches.length ? tr('请确认国家和地区，再选择城市。同名结果较多时可输入“城市, 国家”。', 'Check the country and region, then choose a city. Refine with “city, country” for namesakes.')
                : tr('未找到匹配城市。可尝试英文名，或手动填写经纬度和UTC偏移。', 'No matching city. Try an English name, or enter coordinates and UTC offset manually.');
            const countries = new Intl.DisplayNames([en() ? 'en' : 'zh-CN'], { type: 'region' });
            for (const row of matches) {
                const button = document.createElement('button');
                button.type = 'button'; button.className = 'city-choice';
                button.textContent = `${row[1]} · ${row[3]} · ${countries.of(row[2])} (${row[2]})`;
                button.addEventListener('click', () => choose(row)); results.append(button);
            }
        } catch (_) {
            if (token === generation) hint.textContent = tr('城市数据加载失败，请重试，或使用手动模式。', 'Could not load location data. Try again or use manual mode.');
        }
    }
    function changed() {
        ++generation; selected = null; resolved = null; results.replaceChildren();
        if (!manual.checked) { byId('latitude').value = ''; byId('longitude').value = ''; }
        sync(true);
        hint.textContent = tr('输入城市名后，从列表中确认地点。', 'Enter a city name, then confirm a location from the list.');
        clearTimeout(timer); timer = setTimeout(search, 250);
    }
    function modeChanged() {
        ++generation; selected = null; resolved = null; results.replaceChildren(); clearTimeout(timer);
        for (const id of ['latitude', 'longitude']) byId(id).readOnly = !manual.checked;
        tzSelect.disabled = !manual.checked;
        hint.textContent = tr('输入城市名后，从列表中确认地点。', 'Enter a city name, then confirm a location from the list.');
        sync(true);
        if (!manual.checked && place.value.trim()) search();
    }
    place.addEventListener('input', event => { if (!event.isComposing) changed(); });
    place.addEventListener('compositionend', changed);
    place.addEventListener('keydown', event => { if (event.key === 'Enter' && !manual.checked) { event.preventDefault(); clearTimeout(timer); search(); } });
    manual.addEventListener('change', modeChanged);
    for (const id of ['birthDate', 'birthTime']) byId(id).addEventListener('input', () => sync(true));
    occurrence.addEventListener('change', () => sync());
    window.addEventListener('guagua-languagechange', () => {
        if (!manual.checked && selected) {
            const country = new Intl.DisplayNames([en() ? 'en' : 'zh-CN'], {type:'region'}).of(selected[2]);
            hint.textContent = `${selected[1]} · ${selected[3]} · ${country}`; sync();
        } else if (!manual.checked) search(); else sync();
    });
    modeChanged();
    return {
        search,
        sync,
        getBirthLocation() {
            sync();
            if (manual.checked) return { timezone: Number(tzSelect.value), timezoneResolved: true, timezoneSource: 'manual' };
            if (!selected || resolved?.mode !== 'resolved') {
                hint.textContent = tr('请从搜索结果中选择城市，并确认有效的出生时间。', 'Choose a city from the results and confirm a valid birth time.');
                if (resolved?.mode === 'ambiguous') occurrence.focus();
                else if (resolved?.mode === 'invalid') byId('birthTime').reportValidity();
                else place.focus();
                return null;
            }
            return { timezone: resolved.timezone, timezoneResolved: true, timezoneSource: 'iana',
                timeZoneId: selected[6], daylightSaving: resolved.daylight, dstRepeated: resolved.repeated,
                timezoneAbbreviation: resolved.abbreviation, geonameId: selected[0] };
        }
    };
}

// 出生信息文本解析器
// 支持多种格式的自动识别

// 月份名称映射
const MONTH_NAMES = {
    // 英文
    'jan': 1, 'january': 1,
    'feb': 2, 'february': 2,
    'mar': 3, 'march': 3,
    'apr': 4, 'april': 4,
    'may': 5,
    'jun': 6, 'june': 6,
    'jul': 7, 'july': 7,
    'aug': 8, 'august': 8,
    'sep': 9, 'sept': 9, 'september': 9,
    'oct': 10, 'october': 10,
    'nov': 11, 'november': 11,
    'dec': 12, 'december': 12,
    // 中文
    '一月': 1, '二月': 2, '三月': 3, '四月': 4, '五月': 5, '六月': 6,
    '七月': 7, '八月': 8, '九月': 9, '十月': 10, '十一月': 11, '十二月': 12,
    '1月': 1, '2月': 2, '3月': 3, '4月': 4, '5月': 5, '6月': 6,
    '7月': 7, '8月': 8, '9月': 9, '10月': 10, '11月': 11, '12月': 12,
};

// 常见时区缩写映射（仅做参考，优先用数字偏移）
const TIMEZONE_ABBR = {
    'cst': 8,      // 中国标准时间
    'awst': 8,     // 澳大利亚西部标准时间
    'jst': 9,      // 日本标准时间
    'kst': 9,      // 韩国标准时间
    'gmt': 0,
    'utc': 0,
    'est': -5,     // 美国东部时间
    'edt': -4,
    'cst_us': -6,  // 美国中部时间
    'pst': -8,     // 美国太平洋时间
    'pdt': -7,
    'cet': 1,      // 中欧时间
    'cest': 2,
    'ist': 5.5,    // 印度标准时间
};

/**
 * 解析出生信息文本
 * @param {string} text - 原始文本
 * @returns {Object} 解析结果
 */
export function parseBirthInfo(text) {
    const result = {
        name: '',
        year: null,
        month: null,
        day: null,
        hour: null,
        minute: null,
        second: 0,
        timezone: null,
        latitude: null,
        longitude: null,
        place: '',
        warnings: [],
    };

    if (!text || !text.trim()) {
        result.warnings.push('请输入出生信息文本');
        return result;
    }

    const raw = text.trim();
    const lower = raw.toLowerCase();

    // ===== 1. 提取日期 =====
    const dateResult = extractDate(raw, lower);
    if (dateResult) {
        result.year = dateResult.year;
        result.month = dateResult.month;
        result.day = dateResult.day;
    } else {
        result.warnings.push('未能识别出生日期');
    }

    // ===== 2. 提取时间 =====
    const timeResult = extractTime(raw, lower);
    if (timeResult) {
        result.hour = timeResult.hour;
        result.minute = timeResult.minute;
        result.second = timeResult.second || 0;
    } else {
        result.warnings.push('未能识别出生时间');
    }

    // ===== 3. 提取时区 =====
    const tzResult = extractTimezone(raw, lower);
    if (tzResult !== null) {
        result.timezone = tzResult;
    } else {
        result.warnings.push('未能识别时区，默认使用 UTC+8');
        result.timezone = 8;
    }

    // ===== 4. 提取经纬度 =====
    const latResult = extractLatitude(raw, lower);
    const lonResult = extractLongitude(raw, lower);
    if (latResult !== null) result.latitude = latResult;
    else result.warnings.push('未能识别纬度');
    if (lonResult !== null) result.longitude = lonResult;
    else result.warnings.push('未能识别经度');

    // ===== 5. 提取地点名 =====
    const placeResult = extractPlace(raw);
    if (placeResult) result.place = placeResult;

    // ===== 6. 提取姓名（开头的名字） =====
    const nameResult = extractName(raw);
    if (nameResult) result.name = nameResult;

    return result;
}

// 提取日期
function extractDate(raw, lower) {
    let year, month, day;

    // 格式1: 1997-12-13 或 1997/12/13
    let m = raw.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (m) {
        year = parseInt(m[1]);
        month = parseInt(m[2]);
        day = parseInt(m[3]);
        if (isValidDate(year, month, day)) return { year, month, day };
    }

    // 格式2: 12/13/1997 (美式)
    m = raw.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (m) {
        month = parseInt(m[1]);
        day = parseInt(m[2]);
        year = parseInt(m[3]);
        if (isValidDate(year, month, day)) return { year, month, day };
    }

    // 格式3: Dec 13 1997 或 December 13, 1997
    for (const [name, num] of Object.entries(MONTH_NAMES)) {
        const regex = new RegExp(`${name}[a-z]*\\s+(\\d{1,2})\\s*,?\\s*(\\d{4})`, 'i');
        m = raw.match(regex);
        if (m) {
            day = parseInt(m[1]);
            year = parseInt(m[2]);
            month = num;
            if (isValidDate(year, month, day)) return { year, month, day };
        }
    }

    // 格式4: 13 Dec 1997
    for (const [name, num] of Object.entries(MONTH_NAMES)) {
        const regex = new RegExp(`(\\d{1,2})\\s+${name}[a-z]*\\s+(\\d{4})`, 'i');
        m = raw.match(regex);
        if (m) {
            day = parseInt(m[1]);
            year = parseInt(m[2]);
            month = num;
            if (isValidDate(year, month, day)) return { year, month, day };
        }
    }

    // 格式5: 中文 1997年12月13日
    m = raw.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (m) {
        year = parseInt(m[1]);
        month = parseInt(m[2]);
        day = parseInt(m[3]);
        if (isValidDate(year, month, day)) return { year, month, day };
    }

    // 格式6: 点号分隔 1990.06.17 或 1990.6.17
    m = raw.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
    if (m) {
        year = parseInt(m[1]);
        month = parseInt(m[2]);
        day = parseInt(m[3]);
        if (isValidDate(year, month, day)) return { year, month, day };
    }

    return null;
}

// 提取时间
function extractTime(raw, lower) {
    let hour, minute, second = 0;
    let m;

    // 中文时间修饰词映射（offset: 需要叠加的小时数）
    const timePeriodMap = {
        '凌晨': 0, '早上': 0, '早晨': 0, '上午': 0, '中午': 12,
        '下午': 12, '傍晚': 12, '晚上': 12, '夜里': 12, '深夜': 12,
    };

    // === 格式1: 中文时段修饰词 + 时间（最优先，避免被普通时间匹配抢占）===
    for (const [period, offset] of Object.entries(timePeriodMap)) {
        // 1a: "早上4:50" / "下午3:15"
        m = raw.match(new RegExp(`${period}\\s*(\\d{1,2})[:：](\\d{2})`));
        if (m) {
            hour = parseInt(m[1]);
            minute = parseInt(m[2]);
            if (offset === 12 && hour < 12) hour += 12;
            if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
                return { hour, minute, second: 0 };
            }
        }

        // 1b: "晚上8点半"（半点钟，优先于"点分"格式匹配）
        m = raw.match(new RegExp(`${period}\\s*(\\d{1,2})点半`));
        if (m) {
            hour = parseInt(m[1]);
            minute = 30;
            if (offset === 12 && hour < 12) hour += 12;
            if (hour >= 0 && hour < 24) {
                return { hour, minute, second: 0 };
            }
        }

        // 1c: "早上4点50分" / "下午3点"
        m = raw.match(new RegExp(`${period}\\s*(\\d{1,2})点(?:(\\d{1,2})分)?`));
        if (m) {
            hour = parseInt(m[1]);
            minute = m[2] ? parseInt(m[2]) : 0;
            if (offset === 12 && hour < 12) hour += 12;
            if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
                return { hour, minute, second: 0 };
            }
        }
    }

    // === 格式2: 普通数字时间 08:10 / 08:10:30 ===
    m = raw.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (m) {
        hour = parseInt(m[1]);
        minute = parseInt(m[2]);
        second = m[3] ? parseInt(m[3]) : 0;

        // 检查 AM/PM
        const ampmMatch = raw.match(/(\d{1,2}):(\d{2})\s*(am|pm|a\.m\.|p\.m\.)/i);
        if (ampmMatch) {
            hour = parseInt(ampmMatch[1]);
            minute = parseInt(ampmMatch[2]);
            const isPM = /pm/i.test(ampmMatch[3]);
            if (isPM && hour < 12) hour += 12;
            if (!isPM && hour === 12) hour = 0;
        }

        if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
            return { hour, minute, second };
        }
    }

    // === 格式3: 中文 8时10分 ===
    m = raw.match(/(\d{1,2})时(\d{1,2})分/);
    if (m) {
        hour = parseInt(m[1]);
        minute = parseInt(m[2]);
        if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
            return { hour, minute, second: 0 };
        }
    }

    return null;
}

// 提取时区
function extractTimezone(raw, lower) {
    // 格式1: UTC+8 / GMT-5 / UTC+8:00
    let m = raw.match(/(?:utc|gmt)\s*([+-]?\d{1,2})(?::(\d{2}))?/i);
    if (m) {
        let tz = parseInt(m[1]);
        if (m[2]) tz += parseInt(m[2]) / 60 * Math.sign(tz || 1);
        return tz;
    }

    // 格式2: 时区缩写 + 偏移  如 AWST -8:00 / UTC+8 / GMT-5
    // 匹配带 + 或 - 号的时区偏移
    m = raw.match(/([a-z]{2,5})\s*([+-]\d{1,2})(?::(\d{2}))?/i);
    if (m) {
        const sign = m[2][0] === '+' ? 1 : -1;
        const hours = parseInt(m[2].substring(1));
        const minutes = m[3] ? parseInt(m[3]) : 0;
        const tz = sign * (hours + minutes / 60);
        return tz;
    }

    // 格式3: 单独的 UTC/GMT 偏移，不带时区缩写
    // 注意：要避开普通时间，必须有 UTC/GMT 前缀或者 +/- 号明确标识
    // 这种情况已经被格式1覆盖了

    // 格式3: 纯数字偏移，比如 "08:00" 前面有时区缩写
    m = raw.match(/\b([a-z]{2,5})\s+(\d{1,2}):(\d{2})\b/i);
    if (m) {
        const abbr = m[1].toLowerCase();
        // 如果是时区缩写
        if (TIMEZONE_ABBR[abbr] !== undefined) {
            return TIMEZONE_ABBR[abbr];
        }
    }

    // 格式4: 时区缩写
    for (const [abbr, offset] of Object.entries(TIMEZONE_ABBR)) {
        if (lower.includes(abbr)) {
            return offset;
        }
    }

    // 格式5: 中文时区
    if (/北京时间|中国标准时间|cst/i.test(raw)) {
        return 8;
    }
    if (/台北时间|台湾时间/i.test(raw)) {
        return 8;
    }
    if (/东京时间|日本时间|jst/i.test(raw)) {
        return 9;
    }
    if (/纽约时间|美东|est/i.test(raw)) {
        // 这里简化，实际有夏令时问题
        return -5;
    }

    return null;
}

// 提取纬度
function extractLatitude(raw, lower) {
    // 优先级：带度符号的 > 不带的；英文方向 > 中文方向（中文容易误匹配）

    // 格式1: 十进制 + 度符号 + 英文方向  如 39.9°N（最明确，优先级最高）
    let m = raw.match(/(?:^|[^\d.])(\d{1,2}\.\d+)°\s*([ns])\b/i);
    if (m) {
        let lat = parseFloat(m[1]);
        if (m[2].toLowerCase() === 's') lat = -lat;
        if (Math.abs(lat) <= 90) return lat;
    }

    // 格式2: 度分 + 方向在中间（Astro Gold 格式）如 29°N30'
    m = raw.match(/(?:^|[^\d.])(\d{1,2})°\s*([ns])\s*(\d{1,2})['′]/i);
    if (m) {
        let lat = parseInt(m[1]) + parseInt(m[3]) / 60;
        if (m[2].toLowerCase() === 's') lat = -lat;
        if (Math.abs(lat) <= 90) return lat;
    }

    // 格式3: 度分 + 方向在后面 如 29°30'N
    m = raw.match(/(?:^|[^\d.])(\d{1,2})°\s*(\d{1,2})['′]\s*([ns])\b/i);
    if (m) {
        let lat = parseInt(m[1]) + parseInt(m[2]) / 60;
        if (m[3].toLowerCase() === 's') lat = -lat;
        if (Math.abs(lat) <= 90) return lat;
    }

    // 格式4: 整数度 + 方向 如 29°N
    m = raw.match(/(?:^|[^\d.])(\d{1,2})°\s*([ns])\b/i);
    if (m) {
        let lat = parseInt(m[1]);
        if (m[2].toLowerCase() === 's') lat = -lat;
        if (Math.abs(lat) <= 90) return lat;
    }

    // 格式5: 不带度符号，方向字母 + 分  如 29 N 30' 或 29 N30'
    m = raw.match(/(?:^|[^\d.])(\d{1,2})\s+([ns])\s*(\d{1,2})['′]/i);
    if (m) {
        let lat = parseInt(m[1]) + parseInt(m[3]) / 60;
        if (m[2].toLowerCase() === 's') lat = -lat;
        if (Math.abs(lat) <= 90) return lat;
    }

    // 格式6: 中文 + 度分 如 北纬29度30分 / 29度30分北纬
    // 中文匹配需要更谨慎，避免匹配到"北京""南京"等地名
    m = raw.match(/(?:北纬|南纬)(\d{1,2})[°度]\s*(\d{1,2})?/i);
    if (m) {
        let lat = parseInt(m[1]);
        if (m[2]) lat += parseInt(m[2]) / 60;
        if (/南纬/.test(raw.substring(raw.indexOf(m[0]) - 2, raw.indexOf(m[0])))) lat = -lat;
        if (Math.abs(lat) <= 90) return lat;
    }

    return null;
}

// 提取经度
function extractLongitude(raw, lower) {
    // 优先级：带度符号的 > 不带的；英文方向 > 中文方向

    // 格式1: 十进制 + 度符号 + 英文方向  如 116.4°E（最明确）
    let m = raw.match(/(?:^|[^\d.])(\d{1,3}\.\d+)°\s*([ew])\b/i);
    if (m) {
        let lon = parseFloat(m[1]);
        if (m[2].toLowerCase() === 'w') lon = -lon;
        if (Math.abs(lon) <= 180) return lon;
    }

    // 格式2: 度分 + 方向在中间（Astro Gold 格式）如 111°E37'
    m = raw.match(/(?:^|[^\d.])(\d{1,3})°\s*([ew])\s*(\d{1,2})['′]/i);
    if (m) {
        let lon = parseInt(m[1]) + parseInt(m[3]) / 60;
        if (m[2].toLowerCase() === 'w') lon = -lon;
        if (Math.abs(lon) <= 180) return lon;
    }

    // 格式3: 度分 + 方向在后面 如 111°37'E
    m = raw.match(/(?:^|[^\d.])(\d{1,3})°\s*(\d{1,2})['′]\s*([ew])\b/i);
    if (m) {
        let lon = parseInt(m[1]) + parseInt(m[2]) / 60;
        if (m[3].toLowerCase() === 'w') lon = -lon;
        if (Math.abs(lon) <= 180) return lon;
    }

    // 格式4: 整数度 + 方向 如 111°E
    m = raw.match(/(?:^|[^\d.])(\d{1,3})°\s*([ew])\b/i);
    if (m) {
        let lon = parseInt(m[1]);
        if (m[2].toLowerCase() === 'w') lon = -lon;
        if (Math.abs(lon) <= 180) return lon;
    }

    // 格式5: 不带度符号，方向字母 + 分  如 111 E 37' 或 111 E37'
    m = raw.match(/(?:^|[^\d.])(\d{1,3})\s+([ew])\s*(\d{1,2})['′]/i);
    if (m) {
        let lon = parseInt(m[1]) + parseInt(m[3]) / 60;
        if (m[2].toLowerCase() === 'w') lon = -lon;
        if (Math.abs(lon) <= 180) return lon;
    }

    // 格式6: 中文 如 东经116度 / 116度东经
    m = raw.match(/(?:东经|西经)(\d{1,3})[°度]\s*(\d{1,2})?/i);
    if (m) {
        let lon = parseInt(m[1]);
        if (m[2]) lon += parseInt(m[2]) / 60;
        if (/西经/.test(raw.substring(raw.indexOf(m[0]) - 2, raw.indexOf(m[0])))) lon = -lon;
        if (Math.abs(lon) <= 180) return lon;
    }

    return null;
}

// 提取地点名（启发式）
function extractPlace(raw) {
    // 尝试找 "地点：xxx" 或 "place: xxx" 格式
    let m = raw.match(/(?:地点|place|出生于|出生地)[:：]\s*([^;\n，]+)/i);
    if (m) return m[1].trim();

    // 中文格式1: "XX省XX市" / "XX省XX县" / "XX市XX区"（最完整的优先匹配）
    m = raw.match(/([一-龥]{2,}省[一-龥]{2,}(?:市|县|区))/);
    if (m) return m[1];

    // 中文格式2: "XX市" / "XX县" / "XX区"
    m = raw.match(/([一-龥]{2,}(?:市|县|区))/);
    if (m) return m[1];

    // 中文格式3: "XX省"（只有省份）
    m = raw.match(/([一-龥]{2,}省)/);
    if (m) return m[1];

    // 中文格式4: 逗号/句号后面的2-4个汉字（可能是城市名）
    // 如 "早上4:50，淄博" → 淄博
    const parts = raw.split(/[，,。、；;]/).map(s => s.trim()).filter(s => s.length > 0);
    for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i];
        // 跳过包含时间、日期数字的部分
        if (/[\d年月日时点分秒]/.test(part)) continue;
        // 2-4个汉字，可能是城市名
        if (/^[一-龥]{2,4}$/.test(part)) {
            return part;
        }
    }

    // 英文模式: 城市, 省份, 国家
    m = raw.match(/([a-z]+,\s*[a-z]+(?:,\s*[a-z]+)?)/i);
    if (m) return m[1];

    return '';
}

// 提取姓名（启发式：开头的非日期非数字的词）
function extractName(raw) {
    // 取第一个 token，如果不是日期相关的，可能是名字
    const tokens = raw.split(/[\s,，]+/).filter(t => t.length > 0);
    if (tokens.length === 0) return '';

    const firstToken = tokens[0];

    // 如果第一个词不包含数字，也不是月份或星期，可能是名字
    if (!/\d/.test(firstToken)
        && !/^(natal|birth|chart|星盘|本命|mon|tue|wed|thu|fri|sat|sun|星期一|星期二|星期三|星期四|星期五|星期六|星期日|周一周二周三周四周五周六周日)/i.test(firstToken)) {
        // 检查是不是中文名字（2-4个汉字）
        if (/^[一-龥]{2,4}$/.test(firstToken)) {
            return firstToken;
        }
        // 英文名字（首字母大写，长度合理）
        if (/^[a-z]+$/i.test(firstToken) && firstToken.length <= 20) {
            return firstToken;
        }
    }

    return '';
}

// 验证日期有效性
function isValidDate(year, month, day) {
    if (year < 1900 || year > 2100) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    return true;
}

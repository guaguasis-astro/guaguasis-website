import "../css/assessment-view.css";
// 主入口文件
import { initSwe, calculateBirthChart } from "./astrology.js";
import {
    renderOverview,
    renderFortune,
    renderPOI,
    renderAssets,
    renderFixedStars,
    renderTriplicity,
    renderInfoBar,
    symbolizeReport,
} from "./renderer.js";
import { parseBirthInfo } from "./parser.js";
import { getCityLatLng } from "./cities.js";
import { drawBirthChart } from "./chart-drawer.js";
import html2canvas from "html2canvas";
import { resolveMainlandTime, applyMainlandTime, isMainlandPlace } from "./china-dst.js";

let displayedChart = null;
let displayedChartSize = 600;
window.addEventListener("guagua-languagechange", () => {
    if (displayedChart) {
        renderInfoBar(displayedChart);
        renderOverview(displayedChart);
        renderFortune(displayedChart);
        renderPOI(displayedChart);
        renderAssets(displayedChart);
        renderFixedStars(displayedChart);
        renderTriplicity(displayedChart);
        symbolizeReport(document.querySelector(".content-area"));
        symbolizeReport(document.getElementById("infoAsc"));
        symbolizeReport(document.getElementById("infoMC"));
        drawBirthChart(document.getElementById("birthChart"), displayedChart, displayedChartSize);
        window.GuaguaI18n?.apply();
    }
});

// DOM 元素
const birthForm = document.getElementById("birthForm");
const inputSection = document.getElementById("inputSection");
const loadingSection = document.getElementById("loadingSection");
const resultSection = document.getElementById("resultSection");
const backBtn = document.getElementById("backBtn");
const calcBtn = document.getElementById("calcBtn");
const parseBtn = document.getElementById("parseBtn");
const parseText = document.getElementById("parseText");
const parseHint = document.getElementById("parseHint");

// 全球时区列表（UTC-12 到 UTC+14，含半小时/三刻钟偏移）

const TIMEZONES = [
    { value: -12, label: "UTC-12:00 贝克岛" },
    { value: -11, label: "UTC-11:00 萨摩亚/美属萨摩亚" },
    { value: -10, label: "UTC-10:00 夏威夷/檀香山" },
    { value: -9.5, label: "UTC-09:30 马克萨斯群岛" },
    { value: -9, label: "UTC-09:00 阿拉斯加" },
    { value: -8, label: "UTC-08:00 太平洋时间（美加）" },
    { value: -7, label: "UTC-07:00 山地时间（美加）" },
    { value: -6, label: "UTC-06:00 中部时间（美加）/墨西哥城" },
    { value: -5, label: "UTC-05:00 东部时间（美加）/波哥大/利马" },
    { value: -4.5, label: "UTC-04:30 委内瑞拉" },
    { value: -4, label: "UTC-04:00 大西洋时间（加）/圣地亚哥/卡拉卡斯" },
    { value: -3.5, label: "UTC-03:30 纽芬兰" },
    { value: -3, label: "UTC-03:00 布宜诺斯艾利斯/圣保罗/格陵兰" },
    { value: -2, label: "UTC-02:00 中大西洋" },
    { value: -1, label: "UTC-01:00 亚速尔群岛/佛得角" },
    { value: 0, label: "UTC±00:00 格林威治/伦敦/里斯本" },
    { value: 1, label: "UTC+01:00 巴黎/柏林/罗马/马德里" },
    { value: 2, label: "UTC+02:00 开罗/雅典/伊斯坦布尔/耶路撒冷" },
    { value: 3, label: "UTC+03:00 莫斯科/内罗毕/利雅得" },
    { value: 3.5, label: "UTC+03:30 德黑兰" },
    { value: 4, label: "UTC+04:00 迪拜/巴库/埃里温" },
    { value: 4.5, label: "UTC+04:30 喀布尔" },
    { value: 5, label: "UTC+05:00 巴基斯坦/塔什干" },
    { value: 5.5, label: "UTC+05:30 印度/斯里兰卡" },
    { value: 5.75, label: "UTC+05:45 尼泊尔" },
    { value: 6, label: "UTC+06:00 达卡/阿拉木图/科伦坡" },
    { value: 6.5, label: "UTC+06:30 仰光/曼德勒" },
    { value: 7, label: "UTC+07:00 曼谷/河内/雅加达" },
    { value: 8, label: "UTC+08:00 北京/上海/香港/台北/新加坡" },
    { value: 8.75, label: "UTC+08:45 尤克拉（澳）" },
    { value: 9, label: "UTC+09:00 东京/首尔/平壤" },
    { value: 9.5, label: "UTC+09:30 达尔文/阿德莱德" },
    { value: 10, label: "UTC+10:00 悉尼/墨尔本/关岛" },
    { value: 10.5, label: "UTC+10:30 豪勋爵岛" },
    { value: 11, label: "UTC+11:00 所罗门群岛/新喀里多尼亚" },
    { value: 12, label: "UTC+12:00 奥克兰/惠灵顿/斐济" },
    { value: 12.75, label: "UTC+12:45 查塔姆群岛" },
    { value: 13, label: "UTC+13:00 萨摩亚/汤加" },
    { value: 14, label: "UTC+14:00 莱恩群岛" },
];

// 初始化时区下拉
function initTimezoneSelect() {
    const tzSelect = document.getElementById("timezone");
    for (const tz of TIMEZONES) {
        const opt = document.createElement("option");
        opt.value = tz.value;
        opt.textContent = tz.label;
        tzSelect.appendChild(opt);
    }
    // 默认选东八区
    tzSelect.value = "8";
}

// 根据出生记录自动切换大陆夏令时；不改写出生时间输入。
let lastAutoTimezone = null;
function syncMainlandTimezone(resetChoice = false) {
    const dateInput = document.getElementById("birthDate");
    const timeInput = document.getElementById("birthTime");
    const tzSelect = document.getElementById("timezone");
    const hint = document.getElementById("timezoneHint");
    const repeatedGroup = document.getElementById("dstOccurrenceGroup");
    const occurrence = document.getElementById("dstOccurrence");
    const utc9Option = tzSelect.querySelector('option[value="9"]');
    if (utc9Option) utc9Option.textContent = "UTC+09:00 东京/首尔/平壤";
    if (resetChoice) occurrence.value = "";
    timeInput.setCustomValidity("");
    repeatedGroup.hidden = true;
    occurrence.required = false;
    hint.textContent = "";
    if (!dateInput.value || !timeInput.value) return;
    const [year, month, day] = dateInput.value.split("-").map(Number);
    const [hour, minute] = timeInput.value.split(":").map(Number);
    const place = document.getElementById("birthPlace").value.trim();
    const data = { year, month, day, hour, minute, place, dstOccurrence: occurrence.value };
    const result = resolveMainlandTime(data);
    if (result.mode === "unmanaged") {
        // 从大陆夏令时切换到其他地点，清除上一地点遗留的自动+9。
        if (lastAutoTimezone !== null && Number(tzSelect.value) === lastAutoTimezone) {
            const city = getCityLatLng(place);
            tzSelect.value = String(city ? city.timezone : 8);
        }
        lastAutoTimezone = null;
        return;
    }
    if (result.repeated || result.mode === "ambiguous") {
        repeatedGroup.hidden = false;
        occurrence.required = true;
    }
    if (result.mode === "invalid") {
        hint.textContent = "当天02:00直接跳到03:00，02:00—02:59不存在，请核对出生时间。";
        timeInput.setCustomValidity(hint.textContent);
        return;
    }
    if (result.mode === "ambiguous") {
        hint.textContent = "当天02:00拨回01:00，这个时间出现过两次，请在下方选择。";
        return;
    }
    if (result.mode === "daylight" && utc9Option) {
        utc9Option.textContent = "UTC+09:00 中国大陆夏令时";
    }
    tzSelect.value = String(result.timezone);
    lastAutoTimezone = result.timezone;
    hint.textContent = result.mode === "daylight"
        ? "已自动使用中国大陆夏令时 UTC+9，出生时间保持不变。"
        : "中国大陆此时使用 UTC+8。";
}
for (const id of ["birthDate", "birthTime"]) {
    document.getElementById(id).addEventListener("input", () => syncMainlandTimezone(true));
    document.getElementById(id).addEventListener("change", () => syncMainlandTimezone(true));
}
document.getElementById("dstOccurrence").addEventListener("change", () => syncMainlandTimezone());

// 返回按钮
backBtn.addEventListener("click", () => {
    resultSection.hidden = true;
    inputSection.hidden = false;
});

// 智能解析按钮
parseBtn.addEventListener("click", () => {
    const text = parseText.value.trim();
    if (!text) {
        parseHint.textContent = "请先粘贴出生信息文本";
        parseHint.className = "parse-hint error";
        return;
    }

    const result = parseBirthInfo(text);

    // 填充表单
    if (result.year && result.month && result.day) {
        const dateStr = `${result.year}-${String(result.month).padStart(2, "0")}-${String(result.day).padStart(2, "0")}`;
        document.getElementById("birthDate").value = dateStr;
    }

    if (result.hour !== null && result.minute !== null) {
        const timeStr = `${String(result.hour).padStart(2, "0")}:${String(result.minute).padStart(2, "0")}`;
        document.getElementById("birthTime").value = timeStr;
    }

    if (result.timezone !== null) {
        const tzSelect = document.getElementById("timezone");
        // 看看预设里有没有（找最接近的）
        let found = false;
        let closestValue = null;
        let minDiff = Infinity;
        for (const opt of tzSelect.options) {
            const val = parseFloat(opt.value);
            const diff = Math.abs(val - result.timezone);
            if (diff < minDiff) {
                minDiff = diff;
                closestValue = val;
            }
            if (diff < 0.01) {
                tzSelect.value = opt.value;
                found = true;
                break;
            }
        }
        if (!found && closestValue !== null) {
            tzSelect.value = String(closestValue);
            result.warnings.push(`时区 ${result.timezone} 已自动匹配到最近的 UTC${closestValue >= 0 ? '+' : ''}${closestValue}，请核实`);
        }
    }

    if (result.latitude !== null) {
        document.getElementById("latitude").value = result.latitude.toFixed(4);
    }
    if (result.longitude !== null) {
        document.getElementById("longitude").value = result.longitude.toFixed(4);
    }
    if (result.place) {
        document.getElementById("birthPlace").value = result.place;
    }

    // 如果解析到了地点，尝试用城市库定位经纬度和时区
    if (result.place) {
        const cityInfo = getCityLatLng(result.place);
        if (cityInfo) {
            // 经纬度
            if (result.latitude === null || result.longitude === null) {
                document.getElementById("latitude").value = cityInfo.lat.toFixed(4);
                document.getElementById("longitude").value = cityInfo.lng.toFixed(4);
                result.warnings = result.warnings.filter(w => !w.includes('纬度') && !w.includes('经度'));
            }
            // 时区（如果没解析到时区，或默认设的+8但城市不是中国的，都更新）
            const tzSelect = document.getElementById("timezone");
            const defaultTzWarningIndex = result.warnings.findIndex(w => w.includes('未能识别时区'));
            if (defaultTzWarningIndex >= 0 || result.timezone === null) {
                setTimezoneByValue(cityInfo.timezone, tzSelect);
                if (defaultTzWarningIndex >= 0) {
                    result.warnings.splice(defaultTzWarningIndex, 1);
                }
                result.warnings.push(`已根据"${cityInfo.city}"自动定位时区 UTC${cityInfo.timezone >= 0 ? '+' : ''}${cityInfo.timezone}，请核实`);
            }
        }
    }

    syncMainlandTimezone(true);
    if (isMainlandPlace(document.getElementById("birthPlace").value)) {
        result.warnings = result.warnings.filter(w => !w.includes("自动定位时区") && !w.includes("未能识别时区"));
    }

    // 显示结果提示
    if (result.warnings.length === 0) {
        parseHint.textContent = `✓ 解析成功${result.name ? `（姓名：${result.name}）` : ""}，请核对后点击"开始排盘"`;
        parseHint.className = "parse-hint success";
    } else {
        parseHint.textContent = `⚠ 解析完成，但有 ${result.warnings.length} 项需要确认：${result.warnings.join("；")}`;
        parseHint.className = "parse-hint error";
    }
});

// 表单提交
birthForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    syncMainlandTimezone();
    if (!birthForm.reportValidity()) return;

    // 获取表单数据
    const dateInput = document.getElementById("birthDate").value;
    const timeInput = document.getElementById("birthTime").value;
    const placeInput = document.getElementById("birthPlace").value;
    const timezone = parseFloat(document.getElementById("timezone").value);
    const lat = parseFloat(document.getElementById("latitude").value);
    const lon = parseFloat(document.getElementById("longitude").value);

    const [year, month, day] = dateInput.split("-").map(Number);
    const [hour, minute] = timeInput.split(":").map(Number);

    const birthData = applyMainlandTime({
        year,
        month,
        day,
        hour,
        minute,
        second: 0,
        lat,
        lon,
        timezone,
        place: placeInput,
        dstOccurrence: document.getElementById("dstOccurrence").value,
    });

    // 显示计算中状态（按钮变文字提示）
    const originalBtnText = "开 始 排 盘";
    calcBtn.querySelector("span").textContent = "计算中...";
    calcBtn.disabled = true;

    try {
        // 初始化星历表
        await initSwe();

        // 计算星盘
        const chart = await calculateBirthChart(birthData);

        // 渲染所有模块
        renderInfoBar(chart);
        renderOverview(chart);
        renderFortune(chart);
        renderPOI(chart);
        renderAssets(chart);
        renderFixedStars(chart);
        renderTriplicity(chart);
        symbolizeReport(document.querySelector(".content-area"));
        symbolizeReport(document.getElementById("infoAsc"));
        symbolizeReport(document.getElementById("infoMC"));

        // 绘制星盘图
        const canvas = document.getElementById("birthChart");
        // 响应式尺寸：桌面约600px居中，手机版与内容同宽
        const contentWidth = document.querySelector(".content-area")?.clientWidth || (window.innerWidth - 40);
        const chartSize = Math.min(600, contentWidth);
        displayedChart = chart;
        displayedChartSize = chartSize;
        canvas.style.width = chartSize + "px";
        canvas.style.height = chartSize + "px";

        // 先绘制一次兜底（字体可能还没加载，显示字母）
        drawBirthChart(canvas, chart, chartSize);

        // 等待 HamburgSymbols 字体加载完成后重绘（显示正确的符号）
        async function waitForHamburgFont() {
            try {
                if (document.fonts && document.fonts.load) {
                    // 主动触发字体加载并等待就绪
                    await document.fonts.load('20px "HamburgSymbols"');
                    return true;
                }
            } catch (e) {
                console.warn("HamburgSymbols 字体加载失败，使用备用字体", e);
            }
            return false;
        }

        waitForHamburgFont().then((ok) => {
            if (ok) {
                drawBirthChart(canvas, chart, chartSize);
            }
        });

        // 显示结果
        inputSection.hidden = true;
        resultSection.hidden = false;

        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
        console.error("计算出错:", error);
        alert("计算出错：" + error.message);
    } finally {
        calcBtn.querySelector("span").textContent = originalBtnText;
        calcBtn.disabled = false;
    }
});

// 根据数值设置时区下拉（找最接近的选项）
function setTimezoneByValue(tzValue, tzSelect) {
    let closestValue = null;
    let minDiff = Infinity;
    for (const opt of tzSelect.options) {
        const val = parseFloat(opt.value);
        const diff = Math.abs(val - tzValue);
        if (diff < minDiff) {
            minDiff = diff;
            closestValue = val;
        }
        if (diff < 0.01) {
            tzSelect.value = opt.value;
            return;
        }
    }
    if (closestValue !== null) {
        tzSelect.value = String(closestValue);
    }
}

// 根据地点名自动填充经纬度和时区
function fillByPlace(place) {
    if (!place) return;
    const cityInfo = getCityLatLng(place);
    if (cityInfo) {
        document.getElementById("latitude").value = cityInfo.lat.toFixed(4);
        document.getElementById("longitude").value = cityInfo.lng.toFixed(4);
        const tzSelect = document.getElementById("timezone");
        setTimezoneByValue(cityInfo.timezone, tzSelect);
    }
    syncMainlandTimezone(true);
}

// 城市库在本地，直接匹配；中文输入法选字完成后立即定位。
const birthPlaceInput = document.getElementById("birthPlace");
const updateBirthPlace = () => fillByPlace(birthPlaceInput.value.trim());
birthPlaceInput.addEventListener("input", (event) => {
    if (!event.isComposing) updateBirthPlace();
});
birthPlaceInput.addEventListener("compositionend", updateBirthPlace);
birthPlaceInput.addEventListener("change", updateBirthPlace);
birthPlaceInput.addEventListener("blur", updateBirthPlace);

// 保存报告为图片
const saveReportBtn = document.getElementById("saveReportBtn");
saveReportBtn.addEventListener("click", async () => {
    const originalText = "✦ 保存报告为图片 ✦";
    saveReportBtn.querySelector("span").textContent = "生成中...";
    saveReportBtn.disabled = true;

    const assessmentRoot = document.querySelector(".visual-assessment");
    const assessmentDetails = [...document.querySelectorAll(".visual-assessment details")];
    const originalOpenStates = assessmentDetails.map(detail => detail.open);

    try {
        assessmentRoot?.classList.add("va-export");
        assessmentDetails.forEach(detail => { detail.open = true; });
        await document.fonts.load('16px "HamburgSymbols"');

        // 截图目标：整个结果区域（不含按钮本身）
        window.GuaguaI18n?.apply();
        const target = document.querySelector(".content-area");

        // 临时隐藏按钮
        saveReportBtn.style.visibility = "hidden";

        const canvas = await html2canvas(target, {
            backgroundColor: "#f0e6d0", // 羊皮纸底色
            scale: 2, // 2倍分辨率，更清晰
            useCORS: true,
            logging: false,
        });

        // 恢复按钮
        saveReportBtn.style.visibility = "visible";

        // 生成文件名
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        const fileName = `${window.GuaguaI18n?.language === "en" ? "Guagua_Chart_Report" : "星盘报告"}_${dateStr}.png`;

        // 下载图片
        const link = document.createElement("a");
        link.download = fileName;
        link.href = canvas.toDataURL("image/png");
        link.click();

    } catch (error) {
        console.error("保存图片失败:", error);
        alert("保存图片失败：" + error.message);
    } finally {
        saveReportBtn.style.visibility = "visible";
        assessmentRoot?.classList.remove("va-export");
        assessmentDetails.forEach((detail, index) => { detail.open = originalOpenStates[index]; });
        saveReportBtn.querySelector("span").textContent = originalText;
        saveReportBtn.disabled = false;
    }
});

// 页面加载完成后初始化
document.addEventListener("DOMContentLoaded", () => {
    initTimezoneSelect();
    syncMainlandTimezone();
});

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
import { drawBirthChart } from "./chart-drawer.js";
import html2canvas from "html2canvas";
import { initLocationForm } from "./location-form.js";
let locationForm;

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

    if (result.timezone !== null) setTimezoneByValue(result.timezone, document.getElementById('timezone'));

    if (result.latitude !== null) {
        document.getElementById("latitude").value = result.latitude.toFixed(4);
    }
    if (result.longitude !== null) {
        document.getElementById("longitude").value = result.longitude.toFixed(4);
    }
    if (result.place) {
        document.getElementById("birthPlace").value = result.place;
    }

    // 文本明确给出经纬度和偏移时保留原值，转入显式手动模式。
    if (result.latitude !== null && result.longitude !== null && !result.warnings.some(w => w.includes('未能识别时区'))) {
        document.getElementById('manualLocation').checked = true;
        document.getElementById('manualLocation').dispatchEvent(new Event('change'));
    }
    // 地点必须由用户确认国家/地区，不能只凭第一个同名城市推定。
    if (result.place && !document.getElementById('manualLocation').checked) locationForm.search();
    else locationForm.sync(true);

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
    const birthLocation = locationForm.getBirthLocation();
    if (!birthLocation || !birthForm.reportValidity()) return;

    // 获取表单数据
    const dateInput = document.getElementById("birthDate").value;
    const timeInput = document.getElementById("birthTime").value;
    const placeInput = document.getElementById("birthPlace").value;
    const timezone = parseFloat(document.getElementById("timezone").value);
    const lat = parseFloat(document.getElementById("latitude").value);
    const lon = parseFloat(document.getElementById("longitude").value);

    const [year, month, day] = dateInput.split("-").map(Number);
    const [hour, minute] = timeInput.split(":").map(Number);

    const birthData = {
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
        ...birthLocation,
    };

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

// 手动解析也保留精确偏移，不近似到预设选项。
function setTimezoneByValue(value, select) {
    let option = [...select.options].find(option => Number(option.value) === value);
    if (!option) { option = new Option(`UTC${value >= 0 ? '+' : ''}${value}`, String(value)); select.add(option); }
    select.value = option.value;
}

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
    locationForm = initLocationForm();
});

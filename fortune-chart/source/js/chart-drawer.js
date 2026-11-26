// 星盘图绘制模块
// 使用 Canvas 绘制圆形本命星盘（整宫制 · 文艺复兴风格）
// 配色与页面统一：羊皮纸米色 + 鎏金色 + 深褐色

import { ZODIAC_SIGNS, PLANET_NAMES } from "./astrology.js";

import { ZODIAC_HAMBURG, PLANET_HAMBURG } from "./symbols.js";

// 行星符号（福点、南北交暂时用 Unicode，HamburgSymbols 键位待补充）
const PLANET_SYMBOLS = {
    POF: "⊕",
    NORTH_NODE: "☊",
    SOUTH_NODE: "☋",
};

// 文艺复兴风格配色（与页面 CSS 变量对齐）
const COLORS = {
    // 背景
    bgParchment: "#f7f0de",       // 羊皮纸底（bg-card）
    bgParchmentAlt: "#f2e9d2",    // 交替格（bg-card-alt）
    bgCenter: "#faf5e8",          // 中心圆（bg-cream）

    // 金色系
    goldDark: "#8b6914",          // 深鎏金
    gold: "#a67c00",              // 鎏金
    goldLight: "#c9a227",         // 浅鎏金
    goldPale: "#e8d5a3",          // 淡金

    // 文字
    textInk: "#1a120b",           // 墨色
    textBistre: "#3d2914",        // 深褐
    textSepia: "#6b4f2e",         // 墨褐
    textFaded: "#8b7355",         // 浅褐

    // 边框
    borderGold: "#b8922a",        // 金线
    borderLight: "#c4b089",       // 浅金线
    borderInk: "#8b7355",         // 墨线

    // 其他
    axisAsc: "#a67c00",           // 上升/下降：鎏金色
    axisMc: "#8b6914",            // 天顶/天底：深鎏金
    accentRed: "#b64040",         // 手机四轴与逆行行星
};

/**
 * 绘制圆形本命星盘（整宫制 · 文艺复兴风格）
 * @param {HTMLCanvasElement} canvas - Canvas 元素
 * @param {Object} chart - 星盘数据对象
 * @param {number} [logicalSize] - 逻辑像素尺寸（CSS 像素），不传则用 clientWidth
 */
export function drawBirthChart(canvas, chart, logicalSize) {
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const size = logicalSize || canvas.clientWidth || canvas.width;

    // 超采样高清：物理像素 = 逻辑像素 × max(DPR, 3)，确保高分屏清晰锐利
    const scale = Math.max(dpr, 3);
    const physicalSize = Math.round(size * scale);
    canvas.width = physicalSize;
    canvas.height = physicalSize;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";

    // 重置变换并按比例缩放
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    // 开启高质量图像平滑
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // 清空画布
    ctx.clearRect(0, 0, size, size);

    const center = size / 2;
    // 是否为小屏（手机版）
    const isSmallScreen = size < 500;

    // 星盘主体半径
    // 大屏：留出边距给四轴标签放在圈外
    // 小屏：四轴放在宫内，星盘撑满整个画布
    const chartRadius = isSmallScreen ? size / 2 - 6 : size / 2 - 55;
    const outerRadius = chartRadius;

    // 环的半径定义（从外到内）
    const r = {
        outermost: outerRadius,           // 星盘最外圈
        signOuter: outerRadius * 0.95,    // 星座环外沿
        signInner: outerRadius * 0.88,    // 星座环内沿
        degreeOuter: outerRadius * 0.87,  // 度数刻度外环
        degreeInner: outerRadius * 0.83,  // 度数刻度内环
        planetOuter: outerRadius * 0.82,  // 行星环外沿（紧贴刻度环内侧）
        planetInner: outerRadius * 0.42,  // 行星环内沿（拓宽，给紧密合相留空间）
        houseOuter: outerRadius * 0.40,   // 宫位环外沿（更小）
        houseInner: outerRadius * 0.35,   // 宫位环内沿
        innerCircle: outerRadius * 0.33,  // 中心圆
    };

    const ascLong = chart.houses.ascendant.longitude;
    const ascSignIndex = chart.houses.ascendant.signIndex;
    const ascSignStartLon = ascSignIndex * 30; // 上升星座0°位置（整宫制1宫起点）

    // 黄道经度 → 画布角度
    // 上升星座起点放左侧（180°位置），黄道逆时针排列
    // 整宫制：1宫 = 上升所在的整个星座
    function zodiacToAngle(lon) {
        let deg = 180 + (lon - ascSignStartLon);
        deg = ((deg % 360) + 360) % 360;
        return deg * Math.PI / 180;
    }

    function pointAt(angle, radius) {
        return {
            x: center + Math.cos(angle) * radius,
            y: center - Math.sin(angle) * radius,
        };
    }

    // ===== 背景：羊皮纸色 =====
    ctx.fillStyle = COLORS.bgParchment;
    ctx.beginPath();
    ctx.arc(center, center, outerRadius, 0, Math.PI * 2);
    ctx.fill();

    // 外圈金线
    ctx.beginPath();
    ctx.arc(center, center, outerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.borderGold;
    ctx.lineWidth = 3;
    ctx.stroke();

    // 内圈细金线
    ctx.beginPath();
    ctx.arc(center, center, outerRadius - 4, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.goldLight;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // ===== 1. 星座环 =====
    // 星座环背景（交替深浅米色）
    for (let i = 0; i < 12; i++) {
        const signStartLon = i * 30;
        const signEndLon = signStartLon + 30;
        const startAngle = zodiacToAngle(signStartLon);
        const endAngle = zodiacToAngle(signEndLon);

        ctx.beginPath();
        ctx.arc(center, center, r.signOuter, endAngle, startAngle, true);
        ctx.arc(center, center, r.signInner, startAngle, endAngle, false);
        ctx.closePath();
        ctx.fillStyle = i % 2 === 0 ? COLORS.bgParchment : COLORS.bgParchmentAlt;
        ctx.fill();
    }

    // 星座环分隔线
    for (let i = 0; i < 12; i++) {
        const signStartLon = i * 30;
        const angle = zodiacToAngle(signStartLon);
        const p1 = pointAt(angle, r.signOuter);
        const p2 = pointAt(angle, r.signInner);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = COLORS.borderGold;
        ctx.lineWidth = i % 3 === 0 ? 1.5 : 0.8;
        ctx.stroke();
    }

    // 星座符号（鎏金色，朝向圆心，使用 HamburgSymbols 字体）
    for (let i = 0; i < 12; i++) {
        const signStartLon = i * 30;
        const midLon = signStartLon + 15;
        const midAngle = zodiacToAngle(midLon);
        const symbolR = (r.signOuter + r.signInner) / 2;
        const sp = pointAt(midAngle, symbolR);

        ctx.save();
        ctx.translate(sp.x, sp.y);
        ctx.rotate(-midAngle + Math.PI / 2);

        // 使用 HamburgSymbols 字体（每个星座对应一个字母）
        // 小屏星座符号缩小
        const signFontSize = isSmallScreen ? 16 : 22;
        ctx.font = `${signFontSize}px "HamburgSymbols", "PingFang SC", -apple-system, BlinkMacSystemFont, "Microsoft YaHei", Arial, sans-serif`;
        ctx.fillStyle = COLORS.goldDark;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ZODIAC_HAMBURG[i], 0, 1);

        ctx.restore();
    }

    // ===== 2. 度数刻度环 =====
    // 刻度环背景
    ctx.beginPath();
    ctx.arc(center, center, r.degreeOuter, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.borderLight;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, r.degreeInner, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.borderLight;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // ===== 3. 宫位环（整宫制） =====
    // 整宫制：上升所在星座 = 1宫，每个星座 = 一个宫位
    // 宫位背景（交替深浅）
    for (let i = 0; i < 12; i++) {
        const cuspLon = ascSignStartLon + i * 30;
        const nextCuspLon = cuspLon + 30;
        const startAngle = zodiacToAngle(nextCuspLon);
        const endAngle = zodiacToAngle(cuspLon);

        ctx.beginPath();
        ctx.arc(center, center, r.houseOuter, startAngle, endAngle, true);
        ctx.arc(center, center, r.houseInner, endAngle, startAngle, false);
        ctx.closePath();
        ctx.fillStyle = i % 2 === 0 ? COLORS.bgCenter : COLORS.bgParchment;
        ctx.fill();
    }

    // 宫位环外边框
    ctx.beginPath();
    ctx.arc(center, center, r.houseOuter, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.borderGold;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 宫位环内边框
    ctx.beginPath();
    ctx.arc(center, center, r.houseInner, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.borderGold;
    ctx.lineWidth = 1;
    ctx.stroke();

    // 12 个整宫宫位分隔线（与星座边界对齐）
    for (let i = 0; i < 12; i++) {
        const cuspLon = ascSignStartLon + i * 30;
        const angle = zodiacToAngle(cuspLon);

        const p1 = pointAt(angle, r.degreeInner);
        const p2 = pointAt(angle, r.houseInner);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        // 角宫（1,4,7,10）粗金线
        const isAngular = i === 0 || i === 3 || i === 6 || i === 9;
        ctx.strokeStyle = isAngular ? COLORS.goldDark : COLORS.borderLight;
        ctx.lineWidth = isAngular ? 1.5 : 0.6;
        ctx.stroke();

        // 宫位数字（宫位环内，小字号）
        const midLon = cuspLon + 15;
        const midAngle = zodiacToAngle(midLon);
        const numR = (r.houseOuter + r.houseInner) / 2;
        const hp = pointAt(midAngle, numR);

        ctx.save();
        ctx.translate(hp.x, hp.y);
        // 宫位数字始终水平正立，不随圆周旋转。
        ctx.font = `bold ${isAngular ? 12 : 11}px "PingFang SC", -apple-system, BlinkMacSystemFont, "Microsoft YaHei", Arial, sans-serif`;
        ctx.fillStyle = isAngular ? COLORS.goldDark : COLORS.textFaded;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // 用阿拉伯数字
        ctx.fillText(`${i + 1}`, 0, 0);
        ctx.restore();
    }

    // ===== 4. 行星 =====
    // 收集所有要显示的点：10行星 + 福点 + 南北交
    const allPoints = [];

    // 10 颗行星
    const planetKeys = ["SUN", "MOON", "MERCURY", "VENUS", "MARS", "JUPITER", "SATURN", "URANUS", "NEPTUNE", "PLUTO"];
    for (const key of planetKeys) {
        const p = chart.planets[key];
        allPoints.push({
            key,
            name: PLANET_NAMES[key],
            symbol: PLANET_HAMBURG[key] || key,
            useHamburgFont: !!PLANET_HAMBURG[key],
            longitude: p.longitude,
            degree: p.degree,
            isRetrograde: p.isRetrograde,
            type: "planet",
            isTraditional: ["SUN", "MOON", "MERCURY", "VENUS", "MARS", "JUPITER", "SATURN"].includes(key),
        });
    }

    // 福点
    if (chart.partOfFortune) {
        allPoints.push({
            key: "POF",
            name: "福点",
            symbol: "⊕",
            useHamburgFont: false,
            longitude: chart.partOfFortune.longitude,
            degree: chart.partOfFortune.degree,
            isRetrograde: false,
            type: "pof",
            isTraditional: true,
        });
    }

    // 南北交
    if (chart.planets.NORTH_NODE) {
        allPoints.push({
            key: "NORTH_NODE",
            name: "北交",
            symbol: "☊",
            useHamburgFont: false,
            longitude: chart.planets.NORTH_NODE.longitude,
            degree: chart.planets.NORTH_NODE.degree,
            isRetrograde: chart.planets.NORTH_NODE.isRetrograde,
            type: "node",
            isTraditional: true,
        });
    }
    if (chart.planets.SOUTH_NODE) {
        allPoints.push({
            key: "SOUTH_NODE",
            name: "南交",
            symbol: "☋",
            useHamburgFont: false,
            longitude: chart.planets.SOUTH_NODE.longitude,
            degree: chart.planets.SOUTH_NODE.degree,
            isRetrograde: chart.planets.SOUTH_NODE.isRetrograde,
            type: "node",
            isTraditional: true,
        });
    }

    // 按黄经排序（沿逆时针排列）
    allPoints.sort((a, b) => a.longitude - b.longitude);

    // 参照径向标注：行星、度数、星座、分数由外向内依次排列，字形保持正立。
    const fontScale = size / 600;
    const symbolSize = 23 * fontScale;
    const numberSize = 12 * fontScale;
    const signSize = 14 * fontScale;
    const textFont = 'Georgia, "Songti SC", "Noto Serif SC", serif';
    const elementColors = {
        fire: "#cc6666", earth: "#c58b55", air: "#88a878", water: "#6babad",
    };
    const labelRadii = [0.765, 0.665, 0.58, 0.505].map(value => outerRadius * value);

    // 从最大空隙开始展开圆周，合相星向两边均匀排开，跨0°时同样处理。
    // 黄经刻线始终留在真实位置，发生位移时以细线连接，标注数值不改变。
    let seam = 0;
    let largestGap = 0;
    for (let i = 0; i < allPoints.length; i++) {
        const next = allPoints[(i + 1) % allPoints.length].longitude + (i === allPoints.length - 1 ? 360 : 0);
        if (next - allPoints[i].longitude > largestGap) {
            largestGap = next - allPoints[i].longitude;
            seam = (i + 1) % allPoints.length;
        }
    }
    const placed = allPoints.slice(seam).concat(allPoints.slice(0, seam));
    const minimumGap = 12;
    let previousLongitude = -Infinity;
    for (const p of placed) {
        let longitude = p.longitude;
        while (longitude < previousLongitude) longitude += 360;
        p._originalLon = longitude;
        p._displayLon = longitude;
        previousLongitude = longitude;
    }
    // 相邻约束以均分偏移的方式迭代，避免所有合相星只向一侧堆积。
    for (let pass = 0; pass < 100; pass++) {
        let changed = false;
        for (let i = 1; i < placed.length; i++) {
            const gap = placed[i]._displayLon - placed[i - 1]._displayLon;
            if (gap < minimumGap - 0.01) {
                const shift = (minimumGap - gap) / 2;
                placed[i - 1]._displayLon -= shift;
                placed[i]._displayLon += shift;
                changed = true;
            }
        }
        if (!changed) break;
    }

    for (const p of placed) {
        const angle = zodiacToAngle(p._displayLon);
        const trueAngle = zodiacToAngle(p.longitude);
        const tickStart = pointAt(trueAngle, r.degreeInner);
        const tickEnd = pointAt(trueAngle, r.degreeInner - 6 * fontScale);
        ctx.beginPath();
        ctx.moveTo(tickStart.x, tickStart.y);
        ctx.lineTo(tickEnd.x, tickEnd.y);
        ctx.strokeStyle = COLORS.textSepia;
        ctx.lineWidth = 1.4 * fontScale;
        ctx.stroke();

        if (Math.abs(p._displayLon - p._originalLon) > 0.5) {
            const anchor = pointAt(angle, labelRadii[0] + symbolSize * 0.65);
            ctx.beginPath();
            ctx.moveTo(tickEnd.x, tickEnd.y);
            ctx.lineTo(anchor.x, anchor.y);
            ctx.strokeStyle = COLORS.borderLight;
            ctx.lineWidth = 0.6 * fontScale;
            ctx.stroke();
        }

        // 以整分截取，避免29°59′四舍五入成不合法的29°60′。
        const signIndex = Math.floor(((p.longitude % 360) + 360) % 360 / 30);
        const totalMinutes = Math.floor((p.longitude % 30) * 60 + 1e-7);
        const degree = Math.floor(totalMinutes / 60);
        const minute = totalMinutes % 60;
        const symbol = pointAt(angle, labelRadii[0]);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = p.isRetrograde && p.type === "planet" ? COLORS.accentRed : COLORS.textSepia;
        ctx.font = `${symbolSize}px ${p.useHamburgFont ? '"HamburgSymbols"' : textFont}`;
        ctx.fillText(p.symbol, symbol.x, symbol.y);

        const degreePos = pointAt(angle, labelRadii[1]);
        ctx.fillStyle = COLORS.textSepia;
        ctx.font = `${numberSize}px ${textFont}`;
        ctx.fillText(`${degree}°`, degreePos.x, degreePos.y);

        const signPos = pointAt(angle, labelRadii[2]);
        ctx.fillStyle = elementColors[ZODIAC_SIGNS[signIndex].element];
        ctx.font = `${signSize}px "HamburgSymbols"`;
        ctx.fillText(ZODIAC_HAMBURG[signIndex], signPos.x, signPos.y);

        const minutePos = pointAt(angle, labelRadii[3]);
        ctx.fillStyle = COLORS.textSepia;
        ctx.font = `${numberSize}px ${textFont}`;
        ctx.fillText(`${minute}′`, minutePos.x, minutePos.y);

        if (p.isRetrograde && p.type !== "node") {
            ctx.fillStyle = COLORS.accentRed;
            ctx.font = `${8 * fontScale}px ${textFont}`;
            ctx.fillText("R", symbol.x + symbolSize * 0.52, symbol.y + symbolSize * 0.4);
        }
    }

    // ===== 5. 四轴标注 =====
    const axes = [
        { name: "AC", lon: chart.houses.ascendant.longitude, color: COLORS.axisAsc, degree: chart.houses.ascendant.degree, showDegree: true },
        { name: "MC", lon: chart.houses.midheaven.longitude, color: COLORS.axisMc, degree: chart.houses.midheaven.degree, showDegree: true },
        { name: "DC", lon: chart.houses.descendant.longitude, color: COLORS.axisAsc, degree: chart.houses.descendant.degree, showDegree: !isSmallScreen },
        { name: "IC", lon: chart.houses.imumCoeli.longitude, color: COLORS.axisMc, degree: chart.houses.imumCoeli.degree, showDegree: !isSmallScreen },
    ];

    for (const axis of axes) {
        const angle = zodiacToAngle(axis.lon);
        const degVal = Math.floor(axis.degree);
        const minVal = Math.round((axis.degree - degVal) * 60);
        const degText = `${degVal}°${minVal}'`;

        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const absCos = Math.abs(cosA);
        const absSin = Math.abs(sinA);

        ctx.save();

        if (isSmallScreen) {
            // ===== 小屏（手机版）：四轴只用虚线标示，从外圈向圆心延伸 =====
            const dashStartR = r.outermost;
            const dashEndR = r.planetOuter - 8;
            const p1 = pointAt(angle, dashStartR);
            const p2 = pointAt(angle, dashEndR);

            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([4, 4]);
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = COLORS.accentRed;
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        } else {
            // ===== 大屏：四轴放在圈外，标签+度数水平正立 =====
            const labelR = r.outermost + 18;
            const pos = pointAt(angle, labelR);

            const labelFont = `bold 14px "PingFang SC", -apple-system, BlinkMacSystemFont, "Microsoft YaHei", Arial, sans-serif`;
            const degFont = `bold 13px "PingFang SC", -apple-system, BlinkMacSystemFont, "Microsoft YaHei", Arial, sans-serif`;

            ctx.font = labelFont;
            ctx.textBaseline = "middle";

            let tx = pos.x;
            let ty = pos.y;

            if (absCos > absSin) {
                // 偏左右方向
                if (cosA > 0) {
                    ctx.textAlign = "left";
                    tx += 2;
                } else {
                    ctx.textAlign = "right";
                    tx -= 2;
                }
                ctx.fillStyle = axis.color;
                ctx.font = labelFont;
                ctx.fillText(axis.name, tx, ty - 8);
                if (axis.showDegree) {
                    ctx.fillStyle = COLORS.textSepia;
                    ctx.font = degFont;
                    ctx.fillText(degText, tx, ty + 8);
                }
            } else {
                // 偏上下方向
                ctx.textAlign = "center";
                if (sinA > 0) {
                    ctx.fillStyle = axis.color;
                    ctx.font = labelFont;
                    ctx.fillText(axis.name, tx, ty - 8);
                    if (axis.showDegree) {
                        ctx.fillStyle = COLORS.textSepia;
                        ctx.font = degFont;
                        ctx.fillText(degText, tx, ty + 8);
                    }
                } else {
                    if (axis.showDegree) {
                        ctx.fillStyle = COLORS.textSepia;
                        ctx.font = degFont;
                        ctx.fillText(degText, tx, ty - 8);
                    }
                    ctx.fillStyle = axis.color;
                    ctx.font = labelFont;
                    ctx.fillText(axis.name, tx, ty + 8);
                }
            }
        }

        ctx.restore();
    }

    // ===== 6. 中心圆 =====
    ctx.beginPath();
    ctx.arc(center, center, r.innerCircle, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.bgCenter;
    ctx.fill();
    ctx.strokeStyle = COLORS.borderGold;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 内圈细金线
    ctx.beginPath();
    ctx.arc(center, center, r.innerCircle - 4, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.goldPale;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // 中心采用衬线字体与随画布缩放的字号，给文字留出呼吸空间。
    const centerFont = '"Songti SC", "Noto Serif SC", "STSong", Georgia, serif';
    const centerScale = size / 600;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLORS.goldDark;
    ctx.font = `${9 * centerScale}px ${centerFont}`;
    ctx.fillText("✦", center, center - 30 * centerScale);

    ctx.font = `${14 * centerScale}px ${centerFont}`;
    ctx.fillText(window.GuaguaI18n?.language === "en" ? "Guagua Astrology" : "瓜瓜占星", center, center - 12 * centerScale, r.innerCircle * 1.65);

    ctx.font = `${10 * centerScale}px ${centerFont}`;
    ctx.fillStyle = COLORS.textSepia;
    ctx.fillText(window.GuaguaI18n?.language === "en" ? window.GuaguaI18n.english(chart.dayNightText) : chart.dayNightText, center, center + 6 * centerScale, r.innerCircle * 1.6);

    ctx.font = `${9 * centerScale}px ${centerFont}`;
    ctx.fillStyle = COLORS.textFaded;
    ctx.fillText(window.GuaguaI18n?.language === "en" ? "Whole Sign · Traditional" : "整宫制 · 古典占星", center, center + 23 * centerScale, r.innerCircle * 1.6);

    ctx.fillStyle = COLORS.goldDark;
    ctx.fillText("✦", center, center + 38 * centerScale);
}

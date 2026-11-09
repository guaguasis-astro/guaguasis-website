// UI 渲染模块
import { ZODIAC_SIGNS, formatDegree, formatDegreeMinute, getHouseType, PLANET_PERIODS, getWholeSignAspects } from "./astrology.js";

import { splitHamburgSymbols } from "./symbols.js";
import { renderVisualAssessment } from "./assessment-view.js";

// 行星符号映射（用于恒星性质等场景）
const PLANET_SYMBOLS = {
    "太阳": "☉",
    "月亮": "☽",
    "水星": "☿",
    "金星": "♀",
    "火星": "♂",
    "木星": "♃",
    "土星": "♄",
};

// 统一转换报告正文、标题和表格中的行星名；保留完整计算数据。
const REPORT_PLANET_SYMBOLS = {
    ...PLANET_SYMBOLS,
    "天王星": "♅",
    "海王星": "♆",
    "冥王星": "♇",
};

export function toPlanetSymbols(text) {
    let result = text;
    for (const [name, symbol] of Object.entries(REPORT_PLANET_SYMBOLS)) {
        result = result.replaceAll(name, symbol + "\uFE0E");
    }
    return result.replaceAll("日月围攻", "☉☽围攻")
        .replaceAll("金木围攻", "♀︎♃围攻").replaceAll("火土", "♂︎♄").replaceAll("日月", "☉☽");
}

export function symbolizeReport(container) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.parentElement.closest("script, style, .astro-symbol")) nodes.push(node);
    }
    for (const node of nodes) {
        const text = toPlanetSymbols(node.nodeValue);
        const tokens = splitHamburgSymbols(text);
        if (!tokens.some(token => token.key)) {
            node.nodeValue = text;
            continue;
        }
        const fragment = document.createDocumentFragment();
        for (const token of tokens) {
            if (token.text !== undefined) fragment.appendChild(document.createTextNode(token.text));
            else {
                const symbol = document.createElement("span");
                symbol.className = "astro-symbol";
                symbol.textContent = token.key;
                symbol.setAttribute("role", "img");
                symbol.setAttribute("aria-label", token.label);
                symbol.title = token.label;
                fragment.appendChild(symbol);
            }
        }
        node.replaceWith(fragment);
    }
}

// 将恒星性质文字中的行星名替换为符号
function natureToSymbols(nature) {
    return toPlanetSymbols(nature.replace(/性质/g, ""));
}

// 渲染本命盘总览（行星 + 四轴合并）
export function renderOverview(chart) {
    const { planets, houses, ascSignIndex } = chart;

    const tableBody = document.querySelector("#planetTable tbody");
    tableBody.innerHTML = "";

    // 先行星，后四轴
    const planetOrder = ["SUN", "MOON", "MERCURY", "VENUS", "MARS", "JUPITER", "SATURN", "URANUS", "NEPTUNE", "PLUTO"];
    const axisList = [
        { key: "ASC", name: "上升", data: houses.ascendant },
        { key: "MC", name: "天顶", data: houses.midheaven },
        { key: "DESC", name: "下降", data: houses.descendant },
        { key: "IC", name: "天底", data: houses.imumCoeli },
    ];

    // 三王星不评价尊贵状态
    const outerPlanets = ["URANUS", "NEPTUNE", "PLUTO"];

    // 行星部分
    for (const key of planetOrder) {
        const p = planets[key];
        const sign = ZODIAC_SIGNS[p.signIndex];
        const tr = document.createElement("tr");

        const statusBadges = [];
        if (!outerPlanets.includes(key)) {
            if (p.isRetrograde) statusBadges.push('<span class="badge badge-purple">逆行</span>');
            if (p.dignity.domicile) statusBadges.push('<span class="badge badge-good">庙</span>');
            if (p.dignity.exaltation) statusBadges.push('<span class="badge badge-good">旺</span>');
            if (p.dignity.triplicity) statusBadges.push('<span class="badge badge-good">三分</span>');
            if (p.dignity.term) statusBadges.push('<span class="badge badge-good">界</span>');
            if (p.dignity.face) statusBadges.push('<span class="badge badge-good">面</span>');
            if (p.dignity.detriment) statusBadges.push('<span class="badge badge-bad">陷</span>');
            if (p.dignity.fall) statusBadges.push('<span class="badge badge-bad">落</span>');
            if (p.dignity.peregrine) statusBadges.push('<span class="badge badge-neutral">外来</span>');
        } else {
            // 三王星只标逆行
            if (p.isRetrograde) statusBadges.push('<span class="badge badge-purple">逆行</span>');
        }

        // 喜乐宫标注（三王星无传统喜乐宫，但还是保持判断逻辑）
        let houseText = `${p.house}宫`;
        if (p.isJoyHouse) {
            houseText += ' <span class="badge badge-purple" title="行星喜乐宫">喜乐</span>';
        }

        tr.innerHTML = `
            <td><strong>${p.name}</strong></td>
            <td>${sign.symbol} ${sign.name} ${formatDegreeMinute(p.degree)}</td>
            <td>${houseText}</td>
            <td>${statusBadges.join(" ") || "-"}</td>
        `;
        tableBody.appendChild(tr);
    }

    // 四轴部分（用带文字的分隔行区分）
    const separator = document.createElement("tr");
    separator.innerHTML = `
        <td colspan="4" style="padding: 14px 0; border-bottom: none; font-size: 0.78rem; color: var(--gold-dark); letter-spacing: 6px; text-align: center; font-family: var(--font-display);">
            ✦ 四 轴 与 虚 点 ✦
        </td>
    `;
    tableBody.appendChild(separator);

    for (const axis of axisList) {
        const sign = ZODIAC_SIGNS[axis.data.signIndex];
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${axis.name}</strong></td>
            <td>${sign.symbol} ${sign.name} ${formatDegreeMinute(axis.data.degree)}</td>
            <td>${axis.data.house}宫</td>
            <td>-</td>
        `;
        tableBody.appendChild(tr);
    }
}

// 渲染吉凶分布
export function renderFortune(chart) {
    const { greatBenefic, greatMalefic, isDayChart, planets } = chart;

    // 最幸运的地方
    const fortunateDiv = document.getElementById("mostFortunate");
    const beneficPlanet = greatBenefic.planet;
    const beneficSign = ZODIAC_SIGNS[beneficPlanet.signIndex];
    const beneficHouseType = getHouseType(greatBenefic.house);

    fortunateDiv.innerHTML = `
        <div class="detail-section">
            <div class="detail-label">最大吉星</div>
            <div class="detail-value">${greatBenefic.name} <span class="badge badge-good">${isDayChart ? '日生盘' : '夜生盘'}</span></div>
        </div>
        <div class="detail-section">
            <div class="detail-label">所落宫位</div>
            <div class="detail-value">第${greatBenefic.house}宫 <span class="badge badge-neutral">${beneficHouseType.type} · ${beneficHouseType.strength}</span></div>
            <div class="detail-desc">${beneficSign.symbol} ${beneficSign.name} ${formatDegreeMinute(beneficPlanet.degree)}</div>
        </div>
        <div class="detail-section">
            <div class="detail-label">尊贵状态</div>
            <div class="detail-value">
                <span class="badge ${beneficPlanet.dignitySummary.levelClass}">力量：${beneficPlanet.dignitySummary.level}</span>
            </div>
            <div class="detail-desc">${beneficPlanet.dignitySummary.summaryText}</div>
        </div>
    `;

    // 最不幸的地方
    const unfortunateDiv = document.getElementById("mostUnfortunate");
    const maleficPlanet = greatMalefic.planet;
    const maleficSign = ZODIAC_SIGNS[maleficPlanet.signIndex];
    const maleficHouseType = getHouseType(greatMalefic.house);

    unfortunateDiv.innerHTML = `
        <div class="detail-section">
            <div class="detail-label">最大凶星</div>
            <div class="detail-value">${greatMalefic.name} <span class="badge badge-bad">${isDayChart ? '日生盘' : '夜生盘'}</span></div>
        </div>
        <div class="detail-section">
            <div class="detail-label">所落宫位</div>
            <div class="detail-value">第${greatMalefic.house}宫 <span class="badge badge-neutral">${maleficHouseType.type} · ${maleficHouseType.strength}</span></div>
            <div class="detail-desc">${maleficSign.symbol} ${maleficSign.name} ${formatDegreeMinute(maleficPlanet.degree)}</div>
        </div>
        <div class="detail-section">
            <div class="detail-label">尊贵状态</div>
            <div class="detail-value">
                <span class="badge ${maleficPlanet.dignitySummary.levelClass}">力量：${maleficPlanet.dignitySummary.level}</span>
            </div>
            <div class="detail-desc">${maleficPlanet.dignitySummary.summaryText}</div>
        </div>
    `;
}

// 点位与主星信息用一组紧凑行展示，移动端自然换行。
export function renderCompactLot(lot, label) {
    const sign = ZODIAC_SIGNS[lot.signIndex];
    const houseType = lot.houseType;
    const lord = lot.lord;
    const planet = lord.planet;
    const lordSign = ZODIAC_SIGNS[planet.signIndex];
    const lordHouseType = getHouseType(lord.house);
    const description = label === "福点"
        ? { 3: "机遇容易落到实处，财富与资源更容易显现。", 2: "机遇适合通过持续经营、慢慢积累来兑现。", 1: "机遇的显现偏慢，需要更多耐心和积累。" }[houseType.strengthLevel]
        : { 3: "资产更容易积累，也更容易看到实际成果。", 2: "资产适合靠长期经营，细水长流地积累。", 1: "资产积累的节奏偏慢，适合多些耐心、持续投入。" }[houseType.strengthLevel];
    const aspects = (lot.lordSignAspects || []).filter(aspect => aspect.type !== "aversion");
    const relation = lot.isLordAversion ? `与${label}不合意`
        : aspects.length ? `与${label} ${aspects.map(aspect => aspect.symbol).join(" ")}` : `与${label}无主要相位`;
    const position = `
        <div class="lot-line">
            <strong>${sign.symbol} ${sign.name} ${formatDegreeMinute(lot.degree)}</strong>
            <span>第${lot.house}宫</span>
            <span class="badge badge-neutral">${houseType.type} · 力量${houseType.strength}</span>
        </div>
        <p class="detail-desc lot-description">${description}</p>
    `;
    const lordStatus = `
        <div class="lot-line lot-lord">
            <span class="detail-label">${label}主星</span>
            <strong>${lord.name}</strong>
            <span>${lordSign.symbol} ${lordSign.name} ${formatDegreeMinute(planet.degree)}</span>
            <span>第${lord.house}宫 · ${lordHouseType.type}</span>
            <span class="badge ${planet.dignitySummary.levelClass}">力量${planet.dignitySummary.level}</span>
            <span class="badge badge-neutral">${planet.dignitySummary.summaryText}</span>
            <span class="badge ${lot.isLordAversion ? "badge-neutral" : "badge-good"}">${relation}</span>
        </div>
    `;
    return { position, lordStatus };
}

// 渲染福点及精神点解读
export function renderPOI(chart) {
    const { partOfFortune: pof, planets } = chart;
    const compact = renderCompactLot(pof, "福点");
    document.getElementById("poiDetails").innerHTML = compact.position;
    document.getElementById("poiLordStatus").innerHTML = compact.lordStatus;
    renderLotSignAspects(document.getElementById("poiAspects"), pof, planets, "福点");
    const indicators = chart.wealthAssessment.fortuneIndicators;
    const spirit = indicators.spirit;
    document.getElementById("poiIndicators").innerHTML = `
        <div class="detail-section">
            <div class="lot-line">
                <span class="detail-label">精神点</span>
                <strong>${ZODIAC_SIGNS[spirit.signIndex].name} ${formatDegreeMinute(spirit.degree)}</strong>
                <span>第${spirit.house}宫</span>
                <span class="badge badge-neutral">主星 ${spirit.lordName}</span>
            </div>
        </div>
        ${renderFortuneMatches(indicators)}
    `;
}

// 只展示命中的依据，每条分别说明本盘配置与生活中的含义
export function renderFortuneMatches(indicators, includeContext = true) {
    const renderGroup = (title, items, note = "") => items.length ? `
        <div class="detail-section">
            <div class="detail-label">${title}</div>
            ${items.map(item => `
                <div style="margin-top: 10px; padding-left: 12px; border-left: 2px solid var(--gold-pale);">
                    <div class="detail-value" style="font-size: 0.95rem;">${item.title}</div>
                    <div class="detail-desc" style="margin-top: 8px;">${item.reason}${item.text}</div>
                </div>
            `).join("")}
            ${note ? `<div class="detail-desc" style="margin-top: 12px;">${note}</div>` : ""}
        </div>` : "";
    return renderGroup("财富机会与积累", indicators.wealth)
        + (includeContext ? renderGroup("成就与被看见的机会", indicators.prominence)
            + renderGroup("资源可能从哪里来", indicators.sources) : "");
}

// 渲染资产点
export function renderAssets(chart) {
    const compact = renderCompactLot(chart.lotOfAssets, "资产点");
    document.getElementById("assetsDetails").innerHTML = compact.position;
    document.getElementById("assetsLordStatus").innerHTML = compact.lordStatus;
}

// 渲染某个 Lot 的星座相位与吉星支持（只显示传统七行星 + 日月，不含三王星）
function renderLotSignAspects(containerDiv, lot, planets, lotName) {
    // 只展示传统行星（不含三王星）
    const planetKeys = ["SUN", "MOON", "MERCURY", "VENUS", "MARS", "JUPITER", "SATURN"];
    const beneficSupportKeys = ["JUPITER", "VENUS", "SUN", "MOON"];
    const maleficKeys = ["MARS", "SATURN"];
    const lotSignIndex = lot.signIndex;

    const planetSignAspects = [];

    for (const pKey of planetKeys) {
        const p = planets[pKey];
        const signAspects = getWholeSignAspects(lotSignIndex, p.signIndex);

        // 只展示有主要相位的（排除不合意和空的）
        const mainAspects = signAspects.filter(a => a.type !== "aversion");
        if (mainAspects.length === 0) continue;

        const isBeneficSupport = beneficSupportKeys.includes(pKey);
        const isMalefic = maleficKeys.includes(pKey);

        // 同类相位按精确度数差排序
        let exactDiff = Math.abs(lot.longitude - p.longitude);
        exactDiff = Math.min(exactDiff, 360 - exactDiff);

        let nature = "中性";
        let natureClass = "";
        if (isBeneficSupport) {
            nature = "吉星支持";
            natureClass = "aspect-harmonious";
        } else if (isMalefic) {
            nature = "凶星";
            natureClass = "aspect-hard";
        }

        planetSignAspects.push({
            planet: p.name,
            planetKey: pKey,
            signAspects: mainAspects,
            exactDiff,
            nature,
            natureClass,
            isBeneficSupport,
        });
    }

    // 按性质排序：吉星支持在前，然后凶星，然后中性
    planetSignAspects.sort((a, b) => {
        const order = { "吉星支持": 0, "凶星": 1, "中性": 2 };
        if (order[a.nature] !== order[b.nature]) return order[a.nature] - order[b.nature];
        return a.exactDiff - b.exactDiff;
    });

    const beneficCount = planetSignAspects.filter(a => a.isBeneficSupport).length;

    if (planetSignAspects.length === 0) {
        containerDiv.innerHTML = `
            <div class="detail-desc">${lotName}与各行星在星座层面没有主要相位关系。</div>
        `;
        return;
    }

    let html = `
        <div class="detail-section">
            <div class="detail-label">吉星支持评估（星座相位）</div>
            <div class="detail-value">
                ${beneficCount > 0 ? `<span class="badge badge-good">有 ${beneficCount} 颗吉星在星座层面支持</span>` : '<span class="badge badge-neutral">缺乏直接的吉星支持</span>'}
            </div>
            <div class="detail-desc">
                ${beneficCount >= 4 ? `${lotName}得到全部吉星的星座相位支持，福气丰厚，财运亨通。` :
                  beneficCount >= 3 ? `${lotName}得到多颗吉星的星座相位支持，福气和财运基础较好。` :
                  beneficCount >= 2 ? `${lotName}有两颗吉星的星座相位支持，有一定福气助力。` :
                  beneficCount === 1 ? `${lotName}有一颗吉星的星座相位支持，有轻微的福气和财运助力。` :
                  `${lotName}缺乏吉星的星座相位支持，福气的显化可能需要更多努力和时间。`}
            </div>
            <div class="detail-desc" style="font-size: 0.8rem; color: var(--text-faded); margin-top: 4px;">
                吉星支持：太阳、月亮、木星、金星
            </div>
        </div>
        <div class="table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>行星</th>
                        <th>行星所在星座</th>
                        <th>星座相位</th>
                        <th>性质</th>
                    </tr>
                </thead>
                <tbody>
    `;

    for (const a of planetSignAspects) {
        const p = planets[a.planetKey];
        const pSign = ZODIAC_SIGNS[p.signIndex];
        // 只显示相位符号
        const aspectSymbols = a.signAspects.map(x => `${x.symbol}`).join(" ");
        html += `
            <tr>
                <td><strong>${a.planet}</strong></td>
                <td>${pSign.symbol} ${pSign.name}</td>
                <td style="font-size: 1.1rem;">${aspectSymbols}</td>
                <td class="${a.natureClass}">${a.nature}</td>
            </tr>
        `;
    }

    html += `
                </tbody>
            </table>
        </div>
    `;
    containerDiv.innerHTML = html;
}

// 渲染恒星合相
export function renderFixedStars(chart) {
    const tableBody = document.querySelector("#fixedStarTable tbody");
    const descDiv = document.getElementById("fixedStarDescriptions");
    tableBody.innerHTML = "";
    descDiv.innerHTML = "";

    if (chart.fixedStars.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; color: var(--text-faded); padding: 24px;">
                    没有发现 1.5° 以内的恒星合相
                </td>
            </tr>
        `;
        return;
    }

    for (const star of chart.fixedStars) {
        const isGood = star.starNature.includes("吉");
        const isBad = star.starNature.includes("凶");
        const natureClass = isGood ? "aspect-harmonious" : isBad ? "aspect-hard" : "";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${star.pointName}</strong></td>
            <td>${star.starNameEn}</td>
            <td>${star.starNameZh}</td>
            <td>${formatDegreeMinute(star.orb)}</td>
            <td class="${natureClass}">${natureToSymbols(star.starNature)}</td>
        `;
        tableBody.appendChild(tr);
    }

    // === 合相恒星含义解读 ===
    // 按恒星去重（同一颗星可能合多个点）
    const uniqueStars = [];
    const seen = new Set();
    for (const star of chart.fixedStars) {
        if (!seen.has(star.starNameEn)) {
            seen.add(star.starNameEn);
            uniqueStars.push(star);
        }
    }

    if (uniqueStars.length === 0 || !uniqueStars[0].starDesc) return;

    let html = `
        <div style="font-family: var(--font-display); font-size: 1rem; color: var(--text-bistre); font-weight: 600; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--border-light); letter-spacing: 2px;">
            ✦ 合相恒星含义解读 ✦
        </div>
    `;

    for (const star of uniqueStars) {
        // 找出这颗星合了哪些点
        const points = chart.fixedStars
            .filter(s => s.starNameEn === star.starNameEn)
            .map(s => s.pointName)
            .join("、");

        const isGood = star.starNature.includes("吉");
        const isBad = star.starNature.includes("凶");
        const badgeClass = isGood ? "badge-good" : isBad ? "badge-bad" : "badge-neutral";

        html += `
            <div style="padding: 16px 0; border-bottom: 1px dashed var(--border-light);">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px; flex-wrap: wrap;">
                    <div style="font-family: var(--font-display); font-size: 1.05rem; color: var(--text-ink); font-weight: 700;">
                        ${star.starNameZh} <span style="font-weight: 400; color: var(--text-sepia); font-size: 0.9rem;">· ${star.starNameEn}</span>
                    </div>
                    <span class="badge ${badgeClass}">合 ${points}</span>
                </div>
                <div style="line-height: 1.9; color: var(--text-bistre); font-size: 0.9rem; padding-left: 4px; border-left: 2px solid var(--gold-pale); padding-left: 12px;">
                    ${star.starDesc}
                </div>
            </div>
        `;
    }

    descDiv.innerHTML = html;
}

// 相同结论合写一次，保留各项配置作为依据。
export function consolidateAssessmentDetails(details) {
    const groups = new Map();
    for (const detail of new Set(details)) {
        const index = detail.indexOf("，");
        const fact = index < 0 ? detail : detail.slice(0, index);
        const conclusion = index < 0 ? "" : detail.slice(index + 1);
        const key = conclusion || detail;
        if (!groups.has(key)) groups.set(key, { facts: [], conclusion });
        groups.get(key).facts.push(fact);
    }
    return [...groups.values()].map(group => group.facts.join("；") + (group.conclusion ? `，${group.conclusion}` : ""));
}

// 汇总现有评估中的相位，不额外引入或重新计分。
export function buildAssessmentAspectNarratives(wa) {
    const records = new Map();
    const getRecord = target => {
        if (!records.has(target)) records.set(target, new Map());
        return records.get(target);
    };
    const add = (target, planet, fact, kind) => {
        const record = getRecord(target);
        if (!record.has(planet)) record.set(planet, { facts: new Set(), kinds: new Set() });
        record.get(planet).facts.add(fact);
        record.get(planet).kinds.add(kind);
    };
    for (const aspect of wa.moonHardAspects) add("月亮", aspect.planet, aspect.aspect, "pressure");
    for (const aspect of wa.moonBeneficAspects) {
        add("月亮", aspect.planet, `整宫${aspect.aspects.join("、")}`, "support");
    }
    const otherDetails = [];
    for (const detail of wa.extraDetails) {
        const match = detail.match(/^(太阳|月亮)与(金星|木星)成(.+?)，(受吉星加持|吉中带摩擦)$/);
        if (match) add(match[1], match[2], match[3], match[4] === "受吉星加持" ? "support" : "friction");
        else otherDetails.push(detail);
    }
    const narratives = [...records].map(([target, record]) => {
        const support = [], pressure = [], friction = [];
        const supportContacts = [], pressureContacts = [], frictionContacts = [];
        for (const [planet, data] of record) {
            const fact = `${planet}（${[...data.facts].join("、")}）`;
            const contact = { name: planet, facts: [...data.facts] };
            if (data.kinds.has("pressure")) { pressure.push(fact); pressureContacts.push(contact); }
            else if (data.kinds.has("friction")) { friction.push(fact); frictionContacts.push(contact); }
            else { support.push(fact); supportContacts.push(contact); }
        }
        const evidence = [
            support.length ? `吉星联系：${support.join("、")}` : "",
            pressure.length ? `火土压力：${pressure.join("、")}` : "",
            friction.length ? `吉星摩擦：${friction.join("、")}` : "",
        ].filter(Boolean).join("；");
        const hasPressure = pressure.length || friction.length;
        const conclusion = support.length && hasPressure
            ? "机会和压力会一起来：有资源可借力，也容易有消耗。把助力用在稳定收入上，给开支和周转留些余地。"
            : pressure.length > 1 ? "火土带来的压力比较集中，求财时容易有消耗或周转压力，先稳住收支、留好缓冲。"
            : pressure.length ? "求财中容易有消耗或周转压力，先把收支安排稳妥，按自己的节奏积累。"
            : friction.length ? "机会的落实需要多一些协调，合作中容易有分歧，把条件谈清楚更容易促成收获。"
            : "资源和人际支持较容易接上，有利于改善收入、慢慢积累生活所需。";
        return { target, evidence, conclusion, supportContacts, pressureContacts, frictionContacts };
    });
    return { narratives, otherDetails: consolidateAssessmentDetails(otherDetails) };
}

export function buildTriplicityStarNarratives(chart) {
    const wa = chart.wealthAssessment;
    const groups = [
        ["发光体三分主", chart.triplicity.luminaryTriplicityLords],
        ["二宫三分主", chart.triplicity.secondHouseTriplicityLords],
    ];
    const facts = new Map();
    for (const [group, lords] of groups) {
        for (const lord of lords) {
            for (const star of wa.triplicityStarConjunctions[lord.planetKey] || []) {
                const key = `${lord.planetKey}-${star.starNameEn}`;
                if (!facts.has(key)) facts.set(key, { lord: lord.planetName, star, roles: new Set() });
                facts.get(key).roles.add(group);
            }
        }
    }
    return [...facts.values()].map(({ lord, star, roles }) =>
        `${lord}（${[...roles].join("、")}）合恒星${star.starNameZh}（${star.starNameEn}），容许度${star.orb.toFixed(2)}°`
    );
}

// 渲染三分主星
export function renderTriplicity(chart) {
    const { triplicity, isDayChart } = chart;

    const hintDiv = document.getElementById("triplicityHint");
    hintDiv.textContent = "";

    // 总体详情
    const detailsDiv = document.getElementById("triplicityDetails");
    detailsDiv.innerHTML = `
        <div class="detail-section">
            <div class="lot-line">
                <span class="detail-label">发光体</span>
                <strong>${triplicity.luminaryName}</strong>
                <span>${ZODIAC_SIGNS[chart.planets[triplicity.luminaryKey].signIndex].symbol} ${ZODIAC_SIGNS[chart.planets[triplicity.luminaryKey].signIndex].name}</span>
                <span class="badge badge-neutral">${isDayChart ? "日生盘主星" : "夜生盘主星"}</span>
            </div>
            <div class="detail-desc">其三分主星代表天生的财富格局和资源获取能力。</div>
        </div>
    `;
    document.getElementById("secondHouseDetails").innerHTML = `
        <div class="detail-section">
            <div class="lot-line">
                <span class="detail-label">二宫星座</span>
                <strong>${triplicity.secondHouseSignName}</strong>
            </div>
            <div class="detail-desc">下列三分主星代表实际的财富积累和物质生活状况。</div>
        </div>
    `;

    // 发光体三分主星
    const titleEl = document.getElementById("triplicityLord1Title");
    titleEl.textContent = `${triplicity.luminaryName}的三分主星（含星座年限）`;

    const starConjs = chart.wealthAssessment.triplicityStarConjunctions;
    const lordComp = chart.wealthAssessment.triplicityLordComprehensive;

    const lord1Div = document.getElementById("triplicityLord1");
    lord1Div.innerHTML = renderTriplicityLords(triplicity.luminaryTriplicityLords, starConjs, lordComp);

    // 二宫三分主星
    const lord2Div = document.getElementById("triplicityLord2");
    lord2Div.innerHTML = renderTriplicityLords(triplicity.secondHouseTriplicityLords, starConjs, lordComp);

    // 综合评估：已确认的可视化模板，直接读取真实排盘数据。
    renderVisualAssessment(
        document.getElementById("triplicitySummary"),
        chart,
        buildAssessmentAspectNarratives(chart.wealthAssessment),
        symbolizeReport
    );
}

// 渲染单个三分主星列表
function renderTriplicityLords(lords, starConjunctions = {}, lordComprehensive = {}) {
    let html = "";
    for (const [index, lord] of lords.entries()) {
        const p = lord.planet;
        const sign = ZODIAC_SIGNS[p.signIndex];
        const periodYears = PLANET_PERIODS[lord.planetKey] || null;
        const periodText = periodYears ? `行星周期 ${periodYears} 年` : '';

        // 星座年限（仅发光体的三分主星有）
        let signPeriodHtml = '';
        if (lord.signPeriod !== undefined && lord.signPeriod !== null) {
            signPeriodHtml = `
                <div class="detail-desc" style="margin-top: 6px; color: var(--gold-dark); font-family: var(--font-display);">
                    ❖ 所落${lord.signName}年限：<strong>${lord.signPeriodRounded} 年</strong>
                </div>
            `;
        }

        // 恒星合相标注
        const stars = starConjunctions[lord.planetKey] || [];
        let starHtml = '';
        if (stars.length > 0) {
            const starNames = stars.map(s => `${s.starNameZh}（${s.starNameEn}，${s.orb.toFixed(2)}°）`).join('、');
            starHtml = `
                <div class="detail-desc" style="margin-top: 6px; color: var(--gold-dark);">
                    ✦ 合恒星：${starNames}
                </div>
            `;
        }

        html += `
            <div class="detail-section" style="padding-bottom: 12px; ${index < lords.length - 1 ? "border-bottom: 1px solid var(--border-light);" : ""} margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
                    <span class="badge badge-purple">${lord.orderName}</span>
                    <strong>${lord.planetName}</strong>
                    <span class="badge ${lordComprehensive[lord.planetKey] ? lordComprehensive[lord.planetKey].levelClass : lord.dignitySummary.levelClass}">力量：${lordComprehensive[lord.planetKey] ? lordComprehensive[lord.planetKey].level : lord.dignitySummary.level}</span>
                    ${periodText ? `<span class="badge badge-neutral">${periodText}</span>` : ''}
                </div>
                <div class="detail-desc">
                    ${sign.symbol} ${sign.name} ${formatDegreeMinute(p.degree)} · 第${lord.house}宫
                </div>
                <div class="detail-desc" style="margin-top: 4px;">
                    尊贵：${lord.dignitySummary.summaryText}
                </div>
                ${signPeriodHtml}
                ${starHtml}
            </div>
        `;
    }
    return html;
}

// 渲染信息条
export function renderInfoBar(chart) {
    const { birthData, dayNightText, houses } = chart;
    const ascSign = ZODIAC_SIGNS[houses.ascendant.signIndex];
    const mcSign = ZODIAC_SIGNS[houses.midheaven.signIndex];

    document.getElementById("infoBirth").textContent =
        `${birthData.year}年${birthData.month}月${birthData.day}日 ${String(birthData.hour).padStart(2, "0")}:${String(birthData.minute).padStart(2, "0")} · ${birthData.place || ""}${birthData.daylightSaving ? " · UTC+9（夏令时）" : birthData.dstRepeated ? " · UTC+8（拨表后）" : ""}`;
    document.getElementById("infoDayNight").textContent = dayNightText;
    document.getElementById("infoAsc").textContent = `${ascSign.symbol} ${ascSign.name}`;
    document.getElementById("infoMC").textContent = `${mcSign.symbol} ${mcSign.name}`;
}

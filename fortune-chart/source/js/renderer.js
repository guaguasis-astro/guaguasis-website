// UI 渲染模块
import { ZODIAC_SIGNS, formatDegree, formatDegreeMinute, getHouseType, PLANET_PERIODS, getWholeSignAspects } from "./astrology.js";

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

// 将恒星性质文字中的行星名替换为符号
function natureToSymbols(nature) {
    let result = nature;
    for (const [name, sym] of Object.entries(PLANET_SYMBOLS)) {
        result = result.replaceAll(name, sym);
    }
    // 去掉"性质"二字，让更简洁
    result = result.replace(/性质/g, "");
    return result;
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
        <div class="detail-section">
            <div class="detail-label">解读提示</div>
            <div class="detail-desc">
                ${greatBenefic.name}落第${greatBenefic.house}宫，${beneficPlanet.dignitySummary.score > 0 ? '状态良好，吉性增强' : beneficPlanet.dignitySummary.score < 0 ? '状态偏弱，吉性有所折扣' : '状态中等，吉性平稳'}。
                第${greatBenefic.house}宫所代表的人生领域是盘主最容易获得幸运和助力的地方。
            </div>
        </div>
    `;

    // 最不幸的地方
    const unfortunateDiv = document.getElementById("mostUnfortunate");
    const maleficPlanet = greatMalefic.planet;
    const maleficSign = ZODIAC_SIGNS[maleficPlanet.signIndex];
    const maleficHouseType = getHouseType(greatMalefic.house);

    let maleficAssessment = "";
    if (maleficPlanet.dignitySummary.score > 0) {
        maleficAssessment = `凶星有尊贵加持，凶性有所收敛，表现为有节制的困难，可通过努力转化`;
    } else if (maleficPlanet.dignitySummary.score < -3) {
        maleficAssessment = `凶星落陷/失意，凶性较强，该领域容易遭遇较明显的挫折和考验`;
    } else {
        maleficAssessment = `凶性中等，该领域存在压力和挑战，但也伴随着成长的机会`;
    }

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
        <div class="detail-section">
            <div class="detail-label">解读提示</div>
            <div class="detail-desc">
                ${greatMalefic.name}落第${greatMalefic.house}宫，${maleficAssessment}。
                第${greatMalefic.house}宫所代表的人生领域是盘主最需要谨慎应对、容易遇到挑战的地方。
            </div>
        </div>
    `;
}

// 渲染福点状态
export function renderPOI(chart) {
    const { partOfFortune: pof, planets, isDayChart } = chart;
    const pofSign = ZODIAC_SIGNS[pof.signIndex];
    const lord = pof.lord;
    const lordPlanet = lord.planet;
    const lordSign = ZODIAC_SIGNS[lordPlanet.signIndex];
    const lordHouseType = getHouseType(lord.house);

    // 福点详情
    const poiDetails = document.getElementById("poiDetails");
    poiDetails.innerHTML = `
        <div class="grid-2">
            <div class="detail-section">
                <div class="detail-label">福点位置</div>
                <div class="detail-value">${pofSign.symbol} ${pofSign.name} ${formatDegreeMinute(pof.degree)}</div>
                <div class="detail-desc">第${pof.house}宫</div>
            </div>
            <div class="detail-section">
                <div class="detail-label">计算公式</div>
                <div class="detail-value">${isDayChart ? '日生盘' : '夜生盘'}</div>
                <div class="detail-desc">
                    ${isDayChart ? '福点 = 上升 + 月亮 - 太阳' : '福点 = 上升 + 太阳 - 月亮'}
                </div>
            </div>
        </div>
    `;

    // 福点落宫力量
    const houseStrengthDiv = document.getElementById("poiHouseStrength");
    const houseType = pof.houseType;
    let houseStrengthDesc = "";
    if (houseType.strengthLevel === 3) {
        houseStrengthDesc = "福点落角宫，力量强劲，福气容易显化，人生的财富和机遇较为突出和实在。";
    } else if (houseType.strengthLevel === 2) {
        houseStrengthDesc = "福点落续宫，力量中等，福气需要通过积累和经营才能显现，属于细水长流型。";
    } else {
        houseStrengthDesc = "福点落果宫，力量偏弱，福气较为内敛或延迟显现，可能需要通过服务他人或灵性修行来积累福报。";
    }

    houseStrengthDiv.innerHTML = `
        <div class="detail-section">
            <div class="detail-label">宫位类型</div>
            <div class="detail-value">${houseType.type} <span class="badge badge-neutral">力量：${houseType.strength}</span></div>
        </div>
        <div class="detail-section">
            <div class="detail-label">说明</div>
            <div class="detail-desc">${houseStrengthDesc}</div>
        </div>
    `;

    // 福点主星状态
    const lordStatusDiv = document.getElementById("poiLordStatus");

    // 星座相位符号（只显示符号，不显示文字）
    const signAspectSymbols = pof.lordSignAspects && pof.lordSignAspects.length > 0
        ? pof.lordSignAspects.map(a => `<span style="font-size: 1.1rem; margin-right: 4px;">${a.symbol}</span>`).join("")
        : '<span style="color: var(--text-faded);">无</span>';

    let relationDesc = "";
    if (pof.isLordAversion) {
        relationDesc = "福点主星与福点在星座层面不合意（aversion），能量传递有阻碍，福气的表达可能有曲折。";
    } else if (pof.lordSignAspects && pof.lordSignAspects.length > 0) {
        relationDesc = "福点主星与福点在星座层面有相位关系，能量有流通渠道。";
    } else {
        relationDesc = "福点主星与福点没有明显的星座相位关系。";
    }

    lordStatusDiv.innerHTML = `
        <div class="detail-section">
            <div class="detail-label">福点主星</div>
            <div class="detail-value">${lord.name} <span class="badge ${lordPlanet.dignitySummary.levelClass}">力量：${lordPlanet.dignitySummary.level}</span></div>
            <div class="detail-desc">${lordSign.symbol} ${lordSign.name} ${formatDegreeMinute(lordPlanet.degree)} · 第${lord.house}宫（${lordHouseType.type}）</div>
        </div>
        <div class="detail-section">
            <div class="detail-label">主星尊贵</div>
            <div class="detail-desc">${lordPlanet.dignitySummary.summaryText}</div>
        </div>
        <div class="detail-section">
            <div class="detail-label">与福点的星座相位</div>
            <div class="detail-value" style="font-size: 1rem;">${signAspectSymbols}</div>
        </div>
        <div class="detail-section">
            <div class="detail-label">说明</div>
            <div class="detail-desc">${relationDesc}</div>
        </div>
    `;

    // 福点星座相位与吉星支持
    const poiAspectsDiv = document.getElementById("poiAspects");
    renderLotSignAspects(poiAspectsDiv, pof, planets, "福点");
    const indicators = chart.wealthAssessment.fortuneIndicators;
    const spirit = indicators.spirit;
    document.getElementById("poiIndicators").innerHTML = `
        <div class="detail-section">
            <div class="detail-label">精神点</div>
            <div class="detail-value">${ZODIAC_SIGNS[spirit.signIndex].name} ${formatDegreeMinute(spirit.degree)} · 本命第${spirit.house}宫</div>
            <div class="detail-desc">${isDayChart ? "日生：上升 + 太阳 − 月亮" : "夜生：上升 + 月亮 − 太阳"}；主星：${spirit.lordName}</div>
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
                <div style="margin-top: 18px; padding-left: 12px; border-left: 2px solid var(--gold-pale);">
                    <div class="detail-value" style="font-size: 0.95rem;">${item.title}</div>
                    <div class="detail-desc" style="margin-top: 8px;"><strong>为什么这张盘符合：</strong>${item.reason}</div>
                    <div class="detail-desc" style="margin-top: 8px;">${item.text}</div>
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
    const { lotOfAssets: loa, planets } = chart;
    const loaSign = ZODIAC_SIGNS[loa.signIndex];
    const lord = loa.lord;
    const lordPlanet = lord.planet;
    const lordSign = ZODIAC_SIGNS[lordPlanet.signIndex];
    const cusp2nd = loa.placidus2ndCusp;
    const cusp2ndSign = ZODIAC_SIGNS[cusp2nd.signIndex];

    // 资产点详情
    const detailsDiv = document.getElementById("assetsDetails");
    detailsDiv.innerHTML = `
        <div class="grid-2">
            <div class="detail-section">
                <div class="detail-label">资产点位置</div>
                <div class="detail-value">${loaSign.symbol} ${loaSign.name} ${formatDegreeMinute(loa.degree)}</div>
                <div class="detail-desc">第${loa.house}宫（整宫制）</div>
            </div>
        </div>
    `;

    // 资产点落宫力量
    const houseStrengthDiv = document.getElementById("assetsHouseStrength");
    const houseType = loa.houseType;
    let houseStrengthDesc = "";
    if (houseType.strengthLevel === 3) {
        houseStrengthDesc = "资产点落角宫，力量强劲，资产积累能力强，物质生活容易有显著的积累和显化。";
    } else if (houseType.strengthLevel === 2) {
        houseStrengthDesc = "资产点落续宫，力量中等，资产需要通过持续积累和经营才能增长，属于细水长流型。";
    } else {
        houseStrengthDesc = "资产点落果宫，力量偏弱，资产积累较为内敛或延迟显现，可能需要通过服务他人或长期规划来积累。";
    }

    houseStrengthDiv.innerHTML = `
        <div class="detail-section">
            <div class="detail-label">宫位类型</div>
            <div class="detail-value">${houseType.type} <span class="badge badge-neutral">力量：${houseType.strength}</span></div>
        </div>
        <div class="detail-section">
            <div class="detail-label">说明</div>
            <div class="detail-desc">${houseStrengthDesc}</div>
        </div>
    `;

    // 资产点主星状态
    const lordStatusDiv = document.getElementById("assetsLordStatus");
    const lordHouseType = getHouseType(lord.house);

    const signAspectSymbols = loa.lordSignAspects && loa.lordSignAspects.length > 0
        ? loa.lordSignAspects.map(a => `<span style="font-size: 1.1rem; margin-right: 4px;">${a.symbol}</span>`).join("")
        : '<span style="color: var(--text-faded);">无</span>';

    let relationDesc = "";
    if (loa.isLordAversion) {
        relationDesc = "资产点主星与资产点在星座层面不合意，能量传递有阻碍，资产积累的过程可能有曲折或延迟。";
    } else if (loa.lordSignAspects && loa.lordSignAspects.length > 0) {
        relationDesc = "资产点主星与资产点在星座层面有相位关系，能量有流通渠道，资产的积累和运转相对顺畅。";
    } else {
        relationDesc = "资产点主星与资产点没有明显的星座相位关系。";
    }

    lordStatusDiv.innerHTML = `
        <div class="detail-section">
            <div class="detail-label">资产点主星</div>
            <div class="detail-value">${lord.name} <span class="badge ${lordPlanet.dignitySummary.levelClass}">力量：${lordPlanet.dignitySummary.level}</span></div>
            <div class="detail-desc">${lordSign.symbol} ${lordSign.name} ${formatDegreeMinute(lordPlanet.degree)} · 第${lord.house}宫（${lordHouseType.type}）</div>
        </div>
        <div class="detail-section">
            <div class="detail-label">主星尊贵</div>
            <div class="detail-desc">${lordPlanet.dignitySummary.summaryText}</div>
        </div>
        <div class="detail-section">
            <div class="detail-label">与资产点的星座相位</div>
            <div class="detail-value" style="font-size: 1rem;">${signAspectSymbols}</div>
        </div>
        <div class="detail-section">
            <div class="detail-label">说明</div>
            <div class="detail-desc">${relationDesc}</div>
        </div>
    `;
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

        // 精确度数差（作为参考）
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
                吉星支持：太阳、月亮、木星、金星（星座层面任何相位均视为支持）
            </div>
        </div>
        <div class="table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>行星</th>
                        <th>行星所在星座</th>
                        <th>星座相位</th>
                        <th>精确度数差</th>
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
                <td>${formatDegreeMinute(a.exactDiff)}</td>
                <td class="${a.natureClass}">${a.nature}</td>
            </tr>
        `;
    }

    html += `
                </tbody>
            </table>
        </div>
        <div class="detail-desc" style="font-size: 0.8rem; color: var(--text-faded); margin-top: 8px;">
            注：星座相位（Whole Sign Aspect）只看行星所在星座与${lotName}所在星座的关系，不苛求具体度数容许度。
            精确度数差仅作参考，不作为相位成立的判断依据。
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

// 渲染三分主星
export function renderTriplicity(chart) {
    const { triplicity, isDayChart } = chart;

    const hintDiv = document.getElementById("triplicityHint");
    hintDiv.textContent = "";

    // 总体详情
    const detailsDiv = document.getElementById("triplicityDetails");
    detailsDiv.innerHTML = `
        <div class="grid-2">
            <div class="detail-section">
                <div class="detail-label">发光体</div>
                <div class="detail-value">${triplicity.luminaryName} <span class="badge badge-neutral">${isDayChart ? '日生盘主星' : '夜生盘主星'}</span></div>
                <div class="detail-desc">
                    ${triplicity.luminaryName}所在星座的三分主星代表天生的财富格局和资源获取能力
                </div>
            </div>
            <div class="detail-section">
                <div class="detail-label">二宫星座</div>
                <div class="detail-value">${triplicity.secondHouseSignName}</div>
                <div class="detail-desc">
                    二宫星座的三分主星代表实际的财富积累和物质生活状况
                </div>
            </div>
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

    // 综合评估
    const summaryDiv = document.getElementById("triplicitySummary");
    const wa = chart.wealthAssessment;

    // 福点详情列表
    const pfDetailList = wa.pfDetails.map(d => `<li style="margin-bottom: 6px; line-height: 1.7;">${d}</li>`).join("");

    // 钱财宫详情列表
    const mhDetailList = wa.moneyHouseDetails.map(d => `<li style="margin-bottom: 6px; line-height: 1.7;">${d}</li>`).join("");

    // 三分主星恒星详情
    let triplicityStarList = "";
    if (wa.triplicityStarDetails.length > 0) {
        triplicityStarList = wa.triplicityStarDetails.map(d =>
            `<li style="margin-bottom: 6px; line-height: 1.7;">${d}</li>`
        ).join("");
    }

    summaryDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 280px; gap: 36px; align-items: start;" class="assessment-grid">
            <div>
                <!-- 总评估 -->
                <div class="detail-section">
                    <div class="detail-label">财富格局总评</div>
                    <div class="detail-value">
                        <span class="badge ${wa.wealthClass}" style="font-size: 1rem; padding: 6px 18px; font-family: var(--font-display);">${wa.wealthLevel}</span>
                    </div>
                    <div class="detail-desc" style="margin-top: 12px; line-height: 1.9;">${wa.wealthDesc}</div>
                </div>

                <div class="detail-section">
                    <div class="detail-label">五维度评分（标准化 0-10 分）</div>
                    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-top: 8px;">
                        <div style="text-align: center; padding: 12px 4px; background: var(--bg-card-alt); border: 2px solid var(--border-gold);">
                            <div style="font-size: 0.72rem; color: var(--gold-dark); margin-bottom: 4px; font-weight: 600;">围攻</div>
                            <div style="font-size: 1.25rem; font-family: var(--font-display); color: var(--gold-dark); font-weight: 600;">
                                ${wa.normalized.besiegement}
                            </div>
                        </div>
                        <div style="text-align: center; padding: 12px 4px; background: var(--bg-card-alt); border: 1px solid var(--border-light);">
                            <div style="font-size: 0.72rem; color: var(--text-faded); margin-bottom: 4px; font-weight: 600;">福点&三分主星</div>
                            <div style="font-size: 1.25rem; font-family: var(--font-display); color: var(--gold-dark); font-weight: 600;">
                                ${wa.normalized.pfTriplicityCombined}
                            </div>
                            <div style="font-size: 0.62rem; color: var(--text-faded); margin-top: 2px;">
                                福 ${wa.normalized.partOfFortune} · 三 ${wa.normalized.triplicity}
                            </div>
                        </div>
                        <div style="text-align: center; padding: 12px 4px; background: var(--bg-card-alt); border: 1px solid var(--border-light);">
                            <div style="font-size: 0.72rem; color: var(--text-faded); margin-bottom: 4px; font-weight: 600;">钱财宫</div>
                            <div style="font-size: 1.25rem; font-family: var(--font-display); color: var(--gold-dark); font-weight: 600;">
                                ${wa.normalized.moneyHouse}
                            </div>
                        </div>
                        <div style="text-align: center; padding: 12px 4px; background: var(--bg-card-alt); border: 1px solid var(--border-light);">
                            <div style="font-size: 0.72rem; color: var(--text-faded); margin-bottom: 4px; font-weight: 600;">月亮</div>
                            <div style="font-size: 1.25rem; font-family: var(--font-display); color: var(--gold-dark); font-weight: 600;">
                                ${wa.normalized.moon}
                            </div>
                        </div>
                        <div style="text-align: center; padding: 12px 4px; background: var(--bg-card-alt); border: 1px solid var(--border-light);">
                            <div style="font-size: 0.72rem; color: var(--text-faded); margin-bottom: 4px; font-weight: 600;">额外</div>
                            <div style="font-size: 1.25rem; font-family: var(--font-display); color: var(--gold-dark); font-weight: 600;">
                                ${wa.normalized.extra}
                            </div>
                        </div>
                    </div>
                </div>

                ${wa.fortuneIndicators.wealth.length ? `
                <div class="detail-section">
                    <div class="detail-label">财富获取格局 · 专项支持</div>
                    <div class="detail-value">专项支持 +${wa.fortuneIndicators.wealthBonus} 分</div>
                    <div class="detail-desc">这张盘符合下列财富获取条件，因此在基础评估之上给予专项支持；同一结构的相关条件取较强的一项，多项支持合计最多增加2.5分，总评分最高10分。成就与资源来源另作解读。</div>
                    ${renderFortuneMatches(wa.fortuneIndicators, false)}
                </div>` : ""}

                <!-- 围攻维度详解 -->
                ${wa.besiegementDetails.length > 0 ? `
                <div class="detail-section">
                    <div class="detail-label">维度一 · 围攻（Besiegement）</div>
                    <ul style="margin: 8px 0 0 18px; padding: 0; list-style: none;">
                        ${wa.besiegementDetails.map(d => `<li style="margin-bottom: 6px; line-height: 1.7;">◆ ${d}</li>`).join("")}
                    </ul>
                    <div class="detail-desc" style="margin-top: 8px; font-size: 0.78rem; color: var(--text-faded);">
                        围攻是古典占星中极为重要的格局，日月围攻或金木围攻代表被夹持的行星力量被强化、受到保护
                    </div>
                </div>
                ` : `
                <div class="detail-section">
                    <div class="detail-label">维度一 · 围攻（Besiegement）</div>
                    <div class="detail-desc" style="margin-top: 6px; color: var(--text-faded);">
                        本命盘未形成纯粹的日月围攻或金木围攻格局
                    </div>
                </div>
                `}

                <!-- 月亮状态详解 -->
                <div class="detail-section">
                    <div class="detail-label">维度二 · 月亮状态</div>
                    <div class="detail-desc" style="margin-top: 6px;">
                        月相：<strong>${wa.moonPhase}</strong>${wa.isWaxingMoon ? '（力量渐增）' : '（力量渐减）'}
                    </div>
                    <ul style="margin: 8px 0 0 18px; padding: 0; list-style: none;">
                        ${wa.moonDetails.map(d => `<li style="margin-bottom: 6px; line-height: 1.7;">${d}</li>`).join("")}
                    </ul>
                </div>

                <!-- 福点维度详解 -->
                <div class="detail-section">
                    <div class="detail-label">维度三 · 福点</div>
                    <ul style="margin: 8px 0 0 18px; padding: 0; list-style: none;">
                        ${pfDetailList}
                    </ul>
                    <div class="detail-desc" style="margin-top: 8px; font-size: 0.78rem; color: var(--text-faded);">
                        福点主星落福点第 ${wa.pfLordHouseFromPF} 宫（从福点所在星座起算整宫）。
                    </div>
                </div>

                <!-- 钱财宫维度详解 -->
                <div class="detail-section">
                    <div class="detail-label">维度四 · 钱财宫（2宫）</div>
                    <ul style="margin: 8px 0 0 18px; padding: 0; list-style: none;">
                        ${mhDetailList}
                    </ul>
                </div>

                <!-- 三分主星恒星合相（如有） -->
                ${wa.triplicityStarDetails.length > 0 ? `
                <div class="detail-section">
                    <div class="detail-label">维度五 · 三分主星恒星合相</div>
                    <ul style="margin: 8px 0 0 18px; padding: 0; list-style: none;">
                        ${triplicityStarList}
                    </ul>
                    <div class="detail-desc" style="margin-top: 8px; font-size: 0.78rem; color: var(--text-faded);">
                        恒星合相作为财富判断依据之一，详见上方「恒星合相」章节
                    </div>
                </div>
                ` : ''}

                <!-- 其他加分项 -->
                ${wa.extraDetails && wa.extraDetails.length > 0 ? `
                <div class="detail-section">
                    <div class="detail-label">其他加分 / 减分项</div>
                    <ul style="margin: 8px 0 0 18px; padding: 0; list-style: none;">
                        ${wa.extraDetails.map(d => `<li style="margin-bottom: 6px; line-height: 1.7;">✧ ${d}</li>`).join("")}
                    </ul>
                    <div class="detail-desc" style="margin-top: 8px; font-size: 0.78rem; color: var(--text-faded);">
                        额外修正分：<strong style="color: var(--text-bistre);">${wa.extraBonus > 0 ? '+' : ''}${wa.extraBonus}</strong>
                    </div>
                </div>
                ` : ''}

                <div class="detail-section">
                    <div class="detail-label">参考说明</div>
                    <div class="detail-desc" style="font-size: 0.82rem; color: var(--text-faded); line-height: 1.8;">
                        此评估由AI作出评测，仅供参考，实际财富格局还需结合整张星盘和大运综合判断。
                        人的自由意志和努力同样重要，命由天定，运由己造。
                    </div>
                </div>
            </div>
            <div style="background: var(--bg-card-alt); border: 1px solid var(--border-gold); padding: 24px 20px; text-align: center; position: relative;" class="consult-card">
                <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: var(--bg-card); padding: 0 12px; font-size: 0.75rem; color: var(--gold-dark); letter-spacing: 3px;">
                    ✦ 咨 询 ✦
                </div>
                <div style="font-family: var(--font-display); font-size: 1.05rem; color: var(--text-bistre); margin: 8px 0 14px; font-weight: 600; letter-spacing: 2px;">
                    预 约 咨 询
                </div>
                <div style="font-size: 0.82rem; color: var(--text-sepia); line-height: 1.9; margin-bottom: 8px;">
                    如需更深入的财富格局解读<br>与人生整体运势分析
                </div>
                <div style="border-top: 1px solid var(--border-light); border-bottom: 1px solid var(--border-light); padding: 12px 8px; margin-top: 14px; font-size: 0.85rem; color: var(--text-bistre); line-height: 1.8;">
                    找 瓜 瓜 本 人 预 约<br>
                    <strong style="font-size: 1rem; letter-spacing: 1px; color: var(--gold-dark); font-family: var(--font-display);">微 信：guaguasis</strong>
                </div>
            </div>
        </div>
    `;
}

// 渲染单个三分主星列表
function renderTriplicityLords(lords, starConjunctions = {}, lordComprehensive = {}) {
    let html = "";
    for (const lord of lords) {
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
            <div class="detail-section" style="padding-bottom: 12px; border-bottom: 1px solid var(--border-light); margin-bottom: 12px;">
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
        `${birthData.year}年${birthData.month}月${birthData.day}日 ${String(birthData.hour).padStart(2, "0")}:${String(birthData.minute).padStart(2, "0")} · ${birthData.place || ""}`;
    document.getElementById("infoDayNight").textContent = dayNightText;
    document.getElementById("infoAsc").textContent = `${ascSign.symbol} ${ascSign.name}`;
    document.getElementById("infoMC").textContent = `${mcSign.symbol} ${mcSign.name}`;
}

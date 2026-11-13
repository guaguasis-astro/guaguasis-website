// 已确认的可视化版综合评估，所有内容取自本次排盘。
import { ZODIAC_SIGNS, formatDegreeMinute } from './astrology.js';
import { getAssessmentMoonPhase, getWealthBand, WEALTH_BANDS, getAssessmentFactors, getAssessmentRelations, getAssessmentLord } from './assessment-model.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const phasePaths = ['', 'M12 2 A10 10 0 0 1 12 22 A6 10 0 0 0 12 2 Z', 'M12 2 A10 10 0 0 1 12 22 L12 2 Z', 'M12 2 A10 10 0 0 1 12 22 A6 10 0 0 1 12 2 Z', 'M12 2 A10 10 0 1 1 12 22 A10 10 0 1 1 12 2 Z'];
const phaseGlyph = index => `<svg viewBox="0 0 24 24" aria-hidden="true"><circle class="va-phase-shadow" cx="12" cy="12" r="10"/><path class="va-phase-light" d="${phasePaths[index <= 4 ? index : 8 - index]}"${index > 4 ? ' transform="translate(24 0) scale(-1 1)"' : ''}/></svg>`;
const list = items => `<ul class="va-evidence-list">${items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`;
const paneHeading = title => `<h4 class="va-title">${title}</h4>`;

function renderMoon(phase) {
    return `<div class="va-moon-phase"><div class="va-phase-heading">${phase.growth ? `<span class="va-pill">${phase.growth}月</span>` : ''}<strong>${phase.name}</strong></div>
        <div class="va-phase-flow" role="img" aria-label="${phase.growth ? phase.growth + '月' : phase.name}，当前为${phase.name}">${phase.stages.map(index => `<span class="va-phase-step${index === phase.index ? ' current' : ''}">${phaseGlyph(index)}${index === phase.index ? '<span class="va-phase-current">当前</span>' : ''}</span>`).join('<span class="va-phase-arrow" aria-hidden="true">→</span>')}</div>
        <div class="va-phase-reading">${phase.growthReading ? `<p>${esc(phase.growthReading)}</p>` : ''}<p>${esc(phase.reading)}</p></div></div>`;
}

function renderOverview(chart, factors) {
    const wa = chart.wealthAssessment;
    const selected = getWealthBand(wa.totalScore);
    const first = factors.findIndex(item => item.width === Math.max(...factors.map(factor => factor.width)));
    const factorDetails = factors[first]?.details.join('；') || '财富格局需结合各项已有判断一起看。';
    return `<div class="va-overview"><div class="va-score-pane"><p class="va-muted">财富总评</p><div class="va-score">${wa.totalScore.toFixed(1)}<small>/ 10</small></div><h4 class="va-level">${esc(wa.wealthLevel)}</h4>
        <p class="va-wealth-reading">${esc(wa.wealthDesc)}</p>
        <div class="va-grade" role="img" aria-label="财富总评${wa.totalScore}分，${esc(wa.wealthLevel)}"><div class="va-grade-track">${WEALTH_BANDS.map((band, index) => `<span style="flex:${band.end - band.start}"${index === selected ? ' class="active"' : ''}></span>`).join('')}</div><span class="va-grade-marker" style="left:${Math.max(0, Math.min(100, wa.totalScore * 10))}%"></span><div class="va-grade-labels">${WEALTH_BANDS.map((band, index) => `<span style="flex:${band.end - band.start}"${index === selected ? ' class="active"' : ''}>${band.label}</span>`).join('')}</div></div></div>
        <div class="va-factors"><div class="va-factor-head"><span>各项支持概览</span><span>支持表现</span></div>${factors.map((factor, index) => `<button type="button" class="va-factor${factor.bonus ? ' va-factor-bonus' : ''}${factor.negative ? ' va-factor-pressure' : ''}" data-factor="${index}" aria-pressed="${index === first}"><span>${factor.name}</span><span class="va-track"><span class="va-fill" style="width:${factor.width}%"></span></span><span class="va-status">${factor.status}</span></button>`).join('')}
        <div class="va-factor-detail" aria-live="polite"><strong data-factor-title>${esc(factors[first]?.name)}</strong><p data-factor-reading>${esc(factorDetails)}</p></div></div></div>`;
}

function renderBalance(phase, narrative) {
    const support = narrative?.supportContacts || [];
    const pressure = [...(narrative?.pressureContacts || []), ...(narrative?.frictionContacts || [])];
    const side = (contacts, kind) => contacts.length ? `<div class="va-side va-side-${kind}"><p class="va-side-title">${kind === 'support' ? '助力' : '压力与摩擦'} · ${contacts.length}项</p>${contacts.map(contact => `<div class="va-contact"><span class="va-contact-symbol">${esc(contact.name)}</span><div>${contact.facts.map(fact => `<span class="va-contact-fact">${esc(fact)}</span>`).join('')}</div></div>`).join('')}</div>` : '';
    const layout = support.length && pressure.length ? 'both' : support.length ? 'support-only' : pressure.length ? 'pressure-only' : 'solo';
    return `${paneHeading('支持与压力')}<div class="va-balance va-balance-${layout}">${side(support, 'support')}<div class="va-center-planet"><span class="va-moon-symbol">月亮</span><small>物资与安全感</small></div>${side(pressure, 'pressure')}</div>
        ${renderMoon(phase)}${narrative ? `<div class="va-balance-reading"><div class="va-pills">${support.length ? '<span class="va-pill">有助力</span>' : ''}${pressure.length ? '<span class="va-pill va-pill-pressure">有牵制</span>' : ''}</div><p>${esc(narrative.conclusion)}</p></div>` : ''}`;
}

function renderRelations(relations) {
    const paths = relations.paths.map(path => `<article class="va-path va-path-${path.category}"><h5>${esc(path.title)}</h5><div class="va-path-nodes">${path.nodes.map((node, index) => `${index ? `<div class="va-path-arrow"><span>${esc(path.links[index - 1])}</span><span aria-hidden="true">${path.mutual ? '⇄' : '↓'}</span></div>` : ''}<div class="va-path-node${index === path.nodes.length - 1 ? ' va-path-target' : ''}"><span class="va-path-symbol">${esc(node.symbol)}</span><div><strong>${esc(node.title)}</strong><span>${esc(node.detail)}</span>${node.state ? `<small>${esc(node.state)}</small>` : ''}</div></div>`).join('')}</div><p>${esc(path.reading)}</p></article>`).join('');
    const sources = relations.sources.map(item => `<article class="va-source"><h5>${esc(item.title)}</h5><p>${esc(item.reason)}${esc(item.text)}</p></article>`).join('');
    return `${paneHeading('机会怎样变成收获，行动怎样被看见。')}${paths ? `<div class="va-relation-grid">${paths}</div>` : ''}${sources ? `<div class="va-sources"><h5>资源可能从哪里来</h5>${sources}</div>` : ''}`;
}

function renderLordGroup(lords, wa) {
    return `<div class="va-lord-grid">${lords.map(lord => {
        const entry = getAssessmentLord(lord, wa);
        const sign = ZODIAC_SIGNS[entry.planet.signIndex];
        return `<article class="va-lord${entry.stars === 3 ? ' va-lord-strong' : ''}"><p class="va-lord-order">${esc(entry.orderName)}</p><div class="va-lord-top"><span class="va-lord-symbol">${esc(entry.planetName)}</span><span class="va-star-strength" role="img" aria-label="力量${esc(entry.level)}">${[0, 1, 2].map(index => `<span class="${index < entry.stars ? 'lit' : 'unlit'}" aria-hidden="true">${index < entry.stars ? '✦' : '✧'}</span>`).join('')}</span></div>
            <p class="va-lord-position">${sign.symbol} ${sign.name} ${formatDegreeMinute(entry.planet.degree)}</p><p class="va-muted">第${entry.house}宫 · ${entry.houseKind}</p><div class="va-tags"><span class="va-tag">力量${esc(entry.level)}</span>${entry.tags.map(tag => `<span class="va-tag${tag.good ? ' va-tag-good' : tag.pressure ? ' va-tag-pressure' : ''}">${tag.label}</span>`).join('')}</div>
            ${entry.signPeriodRounded != null ? `<p class="va-lord-period">星座年限 ${entry.signPeriodRounded}年</p>` : ''}${entry.fixedStars.length ? `<p class="va-lord-stars">合恒星：${entry.fixedStars.map(star => `${esc(star.starNameZh)}（${star.orb.toFixed(2)}°）`).join('、')}</p>` : ''}</article>`;
    }).join('')}</div>`;
}

function renderLifeSupport(chart) {
    const t = chart.triplicity;
    const sign = ZODIAC_SIGNS[chart.planets[t.luminaryKey].signIndex];
    return `${paneHeading('你的人生支持系统')}<div class="va-trip-head"><span>发光体</span><strong>${t.luminaryName}</strong><span>${sign.symbol} ${sign.name}</span><span class="va-pill">${chart.isDayChart ? '日生盘' : '夜生盘'}</span></div>
        ${renderLordGroup(t.luminaryTriplicityLords, chart.wealthAssessment)}<div class="va-trip-head va-trip-second"><span>二宫星座</span><strong>${ZODIAC_SIGNS[t.secondHouseSignIndex].symbol} ${t.secondHouseSignName}</strong></div>${renderLordGroup(t.secondHouseTriplicityLords, chart.wealthAssessment)}`;
}

function renderEvidence(chart, narratives) {
    const wa = chart.wealthAssessment;
    const sections = [ ['围攻格局', wa.besiegementDetails], ['福点', wa.pfDetails], ['钱财宫', wa.moneyHouseDetails], ['其他支持与压力', narratives.otherDetails] ];
    return `<details class="va-evidence"><summary>查看其他判断依据</summary>${sections.filter(([, values]) => values.length).map(([title, values]) => `<div><h5>${title}</h5>${list([...new Set(values)])}</div>`).join('')}${narratives.narratives.filter(item => item.target !== '月亮').map(item => `<div><h5>${item.target}相位</h5><p>${esc(item.evidence)}。</p><p>${esc(item.conclusion)}</p></div>`).join('')}</details>`;
}

export function buildVisualAssessmentHTML(chart, narratives) {
    const email = globalThis.window?.GuaguaI18n?.language === 'en'
        ? '<a href="mailto:guaguasis@icloud.com">Email: guaguasis@icloud.com</a>' : '';
    const phase = getAssessmentMoonPhase(chart.planets.SUN.longitude, chart.planets.MOON.longitude);
    const factors = getAssessmentFactors(chart.wealthAssessment);
    const relations = getAssessmentRelations(chart);
    const tabs = [
        { key: 'overview', label: '综合评估', html: renderOverview(chart, factors) + renderEvidence(chart, narratives) },
        { key: 'balance', label: '支持与压力', html: renderBalance(phase, narratives.narratives.find(item => item.target === '月亮')) },
        ...(relations.paths.length || relations.sources.length ? [{ key: 'relations', label: '机缘与行动', html: renderRelations(relations) }] : []),
        { key: 'life', label: '三分主星', html: renderLifeSupport(chart) },
    ];
    return `<div class="visual-assessment"><nav class="va-nav" role="tablist" aria-label="综合评估内容">${tabs.map((tab, index) => `<button type="button" role="tab" id="va-tab-${tab.key}" data-va-tab="${tab.key}" aria-controls="va-panel-${tab.key}" aria-selected="${index === 0}" tabindex="${index === 0 ? '0' : '-1'}">${tab.label}</button>`).join('')}</nav>
        ${tabs.map((tab, index) => `<section class="va-panel" role="tabpanel" id="va-panel-${tab.key}" aria-labelledby="va-tab-${tab.key}"${index ? ' hidden' : ''}>${tab.html}</section>`).join('')}
        <div class="va-consult"><span>如需更深入的财富格局解读与人生整体运势分析</span><div class="va-contact-details"><strong>找瓜瓜本人预约 · 微信：guaguasis</strong>${email}</div></div></div>`;
}

export function renderVisualAssessment(container, chart, narratives, decorate) {
    container.innerHTML = buildVisualAssessmentHTML(chart, narratives);
    const root = container.querySelector('.visual-assessment');
    const factors = getAssessmentFactors(chart.wealthAssessment);
    const tabs = [...root.querySelectorAll('[data-va-tab]')];
    root.addEventListener('click', event => {
        const tab = event.target.closest('[data-va-tab]');
        if (tab) tabs.forEach(button => {
            const selected = button === tab;
            button.setAttribute('aria-selected', String(selected));
            button.tabIndex = selected ? 0 : -1;
            root.querySelector(`#${button.getAttribute('aria-controls')}`).hidden = !selected;
        });
        const factor = event.target.closest('[data-factor]');
        if (factor) {
            const entry = factors[Number(factor.dataset.factor)];
            root.querySelectorAll('[data-factor]').forEach(button => button.setAttribute('aria-pressed', String(button === factor)));
            root.querySelector('[data-factor-title]').textContent = entry.name;
            root.querySelector('[data-factor-reading]').textContent = entry.details.join('；') || '这一项没有额外的支持依据。';
            decorate(root);
        }
    });
    root.addEventListener('keydown', event => {
        const tab = event.target.closest('[data-va-tab]');
        if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const index = tabs.indexOf(tab);
        const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs.at(-1) : tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
        next.focus(); next.click();
    });
}

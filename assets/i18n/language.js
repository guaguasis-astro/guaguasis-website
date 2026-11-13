// 三个主页面共用语言状态；只翻译展示文本，原始排盘数据保持中文键值。
(() => {
    const dictionaries = window.GuaguaEnglish;
    const tool = location.pathname.includes('/fortune-chart/');
    const dictionary = { ...dictionaries.site, ...(tool ? dictionaries.chart : {}) };
    const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const phrases = Object.keys(dictionary).filter(key => key.length > 1).sort((a, b) => b.length - a.length);
    const pattern = new RegExp(phrases.map(escape).join('|'), 'g');
    let saved;
    try { saved = localStorage.getItem('guagua-language'); } catch (_) { /* 隐私模式仍可切换 */ }
    let language = new URLSearchParams(location.search).get('lang') || saved || 'zh';
    language = language === 'en' ? 'en' : 'zh';
    const originalText = new WeakMap();
    const originalAttributes = new WeakMap();
    const attributes = ['alt', 'title', 'aria-label', 'placeholder'];
    let observer;

    function english(value) {
        if (!value || !/[\u3400-\u9fff]/.test(value)) return value;
        const trimmed = value.trim();
        if (dictionary[trimmed]) return value.replace(trimmed, dictionary[trimmed]);
        let text = value;
        if (tool) text = text.replace(/(\d{4})年(\d{1,2})月(\d{1,2})日/g, '$1-$2-$3');
        text = text.replace(pattern, match => dictionary[match]);
        if (tool) {
            text = text.replace(/第\s*(\d+)\s*宫/g, 'House $1').replace(/(\d+)宫/g, 'House $1')
                .replace(/(\d+)\s*年/g, '$1 years').replace(/(\d+)项/g, '$1 items')
                .replace(/(\d+)月/g, '$1/').replace(/(\d+)日/g, '$1').replace(/(\d+)分/g, '$1 points');
            text = text.replace(/[\u3400-\u9fff]+/g, run => dictionary[run] || run);
            text = text.replace(/（/g, ' (').replace(/）/g, ')').replace(/，/g, ', ').replace(/。/g, '. ')
                .replace(/；/g, '; ').replace(/：/g, ': ').replace(/、/g, ', ');
        }
        return text;
    }
    function updateValue(owner, key, value, cache, write) {
        let record = cache.get(owner);
        if (!record) { record = {}; cache.set(owner, record); }
        if (!record[key] || value !== record[key].shown) record[key] = { source: value };
        const entry = record[key];
        const shown = language === 'en' ? english(entry.source) : entry.source;
        entry.shown = shown;
        if (shown !== value) write(shown);
    }
    function apply() {
        observer?.disconnect();
        document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (node.parentElement.closest('script,style,[data-language-switch],.article-card')) continue;
            updateValue(node, 'text', node.nodeValue, originalText, value => { node.nodeValue = value; });
        }
        document.querySelectorAll('title,meta[name="description"],meta[property="og:title"],meta[property="og:description"],meta[name="twitter:title"],meta[name="twitter:description"]').forEach(node => {
            const isTitle = node.tagName === 'TITLE';
            updateValue(node, 'meta', isTitle ? node.textContent : node.content, originalAttributes, value => {
                if (isTitle) node.textContent = value; else node.content = value;
            });
        });
        document.querySelectorAll('[alt],[title],[aria-label],[placeholder]').forEach(node => {
            if (node.closest('[data-language-switch],.article-card')) return;
            for (const name of attributes) if (node.hasAttribute(name)) {
                updateValue(node, name, node.getAttribute(name), originalAttributes, value => node.setAttribute(name, value));
            }
        });
        document.querySelectorAll('a[href]').forEach(link => {
            const url = new URL(link.getAttribute('href'), location.href);
            if (url.origin !== location.origin || !/\/(?:index|consultation)\.html$/.test(url.pathname)) return;
            url.searchParams.set('lang', language);
            link.setAttribute('href', url.pathname + url.search + url.hash);
        });
        document.querySelectorAll('[data-language-switch] button').forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.language === language));
        });
        document.querySelectorAll('.article-card').forEach(card => { card.lang = 'zh-CN'; });
        observer?.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes });
    }
    function setLanguage(next) {
        language = next === 'en' ? 'en' : 'zh';
        try { localStorage.setItem('guagua-language', language); } catch (_) { /* 无存储也可使用 */ }
        const url = new URL(location.href);
        url.searchParams.set('lang', language);
        history.replaceState(null, '', url);
        apply();
        window.dispatchEvent(new CustomEvent('guagua-languagechange', { detail: language }));
    }
    window.GuaguaI18n = { english, apply, get language() { return language; }, setLanguage };
    // 对话框由计算模块触发，同样跟随当前语言。
    const nativeAlert = window.alert.bind(window);
    window.alert = value => nativeAlert(language === 'en' ? english(String(value)) : value);
    document.addEventListener('DOMContentLoaded', () => {
        const switcher = document.createElement('div');
        switcher.className = 'language-switch';
        switcher.dataset.languageSwitch = '';
        switcher.setAttribute('role', 'group');
        switcher.setAttribute('aria-label', 'Language / 语言');
        switcher.innerHTML = '<button type="button" data-language="zh" lang="zh-CN">中文</button><span aria-hidden="true">/</span><button type="button" data-language="en" lang="en">EN</button>';
        const nav = document.querySelector('body > nav');
        if (nav) nav.append(switcher);
        else (document.querySelector('.app > div') || document.querySelector('.sheet')).prepend(switcher);
        switcher.addEventListener('click', event => {
            const button = event.target.closest('[data-language]');
            if (button) setLanguage(button.dataset.language);
        });
        observer = new MutationObserver(apply);
        apply();
    });
})();

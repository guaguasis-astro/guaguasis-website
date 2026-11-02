(() => {
    const root = document.getElementById('astrology-history');
    if (!root) return;

// 节选自瓜瓜《占星历史时间线》。地图锚点表示区域，不代表唯一的起源地。
const places = [
    { id: 'rivers', name: '两河流域', keyword: '黄道十二宫', x: 61, y: 47, chapters: [0, 6] },
    { id: 'egypt', name: '埃及', keyword: '旬星 · 传统融合', x: 44, y: 55, chapters: [1, 3] },
    { id: 'greece', name: '希腊', keyword: '宇宙的秩序', x: 40, y: 35, lx: 20, chapters: [2] },
    { id: 'persia', name: '波斯', keyword: '木土大合相', x: 72, y: 44, chapters: [4] },
    { id: 'india', name: '印度', keyword: '月宿与历法', x: 87, y: 62, chapters: [5] },
    { id: 'iberia', name: '伊比利亚', keyword: '知识的桥梁', x: 18, y: 37, chapters: [7] },
    { id: 'europe', name: '欧洲大陆', keyword: '大学 · 手稿 · 变革', x: 32, y: 27, lx: 0, ly: -63, chapters: [8, 9, 11] },
    { id: 'britain', name: '英国', keyword: '卜卦占星', x: 20, y: 17, lx: -32, ly: -57, chapters: [10] }
];

const chapters = [
    {
        short: '两河流域', title: '美索不达米亚占星传统', era: '约公元前2000年 – 公元前300年',
        region: '两河流域 · 今日伊拉克', place: 'rivers', keyword: '黄道十二宫',
        lead: '占星术起源于占卜传统，最早记录的是日食兆文。',
        discoveries: ['公元前5世纪：标准化黄道十二宫（每宫30度），制作星历表。', '公元前410年左右：本命占星诞生——从世俗占断转向个人命运。', '六十进制计数系统（时间、角度沿用至今）。'],
        people: '贝罗索斯（Berossus）', books: '《Enuma Anu Enlil》 · 《MUL.APIN》 · 楔形文字泥板',
        legacy: '六十进制计时（时分秒）和角度（度分秒）；黄道十二宫的基本框架。'
    },
    {
        short: '古埃及', title: '古埃及占星传统', era: '约公元前2000年 – 公元前300年',
        region: '尼罗河流域 · 埃及', place: 'egypt', keyword: '三十六旬星',
        lead: '围绕36颗旬星（decans）构建占星体系，至少公元前2000年已用于计时和神庙仪式。',
        discoveries: ['天狼星偕日升与尼罗河泛滥深度绑定，标志埃及新年。', '公元前4世纪左右：《历年之书》（Book of the Decades）——旬星用于世俗占星的最早证据。', '《托特之书》（Book of Thoth）：师生对话形式的启示文学——赫尔墨斯对话录的雏形。'],
        people: '佩托西里斯（Petosiris） · 守时祭司（hour-watcher priests）', books: '《历年之书》 · 《托特之书》 · 旬星护身符',
        legacy: '十二星座中“旬星”的概念（后被纳入希腊化占星）；天狼星与新年的关联。'
    },
    {
        short: '古希腊', title: '古希腊早期传统', era: '约公元前400年 – 公元前150年',
        region: '希腊 · 小亚细亚', place: 'greece', keyword: '宇宙的秩序',
        lead: '《蒂迈欧篇》：宇宙是活的生命体、行星有灵魂——占星有效的哲学基础。',
        discoveries: ['柏拉图：球形宇宙 + 行星秩序设定。', '行星命名项目：柏拉图学园系统将希腊神祇对应美索不达米亚行星神。', '希帕克斯：观测为核心、三角学、偏心圆、岁差、星等概念。'],
        people: '柏拉图 · 欧多克索斯 · 亚里士多德 · 希帕克斯', books: '《蒂迈欧篇》 · 《理想国》',
        legacy: '行星的希腊/罗马神名体系（水星墨丘利、金星维纳斯等）；“天球的和谐”概念。'
    },
    {
        short: '希腊化时代', title: '希腊化占星时代', era: '约公元前150年 – 公元625年',
        region: '亚历山大 · 地中海世界', place: 'egypt', keyword: '三大传统的汇流',
        lead: '三大传统（美索不达米亚、埃及、希腊）在埃及汇聚，希腊语成为通用语。',
        discoveries: ['成型的技术体系：上升点、十二宫、相位、阿拉伯点（lots）、各种时间主方法。', '托勒密的集大成：《天文学大成》 + 《四书》。', '行星体液性质配对（吉星/凶星、阳性/阴性、昼/夜）。'],
        people: '托勒密 · 多罗修斯 · 瓦勒留斯', books: '《四书》 · 《天文学大成》 · 《五书》 · 《文选》',
        legacy: '现代西方占星的基本框架（上升、十二宫、相位）；吉星/凶星、昼/夜行星的分类。'
    },
    {
        short: '萨珊波斯', title: '萨珊波斯时期', era: '公元226年 – 632年',
        region: '波斯 · 今日伊朗、伊拉克', place: 'persia', keyword: '木土大合相',
        lead: '萨珊统治者用占星预测王朝兴衰、论证统治合法性。',
        discoveries: ['将希腊占星文献从希腊文译为波斯巴列维语。', '木星-土星大合相历史占星学：将琐罗亚斯德教12000年世界年理论与行星合相结合。', '邀请希腊、叙利亚、中国、印度占星师——多元文化交流。'],
        people: '萨珊王朝宫廷占星师群体', books: '《王表》（Zij-i Shahi） · 多罗修斯《五书》巴列维语译本',
        legacy: '“木土大合相”预言历史大事件的传统（后被阿布·马沙尔发展，影响整个中世纪）。'
    },
    {
        short: '印度', title: '印度占星发展', era: '约公元前5世纪 – 公元7世纪',
        region: '印度', place: 'india', keyword: '月宿与历法',
        lead: '公元1-4世纪：希腊占星/天文学传入印度。公元5-7世纪：印度黄金时代，发展出完整的悉檀多（siddhanta）体系。',
        discoveries: ['月宿（nakshatra）：27-28个月宿，吠陀传统特色。', '业力与轮回：占星不仅预测还回溯过去世。', '五分历（panchangam）：年度历书（太阴日、星宿、日月角距、半太阴日、星期）。'],
        people: '阿利耶毗陀 · 婆罗门笈多 · 斯弗季德瓦贾', books: '《希腊占星》（Yavanajataka） · 《太阳悉檀多》 · 《梵天悉檀多》',
        legacy: '吠陀占星（Jyotish）作为独立传统延续至今。'
    },
    {
        short: '伊斯兰黄金时代', title: '伊斯兰黄金时代', era: '公元600年 – 1300年',
        region: '以巴格达为入口 · 伊斯兰世界', place: 'rivers', keyword: '翻译与集成',
        lead: '三大传统汇流：同时吸收希腊（托勒密）、波斯（萨珊）、印度（悉檀多）的知识。',
        discoveries: ['翻译运动：8-9世纪巴格达智慧馆（Bayt al-Hikma），将希腊、印度、伊朗典籍译为阿拉伯语。', '卜卦占星（horary astrology）兴起流行；光的传递与收集新教义。', '三角学的大发展（正弦、余弦、正切）。'],
        people: '穆沙阿拉 · 阿布·马沙尔 · 花拉子米 · 比鲁尼', books: '《占星科学大导论》 · 《宗教与王朝之书》 · 《马苏第天文典》',
        legacy: '代数、算法（algebra, algorithm）；阿拉伯数字（印度系统的传播）；星盘等天文仪器。'
    },
    {
        short: '安达卢西亚', title: '安达卢西亚', era: '公元711年 – 13世纪',
        region: '伊比利亚 · 科尔多瓦、托莱多', place: 'iberia', keyword: '知识的桥梁',
        lead: '知识传递的管道：伊斯兰东方的天文占星知识经由这里传入基督教欧洲。',
        discoveries: ['马吉里提改编花拉子米《积尺·信德罕德》为科尔多瓦版本。', '查尔卡利《托莱多天文表》（约1080年）。', '查尔卡利发明通用星盘（查尔卡利之盘）——可解决任何纬度问题。'],
        people: '马吉里提 · 查尔卡利 · 阿方索十世', books: '《托莱多天文表》 · 《阿方索天文表》',
        legacy: '希腊知识经伊斯兰消化升级后通过西班牙传回欧洲。'
    },
    {
        short: '中世纪欧洲', title: '中世纪欧洲 / 拜占庭', era: '公元1200年 – 1500年',
        region: '欧洲大陆 · 拜占庭', place: 'europe', keyword: '大学与手稿',
        lead: '占星作为中世纪科学的一部分，在大学教授（尤其是医疗占星形式）。',
        discoveries: ['托莱多翻译运动：克雷莫纳的杰拉德翻译约87部著作。', '拜占庭：12世纪起编纂数千份占星手稿；14世纪修订古典和拜占庭文本。', '主限法（Primary Directions）：中世纪主要推运技术。'],
        people: '圭多·博纳提 · 克雷莫纳的杰拉德 · 大阿尔伯特', books: '《天文书》（Liber Astronomiae） · Firdaria（法达星限）',
        legacy: '医疗占星传统；大学博雅教育包含占星的传统。'
    },
    {
        short: '文艺复兴', title: '文艺复兴占星', era: '公元1500年 – 1700年',
        region: '意大利 · 德国 · 法国 · 英国 · 丹麦', place: 'europe', keyword: '印刷与宇宙变革',
        lead: '16世纪可直接获取希腊手稿；印刷术使年鉴广泛传播，占星进入普通人手中。',
        discoveries: ['哥白尼革命：日心说动摇地心框架。', '伽利略望远镜：发现木星卫星、太阳黑子——天界非完美不变。', '牛顿机械宇宙：宇宙变为按物理定律运转的机器。'],
        people: '第谷·布拉赫 · 约翰·开普勒 · 让-巴蒂斯特·莫兰 · 普拉西德斯', books: '《天球运行论》 · 《Astrologia Gallica》 · 《赫尔墨斯文集》',
        legacy: '科学革命与占星的分道扬镳。'
    },
    {
        short: '17世纪英国', title: '英国占星黄金时代', era: '17世纪',
        region: '英国', place: 'britain', keyword: '卜卦占星',
        lead: '尽管哥白尼革命，占星在英国仍繁荣一个世纪；卜卦占星极为发达。',
        discoveries: ['威廉·莉莉：阅读大部分拉丁文占星著作。', '《基督教占星》：详细论述卜卦占星和部分本命占星，附有大量案例。'],
        people: '威廉·莉莉 · 尼古拉斯·卡尔佩珀 · 约翰·加德伯里', books: '《基督教占星》（Christian Astrology）',
        legacy: '卜卦占星（Horary Astrology）作为独立分支延续。'
    },
    {
        short: '沉寂与转型', title: '衰落与地下时期', era: '18世纪 – 19世纪末',
        region: '欧洲', place: 'europe', keyword: '沉寂与转型',
        lead: '启蒙运动影响下，占星不再被知识界认为值得讨论；传统被稀释、消失、转入地下。',
        discoveries: ['学术界开始整理古代手稿。', '19世纪末三大运动促成复苏：唯灵论运动、通神论运动、深度心理学。'],
        people: 'Franz Cumont', books: '《希腊占星典籍目录》（CCAG）',
        legacy: '占星从“科学”转向“自我认知工具”的现代转型开端。'
    },
    {
        short: '现代复兴', title: '现代复兴', era: '20世纪 – 至今',
        region: '美国 · 欧洲 · 全球', place: null, keyword: '重新阅读古典',
        lead: '现代占星以心理占星为主流，传统占星重新崛起。',
        discoveries: ['1993年 Project Hindsight（回溯计划）发起：将古代占星文献从希腊文和拉丁文译为英文。', 'James Holden 从1950年代开始私人翻译古代文献，2013年去世前全部出版。', '整宫制等古代技术重新进入主流实践。'],
        people: 'Robert Schmidt · Robert Hand · Robert Zoller · Demetra George · Chris Brennan · Benjamin Dykes', books: 'Project Hindsight · ARHAT · 《古代占星的理论与实践》 · 《希腊占星：命运与幸运之研究》',
        legacy: '现代心理占星的主流地位；传统占星/古典占星的当代复兴浪潮。'
    }
];

const byId = id => root.querySelector('#history-' + id);
let selected = 0;
const remembered = new Map();
const markerButtons = new Map();
const chapterButtons = [];

places.forEach(place => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'marker';
    button.style.cssText = `--x:${place.x}%;--y:${place.y}%;--lx:${place.lx || 0}px;--ly:${place.ly || 15}px`;
    button.setAttribute('aria-label', `${place.name}：${place.keyword}，${place.chapters.length}个历史章节`);
    button.setAttribute('aria-controls', 'history-story');
    button.innerHTML = `<span class="marker-dot" aria-hidden="true"></span><span class="marker-label">${place.name}<small>${place.keyword}</small></span>`;
    button.addEventListener('click', () => selectChapter(remembered.get(place.id) ?? place.chapters[0], 'map'));
    byId('markers').append(button);
    markerButtons.set(place.id, button);
});

chapters.forEach((chapter, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chapter';
    button.setAttribute('aria-controls', 'history-story');
    button.innerHTML = `<span class="number">${String(index + 1).padStart(2, '0')}</span> <strong>${chapter.short}</strong><small>${chapter.era}</small>`;
    button.addEventListener('click', () => selectChapter(index, 'chapter'));
    byId('chapter-list').append(button);
    chapterButtons.push(button);
});

function selectChapter(index, origin = 'initial') {
    selected = index;
    const chapter = chapters[index];
    const place = places.find(item => item.id === chapter.place);
    if (place) remembered.set(place.id, index);
    byId('chapter-number').textContent = `历史札记 / ${String(index + 1).padStart(2, '0')}`;
    byId('story-region').textContent = place ? place.name : '走向全球';
    byId('story-era').textContent = chapter.era;
    byId('story-title').textContent = chapter.title;
    byId('story-lead').textContent = chapter.lead;
    byId('people').textContent = chapter.people;
    byId('books').textContent = chapter.books;
    byId('legacy').textContent = chapter.legacy;
    byId('map-location').textContent = chapter.region;
    byId('chapter-count').textContent = `${index + 1} / ${chapters.length}`;
    byId('discoveries').replaceChildren(...chapter.discoveries.map(text => {
        const li = document.createElement('li');
        li.textContent = text;
        return li;
    }));
    markerButtons.forEach((button, id) => {
        const active = id === chapter.place;
        button.setAttribute('aria-pressed', String(active));
        const defaultPlace = places.find(item => item.id === id);
        button.querySelector('small').textContent = active ? chapter.keyword : defaultPlace.keyword;
        button.setAttribute('aria-label', `${defaultPlace.name}：${active ? chapter.keyword : defaultPlace.keyword}，${defaultPlace.chapters.length}个历史章节`);
    });
    chapterButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    byId('global').setAttribute('aria-pressed', String(!place));
    byId('previous').disabled = index === 0;
    byId('next').disabled = index === chapters.length - 1;
    byId('related').replaceChildren();
    if (place && place.chapters.length > 1) {
        place.chapters.forEach(i => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = chapters[i].short;
            button.setAttribute('aria-pressed', String(i === index));
            button.setAttribute('aria-controls', 'history-story');
            button.addEventListener('click', () => selectChapter(i, 'related'));
            byId('related').append(button);
        });
        // Replacing the period switcher should not discard keyboard focus.
        if (origin === 'related') byId('related').querySelector('[aria-pressed="true"]').focus({ preventScroll: true });
    }
    if (place) {
        const scroller = byId('map-scroll');
        scroller.scrollTo({ left: byId('map-canvas').offsetWidth * place.x / 100 - scroller.clientWidth / 2, behavior: 'instant' });
    }
    const strip = byId('chapter-list');
    const activeButton = chapterButtons[index];
    strip.scrollTo({ left: activeButton.offsetLeft - strip.offsetLeft - strip.clientWidth / 2 + activeButton.offsetWidth / 2, behavior: 'instant' });
    if (origin !== 'initial' && origin !== 'related') {
        // Announce the new chapter and put its heading within reach after a mobile tap.
        byId('story-title').tabIndex = -1;
        byId('story-title').focus({ preventScroll: true });
        if (window.innerWidth <= 768 || origin === 'chapter') {
            byId('story').scrollIntoView({ block: 'start', behavior: 'instant' });
        }
    }
}

byId('previous').addEventListener('click', () => selectChapter(Math.max(0, selected - 1), 'previous'));
byId('next').addEventListener('click', () => selectChapter(Math.min(chapters.length - 1, selected + 1), 'next'));
byId('reset').addEventListener('click', () => selectChapter(0, 'reset'));
byId('global').addEventListener('click', () => selectChapter(12, 'global'));
selectChapter(0);

})();

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initSwe, calculatePlanets, PLANET_NAMES } from './js/astrology.js';

// 使用已安装的同版本星历文件，避免回归验证依赖外网。
const ephemerisRoot = fileURLToPath(new URL('./ephe/', import.meta.resolve('sweph-wasm')));
const nativeFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
    const value = String(url);
    if (value.startsWith('file:') && value.endsWith('/swisseph.wasm')) {
        return new Response(fs.readFileSync(new URL(value)), { headers: { 'Content-Type': 'application/wasm' } });
    }
    if (value.startsWith('https://ptprashanttripathi.github.io/sweph-wasm/ephe/')) {
        return new Response(fs.readFileSync(path.join(ephemerisRoot, path.basename(new URL(value).pathname))));
    }
    return nativeFetch(url, options);
};

try {
    const swe = await initSwe();
    for (const month of [1, 2]) {
        const jd = swe.swe_julday(1990, month, 15, 4, swe.SE_GREG_CAL);
        const planets = await calculatePlanets(jd);
        const before = await calculatePlanets(jd - 0.01);
        const after = await calculatePlanets(jd + 0.01);
        for (const key of Object.keys(PLANET_NAMES)) {
            // 以相邻时刻黄经的实际增减独立核对速度和逆行标志。
            const motion = ((after[key].longitude - before[key].longitude + 540) % 360 - 180) / 0.02;
            assert(Math.abs(planets[key].longitudeSpeed - motion) < 0.001, `${key}：速度应与黄经变化一致`);
            assert.equal(planets[key].isRetrograde, motion < 0, `${key}：逆行标志应与黄经变化一致`);
        }
        assert.equal(planets.SUN.isRetrograde, false);
        assert.equal(planets.MOON.isRetrograde, false);
        assert.equal(planets.MERCURY.isRetrograde, month === 1);
    }
    console.log('逆行验证通过：十颗行星速度与相邻时刻黄经变化一致，水星顺逆行及日月顺行正确。');
} finally {
    globalThis.fetch = nativeFetch;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedMediaUrl, validatePortfolio, parseWaveform, getWaveformUrl } from '../src/lib/portfolio.js';

test('portfolio accepts published media and rejects active or foreign URLs', () => {
    const data = [{ category: 'Film', items: [{
        id: 'film-1', title: 'Film', description: 'Composer',
        image: 'https://hls.saxmusic.site/img/film.avif',
        tracks: [{ title: 'Theme', artist: 'Sax', src: 'https://hls.saxmusic.site/theme.m3u8' }],
    }] }];
    assert.equal(validatePortfolio(data), data);
    for (const value of ['javascript:alert(1)', 'data:text/html,unsafe', '//evil.example/a',
        'https://hls.saxmusic.site.evil.example/a', 'https://user:pass@hls.saxmusic.site/a',
        'http://hls.saxmusic.site/a']) {
        assert.equal(isAllowedMediaUrl(value), false, value);
        const malicious = structuredClone(data);
        malicious[0].items[0].tracks[0].src = value;
        assert.throws(() => validatePortfolio(malicious), /Invalid portfolio/);
    }
    assert.equal(isAllowedMediaUrl('/assets/Pro.avif'), true);
    assert.throws(() => validatePortfolio({ error: 'wrong schema' }));
});

test('waveforms handle flat and channel arrays without unbounded allocation', () => {
    assert.deepEqual(parseWaveform({ duration: 104, data: [-0.2, 0.3] }), {
        duration: 104, peaks: [[-0.2, 0.3]],
    });
    assert.deepEqual(parseWaveform({ duration: 10, data: [[0, 1], [1, 0]] }).peaks, [[0, 1], [1, 0]]);
    for (const data of [{ duration: Infinity, data: [0] }, { duration: 10, data: [NaN] },
        { duration: 0, data: [0] }, { duration: 10, data: [new Array(200_001).fill(0)] }]) {
        assert.equal(parseWaveform(data), null);
    }
    assert.equal(getWaveformUrl('https://hls.saxmusic.site/a.m3u8?token=control'),
        'https://hls.saxmusic.site/a.json?token=control');
    assert.equal(getWaveformUrl('https://hls.saxmusic.site/a.mp3'), null);
    assert.equal(getWaveformUrl('/assets/a.m3u8'), '/assets/a.json');
});

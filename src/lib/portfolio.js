const PUBLIC_ORIGIN = 'https://saxmusic.site';
const MEDIA_ORIGIN = 'https://hls.saxmusic.site';

export function isAllowedMediaUrl(value) {
    if (typeof value !== 'string' || !value) return false;
    try {
        const url = new URL(value, PUBLIC_ORIGIN);
        return url.protocol === 'https:' && !url.username && !url.password &&
            (url.origin === MEDIA_ORIGIN || url.origin === PUBLIC_ORIGIN);
    } catch {
        return false;
    }
}

export function validatePortfolio(data) {
    if (!Array.isArray(data) || !data.every(category =>
        category && typeof category.category === 'string' &&
        Array.isArray(category.items) && category.items.every(item =>
            item && typeof item.id === 'string' && typeof item.title === 'string' &&
            typeof item.description === 'string' && isAllowedMediaUrl(item.image) &&
            Array.isArray(item.tracks) && item.tracks.every(track =>
                track && typeof track.title === 'string' &&
                typeof track.artist === 'string' && isAllowedMediaUrl(track.src))))) {
        throw new Error('Invalid portfolio response');
    }
    return data;
}

export function getWaveformUrl(source) {
    const url = new URL(source, PUBLIC_ORIGIN);
    if (!/\.m3u8$/i.test(url.pathname)) return null;
    url.pathname = url.pathname.replace(/\.m3u8$/i, '.json');
    return source.startsWith('/') && !source.startsWith('//')
        ? `${url.pathname}${url.search}${url.hash}` : url.href;
}

export function parseWaveform(data) {
    if (!data || !Number.isFinite(data.duration) || data.duration <= 0 ||
        !Array.isArray(data.data) || !data.data.length) return null;
    const peaks = Array.isArray(data.data[0]) ? data.data : [data.data];
    if (peaks.reduce((total, channel) => total + (channel?.length || 0), 0) > 200_000 ||
        !peaks.every(channel => Array.isArray(channel) && channel.length &&
            channel.every(Number.isFinite))) return null;
    return { peaks, duration: data.duration };
}

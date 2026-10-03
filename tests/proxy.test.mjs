import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/api/[[path]].ts';

afterEach(() => { delete globalThis.caches; });

async function invoke(request, fetch, cache) {
    globalThis.caches = cache ? { default: cache } : undefined;
    const pending = [];
    const response = await onRequest({
        request, env: { SAX_MUSIC_API: { fetch } },
        waitUntil: promise => pending.push(promise),
    });
    await Promise.all(pending);
    return response;
}

test('public cache strips credentials, queries, cookies, and reflected headers', async () => {
    const storage = new Map();
    const cache = {
        match: async request => storage.get(request.url)?.clone(),
        put: async (request, response) => storage.set(request.url, response.clone()),
    };
    let calls = 0;
    const fetch = async request => {
        calls++;
        assert.equal(request.url, 'https://saxmusic.site/api/v1/portfolio');
        assert.equal(request.method, 'GET');
        assert.equal(request.headers.get('Authorization'), null);
        assert.equal(request.headers.get('Cookie'), null);
        return Response.json([{ category: 'Film', items: [] }], { headers: {
            'Set-Cookie': 'private=sentinel', 'Vary': '*',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Expose-Headers': 'Authorization',
        } });
    };
    const cold = await invoke(new Request('https://saxmusic.site/api/v1/portfolio?private=1', {
        headers: { Authorization: 'Bearer SENTINEL', Cookie: 'session=SENTINEL' },
    }), fetch, cache);
    assert.deepEqual(await cold.json(), [{ category: 'Film', items: [] }]);
    assert.equal(cold.headers.get('Set-Cookie'), null);
    assert.equal(cold.headers.get('Vary'), null);
    assert.equal(cold.headers.get('Access-Control-Allow-Credentials'), null);
    assert.equal(cold.headers.get('Access-Control-Expose-Headers'), null);
    assert.match(cold.headers.get('Cache-Control'), /max-age=60/);
    const warm = await invoke(new Request('https://saxmusic.site/api/v1/portfolio'), fetch, cache);
    assert.equal(warm.status, 200);
    assert.equal(calls, 1);
    const head = await invoke(new Request('https://saxmusic.site/api/v1/portfolio', { method: 'HEAD' }), fetch, cache);
    assert.equal(await head.text(), '');
    assert.equal(calls, 1);
});

test('admin upload and authentication pass through without public caching', async () => {
    const request = new Request('https://saxmusic.site/api/admin/upload/direct?project=42', {
        method: 'POST', headers: { Authorization: 'Bearer TEST_CONTROL' }, body: 'UPLOAD_CONTROL',
    });
    const response = await invoke(request, async forwarded => {
        assert.equal(forwarded, request);
        assert.equal(forwarded.headers.get('Authorization'), 'Bearer TEST_CONTROL');
        assert.equal(await forwarded.text(), 'UPLOAD_CONTROL');
        return Response.json({ id: 'uploaded' }, { headers: {
            'Access-Control-Allow-Origin': 'https://admin.example',
        } });
    }, {
        match: () => assert.fail('admin cache lookup'),
        put: () => assert.fail('admin cache write'),
    });
    assert.deepEqual(await response.json(), { id: 'uploaded' });
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://admin.example');
});

test('unauthorized admin response stays unauthorized', async () => {
    const response = await invoke(new Request('https://saxmusic.site/api/admin/projects'),
        async () => Response.json({ error: 'Unauthorized' }, { status: 401 }));
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'Unauthorized' });
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('binding exceptions cannot leak messages or stacks', async t => {
    t.mock.method(console, 'error', () => {});
    const response = await invoke(new Request('https://saxmusic.site/api/v1/portfolio'),
        async () => { throw new Error('BINDING_SENTINEL'); });
    assert.equal(response.status, 502);
    assert.doesNotMatch(await response.text(), /SENTINEL|stack|details/);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('upstream JSON and HTML errors cannot leak internal data', async () => {
    for (const path of ['/api/v1/portfolio', '/api/admin/projects']) {
        for (const contentType of ['application/json', 'text/html']) {
            const response = await invoke(new Request('https://saxmusic.site' + path), async () =>
                new Response('D1_SENTINEL STACK_SENTINEL', { status: 503, headers: { 'Content-Type': contentType } }));
            assert.equal(response.status, 503);
            assert.doesNotMatch(await response.text(), /SENTINEL/);
            assert.equal(response.headers.get('Cache-Control'), 'no-store');
        }
    }
});

test('cache failure preserves a legitimate portfolio response', async () => {
    const response = await invoke(new Request('https://saxmusic.site/api/v1/portfolio'),
        async () => Response.json([]), {
            match: async () => { throw new Error('cache unavailable'); },
            put: async () => { throw new Error('cache unavailable'); },
        });
    assert.deepEqual(await response.json(), []);
});

test('sanitized admin failures preserve allowed cross-origin clients', async () => {
    const response = await invoke(new Request('https://saxmusic.site/api/admin/projects'), async () =>
        Response.json({ error: 'D1_SENTINEL' }, { status: 503, headers: {
            'Access-Control-Allow-Origin': 'https://admin.example',
            'Access-Control-Allow-Credentials': 'true', 'Vary': 'Origin',
        } }));
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), /SENTINEL/);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://admin.example');
    assert.equal(response.headers.get('Access-Control-Allow-Credentials'), 'true');
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('HEAD maps to upstream GET and has no body on errors', async () => {
    const request = new Request('https://saxmusic.site/api/v1/portfolio', { method: 'HEAD' });
    const response = await invoke(request, async forwarded => {
        assert.equal(forwarded.method, 'GET');
        return Response.json({ error: 'D1_SENTINEL' }, { status: 500 });
    });
    assert.equal(response.status, 500);
    assert.equal(await response.text(), '');
});

interface Env {
  SAX_MUSIC_API: Fetcher;
}

const PORTFOLIO_PATH = '/api/v1/portfolio';

function errorResponse(status: number, method: string, upstreamHeaders?: Headers) {
  const response = Response.json({ error: 'API temporarily unavailable' }, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
  if (upstreamHeaders) {
    for (const name of ['Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials',
      'Access-Control-Allow-Methods', 'Access-Control-Allow-Headers',
      'Access-Control-Expose-Headers', 'Vary']) {
      const value = upstreamHeaders.get(name);
      if (value) response.headers.set(name, value);
    }
  }
  return method === 'HEAD' ? new Response(null, response) : response;
}

export const onRequest: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const url = new URL(request.url);
  const isPortfolio = url.pathname === PORTFOLIO_PATH &&
    (request.method === 'GET' || request.method === 'HEAD');
  // Only published portfolio data is anonymous. Preserve admin/upload requests
  // and their authentication; those requests must never enter the public cache.
  const cacheKey = new Request(new URL(PORTFOLIO_PATH, url.origin), {
    headers: { Accept: 'application/json' },
  });
  const cache = globalThis.caches?.default;

  try {
    if (isPortfolio && cache) {
      try {
        const cached = await cache.match(cacheKey);
        if (cached) return request.method === 'HEAD'
          ? new Response(null, cached) : cached;
      } catch {
        // A cache failure must not make the API unavailable.
      }
    }
    const upstream = await env.SAX_MUSIC_API.fetch(isPortfolio ? cacheKey : request);
    // The deployed Worker also returns internal exception messages in 5xx JSON.
    if (upstream.status >= 500) {
      await upstream.body?.cancel();
      return errorResponse(upstream.status, request.method, isPortfolio ? undefined : upstream.headers);
    }

    const headers = new Headers(upstream.headers);
    headers.set('X-Content-Type-Options', 'nosniff');
    if (isPortfolio) {
      // Drop cookies, credentialed CORS, Vary: *, and reflected request headers
      // from the backend's generic CORS middleware before caching public JSON.
      const publicHeaders = new Headers({
        'Content-Type': headers.get('Content-Type') || 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': upstream.status === 200
          ? 'public, max-age=60, s-maxage=60' : 'no-store',
      });
      const response = new Response(upstream.body, {
        status: upstream.status, headers: publicHeaders,
      });
      if (cache && response.status === 200 &&
          publicHeaders.get('Content-Type')?.includes('application/json')) {
        waitUntil(cache.put(cacheKey, response.clone()).catch(() => {}));
      }
      return request.method === 'HEAD' ? new Response(null, response) : response;
    }
    headers.set('Cache-Control', 'no-store');
    // Preserve the Worker's CORS policy instead of overwriting it with '*'.
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (error) {
    console.error('Sax Music API proxy failed', error);
    return errorResponse(502, request.method);
  }
};

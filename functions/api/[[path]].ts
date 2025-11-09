// functions/api/[[path]].ts
// ไฟล์นี้ต้องอยู่ใน Root ของ Pages Project (ไม่ใช่ใน public/)

interface Env {
  SAX_MUSIC_API: Fetcher; // Service Binding
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  try {
    // Forward request ไปยัง Worker ผ่าน Service Binding
    const response = await env.SAX_MUSIC_API.fetch(request);
    
    // Clone response และเพิ่ม CORS headers (ถ้าจำเป็น)
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    
    return newResponse;
    
  } catch (error) {
    console.error('Proxy Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to reach API',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
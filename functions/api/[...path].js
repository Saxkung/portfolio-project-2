// /functions/api/v1/[...path].js

// 1. ดักจับ Request ที่เข้ามา
export async function onRequest({ request, env, params }) {
    
    // 2. ดึงชื่อ Worker Binding ที่เราตั้งไว้ใน Dashboard
    const API_SERVICE = env.SAX_MUSIC_API; 

    // 3. ปรับปรุง URL: Pages Function จะได้ Path แค่ /api/v1/[...path]
    // แต่ Worker ของเราต้องการ Path /api/v1/portfolio
    // เราต้องสร้าง URL ใหม่ที่ถูกต้อง
    const url = new URL(request.url);
    
    // เราจะใช้ Path เดิมของ Request (/api/v1/...) แต่ส่ง Request ไปที่ Worker โดยตรง
    // Path จะถูกแก้ไขอัตโนมัติเมื่อเราใช้ Service Binding

    // สร้าง Request ใหม่โดยใช้ Service Binding เพื่อส่งต่อ
    // (เราใช้ Service Binding ที่ชื่อ SAX_MUSIC_API)
    const workerRequest = new Request(url, request);

    // 4. ส่ง Request ไปยัง Worker Service (SAX_MUSIC_API)
    // นี่คือการเรียกใช้ Worker ของคุณโดยตรง
    const response = await API_SERVICE.fetch(workerRequest);

    // 5. คืน Response ที่ได้จาก Worker กลับไปยัง Frontend
    return response;
}
/**
 * Safe fetch helper that handles non-JSON (e.g. HTML 404/500) responses gracefully
 * and prevents "Unexpected token '<', <!doctype ... is not valid JSON" errors.
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const rawText = await response.text();
    const cleanSnippet = rawText.replace(/<[^>]*>?/gm, '').trim().slice(0, 120);
    throw new Error(
      `Server HTTP ${response.status}: ${cleanSnippet || response.statusText || 'Received non-JSON response from server'}`
    );
  }

  const data = await response.json();

  if (!response.ok) {
    const errMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  }

  return data;
}

/**
 * Formats any error into a polite, natural conversational message for the user,
 * avoiding raw JSON error objects and technical traces.
 */
export function formatFriendlyErrorMessage(error: any): string {
  if (!error) {
    return 'ขออภัยครับ ขณะนี้ระบบไม่สามารถประมวลผลคำตอบได้ชั่วคราว กรุณาลองใหม่อีกครั้งในอีกสักครู่ครับ';
  }

  const raw = typeof error?.message === 'string' ? error.message : JSON.stringify(error || '');

  if (raw.includes('503') || raw.includes('high demand') || raw.includes('UNAVAILABLE') || raw.includes('temporarily unavailable')) {
    return 'ขณะนี้ระบบ AI มีผู้ใช้งานหนาแน่นชั่วคราว ระบบได้พยายามส่งคำขอซ้ำให้อัตโนมัติแล้วแต่ยังไม่สำเร็จ กรุณารอสักครู่แล้วลองส่งคำถามใหม่อีกครั้งนะครับ';
  }

  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED') || raw.includes('quota')) {
    return 'ขณะนี้ปริมาณการใช้งานเกินโควตาชั่วคราว กรุณารอประมาณ 1-2 นาทีแล้วลองส่งคำถามใหม่อีกครั้งครับ';
  }

  if (raw.includes('401') || raw.includes('403') || raw.includes('API_KEY_INVALID') || raw.includes('PERMISSION_DENIED') || raw.includes('No Gemini API Key provided')) {
    return 'ไม่สามารถเชื่อมต่อกับบริการ AI ได้ เนื่องจากยังไม่ได้ตั้งค่า API Key หรือ API Key ไม่ถูกต้อง กรุณาตรวจสอบการตั้งค่าในเมนู AI Settings ครับ';
  }

  if (raw.includes('404') || raw.includes('NOT_FOUND')) {
    return 'โมเดล AI ที่ระบุไม่พร้อมใช้งานในขณะนี้ ระบบแนะนำให้เลือกโมเดล gemini-3.5-flash ในการตั้งค่าครับ';
  }

  if (raw.includes('Failed to fetch') || raw.includes('ECONNRESET') || raw.includes('ETIMEDOUT') || raw.includes('NetworkError') || raw.includes('Network Error')) {
    return 'การเชื่อมต่อไปยังระบบ AI ขัดข้องชั่วคราว กรุณาตรวจสอบสัญญาณอินเทอร์เน็ตแล้วลองใหม่อีกครั้งครับ';
  }

  return 'ขออภัยครับ ขณะนี้ระบบไม่สามารถประมวลผลคำตอบได้ชั่วคราว กรุณาลองส่งคำถามใหม่อีกครั้งในอีกสักครู่ครับ';
}


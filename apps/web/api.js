// Optional FastAPI bridge for server-only symbolic/heavy operations.
// The static app remains fully usable when no API URL is configured.
export function getApiBaseUrl(){
  if (typeof globalThis !== 'undefined' && typeof globalThis.SOLVE_EVERYTHING_API_URL === 'string') {
    return globalThis.SOLVE_EVERYTHING_API_URL.trim().replace(/\/$/,'');
  }
  if (typeof document !== 'undefined') {
    return (document.querySelector('meta[name="api-base-url"]')?.content || '').trim().replace(/\/$/,'');
  }
  return '';
}

export async function requestServerJson(path,payload,{query={},language='fa',timeoutMs=12000}={}){
  const base=getApiBaseUrl();
  const unavailable=language==='en'
    ? 'This operation requires a server. Configure NEXT_PUBLIC_API_URL or try a client-side formula.'
    : 'این عملیات نیاز به سرور دارد. NEXT_PUBLIC_API_URL را پیکربندی کنید یا از یک فرمول سمت‌کاربر استفاده کنید.';
  if (!base) throw new Error(unavailable);
  const url=new URL(`${base}${path}`,globalThis.location?.href || 'https://solveeverything.invalid');
  for(const [key,value] of Object.entries(query)) if(value!==undefined&&value!==null) url.searchParams.set(key,String(value));
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetch(url.toString(),{
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify(payload),signal:controller.signal,
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.detail || `Server returned HTTP ${response.status}`);
    return data;
  }catch(error){
    if(error?.name==='AbortError') throw new Error(language==='en'?'The server operation timed out. Please retry.':'زمان اجرای سروری تمام شد؛ دوباره تلاش کنید.');
    if(error instanceof TypeError || error?.name==='NetworkError') throw new Error(language==='en'?'The server is unavailable. Client-side calculations are still available.':'سرور در دسترس نیست؛ محاسبات سمت‌کاربر همچنان فعال‌اند.');
    throw error;
  }finally{clearTimeout(timer);}
}

export async function requestSymbolicDerivative(expression,point,language='fa'){
  return requestServerJson('/api/v1/calculus/derivative',{expression,variable:'x'},
    {query:{point},language});
}

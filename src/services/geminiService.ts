export async function processWithGemini(body: any, endpoint: string = 'process') {
  console.log(`[GeminiService] Calling backend API for endpoint: ${endpoint}`);
  const apiPath = `/api/gemini/${endpoint}`;
  
  try {
    const response = await fetch(apiPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
       const err = await response.json().catch(() => ({ error: "Error desconocido" }));
       throw new Error(err.error || `Error ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('GeminiService Error:', error);
    throw new Error(error.message || "No se pudo conectar con el servicio de IA.");
  }
}

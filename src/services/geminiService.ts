export async function processWithGemini(body: any, endpoint: string = 'process') {
  console.log(`[GeminiService] Calling server API for endpoint: ${endpoint}`);
  
  // Use absolute path starting with /
  const apiPath = `/api/gemini/${endpoint}`;
  
  try {
    const response = await fetch(apiPath, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("El servidor ha agotado su cuota gratuita por hoy. Por favor, intenta más tarde.");
      }

      const clone = response.clone();
      try {
        const errData = await response.json();
        throw new Error(errData.error || `Error del servidor: ${response.statusText}`);
      } catch (e: any) {
        if (e.message && e.message.includes("Error del servidor")) throw e;
        const textBody = await clone.text().catch(() => "Sin cuerpo de respuesta");
        throw new Error(`Error ${response.status} (${response.statusText}): ${textBody.substring(0, 100)}...`);
      }
    }

    if (contentType?.includes('application/json')) {
      return await response.json();
    } else {
      const textBody = await response.text().catch(() => "Cuerpo ilegible");
      console.error("Non-JSON response from server:", textBody);
      throw new Error(`El servidor devolvió una respuesta inesperada (no JSON): ${textBody.substring(0, 50)}...`);
    }
  } catch (error: any) {
    console.error("Fetch error:", error);
    throw error;
  }
}

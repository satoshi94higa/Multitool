# MultiUtility Hub 🚀

Una suite de herramientas diarias diseñada para la productividad, con inteligencia artificial integrada.

## ✨ Características

- **Procesador de Texto**: Herramientas rápidas para cambiar mayúsculas, limpiar espacios extra, estadísticas de lectura y descarga en `.txt`. Con autoguardado local.
- **Calculadora de Porcentajes**: Resuelve incógnitas rápidamente (¿Cuánto es el X% de Y? o ¿Z es qué porcentaje de Y?).
- **Social Booster IA**: Optimiza tus mensajes para redes sociales usando Google Gemini. 
  - Modos: Optimizar (con opción de quitar formato Markdown), Corregir Gramática (con reporte detallado) y Agregar Emojis.
  - Tonos ajustables: Casual, Profesional y Enérgico.

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite
- **Estilos**: Tailwind CSS
- **Iconografía**: Lucide React
- **IA**: Google Generative AI (Gemini 2.0 Flash)
- **Animaciones**: Motion

## 🚀 Empezando

### Requisitos previos

- Node.js (v18 o superior)
- Una clave de API de [Google AI Studio](https://aistudio.google.com/)

### Instalación

1. Clona el repositorio:
   ```bash
   git clone <tu-repositorio-url>
   cd multiutility-hub
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   Crea un archivo `.env` basado en `.env.example` y agrega tu clave de Gemini:
   ```env
   GEMINI_API_KEY=tu_clave_aqui
   ```

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## 📄 Licencia

MIT

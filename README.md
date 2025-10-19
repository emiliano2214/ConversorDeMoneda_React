🪙 Conversor de Monedas — BCRA + exchangerate.host

Aplicación web fullstack que permite convertir monedas internacionales, obteniendo en tiempo real la cotización del peso argentino (ARS) directamente desde el Banco Central de la República Argentina (BCRA) y el resto de monedas desde la API pública de exchangerate.host.

🚀 Tecnologías utilizadas
🧩 Backend — ASP.NET Core 8 (Web API)

C#

Inyección de dependencias

HttpClient para consumo de API externa (BCRA)

Configuración con appsettings.json

Control de errores personalizados (BcraException)

Controladores REST (BcraController)

⚛️ Frontend — React + Vite + TypeScript

React Hooks (useState, useEffect, useMemo)

Vite 5 con soporte de proxy para desarrollo

Tipado fuerte con TypeScript

Formateo de valores con Intl.NumberFormat

Estilos inline minimalistas sin dependencias externas

📁 Estructura del proyecto
ConversorDeMoneda/
│
├── ConversorDeMoneda.Server/          # Backend .NET
│   ├── Controllers/
│   │   └── BcraController.cs
│   ├── Services/
│   │   ├── BcraClient.cs
│   │   ├── IBcraClient.cs
│   │   └── BcraException.cs
│   ├── appsettings.json
│   └── Program.cs
│
└── conversordemoneda.client/          # Frontend React + Vite
    ├── src/
    │   ├── Components/
    │   │   └── ConversionDeMoneda.tsx
    │   └── App.tsx
    ├── vite.config.ts
    ├── package.json
    └── tsconfig.json

⚙️ Configuración del backend (.NET)
1️⃣ Variables del BCRA

Agrega tu token JWT del BCRA en appsettings.json:

"Bcra": {
  "BaseUrl": "https://api.estadisticasbcra.com",
  "Token": "TU_TOKEN_JWT_DEL_BCRA"
}


🔐 Si prefieres, también podés usar una variable de entorno BCRA__TOKEN.

2️⃣ Endpoints disponibles
Endpoint	Descripción	Ejemplo
GET /api/bcra/usd-oficial	Cotización USD oficial (mayorista)	/api/bcra/usd-oficial
GET /api/bcra/usd?serie=usd_of	USD oficial mayorista	/api/bcra/usd?serie=usd_of
GET /api/bcra/usd?serie=usd_of_minorista	USD promedio bancos (al público)	/api/bcra/usd?serie=usd_of_minorista

El backend obtiene los últimos datos disponibles (d: fecha, v: valor) desde la API del BCRA.

⚙️ Configuración del frontend (React + Vite)
1️⃣ Variables de entorno

Crea un archivo .env.development en la raíz de conversordemoneda.client:

VITE_API_BASE=https://localhost:7151


(usa el puerto HTTPS de tu backend .NET)

2️⃣ Proxy alternativo (opcional)

Si prefieres usar proxy sin variables:

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://localhost:7151",
        changeOrigin: true,
        secure: false
      }
    }
  }
});

🧮 Funcionalidades principales

✅ Conversión entre USD, EUR, ARS, BRL, GBP y JPY
✅ Cotización ARS en vivo desde el BCRA
✅ Diferencia entre dólar mayorista y al público (minorista)
✅ Actualización manual de tasas externas (exchangerate.host)
✅ Edición opcional de tasas (por ejemplo, para simular escenarios)
✅ Historial de conversiones reciente
✅ Validaciones visuales de errores API

🧪 Ejemplo de uso

Inicia el backend (.NET API) desde Visual Studio o CLI:

dotnet run --project ConversorDeMoneda.Server


Inicia el frontend:

cd conversordemoneda.client
npm install
npm run dev


Accede a:

https://localhost:5173


(o el puerto que Vite indique en consola)

Cambia la fuente de ARS:

“BCRA – Oficial mayorista”

“BCRA – Promedio bancos (al público)”

Verás cómo varía el valor del peso argentino 💸

🧠 Ejemplo de respuesta del backend

GET /api/bcra/usd?serie=usd_of_minorista

{
  "date": "2025-10-18",
  "value": 1395.61,
  "serie": "usd_of_minorista"
}


GET /api/bcra/usd?serie=usd_of"

{
  "date": "2025-10-18",
  "value": 1370.45,
  "serie": "usd_of"
}

🧑‍💻 Autor
Emiliano Abate
Proyecto académico — ITES Santa Rosa, La Pampa
Materia: Programación Web / Fullstack

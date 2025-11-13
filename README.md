# VCN Ops Dashboard

Dashboard de operaciones para monitorear costos y uso de aplicaciones en múltiples proveedores (Vercel, GitHub, Stripe, AWS, Cloudflare).

## Características

- 📊 Dashboard con visualización de costos por día
- 🔄 Integración con API de Vercel
- 📱 Interfaz responsive con Tailwind CSS
- 🗄️ Base de datos PostgreSQL con Prisma ORM
- 📈 Gráficos interactivos con Recharts

## Stack Tecnológico

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Backend**: Next.js App Router, API Routes
- **Base de datos**: PostgreSQL + Prisma ORM
- **Visualización**: Recharts, Heroicons
- **TypeScript**: Tipado completo

## Configuración Inicial

### 1. Clonar el repositorio

```bash
git clone https://github.com/VCNPRO/vcn-ops-dashboard.git
cd vcn-ops-dashboard
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y configura las variables:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/vcn_ops_dashboard"
VERCEL_TOKEN="tu_token_de_vercel"
VERCEL_TEAM_ID="tu_team_id" # Opcional
```

### 4. Configurar la base de datos

```bash
# Crear las migraciones
npx prisma migrate dev --name init

# Generar el cliente de Prisma
npx prisma generate
```

### 5. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del Proyecto

```
vcn-ops-dashboard/
├── .github/
│   └── workflows/
│       ├── poll-usage.yml     # Polling cada 15 minutos
│       └── daily-ingest.yml   # Ingesta diaria automática
├── app/
│   ├── api/
│   │   ├── apps/              # CRUD de aplicaciones
│   │   ├── providers/         # CRUD de proveedores
│   │   ├── daily-costs/       # CRUD de costos diarios
│   │   ├── raw-billing/       # CRUD de facturación cruda
│   │   ├── pricing-rates/     # CRUD de precios unitarios
│   │   │   └── bulk-import/   # Importación masiva de precios
│   │   ├── calculate-costs/   # Cálculo automático de costos
│   │   ├── ingest/            # Ingesta automática de datos
│   │   ├── vercel/
│   │   │   ├── projects/      # Obtener proyectos de Vercel
│   │   │   ├── usage/         # Obtener uso de Vercel
│   │   │   └── deployments/   # Obtener deployments de Vercel
│   │   └── sync/
│   │       └── vercel/        # Sincronizar datos de Vercel
│   ├── pricing/
│   │   └── page.tsx           # Página de gestión de precios
│   └── page.tsx               # Página principal del dashboard
├── components/
│   ├── DashboardClient.tsx    # Componente principal del dashboard
│   ├── CostChart.tsx          # Gráfico de costos
│   ├── AppsList.tsx           # Lista de aplicaciones
│   ├── PricingRates.tsx       # Gestión de precios
│   └── Navigation.tsx         # Navegación del sitio
├── lib/
│   ├── prisma.ts              # Cliente singleton de Prisma
│   ├── vercel-sync.ts         # Utilidades de sincronización Vercel
│   ├── ingest-vercel.ts       # Ingesta automática de Vercel
│   └── cost-calculator.ts     # Calculadora de costos
├── prisma/
│   └── schema.prisma          # Esquema de la base de datos
└── .env.example               # Ejemplo de variables de entorno
```

## API Endpoints

### Aplicaciones

- `GET /api/apps` - Obtener todas las apps
- `POST /api/apps` - Crear una app

### Proveedores

- `GET /api/providers` - Obtener todos los proveedores
- `POST /api/providers` - Crear un proveedor

### Costos Diarios

- `GET /api/daily-costs?appId=1&startDate=2025-01-01` - Obtener costos
- `POST /api/daily-costs` - Crear un costo

### Vercel API

- `GET /api/vercel/projects` - Obtener proyectos de Vercel
- `GET /api/vercel/usage?since=1234567890` - Obtener uso de Vercel
- `GET /api/vercel/deployments?projectId=xxx` - Obtener deployments

### Sincronización

- `POST /api/sync/vercel` con body `{ "action": "projects" }` - Sincronizar proyectos
- `POST /api/sync/vercel` con body `{ "action": "usage" }` - Sincronizar uso

### Pricing Rates (Precios Unitarios)

- `GET /api/pricing-rates` - Obtener todos los precios
- `GET /api/pricing-rates?providerId=1` - Filtrar por proveedor
- `POST /api/pricing-rates` - Crear un precio
- `PUT /api/pricing-rates` - Actualizar un precio
- `DELETE /api/pricing-rates?id=1` - Eliminar un precio
- `POST /api/pricing-rates/bulk-import` - Importar precios en bulk

### Cálculo de Costos

- `POST /api/calculate-costs` - Calcular costos desde datos de uso

### Ingesta Automática

- `POST /api/ingest` - Ingerir datos de múltiples proveedores (requiere autenticación Bearer token)

## Uso

### Sincronizar proyectos de Vercel

```bash
curl -X POST http://localhost:3000/api/sync/vercel \
  -H "Content-Type: application/json" \
  -d '{"action":"projects"}'
```

### Importar precios unitarios

```bash
curl -X POST http://localhost:3000/api/pricing-rates/bulk-import \
  -H "Content-Type: application/json" \
  -d '{
    "rates": {
      "vercel": {
        "serverless_invocation": 0.000016,
        "bandwidth_gb": 0.09
      },
      "twilio": {
        "sms_sent": 0.0075
      }
    }
  }'
```

### Calcular costos desde uso

```bash
curl -X POST http://localhost:3000/api/calculate-costs \
  -H "Content-Type: application/json" \
  -d '{
    "appId": 1,
    "providerId": 2,
    "date": "2025-01-15",
    "usage": {
      "serverless_invocation": 1000000,
      "bandwidth_gb": 50.5
    }
  }'
```

Este endpoint:
1. Busca los precios unitarios configurados para el proveedor
2. Calcula el costo: `uso × precio_unitario`
3. Guarda el resultado en `daily_costs`
4. Retorna el desglose de costos

### Ingesta automática de datos

El endpoint `/api/ingest` permite recopilar datos de uso de múltiples proveedores automáticamente:

```bash
curl -X POST https://your-dashboard.com/api/ingest \
  -H "Authorization: Bearer your_ingest_token" \
  -H "Content-Type: application/json" \
  -d '{"targets": ["vercel", "github", "twilio"]}'
```

#### Configurar GitHub Actions para polling automático

1. Configura los secrets en tu repositorio:
   - `DASHBOARD_URL`: URL de tu dashboard (ej: `https://vcn-ops.example.com`)
   - `INGEST_TOKEN`: Token de autenticación para el endpoint

2. Los workflows incluidos:
   - **poll-usage.yml**: Ejecuta cada 15 minutos (personalizable)
   - **daily-ingest.yml**: Ejecuta diariamente a la 1 AM UTC

3. Para ejecutar manualmente:
   - Ve a Actions → Poll Usage Data → Run workflow
   - Especifica los targets (separados por coma): `vercel,github,twilio`

#### Cómo funciona la ingesta

1. El workflow de GitHub Actions llama al endpoint `/api/ingest`
2. El endpoint autentica la solicitud con el token
3. Para cada provider en `targets`:
   - Obtiene datos de uso del día anterior
   - Almacena datos crudos en `raw_billing`
   - Busca los precios unitarios configurados
   - Calcula costos automáticamente
   - Guarda en `daily_costs` con desglose detallado

### Agregar datos de prueba

```sql
-- Insertar un proveedor
INSERT INTO providers (name, type) VALUES ('Vercel', 'vercel');

-- Insertar una app
INSERT INTO apps (name, domain, repo_url)
VALUES ('Mi App', 'miapp.com', 'https://github.com/user/repo');

-- Insertar costos
INSERT INTO daily_costs (app_id, date, provider_id, cost_local, currency)
VALUES (1, '2025-01-01', 1, 25.50, 'USD');
```

## Obtener Token de Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/account/tokens)
2. Crea un nuevo token con los permisos necesarios
3. Copia el token y agrégalo a tu archivo `.env`

## Próximas Funcionalidades

- [ ] Integración con GitHub API
- [ ] Integración con Stripe API
- [ ] Integración con AWS Cost Explorer
- [ ] Integración con Cloudflare Analytics
- [ ] Autenticación y roles de usuario
- [ ] Alertas y notificaciones
- [ ] Exportación de reportes (PDF, CSV)
- [ ] Dashboards personalizables

## Contribuir

Las contribuciones son bienvenidas. Por favor abre un issue o pull request.

## Licencia

MIT

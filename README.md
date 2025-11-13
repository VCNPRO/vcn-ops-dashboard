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
├── app/
│   ├── api/
│   │   ├── apps/              # CRUD de aplicaciones
│   │   ├── providers/         # CRUD de proveedores
│   │   ├── daily-costs/       # CRUD de costos diarios
│   │   ├── raw-billing/       # CRUD de facturación cruda
│   │   ├── vercel/
│   │   │   ├── projects/      # Obtener proyectos de Vercel
│   │   │   ├── usage/         # Obtener uso de Vercel
│   │   │   └── deployments/   # Obtener deployments de Vercel
│   │   └── sync/
│   │       └── vercel/        # Sincronizar datos de Vercel
│   └── page.tsx               # Página principal del dashboard
├── components/
│   ├── DashboardClient.tsx    # Componente principal del dashboard
│   ├── CostChart.tsx          # Gráfico de costos
│   └── AppsList.tsx           # Lista de aplicaciones
├── lib/
│   ├── prisma.ts              # Cliente singleton de Prisma
│   └── vercel-sync.ts         # Utilidades de sincronización
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

## Uso

### Sincronizar proyectos de Vercel

```bash
curl -X POST http://localhost:3000/api/sync/vercel \
  -H "Content-Type: application/json" \
  -d '{"action":"projects"}'
```

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

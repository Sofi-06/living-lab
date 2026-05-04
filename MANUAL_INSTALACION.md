# 🛠️ Manual de Instalación — Sistema CAMINA / LivingLab

> **Dirigido a:** Ingenieros y desarrolladores que instalan o despliegan el sistema por primera vez.

---

## 📋 Índice

- **[Parte A — Instalación local](#parte-a--instalación-local-para-desarrollo)** ← Para otro ingeniero que quiere correr el proyecto en su máquina
- **[Parte B — Despliegue en producción](#parte-b--despliegue-en-producción-aws-ec2--rocky-linux)** ← Para subir el sistema al servidor

---

## 🧱 Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| **Backend** | NestJS + Prisma | NestJS 11 / Prisma 6 |
| **Base de datos** | MySQL | 8.0 |
| **Frontend** | React + Vite | React 19 / Vite 8 |
| **Enrutamiento** | React Router DOM | 7.x |
| **Servidor web** | Nginx | 1.x |
| **Gestor de procesos** | PM2 | última |
| **Runtime** | Node.js | **20.x LTS** |
| **SO servidor** | Rocky Linux 8/9 (AWS EC2) | — |

> ⚠️ **Importante — Prisma ORM:**
> El proyecto usa **Prisma** como capa de base de datos. **No hay un `.sql` de estructura manual.**
> La BD se crea y estructura ejecutando los comandos de Prisma descritos en cada sección.
> El archivo `datos_prueba.sql` contiene únicamente datos de ejemplo opcionales.

---

## 🗂️ Estructura del repositorio

```
living-lab/
├── backend/                    # API REST — NestJS + Prisma (puerto 3000)
│   ├── prisma/
│   │   ├── schema.prisma       ← Esquema de la base de datos
│   │   └── migrations/         ← Historial de migraciones
│   ├── src/
│   │   └── modules/
│   │       ├── auth/           ← Login y autenticación
│   │       ├── users/          ← Gestión de usuarios
│   │       ├── companies/      ← Gestión de empresas
│   │       ├── projects/       ← Proyectos y fases
│   │       └── dashboard/      ← Estadísticas
│   ├── uploads/                ← Evidencias y firmas subidas
│   └── .env                    ← Variables de entorno del backend
├── frontend/                   # SPA React + Vite
│   └── src/pages/
│       ├── coordinador/
│       ├── evaluador/
│       ├── participante/
│       └── representante/
└── datos_prueba.sql            ← Datos de prueba opcionales
```

---

## 🗃️ Modelos de datos

| Tabla | Descripción |
|---|---|
| `users` | Usuarios — roles: `PARTICIPANTE`, `EVALUADOR`, `COORDINADOR`, `REPRESENTANTE` |
| `companies` | Empresas con representante asignado |
| `projects` | Proyectos: `PENDING / IN_PROGRESS / COMPLETED / CANCELLED` |
| `phases` | Catálogo de fases del proceso |
| `project_phases` | Relación proyecto-fase con estado y observaciones |
| `evidences` | Archivos subidos por participantes |
| `phase_checklist` | Criterios de evaluación por fase |
| `summary_checklist` | Checklist resumen por proyecto |
| `business_validation` | Validación final con firma digital de la empresa |

---

---

# PARTE A — Instalación local (para desarrollo)

> Sigue estos pasos si quieres correr el proyecto en **tu propia máquina** para desarrollar o hacer pruebas.

---

## A.1 Requisitos previos

Instala lo siguiente antes de comenzar:

| Herramienta | Versión | Enlace |
|---|---|---|
| Node.js | 20.x LTS | [nodejs.org](https://nodejs.org) |
| MySQL | 8.0 | [dev.mysql.com](https://dev.mysql.com/downloads/) |
| Git | cualquiera | [git-scm.com](https://git-scm.com) |

Verifica las versiones:

```bash
node -v      # v20.x.x
npm -v       # 10.x.x
mysql --version
git --version
```

---

## A.2 Clonar el repositorio

```bash
git clone https://github.com/Sofi-06/living-lab living-lab
cd living-lab
```

---

## A.3 Crear la base de datos local

Abre la consola de MySQL:

```bash
mysql -u root -p
```

Ejecuta:

```sql
CREATE DATABASE camina_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'camina_user'@'localhost' IDENTIFIED BY 'TuPassword';
GRANT ALL PRIVILEGES ON camina_db.* TO 'camina_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## A.4 Configurar y levantar el Backend

```bash
cd living-lab/backend
npm install
```

Crea el archivo `.env` en la carpeta `backend/`:

```env
DATABASE_URL="mysql://camina_user:TuPassword@localhost:3306/camina_db"
PORT=3000
```

Aplica las migraciones y genera el cliente Prisma:

```bash
npx prisma migrate dev     # crea/aplica migraciones en entorno local
npx prisma generate        # genera el cliente TypeScript de Prisma
```

> 💡 Si `migrate dev` pregunta por un nombre de migración, puedes escribir `init` o cualquier nombre descriptivo.

Inicia el backend en modo desarrollo (con hot-reload):

```bash
npm run start:dev
```

> ✅ Backend disponible en `http://localhost:3000`

---

## A.5 Cargar datos de prueba (opcional)

Si quieres tener datos de ejemplo para probar la aplicación:

```bash
mysql -u camina_user -p camina_db < datos_prueba.sql
```

---

## A.6 Configurar y levantar el Frontend

```bash
cd ../frontend
npm install
```

Crea el archivo `.env` en la carpeta `frontend/`:

```env
VITE_API_URL=http://localhost:3000
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

> ✅ Frontend disponible en `http://localhost:5173`

---

## A.7 Scripts disponibles

### Backend

```bash
npm run start:dev    # Modo desarrollo con hot-reload
npm run start:prod   # Modo producción (requiere npm run build primero)
npm run build        # Compila TypeScript → dist/
npm run lint         # Linter ESLint
```

### Frontend

```bash
npm run dev          # Servidor de desarrollo Vite
npm run build        # Compilar para producción → dist/
npm run preview      # Previsualizar el build de producción
```

---

## A.8 Referencia rápida de Prisma (local)

```bash
npx prisma migrate dev       # Crear nueva migración a partir de cambios en schema.prisma
npx prisma generate          # Regenerar el cliente Prisma
npx prisma migrate status    # Ver estado de migraciones
npx prisma studio            # Explorador visual de la BD en http://localhost:5555
```

---

---

# PARTE B — Despliegue en producción (AWS EC2 · Rocky Linux)

> El flujo es: **compilas en tu máquina local → subes los archivos al servidor vía SCP**.

---

## B.1 Preparar los archivos en tu máquina (antes de subir)

### Frontend

Crea el archivo `.env.production` en la carpeta `frontend/`:

```env
VITE_API_URL=https://campusvirtual.com/api
```

Compila:

```bash
cd frontend
npm install
npm run build
```

Esto genera la carpeta `frontend/dist/` lista para subir.

### Backend

```bash
cd backend
npm install
npx prisma generate
npm run build
```

Esto genera la carpeta `backend/dist/` con el código compilado.

> ⚠️ Asegúrate de tener la carpeta `prisma/` con el archivo `schema.prisma` y la carpeta `migrations/` antes de compilar.

---

## B.2 Preparar el servidor EC2

Conéctate por SSH:

```bash
ssh -i "tu-clave.pem" ec2-user@<IP-DEL-SERVIDOR>
```

Actualiza el sistema e instala las dependencias:

```bash
sudo dnf update -y
sudo dnf install nginx mysql-server nodejs npm -y
sudo npm install -g pm2
```

Activa e inicia los servicios:

```bash
sudo systemctl enable --now mysqld
sudo systemctl enable --now nginx
```

---

## B.3 Crear la base de datos en el servidor

```bash
sudo mysql
```

```sql
CREATE DATABASE camina_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'camina_user'@'localhost' IDENTIFIED BY 'TuPassword';
GRANT ALL PRIVILEGES ON camina_db.* TO 'camina_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## B.4 Subir y configurar el Backend

### Subir archivos con SCP

Desde tu máquina local:

```bash
scp -i "tu-clave.pem" -r backend ec2-user@<IP-DEL-SERVIDOR>:/home/ec2-user/
```

### En el servidor — mover y preparar

```bash
sudo mv /home/ec2-user/backend /var/www/camina-backend
cd /var/www/camina-backend
npm install
```

### Crear el archivo `.env` en el servidor

```bash
nano .env
```

```env
DATABASE_URL=mysql://camina_user:TuPassword@localhost:3306/camina_db
PORT=3000
```

Guarda: `Ctrl+O` → `Enter` → `Ctrl+X`

### Aplicar migraciones de Prisma

```bash
npx prisma generate

# Si tienes migraciones (recomendado):
npx prisma migrate deploy

# Si no tienes migraciones aún:
npx prisma db push
```

> ⚠️ **Nunca uses `prisma migrate dev` en producción.** Usa siempre `migrate deploy`.

---

## B.5 Cargar datos de prueba en el servidor (opcional)

Sube el archivo de inserts desde tu máquina:

```bash
scp -i "tu-clave.pem" datos_prueba.sql ec2-user@<IP-DEL-SERVIDOR>:/home/ec2-user/
```

En el servidor, impórtalo:

```bash
mysql -u camina_user -p camina_db < /home/ec2-user/datos_prueba.sql
```

---

## B.6 Iniciar el Backend con PM2

```bash
cd /var/www/camina-backend
npm run build           # solo si no compilaste localmente
pm2 start dist/main.js --name camina-api
pm2 save
pm2 startup             # copia y ejecuta el comando que muestra para auto-inicio
```

Verifica:

```bash
pm2 status
curl http://localhost:3000
```

---

## B.7 Subir y configurar el Frontend

### Subir la carpeta `dist/` con SCP

Desde tu máquina local:

```bash
scp -i "tu-clave.pem" -r frontend/dist ec2-user@<IP-DEL-SERVIDOR>:/home/ec2-user/
```

### En el servidor — mover al directorio de Nginx

```bash
sudo mv /home/ec2-user/dist /var/www/camina-frontend
```

---

## B.8 Configurar Nginx

```bash
sudo nano /etc/nginx/conf.d/camina.conf
```

Pega la siguiente configuración:

```nginx
server {
    listen 80;
    server_name campusvirtual.com;

    # ── Frontend (React SPA) ─────────────────────────────────────
    root /var/www/camina-frontend;
    index index.html;

    location / {
        try_files $uri /index.html;
        # Necesario para que React Router funcione correctamente
    }

    # ── Backend API (proxy reverso a NestJS) ────────────────────
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # ── Archivos subidos (evidencias y firmas) ───────────────────
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000/uploads/;
    }
}
```

Valida y reinicia Nginx:

```bash
sudo nginx -t                    # debe mostrar "syntax is ok"
sudo systemctl restart nginx
```

---

## B.9 Puertos requeridos en AWS Security Group

Ve a **AWS Console → EC2 → Security Groups → Inbound Rules** y verifica:

| Tipo | Puerto | Origen | Motivo |
|---|---|---|---|
| SSH | 22 | Tu IP | Acceso administrativo |
| HTTP | 80 | 0.0.0.0/0 | Tráfico web público |
| HTTPS | 443 | 0.0.0.0/0 | SSL (si configuras certificado) |
| Custom TCP | 3000 | 0.0.0.0/0 | API directa (solo si necesitas acceso directo) |

> ⚠️ Con Nginx correctamente configurado como proxy reverso, el **puerto 3000 puede mantenerse cerrado** — todo el tráfico entra por el 80/443.

---

## B.10 Probar la instalación

Abre en el navegador:

```
https://campusvirtual.com
```

Deberías ver la pantalla de **Login** del sistema.

Verifica la API:

```
https://campusvirtual.com/api
```

---

## B.11 Proceso de actualización

Cuando haya cambios nuevos:

```bash
# En tu máquina local — recompilar
cd backend && npm run build
cd ../frontend && npm run build

# Subir al servidor
scp -i "tu-clave.pem" -r backend/dist ec2-user@<IP>:/home/ec2-user/dist-backend
scp -i "tu-clave.pem" -r frontend/dist ec2-user@<IP>:/home/ec2-user/dist-frontend

# En el servidor
sudo cp -r /home/ec2-user/dist-backend/* /var/www/camina-backend/dist/
sudo cp -r /home/ec2-user/dist-frontend/* /var/www/camina-frontend/

# Aplicar migraciones nuevas si las hay
cd /var/www/camina-backend
npx prisma migrate deploy

# Reiniciar el backend
pm2 restart camina-api
```

---

---

## 📌 Referencia de variables de entorno

### Backend — `backend/.env`

```env
DATABASE_URL=mysql://camina_user:TuPassword@localhost:3306/camina_db
PORT=3000
```

### Frontend (desarrollo) — `frontend/.env`

```env
VITE_API_URL=http://localhost:3000
```

### Frontend (producción) — `frontend/.env.production`

```env
VITE_API_URL=https://campusvirtual.com/api
```

> ⚠️ Las variables de Vite se **inyectan en tiempo de compilación** (`npm run build`). Si las cambias, debes recompilar.

---

## 🔧 Comandos útiles de PM2

```bash
pm2 status                    # Estado de todos los procesos
pm2 logs camina-api           # Logs en tiempo real
pm2 logs camina-api --lines 100  # Últimas 100 líneas
pm2 restart camina-api        # Reiniciar
pm2 stop camina-api           # Detener
pm2 monit                     # Monitor de CPU y RAM
pm2 save                      # Guardar procesos activos
pm2 startup                   # Configurar auto-inicio
```


*Manual de instalación — Sistema CAMINA / LivingLab · Abril 2026*

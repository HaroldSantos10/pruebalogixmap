# PruebaLogixMap

Aplicación web con autenticación segura y mapa interactivo con marcadores arrastrables. Desarrollada como prueba técnica, implementando buenas prácticas de seguridad, arquitectura MVC y pruebas unitarias.

---

## Características

- Registro e inicio de sesión con autenticación JWT
- Contraseñas hasheadas con bcrypt (salt rounds: 10)
- Rutas protegidas mediante middleware de autenticación
- Mapa interactivo con Leaflet.js
- Marcadores arrastrables con actualización automática de posición
- Color personalizable por marcador
- Edición de etiqueta inline directamente en el sidebar
- Confirmación antes de eliminar un marcador
- Proveedor de tiles con fallback automático (Stadia Maps → Esri)
- Headers de seguridad HTTP con Helmet.js
- API key nunca expuesta en el cliente
- Almacenamiento en memoria (sin base de datos requerida)
- 19 pruebas unitarias con Jest y Supertest

---

## Tecnologías

| Categoría | Tecnología |
|-----------|-----------|
| Runtime | Node.js v22 |
| Framework | Express.js |
| Autenticación | JSON Web Tokens (JWT) |
| Cifrado | bcryptjs |
| Seguridad HTTP | Helmet.js |
| Mapa | Leaflet.js |
| Tiles | Stadia Maps / Esri (fallback) |
| IDs únicos | Node.js crypto (nativo) |
| Variables de entorno | dotenv |
| Testing | Jest + Supertest |
| Dev server | Nodemon |

---

## Arquitectura

El proyecto sigue el patrón **MVC** adaptado para una API REST:

pruebalogixmap/
├── src/
│ ├── controllers/ # Lógica de negocio
│ │ ├── authController.js
│ │ └── markerController.js
│ ├── middleware/ # Verificación de JWT
│ │ └── authMiddleware.js
│ ├── models/ # Estructura de datos
│ │ ├── User.js
│ │ └── Marker.js
│ ├── routes/ # Definición de endpoints
│ │ ├── authRoutes.js
│ │ └── markerRoutes.js
│ ├── store.js # Almacenamiento en memoria
│ └── app.js # Configuración del servidor
├── public/ # Frontend estático
│ ├── css/styles.css
│ ├── js/
│ │ ├── auth.js # Lógica de login y registro
│ │ └── map.js # Lógica del mapa y marcadores
│ ├── index.html # Página de autenticación
│ └── map.html # Página del mapa
├── tests/
│ ├── setup.js # Variables de entorno para Jest
│ └── auth.test.js # Suite de pruebas unitarias
├── .env.example # Plantilla de variables de entorno
└── package.json


---

## Seguridad implementada

- **JWT** — tokens firmados con clave secreta, expiración configurable
- **bcrypt** — contraseñas hasheadas con salt rounds 10, nunca almacenadas en texto plano
- **Helmet.js** — headers HTTP de seguridad (XSS, clickjacking, MIME sniffing)
- **Middleware de autenticación** — todas las rutas de marcadores verifican token antes de ejecutar
- **API key en servidor** — la clave de Stadia Maps vive en `.env` y se sirve desde el backend, nunca expuesta en el código del cliente
- **Validación de inputs** — email, contraseña y coordenadas validados antes de procesar
- **Aislamiento por usuario** — cada usuario solo puede ver, editar y eliminar sus propios marcadores

---

## Instalación y uso

### Requisitos

- Node.js v18 o superior
- npm

### Pasos

**1. Clonar el repositorio**
```bash
git clone https://github.com/HaroldSantos10/pruebalogixmap.git
cd pruebalogixmap
```

**2. Instalar dependencias**
```bash
npm install
```

**3. Configurar variables de entorno**
```bash
cp .env.example .env
```

Editá `.env` con tus valores:

PORT=3000
JWT_SECRET=una_clave_secreta_larga_y_segura
JWT_EXPIRES_IN=1h
STADIA_API_KEY= # Opcional — ver sección de mapa


**4. Iniciar el servidor**
```bash
# Desarrollo (con recarga automática)
npm run dev

# Producción
npm start
```

**5. Abrir en el navegador**

http://localhost:3000


---

## Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `PORT` | No | Puerto del servidor. Default: `3000` |
| `JWT_SECRET` | Sí | Clave para firmar tokens JWT. Usar una cadena larga y aleatoria |
| `JWT_EXPIRES_IN` | No | Tiempo de expiración del token. Default: `1h` |
| `STADIA_API_KEY` | No | API key de Stadia Maps para tiles de alta calidad. Sin key, usa Esri como fallback automático |

> Para obtener una API key gratuita de Stadia Maps: [client.stadiamaps.com](https://client.stadiamaps.com)

---

## API REST

### Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Registrar usuario | No |
| POST | `/api/auth/login` | Iniciar sesión | No |

**Registro — body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "minimo8caracteres"
}
```

**Login — respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Marcadores

Todas las rutas requieren header: `Authorization: Bearer <token>`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/markers` | Obtener marcadores del usuario |
| POST | `/api/markers` | Crear marcador |
| PUT | `/api/markers/:id` | Actualizar marcador |
| DELETE | `/api/markers/:id` | Eliminar marcador |

**Crear marcador — body:**
```json
{
  "lat": 13.6929,
  "lng": -89.2182,
  "label": "San Salvador",
  "color": "#3B82F6"
}
```

---

## Pruebas unitarias

```bash
npm test
```

Suite de 19 pruebas que cubren:

- Registro: éxito, email duplicado, contraseña corta, email inválido, body vacío
- Login: éxito, contraseña incorrecta, usuario inexistente
- Rutas protegidas: sin token, token inválido, token válido
- Marcadores: crear, crear sin coordenadas, crear sin auth, actualizar etiqueta, actualizar color, marcador inexistente, eliminar, eliminar inexistente

---

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm start` | Inicia el servidor en producción |
| `npm run dev` | Inicia con nodemon para desarrollo |
| `npm test` | Ejecuta la suite de pruebas |

---

## Autor

**Harold Enoc Santos Morillo**
[github.com/HaroldSantos10](https://github.com/HaroldSantos10) · [linkedin.com/in/harold-santos99](https://linkedin.com/in/harold-santos99)
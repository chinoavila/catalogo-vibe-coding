# 🛍️ Catálogo de Productos Vibe Coding

Aplicación web para gestionar un catálogo de productos con interfaz de administración, integrada a Firebase y desarrollada con Vibe Coding.

## ✨ Características Principales

- 📱 **Responsive Design**: Interfaz adaptativa que funciona en todos los dispositivos
- 🔒 **Panel de Administración**: Gestión segura protegida con contraseña encriptada
- 🗃️ **Gestión de Productos**: Agregar, editar y eliminar productos en tiempo real
- ⚙️ **Configuración del Sitio**: Personalización completa de textos, imágenes y enlaces
- 🖼️ **Gestión de Imágenes**: Subida y almacenamiento de imágenes en Firebase Storage
- 🔄 **Base de Datos en Tiempo Real**: Sincronización automática con Firebase Firestore
- 🎂 **Verificación de Edad**: Sistema de confirmación de edad configurable
- ⚡ **Carga Rápida**: Optimizado con Vite para desarrollo y producción

## 🛠️ Tecnologías Utilizadas

- **Frontend:**
  - ⚡ JavaScript + Vite
  - 🎨 Bootstrap 5 para UI/UX
  - 🔥 Firebase Web SDK v11
  - 🔐 bcryptjs para encriptación de contraseñas

- **Backend:**
  - 🔥 Firebase Cloud Firestore (Base de datos)
  - 📁 Firebase Storage (Almacenamiento de archivos)

- **DevOps:**
  - 🐳 Docker & Docker Compose
  - 📦 Node.js 20 Alpine

## ⚙️ Configuración de Firebase

### 1. 🚀 Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto"
3. Ingresa el nombre del proyecto y sigue los pasos
4. Habilita Google Analytics (opcional)

### 2. 🗄️ Configurar Cloud Firestore

1. En la consola de Firebase, ve a **"Firestore Database"**
2. Haz clic en **"Crear base de datos"**
3. Selecciona el modo de inicio:
   - **Modo de prueba** para desarrollo
   - **Modo de producción** para mayor seguridad
4. Elige la ubicación (recomendado: la más cercana a tus usuarios)

**📂 Estructura de Colecciones:**
```
📁 config/
  └── 📄 site/                      # Configuración general del sitio
      ├── siteName: string          # Nombre del sitio
      ├── slogan1: string           # Eslogan principal
      ├── slogan2: string           # Eslogan secundario
      ├── aboutText: string         # Texto de "Acerca de"
      ├── contactText: string       # Información de contacto
      ├── schedule: string          # Horarios de atención
      ├── shippingInfo: string      # Información de envíos
      ├── instagramUrl: string      # URL completa de Instagram
      ├── instagramHandle: string   # @usuario de Instagram
      ├── coverImage: string        # URL de imagen de portada
      └── adminPassword: string     # Contraseña hasheada con bcrypt

📁 categorias/                      # Categorías de productos
  └── 📄 [auto-id]/                 # ID generado automáticamente
      └── name: string              # Nombre de la categoría

📁 productos/                       # Catálogo de productos
  └── 📄 [auto-id]/                 # ID generado automáticamente
      ├── description: string       # Descripción del producto
      ├── price: string             # Precio del producto
      ├── categoryId: string        # ID de la categoría (opcional)
      └── image: string             # URL de la imagen en Storage
```

> ℹ️ **Nota:** La aplicación creará automáticamente estas colecciones la primera vez que se ejecute.

### 3. 📁 Configurar Firebase Storage

1. En la consola de Firebase, ve a **"Storage"**
2. Haz clic en **"Comenzar"**
3. Selecciona las reglas de seguridad iniciales:
   - **Modo de prueba** para desarrollo
   - **Modo de producción** para mayor seguridad
4. Elige la ubicación (recomendado: la misma que Firestore)

**📂 Estructura de Carpetas en Storage:**
```
gs://tu-proyecto.appspot.com/
├── 📁 productos/           # Imágenes de productos
│   ├── 🖼️ producto1.jpg
│   ├── 🖼️ producto2.png
│   └── 🖼️ ...
└── 📁 sitio/               # Imágenes del sitio
    ├── 🖼️ portada.jpg
    └── 🖼️ ...
```

### 4. 🔒 Configurar Reglas de Seguridad

**Firestore Rules** (`firestore.rules`):
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura pública para mostrar el catálogo
    match /{document=**} {
      allow read: if true;
    }

    // Permitir escritura para categorías
    match /categorias/{categoryId} {
      allow write: if true;
    }
    
    // Permitir escritura para productos
    match /productos/{productId} {
      allow write: if true;
    }
    
    // Permitir escritura para configuración
    match /config/{configId} {
      allow write: if true;
    }
  }
}
```

**Storage Rules** (`storage.rules`):
```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Permitir lectura pública para todas las imágenes
    match /{allPaths=**} {
      allow read: if true;
    }
    
    // Permitir escritura en la carpeta sitio/ (para imágenes de portada)
    match /sitio/{fileName} {
      allow write: if true;
    }
    
    // Permitir escritura en la carpeta productos/ (para imágenes de productos)
    match /productos/{fileName} {
      allow write: if true;
    }
    
    // Permitir escritura en la carpeta categorias/ (para imágenes de categorías - por si se restaura en el futuro)
    match /categorias/{fileName} {
      allow write: if true;
    }
  }
}
```

## 🚀 Instalación y Configuración

### 📋 Requisitos Previos

- 🟢 **Node.js** 20 o superior
- 🐳 **Docker** y **Docker Compose**
- 🔧 **Git** para clonar el repositorio
- 🔥 **Cuenta de Firebase** (gratuita)

### 📦 Instalación Paso a Paso

#### 1. 📥 Clonar el Repositorio
```bash
git clone https://github.com/chinoavila/catalogo-vibe-coding.git
cd catalogo-vibe-coding
```

#### 2. 🔧 Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con tus credenciales de Firebase:

```bash
# Credenciales de Firebase (obtener desde Firebase Console > Configuración del proyecto)
VITE_API_KEY=tu_api_key_aqui
VITE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_PROJECT_ID=tu_proyecto_id
VITE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_MESSAGING_SENDER_ID=tu_messaging_sender_id
VITE_APP_ID=tu_app_id
# Contraseña de administrador (cámbiala por una segura)
VITE_ADMIN_PASS=tu_contraseña_super_segura
```

> ℹ️ **¿Dónde encontrar las credenciales de Firebase?**
> 1. Ve a [Firebase Console](https://console.firebase.google.com/)
> 2. Selecciona tu proyecto
> 3. Ve a **⚙️ Configuración del proyecto**
> 4. En la pestaña **General**, busca **"Tus apps"**
> 5. Si no tienes una app web, haz clic en **"</>** para agregar una
> 6. Copia las credenciales que aparecen en `firebaseConfig`

#### 3. 🐳 Configurar Docker

```bash
# Copia el archivo de ejemplo de Docker Compose
cp docker-compose.example.yml docker-compose.yml
```

Puedes editar `docker-compose.yml` si necesitas cambiar puertos o configuraciones específicas.

#### 4. 🚀 Iniciar la Aplicación

**Opción A: Con Docker (Recomendado)**
```bash
docker-compose up --build
```

**Opción B: Instalación Local**
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

#### 5. 🌐 Acceder a la Aplicación

La aplicación estará disponible en: http://localhost:5173

### 🎯 Primera Configuración

1. **Accede al panel de administración** con la contraseña que configuraste en `.env`
2. **Configura la información del sitio**: nombre, eslóganes, textos, etc.
3. **Sube una imagen de portada** desde la sección de configuración
4. **Agrega tus primeros productos** con descripciones, precios e imágenes
5. **¡Listo!** Tu catálogo ya está funcionando

## 📁 Estructura del Proyecto

```
📦 catalogo-vibe-coding/
├── 📁 public/                      # Archivos estáticos públicos
│   ├── 🖼️ favicon.ico              # Icono del sitio (16x16, 32x32, 48x48)
│   └── 🖼️ logo.png                 # Logo principal (usado en loader y verificación)
├── 📁 src/                         # Código fuente de la aplicación
│   ├── 📄 app.js                   # Lógica principal y manejo de Firebase
│   ├── 📄 main.js                  # Punto de entrada de la aplicación
│   └── 🎨 styles.css               # Estilos CSS personalizados
├── 📁 dist/                        # Build de producción (generado)
├── 📁 node_modules/                # Dependencias de Node.js (no incluir en Git)
├── 📁 .firebase/                   # Archivos de configuración de Firebase
├── ⚙️ .env                         # Variables de entorno (NO incluir en Git)
├── 📄 .env.example                 # Plantilla de variables de entorno
├── 📄 .firebaserc                  # Configuración de proyectos Firebase
├── 📄 .gitignore                   # Archivos ignorados por Git
├── 🐳 docker-compose.yml           # Configuración de Docker
├── 📄 docker-compose.example.yml   # Plantilla de Docker Compose
├── 🔥 firebase.json                # Configuración de Firebase Hosting
├── 🗄️ firestore.indexes.json       # Índices de Firestore
├── 🔒 firestore.rules              # Reglas de seguridad de Firestore
├── 🌐 index.html                   # Página principal HTML
├── 📦 package.json                 # Dependencias y scripts de Node.js
├── 📦 package-lock.json            # Versiones exactas de dependencias
├── 📖 README.md                    # Documentación del proyecto
├── 📁 storage.rules                # Reglas de seguridad de Storage
└── ⚡ vite.config.js               # Configuración de Vite
```

### 🔧 Scripts Disponibles

```bash
# 🚀 Desarrollo - Inicia servidor con hot reload
npm run dev

# 🏗️ Construir - Genera build optimizado para producción
npm run build

# 👀 Vista Previa - Previsualiza el build de producción
npm run preview

# 🐳 Docker - Inicia con Docker Compose
docker-compose up --build

# 🛑 Docker - Detiene los contenedores
docker-compose down
```

## 💡 Funcionalidades Detalladas

### 🏠 **Vista Pública del Catálogo**
- ✅ Diseño responsive que se adapta a móviles, tablets y desktop
- ✅ Carga de productos desde Firebase Firestore en tiempo real
- ✅ Navegación por categorías de productos
- ✅ Filtros por categoría y búsqueda por texto
- ✅ Visualización en grid adaptativo con cards de productos
- ✅ Paginación de productos para mejor rendimiento
- ✅ Ordenamiento de productos por precio
- ✅ Modal de verificación de edad configurable
- ✅ Loader animado con logo personalizable
- ✅ Información de contacto y redes sociales
- ✅ Secciones: Categorías, Catálogo de Productos, Acerca de, Contacto

### ⚙️ **Panel de Administración**
- ✅ Autenticación segura con bcrypt
- ✅ Gestión completa de productos (CRUD)
- ✅ Gestión completa de categorías (CRUD)
- ✅ Organización de productos por categorías
- ✅ Subida de imágenes a Firebase Storage
- ✅ Configuración de textos del sitio
- ✅ Gestión de imagen de portada
- ✅ Configuración de redes sociales

### 🔒 **Seguridad**
- ✅ Contraseñas encriptadas en hash con bcrypt
- ✅ Reglas de Firestore para lectura y escritura configurable
- ✅ Validación de formularios
- ✅ Sanitización de inputs
- ✅ Variables de entorno para credenciales sensibles

## 🚀 Despliegue en Producción

### 🌐 Firebase Hosting (Recomendado)

```bash
# 1. Instalar Firebase CLI
npm install -g firebase-tools

# 2. Autenticarse en Firebase
firebase login

# 3. Inicializar el proyecto (ya configurado)
firebase init

# 4. Construir el proyecto
npm run build

# 5. Desplegar
firebase deploy
```

### 🐳 Docker en Servidor

```bash
# 1. Clonar en el servidor
git clone https://github.com/chinoavila/catalogo-vibe-coding.git
cd catalogo-vibe-coding

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con credenciales de producción

# 3. Desplegar con Docker
docker-compose up -d --build
```

### ⚠️ Consideraciones de Producción

- 🔐 **Cambiar contraseña de admin** antes del despliegue
- 🌐 **Configurar dominio personalizado** en Firebase Hosting
- 🔒 **Habilitar HTTPS** (automático con Firebase Hosting)
- 📊 **Configurar reglas de Firestore** en modo producción
- 🗄️ **Hacer backup** de Firestore regularmente
- 📈 **Monitorear uso** de Firebase para evitar costos inesperados

## 🛠️ Desarrollo y Personalización

### 🎨 **Personalizar Estilos**

El archivo `src/styles.css` contiene todos los estilos personalizados:

```css
/* Variables CSS para colores principales */
:root {
  --primary-color: #your-color;
  --secondary-color: #your-color;
  --accent-color: #your-color;
}
```

### 🔧 **Configuración de Vite**

`vite.config.js` está configurado para:
- 🌐 Servidor en host `0.0.0.0` (accesible desde Docker)
- 📁 Directorio público en `/public`
- ⚡ Hot Module Replacement habilitado
- 🔄 Proxy para APIs si es necesario

### 📱 **Responsive Design**

La aplicación utiliza Bootstrap 5 con breakpoints:
- 📱 **xs**: < 576px (móviles)
- 📱 **sm**: ≥ 576px (móviles grandes)
- 💻 **md**: ≥ 768px (tablets)
- 💻 **lg**: ≥ 992px (desktops)
- 🖥️ **xl**: ≥ 1200px (desktops grandes)

## 🤝 Contribuir

### 🐛 **Reportar Bugs**

Si encuentras un error:
1. 🔍 Verifica que no esté ya reportado en [Issues](https://github.com/chinoavila/catalogo-vibe-coding/issues)
2. 🆕 Crea un nuevo issue con:
   - Descripción detallada del problema
   - Pasos para reproducir
   - Capturas de pantalla si es posible
   - Información del entorno (navegador, OS, etc.)

### 💡 **Sugerir Mejoras**

Para proponer nuevas funcionalidades:
1. 🔍 Revisa la lista de [Issues](https://github.com/chinoavila/catalogo-vibe-coding/issues)
2. 🆕 Crea un issue con la etiqueta "enhancement"
3. 📝 Describe la funcionalidad deseada y su caso de uso

### 🔄 **Pull Requests**

1. 🍴 Haz fork del repositorio
2. 🌿 Crea una rama para tu funcionalidad (`git checkout -b feature/nueva-funcionalidad`)
3. 💾 Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. 📤 Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. 🔄 Crea un Pull Request

## 🔧 Solución de Problemas Comunes

### ❌ **Error: Firebase no está configurado**
```bash
# Verifica que el archivo .env existe y tiene las credenciales correctas
cat .env

# Reinicia el servidor de desarrollo
npm run dev
```

### ❌ **Error: Puerto 5173 en uso**
```bash
# Mata el proceso en el puerto 5173
npx kill-port 5173

# O cambia el puerto en vite.config.js
```

### ❌ **Error: Permisos de Firebase**
```bash
# Verifica las reglas de Firestore y Storage
# Asegúrate de que las reglas permitan lectura pública
```

### ❌ **Error: Imágenes no se cargan**
```bash
# Verifica la configuración de CORS en Firebase Storage
# Asegúrate de que las imágenes están en las carpetas correctas
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

<div align="center">

**⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub ⭐**

</div>

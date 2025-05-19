# Catálogo de Productos con Vibe Coding

Aplicación web para gestionar un catálogo de productos con interfaz de administración, desarrollada con Vibe Coding.

## Tecnologías Utilizadas

- **Frontend:**
  - Vite + JavaScript
  - Bootstrap 5
  - Firebase Web SDK
  - bcryptjs para encriptación

- **Backend:**
  - Express.js (servidor para manejo de imágenes)
  - Firebase Cloud Firestore

## Características

- Visualización de productos en formato de catálogo
- Panel de administración protegido con contraseña
- Gestión de productos (agregar, editar, eliminar)
- Gestión de configuración del sitio
- Almacenamiento de imágenes local
- Base de datos en tiempo real con Firebase

## Configuración de Firebase

1. Crear un proyecto en Firebase:
   - Ir a [Firebase Console](https://console.firebase.google.com/)
   - Crear nuevo proyecto
   - Habilitar Cloud Firestore

2. Configurar Cloud Firestore:
   - En la consola de Firebase, ir a "Firestore Database"
   - Crear base de datos en modo de prueba
   - Crear las siguientes colecciones:
     ```
     config/
       └─ site/  # Documento para configuración del sitio
          ├─ siteName: string
          ├─ slogan1: string
          ├─ slogan2: string
          ├─ aboutText: string
          ├─ contactText: string
          ├─ schedule: string
          ├─ shippingInfo: string
          ├─ instagramUrl: string
          ├─ instagramHandle: string
          ├─ coverImage: string
          └─ adminPassword: string (hash bcrypt)

     productos/  # Colección de productos
       └─ [auto-id]/  # Documentos generados automáticamente
          ├─ description: string
          ├─ price: string
          └─ image: string
     ```

3. Configurar las reglas de seguridad en Firestore:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Permitir lectura a todos
       match /{document=**} {
         allow read: if true;
       }
       
       // Permitir escritura solo si está autenticado como admin
       match /productos/{productId} {
         allow write: if request.auth != null;
       }
       
       match /config/{configId} {
         allow write: if request.auth != null;
       }
     }
   }
   ```

## Configuración del Proyecto

### Requisitos Previos
- Node.js 20 o superior
- Docker y Docker Compose
- Git

### Instrucciones de Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/chinoavila/catalogo-vibe-coding.git
cd catalogoProductos
```

2. Configurar las variables de entorno:
```bash
cp .env.example .env
```
Editar el archivo `.env` con tus credenciales de Firebase y configuración.

3. Configurar Docker:
```bash
cp docker-compose.example.yml docker-compose.yml
```
Ajustar la configuración de Docker según sea necesario.

4. Instalar dependencias:
```bash
npm install
```

5. Iniciar la aplicación:
```bash
docker-compose up --build
```

La aplicación estará disponible en:
- Frontend: http://localhost:5173
- API de imágenes: http://localhost:3000

### Estructura del Proyecto

```
.
├── src/
│   ├── images/
│   │   └── productos/    # Almacenamiento local de imágenes
│   ├── app.js           # Lógica principal de la aplicación
│   ├── main.js          # Punto de entrada
│   └── styles.css       # Estilos
├── server.js            # Servidor Express para imágenes
├── docker-compose.yml   # Configuración de Docker
└── vite.config.js      # Configuración de Vite
```

### Notas de Seguridad

- Nunca compartir el archivo `.env` con credenciales
- Mantener segura la contraseña de administrador
- Las imágenes se almacenan localmente en `/src/images/productos`
- La configuración de Docker puede contener información sensible

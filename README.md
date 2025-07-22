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
   - Habilitar Firebase Storage

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
***Nota:*** la webapp debería crear automáticamente las colecciones necesarias.

3. Configurar Firebase Storage:
   - En la consola de Firebase, ir a "Storage"
   - Hacer clic en "Comenzar"
   - Seleccionar el modo de seguridad:
     - Elegir "Comenzar en modo de prueba" para desarrollo
     - O "Comenzar en modo de producción" para mayor seguridad
   - Seleccionar la ubicación del Storage (recomendado: la misma región que Firestore)
   - Hacer clic en "Listo"
   
   **Estructura de carpetas recomendada en Storage:**
   ```
   gs://tu-proyecto.appspot.com/
   ├── productos/          # Imágenes de productos subidas por el admin
   │   ├── producto1.jpg
   │   ├── producto2.png
   │   └── ...
   └── sitio/             # Imágenes de estructura del sitio subidas por el admin
       ├── portada.jpg
       └── ...
   ```
   
   **Configuración inicial:**
   - Las carpetas se crearán automáticamente cuando subas el primer archivo
   - No es necesario crear las carpetas manualmente
   - El sistema de administración del catálogo creará automáticamente la estructura necesaria

4. Configurar las reglas de seguridad en Firestore:
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

5. Configurar las reglas de seguridad en Storage:
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
          allow write:  if request.auth != null;
        }
        
        // Permitir escritura en la carpeta productos/ (para imágenes de productos)
        match /productos/{fileName} {
          allow write:  if request.auth != null;
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

4. Instalar dependencias (opcional, Docker lo hará automáticamente):
```powershell
npm install
```

5. Iniciar la aplicación:
```powershell
docker-compose up --build
```

La aplicación estará disponible en `http://localhost:5173`

### Estructura del Proyecto

```
.
├── public/
│   ├── favicon.ico    # Favicon del sitio
│   └── logo.png       # Logo principal utilizado en loader y verificación de edad
├── src/
│   ├── app.js         # Lógica principal de la aplicación
│   ├── main.js        # Punto de entrada
│   └── styles.css     # Estilos
├── .env  # Archivo de entorno
├── .env.example  # Ejemplo de archivo de entorno
├── docker-compose.yml # Configuración de Docker
├── docker-compose.example.yml  # Ejemplo de configuración Docker
├── package.json       # Dependencias del proyecto
└── vite.config.js     # Configuración de Vite
```

### Notas de Seguridad

- Nunca compartir el archivo `.env` con credenciales
- Mantener segura la contraseña de administrador
- La configuración de Docker puede contener información sensible
- Los volúmenes de Docker `vite_node_modules` y `express_node_modules` mantienen las dependencias

### Assets y Archivos Estáticos

- **favicon.ico**: Favicon del sitio web que aparece en la pestaña del navegador
- **logo.png**: Logo principal utilizado en el loader de carga y pantalla de verificación de edad
- **public/**: Directorio donde Vite busca archivos estáticos que se copiarán directamente al build

Durante el build (`npm run build`), Vite copiará automáticamente todos los archivos del directorio `public/` (como `favicon.ico` y `logo.png`) a la raíz del directorio de distribución, manteniendo la estructura de referencias en el HTML.

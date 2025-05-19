# Catálogo de Productos

## Configuración del Proyecto

### Requisitos Previos
- Node.js 20 o superior
- Docker y Docker Compose
- Git

### Instrucciones de Instalación

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
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

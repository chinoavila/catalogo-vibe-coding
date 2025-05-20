const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Configurar multer para el almacenamiento de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, 'src/images');
        // Crear el directorio si no existe
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Endpoint para subir imágenes
app.post('/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No se recibió ningún archivo');
        }
        // Devolver el nombre del archivo generado
        res.status(200).json({
            fileName: req.file.filename,
            path: `/src/images/${req.file.filename}`
        });
    } catch (error) {
        console.error('Error al subir archivo:', error);
        res.status(500).send('Error al procesar la imagen');
    }
});

// Servir archivos estáticos
app.use('/src/images', express.static(path.join(__dirname, 'src/images')));

// Servir archivos estáticos del build de Vite
app.use(express.static(path.join(__dirname, 'dist')));

// Todas las demás rutas sirven index.html para SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Usar variable de entorno para el puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Express ejecutándose en el puerto ${PORT}`);
});

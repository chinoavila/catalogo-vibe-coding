import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import bcrypt from 'bcryptjs';

// Variables para el control del loader
let isConfigLoaded = false;
let isProductsLoaded = false;
let isCategoriesLoaded = false;
let pendingImages = 0;

// Variables para productos y categorías
let products = [];
let categories = [];
let currentCategoryFilter = null; // null = ver todos, string = id de categoría

// Función para mostrar el loader
function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'flex';
        loader.classList.remove('fade-out');
        disableScroll(); // Deshabilitar scroll cuando se muestra el loader
    }
}

// Función para ocultar el loader
function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('fade-out');
        setTimeout(() => {
            loader.style.display = 'none';
            // Habilitar scroll solo si no hay otras pantallas activas
            if (!shouldKeepScrollDisabled()) {
                enableScroll();
            }
        }, 500); // Esperar a que termine la animación de fade-out
    }
}

// Función para verificar si se puede ocultar el loader
function checkIfCanHideLoader() {
    if (isConfigLoaded && isProductsLoaded && isCategoriesLoaded && pendingImages === 0 && ageVerified) {
        console.log('✅ Todos los datos, imágenes y verificaciones han sido completados, ocultando loader');
        hideLoader();
    }
}

// Función para manejar la carga de imágenes
function handleImageLoad() {
    pendingImages--;
    console.log(`📸 Imagen cargada. Imágenes pendientes: ${pendingImages}`);
    checkIfCanHideLoader();
}

// Función para manejar el error de carga de imágenes
function handleImageError() {
    pendingImages--;
    console.log(`❌ Error al cargar imagen. Imágenes pendientes: ${pendingImages}`);
    checkIfCanHideLoader();
}

// Variables para el control de verificación de edad
let ageVerificationRequired = false;
let ageVerified = false;

// Funciones para controlar el scroll de la página
function disableScroll() {
    document.body.classList.add('no-scroll');
    console.log('🚫 Scroll deshabilitado');
}

function enableScroll() {
    document.body.classList.remove('no-scroll');
    console.log('✅ Scroll habilitado');
}

// Función para verificar si se debe mantener el scroll deshabilitado
function shouldKeepScrollDisabled() {
    const loader = document.getElementById('loader');
    const ageVerification = document.getElementById('age-verification');
    
    // Mantener scroll deshabilitado si el loader está visible
    if (loader && loader.style.display !== 'none' && !loader.classList.contains('fade-out')) {
        return true;
    }
    
    // Mantener scroll deshabilitado si la verificación de edad está visible
    if (ageVerification && !ageVerification.classList.contains('d-none')) {
        return true;
    }
    
    return false;
}

// Función para mostrar la verificación de edad
function showAgeVerification() {
    const ageVerificationEl = document.getElementById('age-verification');
    if (ageVerificationEl) {
        ageVerificationEl.classList.remove('d-none');
        disableScroll(); // Deshabilitar scroll cuando se muestra la verificación de edad
        console.log('🔞 Mostrando verificación de edad');
        
        // Manejar la carga del logo de verificación de edad
        const ageVerificationLogo = document.querySelector('.age-verification-logo');
        if (ageVerificationLogo) {
            pendingImages++;
            console.log(`🔄 Cargando logo de verificación de edad. Imágenes pendientes: ${pendingImages}`);
            
            const handleAgeLogoLoad = () => {
                handleImageLoad();
                ageVerificationLogo.removeEventListener('load', handleAgeLogoLoad);
                ageVerificationLogo.removeEventListener('error', handleAgeLogoError);
            };
            
            const handleAgeLogoError = () => {
                handleImageError();
                ageVerificationLogo.removeEventListener('load', handleAgeLogoLoad);
                ageVerificationLogo.removeEventListener('error', handleAgeLogoError);
            };
            
            ageVerificationLogo.addEventListener('load', handleAgeLogoLoad);
            ageVerificationLogo.addEventListener('error', handleAgeLogoError);
            
            if (ageVerificationLogo.complete) {
                handleAgeLogoLoad();
            }
        }
    }
}

// Función para ocultar la verificación de edad
function hideAgeVerification() {
    const ageVerificationEl = document.getElementById('age-verification');
    if (ageVerificationEl) {
        ageVerificationEl.classList.add('d-none');
        // Habilitar scroll solo si no hay otras pantallas activas
        if (!shouldKeepScrollDisabled()) {
            enableScroll();
        }
        console.log('✅ Verificación de edad completada');
    }
}

// Función para manejar la confirmación de edad
function handleAgeConfirmation() {
    ageVerified = true;
    localStorage.setItem('ageVerified', 'true');
    hideAgeVerification();
    console.log('✅ Usuario confirmó ser mayor de edad');
}

// Función para manejar el rechazo de edad
function handleAgeDeny() {
    console.log('❌ Usuario declaró ser menor de edad');
    // Redirigir a una página externa o mostrar mensaje
    window.location.href = 'https://www.google.com';
}

// Función para verificar si se necesita verificación de edad
function checkAgeVerification(config) {
    if (config && config.ageVerificationEnabled) {
        ageVerificationRequired = true;
        const storedVerification = localStorage.getItem('ageVerified');
        
        if (storedVerification !== 'true') {
            showAgeVerification();
            return true; // Necesita verificación
        } else {
            ageVerified = true;
            console.log('✅ Verificación de edad ya confirmada previamente');
            return false; // Ya verificado
        }
    } else {
        ageVerificationRequired = false;
        ageVerified = true; // No se requiere verificación
        return false;
    }
}

// Función para verificar la conexión a Firebase
async function checkFirebaseConnection() {
    const firebaseConfig = {
        apiKey: import.meta.env.VITE_API_KEY,
        authDomain: import.meta.env.VITE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_APP_ID,
    };

    try {
        console.log('Iniciando Firebase...');
        const app = initializeApp(firebaseConfig);
        console.log('Firebase inicializado correctamente');

        console.log('Iniciando Firestore...');
        const db = getFirestore(app);
        console.log('Firestore inicializado correctamente');

        console.log('Probando conexión a Firestore...');
        const testDoc = doc(db, 'config', 'site');
        const docSnap = await getDoc(testDoc);
        
        if (docSnap.exists()) {
            console.log('✅ Conexión exitosa a Firestore. Datos recuperados:', docSnap.data());
            return true;
        } else {
            console.log('⚠️ Conexión exitosa pero el documento no existe');
            return false;
        }
    } catch (error) {
        console.error('❌ Error al conectar con Firebase:', error);
        return false;
    }
}

// Configuración de Firebase 
let adminPassword = ''; // Se cargará desde Firebase

async function initAdminPassword() {
    try {
        const docSnap = await getDoc(siteConfigRef);
        if (docSnap.exists()) {
            const config = docSnap.data();
            adminPassword = config.adminPassword || import.meta.env.VITE_ADMIN_PASS; // Fallback a la variable de entorno
        }
    } catch (error) {
        console.error('Error al cargar contraseña de admin:', error);
        adminPassword = import.meta.env.VITE_ADMIN_PASS; // Fallback a la variable de entorno
    }
}

async function login(pass) {
    await initAdminPassword(); // Asegurar que tenemos la contraseña más reciente
    if (pass === adminPassword) {
        isAdmin = true;
        localStorage.setItem('isAdmin', 'true');
    }
}
const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencia a la colección de configuración
const siteConfigRef = doc(db, 'config', 'site');

// Función para actualizar el formulario con los valores actuales            
async function updateForm() {
    // Capturar los valores actuales o usar placeholders
    const currentSiteName = document.querySelector('.navbar-brand').textContent;
    const currentSlogan1 = document.getElementById('slogan1').textContent;
    const currentSlogan2 = document.getElementById('slogan2').textContent;
    const currentAboutText = document.getElementById('about-content').textContent;
    const currentContactText = document.getElementById('contact-content').textContent;
    const currentSchedule = document.getElementById('schedule-text').textContent;
    const currentShippingInfo = document.getElementById('shipping-text').textContent;
    const currentInstagramUrl = document.getElementById('instagram-link').href;
    const currentInstagramHandle = document.getElementById('instagram-handle').textContent;
    const currentCoverImage = document.getElementById('header-image').src;

    // Obtener la configuración actual para el checkbox de verificación de edad
    try {
        const docSnap = await getDoc(siteConfigRef);
        const currentConfig = docSnap.exists() ? docSnap.data() : {};
        document.getElementById('age-verification-enabled').checked = currentConfig.ageVerificationEnabled || false;
    } catch (error) {
        console.error('Error al cargar configuración de verificación de edad:', error);
        document.getElementById('age-verification-enabled').checked = false;
    }

    // Actualizar los campos del formulario
    document.getElementById('site-name').value = currentSiteName === '[Nombre del sitio]' ? '' : currentSiteName;
    document.getElementById('slogan1-text').value = currentSlogan1 === '[Slogan principal]' ? '' : currentSlogan1;
    document.getElementById('slogan2-text').value = currentSlogan2 === '[Slogan secundario]' ? '' : currentSlogan2;
    document.getElementById('about-text').value = currentAboutText === '[Texto Quiénes somos]' ? '' : currentAboutText;
    document.getElementById('contact-text').value = currentContactText === '[Texto de Contacto]' ? '' : currentContactText;
    document.getElementById('schedule').value = currentSchedule === '[Horario de atención]' ? '' : currentSchedule;
    document.getElementById('shipping-info').value = currentShippingInfo === '[Información de envíos]' ? '' : currentShippingInfo;
    document.getElementById('instagram-url').value = currentInstagramUrl === '#' ? '' : currentInstagramUrl;
    document.getElementById('instagram-handle-text').value = currentInstagramHandle === '[Usuario de Instagram]' ? '' : currentInstagramHandle;
    
    // Limpiar el input de archivo y mostrar la imagen actual
    document.getElementById('cover-image').value = '';
    
    // Mostrar la imagen de portada actual
    const currentCoverImageElement = document.getElementById('current-cover-image');
    if (currentCoverImage && !currentCoverImage.includes('[URL imagen de portada]')) {
        currentCoverImageElement.src = currentCoverImage;
        currentCoverImageElement.style.display = 'block';
    } else {
        currentCoverImageElement.style.display = 'none';
    }
}

// Función para cargar la configuración del sitio
// Función para actualizar la interfaz con la configuración del sitio
function updateSiteConfigUI(config) {
    try {
        if (config) {
            const siteName = config.siteName || '[Nombre del sitio]';

            // Actualizar todas las instancias del nombre del sitio
            document.title = `${siteName} | Catálogo de Productos`;
            document.querySelector('.navbar-brand').textContent = siteName;
            document.querySelector('#catalogo h2').textContent = `Catálogo ${siteName}`;
            document.querySelector('footer div').textContent = `© Sitio oficial de ${siteName}, desarrollado por Alejandro Javier Avila. Todos los derechos reservados.`;

            // Configurar la imagen de portada con control de carga
            const headerImage = document.getElementById('header-image');
            const coverImageUrl = config.coverImage || 'https://placehold.co/600x400?text=Image+Not+Found';
            
            // Solo incrementar el contador si la imagen cambió
            if (headerImage.src !== coverImageUrl) {
                pendingImages++;
                console.log(`🔄 Cargando imagen de portada. Imágenes pendientes: ${pendingImages}`);
                
                const handleHeaderImageLoad = () => {
                    handleImageLoad();
                    headerImage.removeEventListener('load', handleHeaderImageLoad);
                    headerImage.removeEventListener('error', handleHeaderImageError);
                };
                
                const handleHeaderImageError = () => {
                    handleImageError();
                    headerImage.removeEventListener('load', handleHeaderImageLoad);
                    headerImage.removeEventListener('error', handleHeaderImageError);
                };
                
                headerImage.addEventListener('load', handleHeaderImageLoad);
                headerImage.addEventListener('error', handleHeaderImageError);
                headerImage.src = coverImageUrl;
            }

            // Resto de la configuración
            document.getElementById('slogan1').textContent = config.slogan1 || '[Slogan principal]';
            document.getElementById('slogan2').textContent = config.slogan2 || '[Slogan secundario]';
            document.getElementById('about-content').textContent = config.aboutText || '[Texto Quiénes somos]';
            document.getElementById('contact-content').textContent = config.contactText || '[Texto de Contacto]';
            document.getElementById('schedule-text').textContent = config.schedule || '[Horario de atención]';
            document.getElementById('shipping-text').textContent = config.shippingInfo || '[Información de envíos]'; document.getElementById('instagram-link').href = config.instagramUrl || '#';
            document.getElementById('instagram-handle').textContent = config.instagramHandle || '[Usuario de Instagram]';

            // Actualizar la contraseña del módulo de administración si existe
            if (config.adminPassword) {
                adminModule.updatePassword(config.adminPassword);
            }

            // Verificar si se necesita verificación de edad
            checkAgeVerification(config);
        } else {
            // Si no existe configuración, mostrar placeholders
            const siteName = '[Nombre del sitio]';

            // Actualizar todas las instancias del nombre del sitio
            document.title = `${siteName} | Catálogo de Productos`;
            document.querySelector('.navbar-brand').textContent = siteName;
            document.querySelector('#catalogo h2').textContent = `Catálogo ${siteName}`;
            document.querySelector('footer div').textContent = `© 2025 Sitio oficial de ${siteName}, desarrollado por Alejandro Javier Avila. Todos los derechos reservados.`;

            // Configurar imagen de portada placeholder
            const headerImage = document.getElementById('header-image');
            const placeholderUrl = 'https://placehold.co/600x400?text=Image+Not+Found';
            
            if (headerImage.src !== placeholderUrl) {
                pendingImages++;
                console.log(`🔄 Cargando imagen placeholder. Imágenes pendientes: ${pendingImages}`);
                
                const handlePlaceholderLoad = () => {
                    handleImageLoad();
                    headerImage.removeEventListener('load', handlePlaceholderLoad);
                    headerImage.removeEventListener('error', handlePlaceholderError);
                };
                
                const handlePlaceholderError = () => {
                    handleImageError();
                    headerImage.removeEventListener('load', handlePlaceholderLoad);
                    headerImage.removeEventListener('error', handlePlaceholderError);
                };
                
                headerImage.addEventListener('load', handlePlaceholderLoad);
                headerImage.addEventListener('error', handlePlaceholderError);
                headerImage.src = placeholderUrl;
            }

            // Resto de placeholders
            document.getElementById('slogan1').textContent = '[Slogan principal]';
            document.getElementById('slogan2').textContent = '[Slogan secundario]';
            document.getElementById('about-content').textContent = '[Texto Quiénes somos]';
            document.getElementById('contact-content').textContent = '[Texto de Contacto]';
            document.getElementById('schedule-text').textContent = '[Horario de atención]';
            document.getElementById('shipping-text').textContent = '[Información de envíos]';
            document.getElementById('instagram-link').href = '#';
            document.getElementById('instagram-handle').textContent = '[Usuario de Instagram]';

            // No hay configuración, por lo tanto no se requiere verificación de edad
            checkAgeVerification(null);
        }
    } catch (error) {
        console.error('Error al actualizar la configuración en la interfaz:', error);
    }
}

async function loadSiteConfig() {
    try {
        console.log('🔄 Cargando configuración del sitio...');
        const docSnap = await getDoc(siteConfigRef);
        if (docSnap.exists()) {
            const config = docSnap.data();
            updateSiteConfigUI(config);
        } else {
            // Si no existe configuración, mostrar placeholders
            updateSiteConfigUI(null);
        }
        isConfigLoaded = true;
        console.log('✅ Configuración del sitio cargada');
        checkIfCanHideLoader();
    } catch (error) {
        console.error('Error al cargar la configuración:', error);
        isConfigLoaded = true; // Marcar como cargado incluso si hay error para no bloquear
        checkIfCanHideLoader();
    }
}

// Función para mostrar mensajes toast
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    const toastId = `toast-${Date.now()}`;

    const toastEl = document.createElement('div');
    toastEl.className = `toast ${type === 'error' ? 'bg-danger' : type === 'success' ? 'bg-success' : ''}`;
    toastEl.id = toastId;

    toastEl.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">${type === 'error' ? 'Error' : type === 'success' ? 'Éxito' : 'Información'}</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">${message}</div>
    `;

    toastContainer.appendChild(toastEl);

    const toast = new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: 3000
    });

    toast.show();

    // Eliminar el toast del DOM cuando se oculte
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

// Función para guardar la configuración del sitio
async function saveSiteConfig(event) {
    event.preventDefault();
    if (!adminModule.isAdmin()) {
        showToast('Acceso restringido.', 'error');
        return;
    } try {
        // Obtener la configuración actual para preservar la contraseña
        const docSnap = await getDoc(siteConfigRef);
        const currentConfig = docSnap.exists() ? docSnap.data() : {};

        const imageFile = document.getElementById('cover-image').files[0];
        const config = {
            siteName: document.getElementById('site-name').value,
            slogan1: document.getElementById('slogan1-text').value,
            slogan2: document.getElementById('slogan2-text').value,
            aboutText: document.getElementById('about-text').value,
            contactText: document.getElementById('contact-text').value,
            schedule: document.getElementById('schedule').value,
            shippingInfo: document.getElementById('shipping-info').value,
            instagramUrl: document.getElementById('instagram-url').value,
            instagramHandle: document.getElementById('instagram-handle-text').value,
            ageVerificationEnabled: document.getElementById('age-verification-enabled').checked,
            adminPassword: currentConfig.adminPassword || import.meta.env.VITE_ADMIN_PASS // Preservar la contraseña existente
        };        if (imageFile) {
            // Si se seleccionó una nueva imagen, procesarla y actualizar
            try {
                console.log('📷 Subiendo imagen de portada:', imageFile.name);
                const timestamp = Date.now();
                const fileName = `${timestamp}_${imageFile.name}`;
                const storageRef = ref(storage, `sitio/${fileName}`);
                
                console.log('📤 Subiendo a:', `sitio/${fileName}`);
                // Subir la imagen
                await uploadBytes(storageRef, imageFile);
                console.log('✅ Imagen de portada subida exitosamente');
                
                // Obtener la URL de descarga
                const downloadURL = await getDownloadURL(storageRef);
                console.log('🔗 URL de portada obtenida:', downloadURL);
                config.coverImage = downloadURL;
            } catch (error) {
                console.error("❌ Error guardando la imagen de portada:", error);
                console.error("Error details:", {
                    code: error.code,
                    message: error.message,
                    customData: error.customData
                });
                throw error;
            }
        } else {
            // Si no hay nueva imagen, recuperar la imagen actual del header
            const currentImage = document.getElementById('header-image').src;
            if (currentImage && !currentImage.includes('[URL imagen de portada]')) {
                config.coverImage = currentImage;
            }
        }        await setDoc(siteConfigRef, config);
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalSiteConfig'));
        
        // Limpiar el formulario antes de cerrar el modal
        document.getElementById('site-config-form').reset();
        document.getElementById('current-cover-image').style.display = 'none';
        clearImagePreviews();
        
        modal.hide();

        showToast('Configuración guardada correctamente', 'success');
    } catch (error) {
        console.error('Error al guardar la configuración:', error);
        showToast('Error al guardar la configuración. Por favor intenta nuevamente.', 'error');
    }
}

const PRODUCTS_PER_PAGE = 6; // Número de productos por página
let currentPage = 1; // Página actual

// Inicializar Firebase Storage
const storage = getStorage(app);

// Función de diagnóstico para Firebase Storage y Firestore
function checkFirebaseConfig() {
    console.log('🔧 Verificando configuración de Firebase...');
    console.log('API Key:', import.meta.env.VITE_API_KEY ? '✅ Configurado' : '❌ Faltante');
    console.log('Auth Domain:', import.meta.env.VITE_AUTH_DOMAIN ? '✅ Configurado' : '❌ Faltante');
    console.log('Project ID:', import.meta.env.VITE_PROJECT_ID ? '✅ Configurado' : '❌ Faltante');
    console.log('Storage Bucket:', import.meta.env.VITE_STORAGE_BUCKET ? '✅ Configurado' : '❌ Faltante');
    console.log('Messaging Sender ID:', import.meta.env.VITE_MESSAGING_SENDER_ID ? '✅ Configurado' : '❌ Faltante');
    console.log('App ID:', import.meta.env.VITE_APP_ID ? '✅ Configurado' : '❌ Faltante');
    console.log('Firebase Storage inicializado:', storage ? '✅ OK' : '❌ Error');
    console.log('Firebase Firestore inicializado:', db ? '✅ OK' : '❌ Error');
}

// Función para guardar imagen en Firebase Storage
async function saveImage(imageFile) {
    try {
        console.log('📷 Iniciando subida de imagen:', imageFile.name);
        const timestamp = Date.now();
        const fileName = `${timestamp}_${imageFile.name}`;
        const storageRef = ref(storage, `productos/${fileName}`);

        console.log('📤 Subiendo archivo a:', `productos/${fileName}`);
        // Subir la imagen
        await uploadBytes(storageRef, imageFile);
        console.log('✅ Archivo subido exitosamente');

        // Obtener la URL de descarga
        const downloadURL = await getDownloadURL(storageRef);
        console.log('🔗 URL obtenida:', downloadURL);
        return downloadURL;
    } catch (error) {
        console.error("❌ Error guardando la imagen:", error);
        console.error("Error details:", {
            code: error.code,
            message: error.message,
            customData: error.customData
        });
        throw error;
    }
}

// Función para eliminar imagen de Firebase Storage
async function deleteImage(imageUrl) {
    try {
        if (!imageUrl) return;

        // Extraer la ruta del storage de la URL
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
    } catch (error) {
        console.error("Error eliminando la imagen:", error);
        // No lanzar el error para permitir eliminar el producto aunque falle la eliminación de la imagen
    }
}

// --- Módulo de administración ---
const adminModule = (() => {
    let isAdmin = localStorage.getItem('isAdmin') === 'true';
    let adminPassword = ''; // Se actualizará desde Firebase

    // Función para actualizar la contraseña
    function updatePassword(newPassword) {
        if (newPassword) {
            adminPassword = newPassword;
        }
    }

    // Función para inicializar la contraseña desde Firebase
    async function initPassword() {
        try {
            const docSnap = await getDoc(siteConfigRef);
            if (docSnap.exists()) {
                const config = docSnap.data();
                if (config.adminPassword) {
                    adminPassword = config.adminPassword;
                } else {
                    // Si no hay contraseña, crear una por defecto
                    adminPassword = await bcrypt.hash('admin123', 10);
                    await updateDoc(siteConfigRef, {
                        ...config,
                        adminPassword: adminPassword
                    });
                }
            } else {
                // Si no existe el documento, crearlo con contraseña por defecto
                adminPassword = await bcrypt.hash('admin123', 10);
                await setDoc(siteConfigRef, {
                    adminPassword: adminPassword
                });
            }
        } catch (error) {
            console.error('Error al cargar contraseña de admin:', error);
        }
    }

    async function login(pass) {
        try {
            await initPassword(); // Asegurar que tenemos la contraseña más reciente
            const isMatch = await bcrypt.compare(pass, adminPassword);
            if (isMatch) {
                isAdmin = true;
                localStorage.setItem('isAdmin', 'true');
                document.getElementById('btn-add-product').classList.remove('d-none');
                document.getElementById('btn-add-category').classList.remove('d-none');
                document.getElementById('btn-add-product-categories').classList.remove('d-none');
                document.getElementById('btn-edit-site').classList.remove('d-none');
                document.getElementById('logout-container').style.display = 'block';
                document.getElementById('change-password-container').style.display = 'block';
                document.getElementById('btn-admin').style.display = 'none';
                showToast('Credenciales correctas: se habilitó el modo administrador.', 'success');
                renderProducts();
                renderCategories();
                return true;
            } else {
                showToast('Credenciales incorrectas.', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error al verificar la contraseña:', error);
            showToast('Error al verificar las credenciales.', 'error');
            return false;
        }
    }

    function logout() {
        isAdmin = false;
        localStorage.removeItem('isAdmin');
        document.getElementById('btn-add-product').classList.add('d-none');
        document.getElementById('btn-add-category').classList.add('d-none');
        document.getElementById('btn-add-product-categories').classList.add('d-none');
        document.getElementById('btn-edit-site').classList.add('d-none');
        document.getElementById('change-password-container').style.display = 'none';
        document.getElementById('btn-admin').style.display = '';
        renderProducts();
        renderCategories();
    }

    function restoreAdminSession() {
        isAdmin = true;
        return true;
    }

    async function addProduct(productosCol, data) {
        if (!isAdmin) {
            showToast('Acceso restringido.', 'error');
            return;
        }
        try {
            console.log('📝 Agregando producto:', data);
            await addDoc(productosCol, data);
            console.log('✅ Producto agregado exitosamente');
        } catch (error) {
            console.error('❌ Error agregando producto:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message
            });
            throw error;
        }
    }

    async function deleteProduct(productosCol, id) {
        if (!isAdmin) {
            showToast('Acceso restringido.', 'error');
            return;
        }
        try {
            console.log('🗑️ Eliminando producto:', id);
            await deleteDoc(doc(productosCol, id));
            console.log('✅ Producto eliminado exitosamente');
        } catch (error) {
            console.error('❌ Error eliminando producto:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message
            });
            throw error;
        }
    }

    async function addCategory(categoriasCol, data) {
        if (!isAdmin) {
            showToast('Acceso restringido.', 'error');
            return;
        }
        try {
            console.log('📝 Agregando categoría:', data);
            await addDoc(categoriasCol, data);
            console.log('✅ Categoría agregada exitosamente');
        } catch (error) {
            console.error('❌ Error agregando categoría:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message
            });
            throw error;
        }
    }

    async function deleteCategory(categoriasCol, id) {
        if (!isAdmin) {
            showToast('Acceso restringido.', 'error');
            return;
        }
        try {
            console.log('🗑️ Eliminando categoría:', id);
            await deleteDoc(doc(categoriasCol, id));
            console.log('✅ Categoría eliminada exitosamente');
        } catch (error) {
            console.error('❌ Error eliminando categoría:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message
            });
            throw error;
        }
    }

    function isAdminCheck() {
        return isAdmin;
    }

    return { 
        login, 
        logout, 
        addProduct, 
        deleteProduct, 
        addCategory, 
        deleteCategory, 
        isAdmin: isAdminCheck, 
        updatePassword,
        restoreAdminSession 
    };
})();
// --- Fin módulo administración ---

// Variables para el ordenamiento
let sortDirection = 'asc'; // 'asc' o 'desc'

// Función para ordenar productos por precio
function sortProductsByPrice() {
    products.sort((a, b) => {
        const multiplier = sortDirection === 'asc' ? 1 : -1;
        return (parseFloat(a.price) - parseFloat(b.price)) * multiplier;
    });
    renderProducts();
    
    // Actualizar el icono del botón
    const sortIcon = document.getElementById('sort-icon');
    sortIcon.textContent = sortDirection === 'asc' ? '↑' : '↓';
}

// Event listener para el botón de ordenamiento
document.getElementById('btn-sort-price').addEventListener('click', () => {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    sortProductsByPrice();
});

// Escuchar cambios en Firestore y actualizar la galería
document.addEventListener('DOMContentLoaded', async () => {
    // Mostrar el loader al inicio
    showLoader();
    console.log('🚀 Iniciando carga de la aplicación...');
    
    // Verificar configuración de Firebase
    checkFirebaseConfig();
    
    // Contar el logo del loader como imagen pendiente
    const loaderLogo = document.querySelector('.loader-logo');
    if (loaderLogo) {
        pendingImages++;
        console.log(`🔄 Cargando logo del loader. Imágenes pendientes: ${pendingImages}`);
        
        const handleLoaderLogoLoad = () => {
            handleImageLoad();
            loaderLogo.removeEventListener('load', handleLoaderLogoLoad);
            loaderLogo.removeEventListener('error', handleLoaderLogoError);
        };
        
        const handleLoaderLogoError = () => {
            handleImageError();
            loaderLogo.removeEventListener('load', handleLoaderLogoLoad);
            loaderLogo.removeEventListener('error', handleLoaderLogoError);
        };
        
        loaderLogo.addEventListener('load', handleLoaderLogoLoad);
        loaderLogo.addEventListener('error', handleLoaderLogoError);
        
        // Si el logo ya está cargado (desde caché)
        if (loaderLogo.complete) {
            handleLoaderLogoLoad();
        }
    }
    
    // Timeout de seguridad para ocultar el loader después de 10 segundos
    setTimeout(() => {
        if (document.getElementById('loader').style.display !== 'none') {
            console.log('⏰ Timeout de loader alcanzado, ocultando por seguridad');
            hideLoader();
        }
    }, 10000);
    
    // Cargar la configuración del sitio
    await loadSiteConfig();

    // Verificar si hay una sesión de administrador activa
    if (localStorage.getItem('isAdmin') === 'true') {
        // Actualizar el estado interno del módulo de administración
        adminModule.restoreAdminSession();
        document.getElementById('btn-add-product').classList.remove('d-none');
        document.getElementById('btn-add-category').classList.remove('d-none');
        document.getElementById('btn-add-product-categories').classList.remove('d-none');
        document.getElementById('btn-edit-site').classList.remove('d-none');
        document.getElementById('logout-container').style.display = 'block';
        document.getElementById('change-password-container').style.display = 'block';
        document.getElementById('btn-admin').style.display = 'none';
    }

    // Event listener para el formulario de configuración
    document.getElementById('site-config-form').addEventListener('submit', saveSiteConfig);

    // Event listener para el botón de editar configuración del sitio
    document.getElementById('btn-edit-site').addEventListener('click', updateForm);

    // Event listeners para verificación de edad
    document.getElementById('btn-age-confirm').addEventListener('click', handleAgeConfirmation);
    document.getElementById('btn-age-deny').addEventListener('click', handleAgeDeny);

    // Event listeners para navegación entre categorías y catálogo
    document.getElementById('btn-back-categories').addEventListener('click', showCategoriesView);

    // Event listeners para formularios
    document.getElementById('category-form').addEventListener('submit', saveCategoryForm);
    
    // Event listeners para vista previa de imágenes
    setupImagePreviews();
    
    // Event listener para limpiar formulario de categoría al abrirlo
    document.getElementById('btn-add-category').addEventListener('click', () => {
        document.getElementById('modalCategoryLabel').textContent = 'Agregar Categoría';
        document.getElementById('category-id').value = '';
        document.getElementById('category-name').value = '';
    });

    // Event listener para limpiar formulario de producto al abrirlo
    document.getElementById('btn-add-product').addEventListener('click', () => {
        document.getElementById('modalProductLabel').textContent = 'Agregar Producto';
        document.getElementById('product-id').value = '';
        document.getElementById('description').value = '';
        document.getElementById('price').value = '';
        document.getElementById('image').value = '';
        document.getElementById('current-image').style.display = 'none';
        clearImagePreviews();
        
        // Preseleccionar la categoría actual si no estamos viendo "Todos los productos"
        const categorySelect = document.getElementById('product-category');
        if (currentCategoryFilter && categorySelect) {
            categorySelect.value = currentCategoryFilter;
            console.log('🎯 Categoría preseleccionada:', currentCategoryFilter);
        } else {
            categorySelect.value = '';
        }
    });

    // Event listener para el botón de agregar producto en la pantalla de categorías
    document.getElementById('btn-add-product-categories').addEventListener('click', () => {
        document.getElementById('modalProductLabel').textContent = 'Agregar Producto';
        document.getElementById('product-id').value = '';
        document.getElementById('description').value = '';
        document.getElementById('price').value = '';
        document.getElementById('image').value = '';
        document.getElementById('current-image').style.display = 'none';
        clearImagePreviews();
        
        // Desde la pantalla de categorías, no hay categoría preseleccionada por defecto
        const categorySelect = document.getElementById('product-category');
        if (categorySelect) {
            categorySelect.value = '';
            console.log('🎯 Formulario de producto abierto desde pantalla de categorías');
        }
    });

    // Manejar el evento de cierre de sesión
    document.getElementById('btn-logout').addEventListener('click', (e) => {
        e.preventDefault();
        adminModule.logout();
        document.getElementById('logout-container').style.display = 'none';
    });

    // Botón Volver Arriba
    const btnScrollTop = document.getElementById('btn-scroll-top');

    // Mostrar/ocultar botón según el scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btnScrollTop.classList.add('visible');
        } else {
            btnScrollTop.classList.remove('visible');
        }
    });

    // Acción del botón
    btnScrollTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    const productosCol = collection(db, 'productos');
    onSnapshot(productosCol, (snapshot) => {
        console.log('🔄 Cargando productos...');
        products = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            products.push({ ...data, _id: docSnap.id });
        });
        // Aplicar el ordenamiento actual
        sortProductsByPrice();
        
        // Solo renderizar productos si estamos en la vista de catálogo
        if (document.getElementById('catalogo').classList.contains('d-none') === false) {
            renderProducts();
        }
        
        // Marcar productos como cargados solo en la primera carga
        if (!isProductsLoaded) {
            isProductsLoaded = true;
            console.log('✅ Productos cargados');
            checkIfCanHideLoader();
        }
    });

    // Listener para cambios en tiempo real de las categorías
    const categoriasCol = collection(db, 'categorias');
    onSnapshot(categoriasCol, (snapshot) => {
        console.log('🔄 Cargando categorías...');
        categories = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            categories.push({ ...data, _id: docSnap.id });
        });
        
        // Ordenar categorías alfabéticamente
        categories.sort((a, b) => a.name.localeCompare(b.name));
        
        // Solo renderizar categorías si estamos en la vista de categorías
        if (document.getElementById('categorias').classList.contains('d-none') === false) {
            renderCategories();
        }
        
        // Actualizar el select de categorías en el formulario de productos
        updateCategorySelect();
        
        // Marcar categorías como cargadas solo en la primera carga
        if (!isCategoriesLoaded) {
            isCategoriesLoaded = true;
            console.log('✅ Categorías cargadas');
            checkIfCanHideLoader();
        }
    });

    // Listener para cambios en tiempo real de la configuración del sitio
    onSnapshot(siteConfigRef, (docSnap) => {
        if (docSnap.exists()) {
            const config = docSnap.data();
            console.log('🔄 Configuración actualizada en tiempo real:', config.siteName);
            updateSiteConfigUI(config);
        } else {
            // Si no existe configuración, mostrar placeholders
            console.log('⚠️ No existe configuración, mostrando placeholders');
            updateSiteConfigUI(null);
        }
        
        // Solo marcar como cargado si es la primera vez
        if (!isConfigLoaded) {
            isConfigLoaded = true;
            console.log('✅ Configuración del sitio cargada (tiempo real)');
            checkIfCanHideLoader();
        }
    });

    // Asegurar que window.bootstrap esté disponible
    let bootstrapLib = window.bootstrap;
    if (!bootstrapLib) {
        try {
            bootstrapLib = await import('bootstrap/dist/js/bootstrap.esm.js');
            window.bootstrap = bootstrapLib;
        } catch (e) {
            console.error('No se pudo cargar Bootstrap JS:', e);
        }
    }

    // Fix universal para menú hamburguesa y botón Administración
    // 1. Menú hamburguesa Bootstrap (usar collapse de Bootstrap)
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.getElementById('navbarNav');
    if (navbarToggler && navbarCollapse && window.bootstrap) {
        navbarToggler.addEventListener('click', function () {
            const bsCollapse = window.bootstrap.Collapse.getOrCreateInstance(navbarCollapse);
            bsCollapse.toggle();
        });
    }
    // 2. Botón Administración: abrir modal siempre, sin interferencia con el collapse
    const btnAdmin = document.getElementById('btn-admin');
    const modalAdminLogin = document.getElementById('modalAdminLogin');
    let adminModal = null;
    if (btnAdmin && modalAdminLogin && window.bootstrap && window.bootstrap.Modal) {
        adminModal = new window.bootstrap.Modal(modalAdminLogin);
        btnAdmin.addEventListener('click', function (e) {
            e.preventDefault();
            document.getElementById('admin-pass').value = '';
            document.getElementById('admin-login-error').classList.add('d-none');
            adminModal.show();
        });
    }

    document.getElementById('admin-login-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const pass = document.getElementById('admin-pass').value;
        
        try {
            const loginSuccess = await adminModule.login(pass);
            if (loginSuccess) {
                if (adminModal) adminModal.hide();
                setTimeout(() => {
                    document.getElementById('btn-add-product').classList.remove('d-none');
                }, 100);
            } else {
                document.getElementById('admin-login-error').classList.remove('d-none');
            }
        } catch (error) {
            console.error('Error durante el login:', error);
            document.getElementById('admin-login-error').classList.remove('d-none');
        }
    });

    // Limpiar el formulario y errores al cerrar el modal de login
    document.getElementById('modalAdminLogin').addEventListener('hidden.bs.modal', function () {
        document.getElementById('admin-pass').value = '';
        document.getElementById('admin-login-error').classList.add('d-none');
    });

    // Limpiar el formulario al cerrar el modal de configuración del sitio
    document.getElementById('modalSiteConfig').addEventListener('hidden.bs.modal', function () {
        document.getElementById('site-config-form').reset();
        document.getElementById('current-cover-image').style.display = 'none';
        clearImagePreviews();
    });

    // Limpiar el formulario al cerrar el modal de productos
    document.getElementById('modalProduct').addEventListener('hidden.bs.modal', function () {
        document.getElementById('current-image').style.display = 'none';
        clearImagePreviews();
    });

    // Eliminar el login simple anterior (admin-login div)
    const oldLoginDiv = document.getElementById('admin-login');
    if (oldLoginDiv) oldLoginDiv.innerHTML = '';
    
    // Event listener duplicado - limpiar formulario de producto al abrirlo (versión adicional)
    document.getElementById('btn-add-product').addEventListener('click', () => {
        document.getElementById('modalProductLabel').textContent = 'Agregar Producto';
        document.getElementById('product-id').value = '';
        document.getElementById('description').value = '';
        document.getElementById('price').value = '';
        document.getElementById('image').value = '';
        document.getElementById('current-image').style.display = 'none';
        clearImagePreviews();
        
        // Preseleccionar la categoría actual si no estamos viendo "Todos los productos"
        const categorySelect = document.getElementById('product-category');
        if (currentCategoryFilter && categorySelect) {
            categorySelect.value = currentCategoryFilter;
            console.log('🎯 Categoría preseleccionada (evento duplicado):', currentCategoryFilter);
        } else {
            categorySelect.value = '';
        }
    });
    
    document.getElementById('product-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const id = document.getElementById('product-id').value;
        const description = document.getElementById('description').value.trim();
        const categoryId = document.getElementById('product-category').value;
        const price = parseFloat(document.getElementById('price').value);
        const imageFile = document.getElementById('image').files[0];

        // Validar campos requeridos
        if (!description || !categoryId || isNaN(price)) {
            showToast('Por favor completa todos los campos requeridos', 'error');
            return;
        }

        // Al agregar un nuevo producto, la imagen es requerida
        if (!id && !imageFile) {
            showToast('Por favor selecciona una imagen para el nuevo producto', 'error');
            return;
        }

        try {
            const productosCol = collection(db, 'productos');
            const productData = {
                description,
                categoryId,
                price: price.toFixed(2)
            };

            // Si hay una imagen nueva, procesarla
            if (imageFile) {
                const imagePath = await saveImage(imageFile);
                if (imagePath) {
                    productData.image = imagePath;
                }
            }

            if (id) {
                // Editar producto
                if (!adminModule.isAdmin()) {
                    showToast('Acceso restringido.', 'error');
                    return;
                }

                // Si no hay imagen nueva, mantener la imagen existente
                if (!imageFile) {
                    const currentProduct = products.find(p => p._id === id);
                    if (currentProduct && currentProduct.image) {
                        productData.image = currentProduct.image;
                    }
                }

                await window.updateProduct(productosCol, id, productData);
                showToast('Producto actualizado correctamente', 'success');
            } else {
                // Agregar producto
                await adminModule.addProduct(productosCol, productData);
                showToast('Producto agregado correctamente', 'success');
            }

            // Cerrar el modal y limpiar el formulario
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalProduct'));
            document.getElementById('current-image').style.display = 'none';
            clearImagePreviews();
            if (modal) modal.hide();
            this.reset();
        } catch (error) {
            console.error('Error al procesar el producto:', error);
            showToast('Error al guardar el producto. Por favor intenta nuevamente.', 'error');
        }
    });

    // Sidebar toggle
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        document.querySelector('.container').classList.toggle('sidebar-open');
    });
    // Cerrar sidebar al hacer click en un enlace
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', () => {
            sidebar.classList.remove('open');
            document.querySelector('.container').classList.remove('sidebar-open');
        });
    });
});

// Función para mostrar la imagen en el slider
function showImageSlider(product) {
    const modal = new bootstrap.Modal(document.getElementById('modalImageSlider'));
    const modalTitle = document.getElementById('modalImageSliderLabel');
    const sliderImage = document.getElementById('sliderImage');
    const productTitle = document.querySelector('#modalImageSlider .product-title');
    const productPrice = document.querySelector('#modalImageSlider .product-price span');
    const productDescription = document.querySelector('#modalImageSlider .product-description');
    const prevBtn = document.getElementById('prevProduct');
    const nextBtn = document.getElementById('nextProduct');

    // Encuentra el índice del producto actual
    let currentIndex = products.findIndex(p => p._id === product._id);
    function updateSliderContent(newProduct, newIndex) {
        modalTitle.textContent = 'Vista del Producto';
        sliderImage.src = newProduct.image || '';
        sliderImage.alt = newProduct.description;
        productTitle.textContent = 'Detalles del Producto';
        productPrice.textContent = `$${newProduct.price}`;
        productDescription.textContent = newProduct.description;

        // Actualizar estado de los botones de navegación
        prevBtn.disabled = newIndex <= 0;
        nextBtn.disabled = newIndex >= products.length - 1;

        // Actualizar el índice current
        currentIndex = newIndex;
    }
    // Configurar navegación
    prevBtn.onclick = () => {
        if (currentIndex > 0) {
            updateSliderContent(products[currentIndex - 1], currentIndex - 1);
            resetZoom();
        }
    };

    nextBtn.onclick = () => {
        if (currentIndex < products.length - 1) {
            updateSliderContent(products[currentIndex + 1], currentIndex + 1);
            resetZoom();
        }
    };

    // También permitir navegación con teclado
    const handleKeydown = (e) => {
        if (e.key === 'ArrowLeft' && currentIndex > 0) {
            prevBtn.click();
        } else if (e.key === 'ArrowRight' && currentIndex < products.length - 1) {
            nextBtn.click();
        }
    };

    document.addEventListener('keydown', handleKeydown);

    // Limpiar event listener al cerrar el modal
    document.getElementById('modalImageSlider').addEventListener('hidden.bs.modal', () => {
        document.removeEventListener('keydown', handleKeydown);
    });

    updateSliderContent(product, currentIndex);

    function resetZoom() {
        isZoomed = false;
        sliderImage.style.transform = 'scale(1)';
        sliderImage.classList.remove('zoomed');
    }

    // Manejar zoom de imagen
    let isZoomed = false;
    sliderImage.addEventListener('click', function () {
        if (!isZoomed) {
            this.style.transform = 'scale(1.5)';
            this.classList.add('zoomed');
        } else {
            resetZoom();
        }
        isZoomed = !isZoomed;
    });

    // Resetear zoom al cerrar el modal
    document.getElementById('modalImageSlider').addEventListener('hidden.bs.modal', function () {
        resetZoom();
    });

    modal.show();
}

// Modificar la función renderProducts para incluir el evento click en las imágenes
function renderProducts() {
    const list = document.getElementById('product-list');
    list.innerHTML = '';

    const filteredProducts = getFilteredProducts();

    if (filteredProducts.length === 0) {
        list.innerHTML = '<p class="text-center text-secondary">No hay productos en esta categoría.</p>';
        // Si no hay productos, no hay imágenes que cargar
        checkIfCanHideLoader();
        return;
    }

    // Calcular paginación
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    const isAdmin = adminModule.isAdmin();

    // Contar las imágenes que se van a cargar
    pendingImages = paginatedProducts.length;
    console.log(`🔄 Iniciando carga de ${pendingImages} imágenes de productos`);

    // Renderizar productos
    paginatedProducts.forEach((product) => {
        const col = document.createElement('div');
        col.className = 'col-12 col-md-6 col-lg-4';
        let imageUrl = product.image || 'https://placehold.co/600x400?text=Image+Not+Found';
        col.innerHTML = `        <div class="card product-card h-100 d-flex flex-column justify-content-between">
            <img src="${imageUrl}" class="card-img-top" alt="${product.description}" data-product-id="${product._id}">
            <div class="card-body">
                <p class="card-text">${product.description}</p>
                <p class="card-text"><span class="fw-bold text-pink">$${product.price}</span></p>
            </div>${isAdmin ? `<div class='card-footer bg-transparent border-0 d-flex gap-2'>
                <button class='btn btn-pink flex-fill' onclick="window.editProduct('${product._id}')">Editar</button>
                <button class='btn btn-danger flex-fill' onclick="window.deleteProduct('${product._id}')">Eliminar</button>
            </div>` : ''}
        </div>
        `;

        // Agregar evento click a la imagen y eventos de carga
        const img = col.querySelector('.card-img-top');
        img.addEventListener('click', () => showImageSlider(product));
        
        // Agregar eventos para controlar la carga de imágenes
        img.addEventListener('load', handleImageLoad);
        img.addEventListener('error', handleImageError);
        
        // Si la imagen ya está cargada (desde caché), decrementar el contador
        if (img.complete) {
            handleImageLoad();
        }

        list.appendChild(col);
    });

    // Agregar controles de paginación con límite de páginas mostradas
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'w-100 d-flex justify-content-center mt-4';
    
    // Configuración de paginación limitada
    const maxVisiblePages = 3; // Número máximo de páginas numeradas a mostrar
    
    // Calcular el rango de páginas a mostrar
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Ajustar el inicio si estamos cerca del final
    if (endPage - startPage + 1 < maxVisiblePages && totalPages >= maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Generar las páginas numeradas
    let pageNumbers = '';
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <button class="page-link" onclick="changePage(${i})">${i}</button>
            </li>
        `;
    }
    
    paginationContainer.innerHTML = `
        <nav aria-label="Navegación de páginas">
            <ul class="pagination flex-wrap">
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <button class="page-link" onclick="changePage(1)" ${currentPage === 1 ? 'disabled' : ''}>
                        <span class="d-none d-md-inline">Primero</span>
                        <span class="d-inline d-md-none">⏮</span>
                    </button>
                </li>
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <button class="page-link" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                        <span class="d-none d-md-inline">Anterior</span>
                        <span class="d-inline d-md-none">◀</span>
                    </button>
                </li>
                ${pageNumbers}
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <button class="page-link" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                        <span class="d-none d-md-inline">Siguiente</span>
                        <span class="d-inline d-md-none">▶</span>
                    </button>
                </li>
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <button class="page-link" onclick="changePage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
                        <span class="d-none d-md-inline">Último</span>
                        <span class="d-inline d-md-none">⏭</span>
                    </button>
                </li>
            </ul>
        </nav>
    `;
    list.appendChild(paginationContainer);
}

// Función para cambiar de página
window.changePage = function (newPage) {
    if (newPage >= 1 && newPage <= Math.ceil(getFilteredProducts().length / PRODUCTS_PER_PAGE)) {
        currentPage = newPage;
        renderProducts();
    }
}

// Funciones para navegación entre vistas
function showCategoriesView() {
    document.getElementById('categorias').classList.remove('d-none');
    document.getElementById('catalogo').classList.add('d-none');
    currentCategoryFilter = null;
    document.getElementById('current-category-name').textContent = '';
    renderCategories();
}

function showCatalogView(categoryId = null, categoryName = 'Todos los productos') {
    document.getElementById('categorias').classList.add('d-none');
    document.getElementById('catalogo').classList.remove('d-none');
    currentCategoryFilter = categoryId;
    document.getElementById('current-category-name').textContent = categoryName;
    currentPage = 1; // Resetear a la primera página
    renderProducts();
}

// Función para obtener productos filtrados por categoría
function getFilteredProducts() {
    if (!currentCategoryFilter) {
        return products;
    }
    return products.filter(product => product.categoryId === currentCategoryFilter);
}

// Función para renderizar categorías
function renderCategories() {
    const list = document.getElementById('category-list');
    list.innerHTML = '';

    // Crear la tarjeta "Ver Todos" siempre al inicio
    const viewAllCol = document.createElement('div');
    viewAllCol.className = 'col-12 col-md-6 col-lg-4';
    
    viewAllCol.innerHTML = `
        <div class="card category-card h-100 d-flex flex-column justify-content-center" style="cursor: pointer;">
            <div class="card-body text-center">
                <h5 class="card-title">Ver Todos</h5>
                <p class="card-text">Mostrar todos los productos disponibles</p>
            </div>
        </div>
    `;

    // Agregar evento click a la tarjeta "Ver Todos"
    viewAllCol.addEventListener('click', () => showCatalogView(null, 'Todos los productos'));

    list.appendChild(viewAllCol);

    if (categories.length === 0) {
        const noCategories = document.createElement('div');
        noCategories.className = 'col-12 text-center text-secondary mt-4';
        noCategories.innerHTML = '<p>No hay categorías disponibles. El administrador puede agregar categorías.</p>';
        list.appendChild(noCategories);
        // Si no hay categorías, verificar si se puede ocultar el loader
        checkIfCanHideLoader();
        return;
    }

    const isAdmin = adminModule.isAdmin();

    // Renderizar categorías sin imágenes
    categories.forEach((category) => {
        const col = document.createElement('div');
        col.className = 'col-12 col-md-6 col-lg-4';
        
        col.innerHTML = `
            <div class="card category-card h-100 d-flex flex-column justify-content-center" style="cursor: pointer;">
                <div class="card-body text-center">
                    <h5 class="card-title">${category.name}</h5>
                </div>
                ${isAdmin ? `<div class='card-footer bg-transparent border-0 d-flex gap-2'>
                    <button class='btn btn-pink flex-fill' onclick="window.editCategory('${category._id}')">Editar</button>
                    <button class='btn btn-danger flex-fill' onclick="window.deleteCategory('${category._id}')">Eliminar</button>
                </div>` : ''}
            </div>
        `;

        // Agregar evento click a la tarjeta para navegar al catálogo
        col.addEventListener('click', (e) => {
            // Evitar navegación si se hace click en los botones de administración
            if (!e.target.closest('button')) {
                showCatalogView(category._id, category.name);
            }
        });

        list.appendChild(col);
    });
}

// Función para configurar las vistas previas de imágenes
function setupImagePreviews() {
    // Vista previa para imagen de producto
    const productImageInput = document.getElementById('image');
    const previewImage = document.getElementById('preview-image');
    const currentImage = document.getElementById('current-image');

    if (productImageInput && previewImage) {
        productImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                console.log('📷 Mostrando vista previa de imagen de producto:', file.name);
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImage.src = e.target.result;
                    previewImage.style.display = 'block';
                    // Ocultar imagen actual cuando hay vista previa
                    if (currentImage) {
                        currentImage.style.display = 'none';
                    }
                };
                reader.readAsDataURL(file);
            } else {
                // Si no hay archivo, ocultar vista previa y mostrar imagen actual si existe
                previewImage.style.display = 'none';
                if (currentImage && currentImage.src) {
                    currentImage.style.display = 'block';
                }
            }
        });
    }

    // Vista previa para imagen de portada
    const coverImageInput = document.getElementById('cover-image');
    const previewCoverImage = document.getElementById('preview-cover-image');
    const currentCoverImage = document.getElementById('current-cover-image');

    if (coverImageInput && previewCoverImage) {
        coverImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                console.log('📷 Mostrando vista previa de imagen de portada:', file.name);
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewCoverImage.src = e.target.result;
                    previewCoverImage.style.display = 'block';
                    // Ocultar imagen actual cuando hay vista previa
                    if (currentCoverImage) {
                        currentCoverImage.style.display = 'none';
                    }
                };
                reader.readAsDataURL(file);
            } else {
                // Si no hay archivo, ocultar vista previa y mostrar imagen actual si existe
                previewCoverImage.style.display = 'none';
                if (currentCoverImage && currentCoverImage.src) {
                    currentCoverImage.style.display = 'block';
                }
            }
        });
    }
}

// Función para limpiar vistas previas cuando se resetean los formularios
function clearImagePreviews() {
    const previewImage = document.getElementById('preview-image');
    const previewCoverImage = document.getElementById('preview-cover-image');
    
    if (previewImage) {
        previewImage.style.display = 'none';
        previewImage.src = '';
    }
    
    if (previewCoverImage) {
        previewCoverImage.style.display = 'none';
        previewCoverImage.src = '';
    }
}
function updateCategorySelect() {
    const select = document.getElementById('product-category');
    if (!select) return;

    // Limpiar opciones existentes excepto la primera
    select.innerHTML = '<option value="">Selecciona una categoría</option>';

    // Agregar las categorías disponibles
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category._id;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

// Función para manejar el formulario de categorías
async function saveCategoryForm(e) {
    e.preventDefault();
    const id = document.getElementById('category-id').value;
    const name = document.getElementById('category-name').value.trim();

    // Validar campos requeridos
    if (!name) {
        showToast('Por favor completa el nombre de la categoría', 'error');
        return;
    }

    try {
        const categoriasCol = collection(db, 'categorias');
        const categoryData = {
            name
        };

        if (id) {
            // Editar categoría
            if (!adminModule.isAdmin()) {
                showToast('Acceso restringido.', 'error');
                return;
            }

            await updateCategory(categoriasCol, id, categoryData);
            showToast('Categoría actualizada correctamente', 'success');
        } else {
            // Agregar categoría
            await adminModule.addCategory(categoriasCol, categoryData);
            showToast('Categoría agregada correctamente', 'success');
        }

        // Cerrar el modal y limpiar el formulario
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalCategory'));
        if (modal) modal.hide();
        document.getElementById('category-form').reset();
    } catch (error) {
        console.error('Error al procesar la categoría:', error);
        showToast('Error al guardar la categoría. Por favor intenta nuevamente.', 'error');
    }
}


// Funciones para editar y eliminar categorías
window.editCategory = function (id) {
    const category = categories.find(c => c._id === id);
    if (!category) return;
    
    document.getElementById('modalCategoryLabel').textContent = 'Editar Categoría';
    document.getElementById('category-id').value = category._id;
    document.getElementById('category-name').value = category.name;

    const modal = new bootstrap.Modal(document.getElementById('modalCategory'));
    modal.show();
}

window.deleteCategory = async function (id) {
    if (!adminModule.isAdmin()) {
        showToast('Acceso restringido.', 'error');
        return;
    }

    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría? Los productos asociados quedarán sin categoría.')) {
        return;
    }

    try {
        const categoriasCol = collection(db, 'categorias');

        await adminModule.deleteCategory(categoriasCol, id);
        showToast('Categoría eliminada correctamente', 'success');
    } catch (error) {
        console.error('Error al eliminar la categoría:', error);
        showToast('Error al eliminar la categoría', 'error');
    }
}

// Función para actualizar categoría
async function updateCategory(categoriasCol, id, data) {
    if (!adminModule.isAdmin()) {
        showToast('Acceso restringido.', 'error');
        return;
    }
    try {
        console.log('✏️ Actualizando categoría:', id, data);
        const ref = doc(categoriasCol, id);
        await updateDoc(ref, data);
        console.log('✅ Categoría actualizada exitosamente');
    } catch (error) {
        console.error('❌ Error actualizando categoría:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message
        });
        throw error;
    }
}





// Modal para agregar/editar producto
window.editProduct = function (id) {
    const product = products.find(p => p._id === id);
    if (!product) return;
    document.getElementById('modalProductLabel').textContent = 'Editar Producto';
    document.getElementById('product-id').value = product._id;
    document.getElementById('description').value = product.description;
    document.getElementById('product-category').value = product.categoryId || '';
    document.getElementById('price').value = product.price;
    document.getElementById('image').value = ''; // Limpiar el input de archivo

    // Mostrar la imagen actual
    const currentImage = document.getElementById('current-image');
    if (product.image) {
        currentImage.src = product.image;
        currentImage.style.display = 'block';
    } else {
        currentImage.style.display = 'none';
    }

    const modal = new bootstrap.Modal(document.getElementById('modalProduct'));
    modal.show();
}

window.updateProduct = async function (productosCol, id, data) {
    if (!adminModule.isAdmin()) {
        showToast('Acceso restringido.', 'error');
        return;
    }
    try {
        console.log('✏️ Actualizando producto:', id, data);
        const ref = doc(productosCol, id);
        await updateDoc(ref, data);
        console.log('✅ Producto actualizado exitosamente');
    } catch (error) {
        console.error('❌ Error actualizando producto:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message
        });
        throw error;
    }
}

window.deleteProduct = async function (id) {
    try {
        const productosCol = collection(db, 'productos');
        const product = products.find(p => p._id === id);

        if (product && product.image) {
            await deleteImage(product.image);
        }

        await adminModule.deleteProduct(productosCol, id);
        showToast('Producto eliminado correctamente', 'success');
    } catch (error) {
        console.error('Error al eliminar el producto:', error);
        showToast('Error al eliminar el producto', 'error');
    }
}

// Función para cambiar la contraseña
async function changePassword(currentPass, newPass) {
    try {
        const docSnap = await getDoc(siteConfigRef);
        if (!docSnap.exists()) {
            throw new Error('No existe la configuración del sitio');
        }

        const config = docSnap.data();
        const storedPassword = config.adminPassword;

        // Verificar la contraseña actual
        const isMatch = await bcrypt.compare(currentPass, storedPassword);
        if (!isMatch) {
            throw new Error('La contraseña actual es incorrecta');
        }

        // Encriptar y actualizar la nueva contraseña en Firebase
        const hashedPassword = await bcrypt.hash(newPass, 10);
        await updateDoc(siteConfigRef, {
            ...config,
            adminPassword: hashedPassword
        });

        // Actualizar la contraseña en el módulo de administración
        adminModule.updatePassword(newPass);

        return true;
    } catch (error) {
        console.error('Error al cambiar la contraseña:', error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // ...existing code...

    // Event listener para el formulario de cambio de contraseña
    document.getElementById('change-password-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const errorDiv = document.getElementById('password-error');

        // Validar que las contraseñas nuevas coincidan
        if (newPassword !== confirmPassword) {
            errorDiv.textContent = 'Las contraseñas no coinciden';
            errorDiv.classList.remove('d-none');
            return;
        }

        // Validar longitud mínima
        if (newPassword.length < 6) {
            errorDiv.textContent = 'La contraseña debe tener al menos 6 caracteres';
            errorDiv.classList.remove('d-none');
            return;
        }

        try {
            await changePassword(currentPassword, newPassword);
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalChangePassword'));
            modal.hide();
            showToast('Contraseña cambiada correctamente', 'success');
            this.reset();
            errorDiv.classList.add('d-none');
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('d-none');
        }
    });

    // Limpiar el formulario y errores al cerrar el modal
    document.getElementById('modalChangePassword').addEventListener('hidden.bs.modal', function () {
        document.getElementById('change-password-form').reset();
        document.getElementById('password-error').classList.add('d-none');
    });

    // ...existing code...
});

// Ejecutar verificación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    const isConnected = await checkFirebaseConnection();
    if (isConnected) {
        console.log('🚀 La aplicación está lista y conectada a Firebase');
    } else {
        console.error('❌ Hay problemas con la conexión a Firebase');
        // Ocultar el loader en caso de error de conexión
        hideLoader();
        // Mostrar mensaje de error en la UI
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger fixed-top m-3';
        errorDiv.innerHTML = `
            <strong>Error de conexión</strong><br>
            No se pudo conectar con la base de datos. 
            Por favor, verifica tu conexión a internet y la configuración de Firebase.
        `;
        document.body.appendChild(errorDiv);
    }
});

// Debug temporal - eliminar después
setTimeout(() => {
    console.log('=== DEBUG ADMIN STATE ===');
    console.log('localStorage isAdmin:', localStorage.getItem('isAdmin'));
    console.log('adminModule exists:', typeof adminModule !== 'undefined');
    if (typeof adminModule !== 'undefined') {
        console.log('adminModule.isAdmin():', adminModule.isAdmin());
    }

    // Verificar botones
    const btnAddProduct = document.getElementById('btn-add-product');
    const btnAddCategory = document.getElementById('btn-add-category');
    const btnAddProductCategories = document.getElementById('btn-add-product-categories');
    console.log('btn-add-product exists:', !!btnAddProduct);
    console.log('btn-add-product visible:', btnAddProduct && !btnAddProduct.classList.contains('d-none'));
    console.log('btn-add-category exists:', !!btnAddCategory);
    console.log('btn-add-category visible:', btnAddCategory && !btnAddCategory.classList.contains('d-none'));
    console.log('btn-add-product-categories exists:', !!btnAddProductCategories);
    console.log('btn-add-product-categories visible:', btnAddProductCategories && !btnAddProductCategories.classList.contains('d-none'));

    // Verificar formularios
    const categoryForm = document.getElementById('category-form');
    const productForm = document.getElementById('product-form');
    console.log('category-form exists:', !!categoryForm);
    console.log('product-form exists:', !!productForm);
    console.log('=== END DEBUG ===');
}, 3000);
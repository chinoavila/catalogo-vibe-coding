import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import bcrypt from 'bcryptjs';

// Configuración de Firebase usand    let isAdmin = localStorage.getItem('isAdmin') === 'true';
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
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_ID,
    measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencia a la colección de configuración
const siteConfigRef = doc(db, 'config', 'site');

// Función para actualizar el formulario con los valores actuales            
function updateForm() {
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
}

// Función para cargar la configuración del sitio
async function loadSiteConfig() {
    try {
        const docSnap = await getDoc(siteConfigRef);
        if (docSnap.exists()) {
            const config = docSnap.data();
            const siteName = config.siteName || '[Nombre del sitio]';

            // Actualizar todas las instancias del nombre del sitio
            document.title = `${siteName} | Catálogo de Productos`;
            document.querySelector('.navbar-brand').textContent = siteName;
            document.querySelector('#catalogo h2').textContent = `Catálogo ${siteName}`;
            document.querySelector('footer div').textContent = `© Sitio oficial de ${siteName}, desarrollado por Alejandro Javier Avila. Todos los derechos reservados.`;

            // Resto de la configuración
            document.getElementById('header-image').src = config.coverImage || '[URL imagen de portada]';
            document.getElementById('slogan1').textContent = config.slogan1 || '[Slogan principal]';
            document.getElementById('slogan2').textContent = config.slogan2 || '[Slogan secundario]';
            document.getElementById('about-content').textContent = config.aboutText || '[Texto Quiénes somos]';
            document.getElementById('contact-content').textContent = config.contactText || '[Texto de Contacto]';
            document.getElementById('schedule-text').textContent = config.schedule || '[Horario de atención]';
            document.getElementById('shipping-text').textContent = config.shippingInfo || '[Información de envíos]';            document.getElementById('instagram-link').href = config.instagramUrl || '#';
            document.getElementById('instagram-handle').textContent = config.instagramHandle || '[Usuario de Instagram]';

            // Actualizar la contraseña del módulo de administración si existe
            if (config.adminPassword) {
                adminModule.updatePassword(config.adminPassword);
            }

            // Agregar evento para actualizar el formulario cuando se abre el modal
            document.getElementById('btn-edit-site').addEventListener('click', updateForm);
        } else {
            // Si no existe configuración, mostrar placeholders
            const siteName = '[Nombre del sitio]';

            // Actualizar todas las instancias del nombre del sitio
            document.title = `${siteName} | Catálogo de Productos`;
            document.querySelector('.navbar-brand').textContent = siteName;
            document.querySelector('#catalogo h2').textContent = `Catálogo ${siteName}`;
            document.querySelector('footer div').textContent = `© 2025 Sitio oficial de ${siteName}, desarrollado por Alejandro Javier Avila. Todos los derechos reservados.`;

            // Resto de placeholders
            document.getElementById('header-image').src = '[URL imagen de portada]';
            document.getElementById('slogan1').textContent = '[Slogan principal]';
            document.getElementById('slogan2').textContent = '[Slogan secundario]';
            document.getElementById('about-content').textContent = '[Texto Quiénes somos]';
            document.getElementById('contact-content').textContent = '[Texto de Contacto]';
            document.getElementById('schedule-text').textContent = '[Horario de atención]';
            document.getElementById('shipping-text').textContent = '[Información de envíos]';
            document.getElementById('instagram-link').href = '#';
            document.getElementById('instagram-handle').textContent = '[Usuario de Instagram]';
        }
    } catch (error) {
        console.error('Error al cargar la configuración:', error);
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
    }    try {
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
            adminPassword: currentConfig.adminPassword || import.meta.env.VITE_ADMIN_PASS // Preservar la contraseña existente
        };

        if (imageFile) {
            // Si se seleccionó una nueva imagen, procesarla y actualizar
            const coverImage = await saveImage(imageFile);
            if (coverImage) {
                config.coverImage = coverImage;
            }
        } else {
            // Si no hay nueva imagen, recuperar la imagen actual del header
            const currentImage = document.getElementById('header-image').src;
            if (currentImage && !currentImage.includes('[URL imagen de portada]')) {
                config.coverImage = currentImage;
            }
        }        await setDoc(siteConfigRef, config);
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalSiteConfig'));
        modal.hide();
        
        // Recargar la configuración del sitio inmediatamente
        await loadSiteConfig();
        showToast('Configuración guardada correctamente', 'success');
    } catch (error) {
        console.error('Error al guardar la configuración:', error);
        showToast('Error al guardar la configuración. Por favor intenta nuevamente.', 'error');
    }
}

let products = [];
const PRODUCTS_PER_PAGE = 6; // Número de productos por página
let currentPage = 1; // Página actual

// Función para guardar imagen localmente
async function saveImage(imageFile) {
    try {
        const formData = new FormData();
        formData.append('image', imageFile);

        try {
            // Enviar la imagen al servidor Express para guardarla
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Error al subir la imagen');
            }

            // Obtener la ruta del archivo del servidor
            const data = await response.json();
            return data.path;
        } catch (error) {
            console.error("Error guardando la imagen:", error);
            throw error;
        }
    } catch (error) {
        console.error("Error procesando la imagen:", error);
        throw error;
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
        await initPassword(); // Asegurar que tenemos la contraseña más reciente
        try {
            const isMatch = await bcrypt.compare(pass, adminPassword);
            if (isMatch) {
                isAdmin = true;
                localStorage.setItem('isAdmin', 'true');
                document.getElementById('btn-add-product').classList.remove('d-none');
                document.getElementById('btn-edit-site').classList.remove('d-none');
                document.getElementById('logout-container').style.display = 'block';
                document.getElementById('change-password-container').style.display = 'block';
                document.getElementById('btn-admin').style.display = 'none';
                showToast('Credenciales correctas: se habilitó el modo administrador.', 'success');
                renderProducts();
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
        document.getElementById('btn-edit-site').classList.add('d-none');
        document.getElementById('change-password-container').style.display = 'none';
        document.getElementById('btn-admin').style.display = '';
        renderProducts();
    }

    async function addProduct(productosCol, data) {
        if (!isAdmin) {
            showToast('Acceso restringido.', 'error');
            return;
        }
        await addDoc(productosCol, data);
    }

    async function deleteProduct(productosCol, id) {
        if (!isAdmin) {
            showToast('Acceso restringido.', 'error');
            return;
        }
        await deleteDoc(doc(productosCol, id));
    }    function isAdminCheck() {
        return isAdmin;
    }

    return { login, logout, addProduct, deleteProduct, isAdmin: isAdminCheck, updatePassword };
})();
// --- Fin módulo administración ---

// Escuchar cambios en Firestore y actualizar la galería
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar la configuración del sitio
    await loadSiteConfig();

    // Verificar si hay una sesión de administrador activa
    if (localStorage.getItem('isAdmin') === 'true') {
        document.getElementById('btn-add-product').classList.remove('d-none');
        document.getElementById('btn-edit-site').classList.remove('d-none');
        document.getElementById('logout-container').style.display = 'block';
        document.getElementById('btn-admin').style.display = 'none';
    }

    // Event listener para el formulario de configuración
    document.getElementById('site-config-form').addEventListener('submit', saveSiteConfig);

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
        products = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            products.push({ ...data, _id: docSnap.id });
        });
        renderProducts();
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

    document.getElementById('admin-login-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const pass = document.getElementById('admin-pass').value;
        if (adminModule.login(pass)) {
            if (adminModal) adminModal.hide();
            setTimeout(() => {
                document.getElementById('btn-add-product').classList.remove('d-none');
            }, 100);
        } else {
            document.getElementById('admin-login-error').classList.remove('d-none');
        }
    });

    // Eliminar el login simple anterior (admin-login div)
    const oldLoginDiv = document.getElementById('admin-login');
    if (oldLoginDiv) oldLoginDiv.innerHTML = ''; document.getElementById('btn-add-product').addEventListener('click', () => {
        document.getElementById('modalProductLabel').textContent = 'Agregar Producto';
        document.getElementById('product-id').value = '';
        document.getElementById('description').value = '';
        document.getElementById('price').value = '';
        document.getElementById('image').value = '';
        document.getElementById('current-image').style.display = 'none';
    }); document.getElementById('product-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const id = document.getElementById('product-id').value;
        const description = document.getElementById('description').value.trim();
        const price = parseFloat(document.getElementById('price').value);
        const imageFile = document.getElementById('image').files[0];

        // Validar campos requeridos
        if (!description || isNaN(price)) {
            showToast('Por favor completa la descripción y el precio', 'error');
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

    // Cargar configuración del sitio
    loadSiteConfig();
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

        // Actualizar el índice actual
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

    if (products.length === 0) {
        list.innerHTML = '<p class="text-center text-secondary">No hay productos en el catálogo.</p>';
        return;
    }

    // Calcular paginación
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
    const paginatedProducts = products.slice(startIndex, endIndex);

    const isAdmin = adminModule.isAdmin && adminModule.isAdmin();

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

        // Agregar evento click a la imagen
        const img = col.querySelector('.card-img-top');
        img.addEventListener('click', () => showImageSlider(product));

        list.appendChild(col);
    });

    // Agregar controles de paginación
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'w-100 d-flex justify-content-center mt-4';
    paginationContainer.innerHTML = `
        <nav aria-label="Navegación de páginas">
            <ul class="pagination">
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <button class="page-link" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>
                </li>
                ${Array.from({ length: totalPages }, (_, i) => i + 1).map(page => `
                    <li class="page-item ${currentPage === page ? 'active' : ''}">
                        <button class="page-link" onclick="changePage(${page})">${page}</button>
                    </li>
                `).join('')}
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <button class="page-link" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Siguiente</button>
                </li>
            </ul>
        </nav>
    `;
    list.appendChild(paginationContainer);
}

// Función para cambiar de página
window.changePage = function (newPage) {
    if (newPage >= 1 && newPage <= Math.ceil(products.length / PRODUCTS_PER_PAGE)) {
        currentPage = newPage;
        renderProducts();
    }
}

// Modal para agregar/editar producto
window.editProduct = function (id) {
    const product = products.find(p => p._id === id);
    if (!product) return;
    document.getElementById('modalProductLabel').textContent = 'Editar Producto';
    document.getElementById('product-id').value = product._id;
    document.getElementById('description').value = product.description;
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
    const ref = doc(productosCol, id);
    await updateDoc(ref, data);
}

window.deleteProduct = async function (id) {
    try {
        const productosCol = collection(db, 'productos');
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
    document.getElementById('change-password-form').addEventListener('submit', async function(e) {
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
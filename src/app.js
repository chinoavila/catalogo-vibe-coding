import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, getDoc, setDoc } from "firebase/firestore";

// Configuración de Firebase usando variables de entorno Vite
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
            document.querySelector('.navbar-brand').textContent = siteName;
            document.querySelector('#catalogo h2').textContent = `Catálogo ${siteName}`;
            document.getElementById('header-image').src = config.coverImage || '[URL imagen de portada]';
            document.getElementById('slogan1').textContent = config.slogan1 || '[Slogan principal]';
            document.getElementById('slogan2').textContent = config.slogan2 || '[Slogan secundario]';
            document.getElementById('about-content').textContent = config.aboutText || '[Texto Quiénes somos]';
            document.getElementById('contact-content').textContent = config.contactText || '[Texto de Contacto]';
            document.getElementById('schedule-text').textContent = config.schedule || '[Horario de atención]';
            document.getElementById('shipping-text').textContent = config.shippingInfo || '[Información de envíos]';
            document.getElementById('instagram-link').href = config.instagramUrl || '#';
            document.getElementById('instagram-handle').textContent = config.instagramHandle || '[Usuario de Instagram]';

            // Agregar evento para actualizar el formulario cuando se abre el modal
            document.getElementById('btn-edit-site').addEventListener('click', updateForm);
        } else {
            // Si no existe configuración, mostrar placeholders            
            const siteName = '[Nombre del sitio]';
            document.querySelector('.navbar-brand').textContent = siteName;
            document.querySelector('#catalogo h2').textContent = `Catálogo ${siteName}`;
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

// Función para guardar la configuración del sitio
async function saveSiteConfig(event) {
    event.preventDefault();
    if (!adminModule.isAdmin()) return alert('Acceso restringido.');

    try {
        const imageFile = document.getElementById('cover-image').files[0];
        let coverImage = null;

        if (imageFile) {
            coverImage = await saveImage(imageFile);
        } const config = {
            siteName: document.getElementById('site-name').value,
            slogan1: document.getElementById('slogan1-text').value,
            slogan2: document.getElementById('slogan2-text').value,
            aboutText: document.getElementById('about-text').value,
            contactText: document.getElementById('contact-text').value,
            schedule: document.getElementById('schedule').value,
            shippingInfo: document.getElementById('shipping-info').value,
            instagramUrl: document.getElementById('instagram-url').value,
            instagramHandle: document.getElementById('instagram-handle-text').value
        };

        if (coverImage) {
            config.coverImage = coverImage;
        }

        await setDoc(siteConfigRef, config);
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalSiteConfig'));
        modal.hide();
        alert('Configuración guardada correctamente');
    } catch (error) {
        console.error('Error al guardar la configuración:', error);
        alert('Error al guardar la configuración. Por favor intenta nuevamente.');
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
    // Obtener credenciales del administrador desde variables de entorno
    const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS;
    let isAdmin = localStorage.getItem('isAdmin') === 'true';    
    function login(pass) {
        if (pass === ADMIN_PASS) {
            isAdmin = true;
            localStorage.setItem('isAdmin', 'true');
            document.getElementById('btn-add-product').classList.remove('d-none');
            document.getElementById('btn-edit-site').classList.remove('d-none');
            document.getElementById('logout-container').style.display = 'block';
            document.getElementById('btn-admin').style.display = 'none';
            renderProducts(); // Re-renderizar productos para mostrar botones de edición
            return true;
        } else {
            alert('Credenciales incorrectas.');
            return false;
        }
    }
    function logout() {
        isAdmin = false;
        localStorage.removeItem('isAdmin');
        document.getElementById('btn-add-product').classList.add('d-none');
        document.getElementById('btn-edit-site').classList.add('d-none');
        document.getElementById('btn-admin').style.display = '';
        renderProducts();
    }

    async function addProduct(productosCol, data) {
        if (!isAdmin) return alert('Acceso restringido.');
        await addDoc(productosCol, data);
    }

    async function deleteProduct(productosCol, id) {
        if (!isAdmin) return alert('Acceso restringido.');
        await deleteDoc(doc(productosCol, id));
    }

    function isAdminCheck() {
        return isAdmin;
    }

    return { login, logout, addProduct, deleteProduct, isAdmin: isAdminCheck };
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
    if (oldLoginDiv) oldLoginDiv.innerHTML = '';    document.getElementById('btn-add-product').addEventListener('click', () => {
        document.getElementById('modalProductLabel').textContent = 'Agregar Producto';
        document.getElementById('product-id').value = '';
        document.getElementById('description').value = '';
        document.getElementById('price').value = '';
        document.getElementById('image').value = '';
        document.getElementById('current-image').style.display = 'none';
    });document.getElementById('product-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const id = document.getElementById('product-id').value;
        const description = document.getElementById('description').value.trim();
        const price = parseFloat(document.getElementById('price').value);
        const imageFile = document.getElementById('image').files[0];

        // Validar campos requeridos
        if (!description || isNaN(price)) {
            return alert('Por favor completa la descripción y el precio');
        }
        
        // Al agregar un nuevo producto, la imagen es requerida
        if (!id && !imageFile) {
            return alert('Por favor selecciona una imagen para el nuevo producto');
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
                if (!adminModule.isAdmin()) return alert('Acceso restringido.');
                
                // Si no hay imagen nueva, mantener la imagen existente
                if (!imageFile) {
                    const currentProduct = products.find(p => p._id === id);
                    if (currentProduct && currentProduct.image) {
                        productData.image = currentProduct.image;
                    }
                }

                await window.updateProduct(productosCol, id, productData);
            } else {
                // Agregar producto
                await adminModule.addProduct(productosCol, productData);
            }

            // Cerrar el modal y limpiar el formulario
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalProduct'));
            document.getElementById('current-image').style.display = 'none';
            if (modal) modal.hide();
            this.reset();
        } catch (error) {
            console.error('Error al procesar el producto:', error);
            alert('Error al guardar el producto. Por favor intenta nuevamente.');
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
        let imageUrl = product.image || 'https://via.placeholder.com/300x180?text=Sin+Imagen';
        col.innerHTML = `        <div class="card product-card h-100 d-flex flex-column justify-content-between">
            <img src="${imageUrl}" class="card-img-top" alt="${product.description}">
            <div class="card-body">
                <p class="card-text">${product.description}</p>
                <p class="card-text"><span class="fw-bold text-pink">$${product.price}</span></p>
            </div>${isAdmin ? `<div class='card-footer bg-transparent border-0 d-flex gap-2'>
                <button class='btn btn-pink flex-fill' onclick="window.editProduct('${product._id}')">Editar</button>
                <button class='btn btn-danger flex-fill' onclick="window.deleteProduct('${product._id}')">Eliminar</button>
            </div>` : ''}
        </div>
        `;
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
    if (!adminModule.isAdmin()) return alert('Acceso restringido.');
    const ref = doc(productosCol, id);
    await updateDoc(ref, data);
}

window.deleteProduct = async function (id) {
    const productosCol = collection(db, 'productos');
    await adminModule.deleteProduct(productosCol, id);
}
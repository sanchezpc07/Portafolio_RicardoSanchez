/* 
  JavaScript for Ricardo Sanchez | Consultor Empresarial
  Functionality: Form Validation, Navigation, Simple Animations
*/

document.addEventListener('DOMContentLoaded', () => {
    // 1. Navigation Menu Toggle (Mobile)
    const header = document.querySelector('header');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            if (navLinks.style.display === 'flex') {
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = 'var(--header-height)';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.backgroundColor = 'white';
                navLinks.style.padding = '20px';
                navLinks.style.boxShadow = 'var(--shadow-lg)';
                navLinks.style.zIndex = '1000';
            }
        });
    }

    // 2. Sticky Header on Scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 3. Contact Form Validation and Submission
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Clear previous errors
            clearErrors();
            
            const nombre = document.getElementById('nombre').value.trim();
            const correo = document.getElementById('correo').value.trim();
            const mensaje = document.getElementById('mensaje').value.trim();
            
            let isValid = true;
            
            // Validate Name
            if (!nombre) {
                showError('nombreError', 'Por favor ingrese su nombre completo');
                isValid = false;
            }
            
            // Validate Email
            if (!correo) {
                showError('correoError', 'Por favor ingrese su correo electrónico');
                isValid = false;
            } else if (!isValidEmail(correo)) {
                showError('correoError', 'Correo electrónico no válido');
                isValid = false;
            }
            
            // Validate Message
            if (!mensaje) {
                showError('mensajeError', 'Por favor escriba su mensaje');
                isValid = false;
            }
            
            if (isValid) {
                const submitBtn = contactForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerText;
                
                submitBtn.disabled = true;
                submitBtn.innerText = 'Enviando...';
                
                const formData = new FormData(contactForm);
                
                fetch(contactForm.action, {
                    method: contactForm.method,
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                })
                .then(response => {
                    if (response.ok) {
                        formStatus.innerText = '¡Gracias por su mensaje! Nos pondremos en contacto pronto.';
                        formStatus.className = 'form-status success';
                        contactForm.reset();
                    } else {
                        response.json().then(data => {
                            if (Object.hasOwn(data, 'errors')) {
                                formStatus.innerText = data["errors"].map(error => error["message"]).join(", ");
                            } else {
                                formStatus.innerText = "¡Vaya! Hubo un problema al enviar el formulario.";
                            }
                            formStatus.className = 'form-status error';
                        })
                    }
                })
                .catch(error => {
                    formStatus.innerText = "¡Vaya! Hubo un problema al enviar el formulario.";
                    formStatus.className = 'form-status error';
                })
                .finally(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalText;
                });
            }
        });
    }

    // Helper: Show error messages
    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.innerText = message;
        }
    }

    // Helper: Clear error messages
    function clearErrors() {
        const errors = document.querySelectorAll('.error-msg');
        errors.forEach(err => err.innerText = '');
        formStatus.className = 'form-status';
        formStatus.innerText = '';
    }

    // Helper: Email validation regex
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // 4. Reveal on Scroll (Basic Animation)
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Apply reveal to sections/cards
    document.querySelectorAll('.service-card, .about-container, .contact-wrapper, .comment-item, .comment-form-container').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    // 5. Supabase Auth & Comments Logic
    const SUPABASE_URL = 'https://ugdfzuondglorxbimram.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_w6h38Nuf37suPtCIGGYqfw_RsBFOX2L';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const commentForm = document.getElementById('commentForm');
    const commentsList = document.getElementById('commentsList');
    const commentStatus = document.getElementById('commentStatus');
    const loginStatus = document.getElementById('loginStatus');
    const registerStatus = document.getElementById('registerStatus');

    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    const userInfo = document.getElementById('userInfo');
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    const authOverlay = document.getElementById('authOverlay');
    const submitCommentBtn = document.getElementById('submitCommentBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const navLogoutLi = document.getElementById('nav-logout-li');
    const navLogout = document.getElementById('nav-logout');

    const toRegister = document.getElementById('toRegister');
    const toLogin = document.getElementById('toLogin');

    let currentUser = null;

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
        currentUser = session?.user || null;
        updateUIForAuth();
    });

    // Auth State Listener
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        currentUser = session?.user || null;
        updateUIForAuth();
    });

    function updateUIForAuth() {
        if (currentUser) {
            // Logged In
            if (loginSection) loginSection.style.display = 'none';
            if (registerSection) registerSection.style.display = 'none';
            if (userInfo) {
                userInfo.style.display = 'block';
                userEmailDisplay.innerText = currentUser.email;
            }
            if (authOverlay) authOverlay.style.display = 'none';
            if (submitCommentBtn) submitCommentBtn.disabled = false;
            if (navLogoutLi) navLogoutLi.style.display = 'block';
        } else {
            // Logged Out
            if (userInfo) userInfo.style.display = 'none';
            if (loginSection) loginSection.style.display = 'block';
            if (registerSection) registerSection.style.display = 'none';
            if (authOverlay) authOverlay.style.display = 'flex';
            if (submitCommentBtn) submitCommentBtn.disabled = true;
            if (navLogoutLi) navLogoutLi.style.display = 'none';
        }
    }

    // Switch between Login and Register
    if (toRegister) toRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginSection.style.display = 'none';
        registerSection.style.display = 'block';
    });

    if (toLogin) toLogin.addEventListener('click', (e) => {
        e.preventDefault();
        loginSection.style.display = 'block';
        registerSection.style.display = 'none';
    });

    // Handle Registration
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('r-email').value;
            const password = document.getElementById('r-password').value;
            const confirmPassword = document.getElementById('r-confirm-password').value;
            const btn = registerForm.querySelector('button');
            
            // Password confirmation check
            if (password !== confirmPassword) {
                registerStatus.innerText = 'Las contraseñas no coinciden.';
                registerStatus.className = 'form-status error';
                return;
            }

            btn.disabled = true;
            btn.innerText = 'Registrando...';
            registerStatus.className = 'form-status';
            registerStatus.innerText = '';

            const { error } = await supabase.auth.signUp({ 
                email, 
                password 
            });

            if (error) {
                registerStatus.innerText = error.message;
                registerStatus.className = 'form-status error';
            } else {
                registerStatus.innerText = '¡Registro exitoso! Por favor verifica tu correo e inicia sesión.';
                registerStatus.className = 'form-status success';
                registerForm.reset();
            }
            btn.disabled = false;
            btn.innerText = 'Registrarse';
        });
    }

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('l-email').value;
            const password = document.getElementById('l-password').value;
            const btn = loginForm.querySelector('button');

            btn.disabled = true;
            btn.innerText = 'Entrando...';
            loginStatus.className = 'form-status';
            loginStatus.innerText = '';

            const { error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                loginStatus.innerText = 'Error: ' + error.message;
                loginStatus.className = 'form-status error';
            } else {
                loginStatus.innerText = '¡Sesión iniciada!';
                loginStatus.className = 'form-status success';
                loginForm.reset();
            }
            btn.disabled = false;
            btn.innerText = 'Entrar';
        });
    }

    // Toggle Password Visibility Logic
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', () => {
            const targetId = icon.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // Handle Logout
    const handleLogout = async (e) => {
        if (e) e.preventDefault();
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error logging out:', error);
    };

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (navLogout) navLogout.addEventListener('click', handleLogout);

    // Comments Logic
    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!currentUser) return;

            const message = document.getElementById('c-mensaje').value.trim();

            if (!message) return;

            submitCommentBtn.disabled = true;
            submitCommentBtn.innerText = 'Publicando...';
            commentStatus.className = 'form-status';
            commentStatus.innerText = '';

            try {
                // Updated to use user_email and comment_text as per requirements
                const { error } = await supabase
                    .from('comments')
                    .insert([{ 
                        user_email: currentUser.email, 
                        comment_text: message 
                    }]);

                if (error) throw error;

                commentStatus.innerText = '¡Comentario publicado con éxito!';
                commentStatus.className = 'form-status success';
                commentForm.reset();
                fetchComments(); // Refresh list
            } catch (error) {
                console.error('Error posting comment:', error);
                commentStatus.innerText = 'Hubo un error al publicar el comentario.';
                commentStatus.className = 'form-status error';
            } finally {
                submitCommentBtn.disabled = false;
                submitCommentBtn.innerText = 'Publicar Comentario';
            }
        });
    }

    async function fetchComments() {
        try {
            const { data, error } = await supabase
                .from('comments')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data.length === 0) {
                commentsList.innerHTML = '<p class="loading-msg">No hay comentarios aún. ¡Sé el primero en comentar!</p>';
                return;
            }

            commentsList.innerHTML = data.map(comment => {
                // Fallback for old data: use 'name' if 'user_email' is missing, etc.
                const author = comment.user_email || comment.name || 'Usuario Anónimo';
                const text = comment.comment_text || comment.content || '';
                
                return `
                    <div class="comment-item">
                        <div class="comment-header">
                            <span class="comment-name">${escapeHtml(author)}</span>
                            <span class="comment-date">${new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                        <p class="comment-content">${escapeHtml(text)}</p>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Error fetching comments:', error);
            commentsList.innerHTML = '<p class="loading-msg error">Error al cargar los comentarios.</p>';
        }
    }

    // Initial fetch
    fetchComments();

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});

// Adding revealed styles to the head tag (CSS equivalent)
const style = document.createElement('style');
style.textContent = `
    .revealed {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(style);

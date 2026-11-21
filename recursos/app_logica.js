(function () {
    const DATOS = window.CORAZON_RD_DATOS || {};
    const ADMIN_DEFECTO = DATOS.adminDefecto || {
        usuario: "fafi_admin",
        cedula: "000-0000000-0",
        provincia: "Distrito Nacional",
        password: "",
        comunidad: "Administración Central CORAZÓN RD",
        email: "admin@corazonrd.org",
        rol: "admin"
    };

    const CLAVES = {
        usuarios: "corazon_rd_usuarios_v1",
        sesion: "corazon_rd_sesion_v1",
        noticias: "corazon_rd_noticias_v1",
        mensajesAdmin: "corazon_rd_mensajes_admin_v1",
        reacciones: "corazon_rd_reacciones_v1"
    };

    const EMOJIS_DISPONIBLES = ["🔥", "❤️", "💪", "👏", "😡", "🙌"];

    const limpiarCedula = (val) => String(val || "").replace(/[^0-9]/g, "").trim();

    function leerStorage(clave, fallback) {
        try {
            const raw = localStorage.getItem(clave);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function guardarStorage(clave, valor) {
        try {
            localStorage.setItem(clave, JSON.stringify(valor));
        } catch (e) {}
    }

    function escaparHtml(texto) {
        return String(texto || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    let usuarios = leerStorage(CLAVES.usuarios, []);
    if (!Array.isArray(usuarios)) usuarios = [];

    let sesion = leerStorage(CLAVES.sesion, null);
    let noticias = leerStorage(CLAVES.noticias, null);
    if (!Array.isArray(noticias)) {
        noticias = Array.isArray(DATOS.noticiasDefecto) ? DATOS.noticiasDefecto : [];
        guardarStorage(CLAVES.noticias, noticias);
    }

    let mensajesAdmin = leerStorage(CLAVES.mensajesAdmin, []);
    if (!Array.isArray(mensajesAdmin)) mensajesAdmin = [];

    let reaccionesData = leerStorage(CLAVES.reacciones, {});
    if (!reaccionesData || typeof reaccionesData !== "object") reaccionesData = {};

    let imagenPubDataUrl = "";
    let imagenAdminDataUrl = "";

    function obtenerReaccionItem(itemId) {
        if (!reaccionesData[itemId]) {
            const conteos = {};
            EMOJIS_DISPONIBLES.forEach((em) => {
                conteos[em] = 0;
            });
            conteos["🔥"] = 3;
            reaccionesData[itemId] = {
                conteos,
                seleccionado: null
            };
        }
        return reaccionesData[itemId];
    }

    function construirBloqueReacciones(itemId) {
        const estado = obtenerReaccionItem(itemId);
        const emojiPrincipal = estado.seleccionado || "🔥";
        const totalPrincipal = estado.conteos[emojiPrincipal] || 0;
        const tieneActiva = Boolean(estado.seleccionado);

        const opcionesHtml = EMOJIS_DISPONIBLES.map((em) => {
            const cant = estado.conteos[em] || 0;
            const activaClase = estado.seleccionado === em ? "activa" : "";
            return `
                <button type="button" class="btn-reaccion-opcion ${activaClase}" data-reaccion-item="${escaparHtml(itemId)}" data-emoji="${em}" title="Reaccionar con ${em}">
                    <span class="reaccion-emoji">${em}</span>
                    <span class="reaccion-contador">${cant}</span>
                </button>
            `;
        }).join("");

        return `
            <div class="reacciones-bloque" data-reacciones-contenedor="${escaparHtml(itemId)}">
                <div class="reacciones-fila-principal">
                    <button type="button" class="btn-reaccion-principal ${tieneActiva ? "activa" : ""}" data-reaccion-principal="${escaparHtml(itemId)}" data-emoji="${emojiPrincipal}">
                        <span class="emoji-principal">${emojiPrincipal}</span>
                        <span class="cantidad-principal">${totalPrincipal}</span>
                    </button>
                    <button type="button" class="btn-abrir-emojis" data-toggle-emojis="${escaparHtml(itemId)}" aria-label="Elegir emoji">
                        +
                    </button>
                </div>
                <div class="reacciones-desplegable">
                    ${opcionesHtml}
                </div>
            </div>
        `;
    }

    function animarEmojiEnBoton(btnEl) {
        if (!btnEl) return;
        const emojiSpan = btnEl.querySelector(".emoji-principal, .reaccion-emoji") || btnEl;
        emojiSpan.classList.remove("emoji-animado-click");
        void emojiSpan.offsetWidth;
        emojiSpan.classList.add("emoji-animado-click");
    }

    function esAdmin() {
        return Boolean(sesion && sesion.rol === "admin");
    }

    function estaAutenticado() {
        return Boolean(sesion && sesion.usuario);
    }

    function abrirModal(idModal) {
        const modal = document.getElementById(idModal);
        if (modal) modal.classList.add("abierto");
    }

    function cerrarModal(idModal) {
        const modal = document.getElementById(idModal);
        if (modal) modal.classList.remove("abierto");
    }

    function actualizarEstadoSesionUI() {
        const badge = document.getElementById("badge-usuario-activo");
        const btnLogin = document.getElementById("btn-top-login");
        const btnCrear = document.getElementById("btn-top-crear");
        const btnCerrar = document.getElementById("btn-top-cerrar");
        const textoEstado = document.getElementById("texto-estado-sesion");
        const panelAdmin = document.getElementById("panel-admin-blog");
        const avisoAdmin = document.getElementById("aviso-bloqueo-admin");

        const camposAdmin = [
            document.getElementById("admin-remitente"),
            document.getElementById("admin-tipo-evento"),
            document.getElementById("admin-sector"),
            document.getElementById("admin-asunto"),
            document.getElementById("admin-detalle"),
            document.getElementById("btn-enviar-admin"),
            document.getElementById("btn-subir-admin-img")
        ];

        if (estaAutenticado()) {
            if (badge) {
                badge.style.display = "inline-block";
                badge.textContent = esAdmin()
                    ? `ADMIN: ${sesion.usuario}`
                    : `@${sesion.usuario}`;
                badge.classList.toggle("es-admin", esAdmin());
            }
            if (btnLogin) btnLogin.style.display = "none";
            if (btnCrear) btnCrear.style.display = "none";
            if (btnCerrar) btnCerrar.style.display = "inline-block";

            if (textoEstado) {
                const provInfo = sesion.provincia ? ` (${sesion.provincia})` : "";
                textoEstado.textContent = esAdmin()
                    ? `Sesión activa como administrador (${sesion.usuario}). Ya puedes publicar noticias, comentar y gestionar mensajes.`
                    : `Sesión iniciada como @${sesion.usuario}${provInfo}. Ya puedes comentar y enviar mensajes a los administradores.`;
            }

            if (panelAdmin) {
                panelAdmin.classList.toggle("visible", esAdmin());
            }

            if (avisoAdmin) {
                avisoAdmin.textContent = "Cuenta verificada: completa los detalles del evento para enviarlo a los administradores.";
            }

            camposAdmin.forEach((el) => {
                if (el) el.disabled = false;
            });

            const remitenteInput = document.getElementById("admin-remitente");
            if (remitenteInput && !remitenteInput.value.trim()) {
                remitenteInput.value = sesion.usuario;
            }
        } else {
            if (badge) {
                badge.style.display = "none";
                badge.textContent = "";
                badge.classList.remove("es-admin");
            }
            if (btnLogin) btnLogin.style.display = "inline-block";
            if (btnCrear) btnCrear.style.display = "inline-block";
            if (btnCerrar) btnCerrar.style.display = "none";

            if (textoEstado) {
                textoEstado.textContent = "Modo visitante: puedes ver y reaccionar a las publicaciones, pero debes iniciar sesión con tu cédula o crear tu cuenta para comentar o enviar mensajes.";
            }

            if (panelAdmin) {
                panelAdmin.classList.remove("visible");
            }

            if (avisoAdmin) {
                avisoAdmin.textContent = "Debes iniciar sesión con tu cédula o crear tu cuenta para enviar mensajes a los administradores.";
            }

            camposAdmin.forEach((el) => {
                if (el) el.disabled = true;
            });
        }

        renderProtestas();
        renderNoticias();
        renderHistorialAdmin();
    }

    function renderProtestas() {
        const contenedor = document.getElementById("protesta-contenedor");
        if (!contenedor) return;
        const items = Array.isArray(DATOS.protestasDefecto) ? DATOS.protestasDefecto : [];

        contenedor.innerHTML = items.map((p) => `
            <article class="card">
                <img src="${escaparHtml(p.imagen)}" alt="${escaparHtml(p.titulo)}">
                <div class="card-body">
                    <span>${escaparHtml(p.categoria)}</span>
                    <h3>${escaparHtml(p.titulo)}</h3>
                    ${construirBloqueReacciones(p.id)}
                </div>
            </article>
        `).join("");
    }

    function renderNoticias() {
        const contenedor = document.getElementById("noticias-contenedor");
        if (!contenedor) return;

        if (!noticias.length) {
            contenedor.innerHTML = `<div class="noticia-card"><div class="noticia-cuerpo"><p class="noticia-texto">Aún no hay publicaciones en el blog.</p></div></div>`;
            return;
        }

        contenedor.innerHTML = noticias.map((n) => {
            const comentariosHtml = (Array.isArray(n.comentarios) ? n.comentarios : []).map((c) => `
                <div class="comentario-item">
                    <strong>@${escaparHtml(c.autor)}</strong>
                    <p>${escaparHtml(c.texto)}</p>
                </div>
            `).join("");

            const formComentarioHtml = estaAutenticado()
                ? `
                    <form class="comentario-form" data-noticia-id="${escaparHtml(n.id)}">
                        <input type="text" name="comentario" required placeholder="Escribe tu comentario como @${escaparHtml(sesion.usuario)}...">
                        <button type="submit" class="btn btn-pequeno">Comentar</button>
                    </form>
                `
                : `<p class="aviso-solo-lectura">Inicia sesión con tu cédula o crea tu cuenta para comentar.</p>`;

            const btnEliminarNoticia = esAdmin()
                ? `<button type="button" class="btn btn-pequeno btn-eliminar-noticia" data-eliminar-noticia="${escaparHtml(n.id)}" style="margin-top:10px;">Eliminar publicación</button>`
                : "";

            const imgHtml = n.imagen
                ? `<img src="${escaparHtml(n.imagen)}" alt="${escaparHtml(n.titulo)}">`
                : "";

            return `
                <article class="noticia-card">
                    ${imgHtml}
                    <div class="noticia-cuerpo">
                        <div class="noticia-meta">${escaparHtml(n.categoria)} • Por ${escaparHtml(n.autor)} • ${escaparHtml(n.fecha)}</div>
                        <h3>${escaparHtml(n.titulo)}</h3>
                        <p class="noticia-texto">${escaparHtml(n.contenido)}</p>
                        ${construirBloqueReacciones(n.id)}
                        ${btnEliminarNoticia}
                        <div class="comentarios-area">
                            <h4>Comentarios</h4>
                            ${comentariosHtml || `<p style="font-size:0.88rem; color:#cccccc; margin-bottom:8px;">Sé el primero en comentar.</p>`}
                            ${formComentarioHtml}
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    }

    function renderHistorialAdmin() {
        const cont = document.getElementById("historial-mensajes-admin");
        if (!cont) return;

        if (!mensajesAdmin.length) {
            cont.innerHTML = "";
            return;
        }

        const visibles = esAdmin()
            ? mensajesAdmin
            : mensajesAdmin.filter((m) => sesion && m.autorCedula === sesion.cedula);

        if (!visibles.length) {
            cont.innerHTML = "";
            return;
        }

        cont.innerHTML = visibles.map((m) => {
            const imgAdjunta = m.imagen
                ? `<img src="${escaparHtml(m.imagen)}" alt="Evidencia del reporte">`
                : "";
            const provTexto = m.provincia ? ` • Provincia: ${escaparHtml(m.provincia)}` : "";
            const accionesAdmin = esAdmin()
                ? `
                    <div class="admin-msg-acciones">
                        <button type="button" class="btn btn-donar btn-pequeno btn-publicar-desde-msg" data-msg-id="${escaparHtml(m.id)}">Publicar en el Blog</button>
                        <button type="button" class="btn btn-pequeno btn-borrar-msg" data-msg-id="${escaparHtml(m.id)}">Borrar mensaje</button>
                    </div>
                `
                : "";

            return `
                <div class="admin-msg-item">
                    <strong>${escaparHtml(m.tipoEvento)} • De: ${escaparHtml(m.remitente)} • Sector: ${escaparHtml(m.sector)}${provTexto} • ${escaparHtml(m.fecha)}</strong>
                    <h4>${escaparHtml(m.asunto)}</h4>
                    <p>${escaparHtml(m.detalle)}</p>
                    ${imgAdjunta}
                    ${accionesAdmin}
                </div>
            `;
        }).join("");
    }

    function leerArchivoComoDataUrl(file, callback) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => callback(String(reader.result || ""));
        reader.readAsDataURL(file);
    }

    document.addEventListener("DOMContentLoaded", () => {
        renderProtestas();
        renderNoticias();
        renderHistorialAdmin();
        actualizarEstadoSesionUI();

        // Menú lateral: marcar enlace activo
        const navLinks = document.querySelectorAll("#menu-principal-6 a");
        navLinks.forEach((link) => {
            link.addEventListener("click", () => {
                navLinks.forEach((a) => a.classList.remove("active"));
                link.classList.add("active");
            });
        });

        // Botones de acceso y cierre de sesión
        document.getElementById("btn-top-login")?.addEventListener("click", () => abrirModal("modal-login"));
        document.getElementById("btn-blog-login")?.addEventListener("click", () => abrirModal("modal-login"));
        document.getElementById("btn-top-crear")?.addEventListener("click", () => abrirModal("modal-crear-usuario"));
        document.getElementById("btn-blog-crear")?.addEventListener("click", () => abrirModal("modal-crear-usuario"));

        document.getElementById("btn-top-cerrar")?.addEventListener("click", () => {
            sesion = null;
            guardarStorage(CLAVES.sesion, null);
            actualizarEstadoSesionUI();
        });

        document.querySelectorAll("[data-cerrar-modal]").forEach((btn) => {
            btn.addEventListener("click", () => cerrarModal(btn.getAttribute("data-cerrar-modal")));
        });

        document.querySelectorAll(".modal-overlay").forEach((overlay) => {
            overlay.addEventListener("click", (e) => {
                if (e.target === overlay) overlay.classList.remove("abierto");
            });
        });

        // Registro de usuario (Nombre de usuario, Cédula, Provincia uno bajo otro)
        const formRegistro = document.getElementById("form-registro-usuario");
        formRegistro?.addEventListener("submit", (e) => {
            e.preventDefault();
            const msgEl = document.getElementById("msg-registro");
            const usuario = (document.getElementById("reg-usuario")?.value || "").trim();
            const cedulaRaw = (document.getElementById("reg-cedula")?.value || "").trim();
            const cedulaLimpia = limpiarCedula(cedulaRaw);
            const provincia = (document.getElementById("reg-provincia")?.value || "").trim();
            const comunidad = (document.getElementById("reg-comunidad")?.value || "").trim();
            const email = (document.getElementById("reg-email")?.value || "").trim();
            const password = document.getElementById("reg-password")?.value || "";
            const confirmar = document.getElementById("reg-confirmar-password")?.value || "";

            if (!usuario || !cedulaLimpia || !provincia || !comunidad || !email || !password) {
                if (msgEl) msgEl.textContent = "Completa todos los campos obligatorios.";
                return;
            }

            if (cedulaLimpia.length !== 11) {
                if (msgEl) msgEl.textContent = "Ingresa una cédula válida de 11 dígitos.";
                return;
            }

            if (password !== confirmar) {
                if (msgEl) msgEl.textContent = "Las contraseñas no coinciden.";
                return;
            }

            const existeCedula =
                usuarios.some((u) => limpiarCedula(u.cedula) === cedulaLimpia) ||
                limpiarCedula(ADMIN_DEFECTO.cedula) === cedulaLimpia;

            if (existeCedula) {
                if (msgEl) msgEl.textContent = "Ya existe una cuenta registrada con esa cédula.";
                return;
            }

            const nuevoUsuario = {
                usuario,
                cedula: cedulaRaw,
                provincia,
                comunidad,
                email,
                password,
                rol: "usuario"
            };

            usuarios.push(nuevoUsuario);
            guardarStorage(CLAVES.usuarios, usuarios);

            sesion = {
                usuario: nuevoUsuario.usuario,
                cedula: nuevoUsuario.cedula,
                provincia: nuevoUsuario.provincia,
                comunidad: nuevoUsuario.comunidad,
                rol: "usuario"
            };
            guardarStorage(CLAVES.sesion, sesion);

            if (msgEl) msgEl.textContent = "¡Cuenta creada! Ya iniciaste sesión.";
            formRegistro.reset();
            actualizarEstadoSesionUI();
            setTimeout(() => cerrarModal("modal-crear-usuario"), 700);
        });

        // Iniciar sesión SIEMPRE por campo de Cédula
        const formLogin = document.getElementById("form-login-usuario");
        formLogin?.addEventListener("submit", (e) => {
            e.preventDefault();
            const msgEl = document.getElementById("msg-login");
            const cedulaIngresada = limpiarCedula(document.getElementById("login-usuario")?.value);
            const passwordIngresada = document.getElementById("login-password")?.value || "";

            if (!cedulaIngresada || !passwordIngresada) {
                if (msgEl) msgEl.textContent = "Ingresa tu cédula y contraseña.";
                return;
            }

            if (
                limpiarCedula(ADMIN_DEFECTO.cedula) === cedulaIngresada &&
                passwordIngresada === ADMIN_DEFECTO.password
            ) {
                sesion = {
                    usuario: ADMIN_DEFECTO.usuario,
                    cedula: ADMIN_DEFECTO.cedula,
                    provincia: ADMIN_DEFECTO.provincia,
                    comunidad: ADMIN_DEFECTO.comunidad,
                    rol: "admin"
                };
                guardarStorage(CLAVES.sesion, sesion);
                if (msgEl) msgEl.textContent = "Sesión de administrador iniciada.";
                formLogin.reset();
                actualizarEstadoSesionUI();
                setTimeout(() => cerrarModal("modal-login"), 600);
                return;
            }

            const encontrado = usuarios.find(
                (u) => limpiarCedula(u.cedula) === cedulaIngresada && u.password === passwordIngresada
            );

            if (!encontrado) {
                if (msgEl) msgEl.textContent = "Cédula o contraseña incorrecta.";
                return;
            }

            sesion = {
                usuario: encontrado.usuario,
                cedula: encontrado.cedula,
                provincia: encontrado.provincia || "",
                comunidad: encontrado.comunidad || "",
                rol: encontrado.rol || "usuario"
            };
            guardarStorage(CLAVES.sesion, sesion);
            if (msgEl) msgEl.textContent = `Bienvenido, @${encontrado.usuario}.`;
            formLogin.reset();
            actualizarEstadoSesionUI();
            setTimeout(() => cerrarModal("modal-login"), 600);
        });

        // Subida de imagen en Blog (Admin)
        const inputPubImg = document.getElementById("input-archivo-imagen");
        const btnSubirPubImg = document.getElementById("btn-subir-imagen-archivo");
        const btnQuitarPubImg = document.getElementById("btn-quitar-pub-img");
        const vistaPubImg = document.getElementById("vista-previa-pub-img");
        const nombrePubImg = document.getElementById("nombre-archivo-imagen");

        btnSubirPubImg?.addEventListener("click", () => inputPubImg?.click());
        inputPubImg?.addEventListener("change", () => {
            const archivo = inputPubImg.files && inputPubImg.files[0];
            if (!archivo) return;
            leerArchivoComoDataUrl(archivo, (dataUrl) => {
                imagenPubDataUrl = dataUrl;
                if (nombrePubImg) nombrePubImg.textContent = archivo.name;
                if (vistaPubImg) {
                    vistaPubImg.src = dataUrl;
                    vistaPubImg.classList.add("visible");
                }
                if (btnQuitarPubImg) btnQuitarPubImg.style.display = "inline-block";
            });
        });

        btnQuitarPubImg?.addEventListener("click", () => {
            imagenPubDataUrl = "";
            if (inputPubImg) inputPubImg.value = "";
            if (nombrePubImg) nombrePubImg.textContent = "";
            if (vistaPubImg) {
                vistaPubImg.src = "";
                vistaPubImg.classList.remove("visible");
            }
            btnQuitarPubImg.style.display = "none";
        });

        // Publicar noticia (solo admin)
        const formPublicar = document.getElementById("form-publicar-noticia");
        formPublicar?.addEventListener("submit", (e) => {
            e.preventDefault();
            if (!esAdmin()) return;

            const titulo = (document.getElementById("pub-titulo")?.value || "").trim();
            const categoria = (document.getElementById("pub-categoria")?.value || "").trim();
            const imgUrlInput = (document.getElementById("pub-imagen")?.value || "").trim();
            const contenido = (document.getElementById("pub-contenido")?.value || "").trim();
            const msgPub = document.getElementById("msg-pub-admin");

            if (!titulo || !categoria || !contenido) return;

            const nuevaNoticia = {
                id: "noticia-" + Date.now(),
                titulo,
                categoria,
                autor: sesion.usuario,
                fecha: "Ahora",
                imagen: imagenPubDataUrl || imgUrlInput || "",
                contenido,
                comentarios: []
            };

            noticias.unshift(nuevaNoticia);
            guardarStorage(CLAVES.noticias, noticias);
            formPublicar.reset();
            btnQuitarPubImg?.click();
            if (msgPub) msgPub.textContent = "Publicación agregada al blog.";
            renderNoticias();
        });

        // Subida de imagen en Mensajes Admin
        const inputAdminImg = document.getElementById("input-archivo-admin-img");
        const btnSubirAdminImg = document.getElementById("btn-subir-admin-img");
        const btnQuitarAdminImg = document.getElementById("btn-quitar-admin-img");
        const vistaAdminImg = document.getElementById("vista-previa-admin-img");
        const nombreAdminImg = document.getElementById("nombre-archivo-admin-img");

        btnSubirAdminImg?.addEventListener("click", () => inputAdminImg?.click());
        inputAdminImg?.addEventListener("change", () => {
            const archivo = inputAdminImg.files && inputAdminImg.files[0];
            if (!archivo) return;
            leerArchivoComoDataUrl(archivo, (dataUrl) => {
                imagenAdminDataUrl = dataUrl;
                if (nombreAdminImg) nombreAdminImg.textContent = archivo.name;
                if (vistaAdminImg) {
                    vistaAdminImg.src = dataUrl;
                    vistaAdminImg.classList.add("visible");
                }
                if (btnQuitarAdminImg) btnQuitarAdminImg.style.display = "inline-block";
            });
        });

        btnQuitarAdminImg?.addEventListener("click", () => {
            imagenAdminDataUrl = "";
            if (inputAdminImg) inputAdminImg.value = "";
            if (nombreAdminImg) nombreAdminImg.textContent = "";
            if (vistaAdminImg) {
                vistaAdminImg.src = "";
                vistaAdminImg.classList.remove("visible");
            }
            btnQuitarAdminImg.style.display = "none";
        });

        // Enviar mensaje a administradores
        const formMsgAdmin = document.getElementById("form-mensaje-admin");
        formMsgAdmin?.addEventListener("submit", (e) => {
            e.preventDefault();
            const feedbackEl = document.getElementById("msg-admin-feedback");
            if (!estaAutenticado()) {
                if (feedbackEl) feedbackEl.textContent = "Debes iniciar sesión con tu cédula para enviar un mensaje.";
                return;
            }

            const remitente = (document.getElementById("admin-remitente")?.value || "").trim();
            const tipoEvento = document.getElementById("admin-tipo-evento")?.value || "Evento Importante";
            const sector = (document.getElementById("admin-sector")?.value || "").trim();
            const asunto = (document.getElementById("admin-asunto")?.value || "").trim();
            const detalle = (document.getElementById("admin-detalle")?.value || "").trim();

            if (!remitente || !sector || !asunto || !detalle) return;

            mensajesAdmin.unshift({
                id: "msg-" + Date.now(),
                remitente,
                autorCedula: sesion.cedula,
                provincia: sesion.provincia || "",
                tipoEvento,
                sector,
                asunto,
                detalle,
                imagen: imagenAdminDataUrl || "",
                fecha: "Ahora"
            });

            guardarStorage(CLAVES.mensajesAdmin, mensajesAdmin);
            formMsgAdmin.reset();
            btnQuitarAdminImg?.click();
            if (feedbackEl) feedbackEl.textContent = "Mensaje enviado a los administradores.";
            renderHistorialAdmin();
        });

        // Delegación de clics para reacciones, donaciones y acciones de admin
        document.addEventListener("click", (e) => {
            // Toggle selector de emojis
            const btnToggleEmojis = e.target.closest("[data-toggle-emojis]");
            if (btnToggleEmojis) {
                const itemId = btnToggleEmojis.getAttribute("data-toggle-emojis");
                const bloque = document.querySelector(`[data-reacciones-contenedor="${itemId}"]`);
                if (bloque) bloque.classList.toggle("abierto");
                return;
            }

            // Reacción principal rápida
            const btnPrincipal = e.target.closest("[data-reaccion-principal]");
            if (btnPrincipal) {
                const itemId = btnPrincipal.getAttribute("data-reaccion-principal");
                const emoji = btnPrincipal.getAttribute("data-emoji") || "🔥";
                const estado = obtenerReaccionItem(itemId);

                if (estado.seleccionado === emoji) {
                    estado.conteos[emoji] = Math.max(0, (estado.conteos[emoji] || 0) - 1);
                    estado.seleccionado = null;
                } else {
                    if (estado.seleccionado) {
                        estado.conteos[estado.seleccionado] = Math.max(0, (estado.conteos[estado.seleccionado] || 0) - 1);
                    }
                    estado.conteos[emoji] = (estado.conteos[emoji] || 0) + 1;
                    estado.seleccionado = emoji;
                }

                guardarStorage(CLAVES.reacciones, reaccionesData);
                animarEmojiEnBoton(btnPrincipal);
                renderProtestas();
                renderNoticias();
                return;
            }

            // Reacción desde opciones desplegables
            const btnOpcion = e.target.closest("[data-reaccion-item][data-emoji]");
            if (btnOpcion) {
                const itemId = btnOpcion.getAttribute("data-reaccion-item");
                const emoji = btnOpcion.getAttribute("data-emoji");
                const estado = obtenerReaccionItem(itemId);

                if (estado.seleccionado === emoji) {
                    estado.conteos[emoji] = Math.max(0, (estado.conteos[emoji] || 0) - 1);
                    estado.seleccionado = null;
                } else {
                    if (estado.seleccionado) {
                        estado.conteos[estado.seleccionado] = Math.max(0, (estado.conteos[estado.seleccionado] || 0) - 1);
                    }
                    estado.conteos[emoji] = (estado.conteos[emoji] || 0) + 1;
                    estado.seleccionado = emoji;
                }

                guardarStorage(CLAVES.reacciones, reaccionesData);
                animarEmojiEnBoton(btnOpcion);
                renderProtestas();
                renderNoticias();
                return;
            }

            // Botón Quiero Donar
            const btnDonar = e.target.closest("#btn-quiero-donar");
            if (btnDonar) {
                const panel = document.getElementById("panel-cuentas-donacion");
                if (panel) {
                    const estaVisible = panel.style.display !== "none";
                    panel.style.display = estaVisible ? "none" : "grid";
                    btnDonar.setAttribute("aria-expanded", String(!estaVisible));
                }
                return;
            }

            // Copiar cuenta
            const btnCopiar = e.target.closest(".btn-copiar-cuenta");
            if (btnCopiar) {
                const texto = btnCopiar.getAttribute("data-copiar") || "";
                if (navigator.clipboard && texto) {
                    navigator.clipboard.writeText(texto).catch(() => {});
                }
                const original = btnCopiar.textContent;
                btnCopiar.textContent = "¡Copiado!";
                setTimeout(() => {
                    btnCopiar.textContent = original;
                }, 1200);
                return;
            }

            // Eliminar noticia (admin)
            const btnEliminarNoticia = e.target.closest(".btn-eliminar-noticia");
            if (btnEliminarNoticia && esAdmin()) {
                const idBorrar = btnEliminarNoticia.getAttribute("data-eliminar-noticia");
                noticias = noticias.filter((n) => n.id !== idBorrar);
                guardarStorage(CLAVES.noticias, noticias);
                renderNoticias();
                return;
            }

            // Publicar en blog desde mensaje admin
            const btnPublicarDesdeMsg = e.target.closest(".btn-publicar-desde-msg");
            if (btnPublicarDesdeMsg && esAdmin()) {
                const msgId = btnPublicarDesdeMsg.getAttribute("data-msg-id");
                const msgObj = mensajesAdmin.find((m) => m.id === msgId);
                if (msgObj) {
                    noticias.unshift({
                        id: "noticia-" + Date.now(),
                        titulo: msgObj.asunto,
                        categoria: msgObj.tipoEvento,
                        autor: sesion.usuario,
                        fecha: "Hoy",
                        imagen: msgObj.imagen || "",
                        contenido: `${msgObj.detalle} (Sector: ${msgObj.sector}${msgObj.provincia ? ", " + msgObj.provincia : ""})`,
                        comentarios: []
                    });
                    guardarStorage(CLAVES.noticias, noticias);
                    renderNoticias();
                }
                return;
            }

            // Borrar mensaje admin
            const btnBorrarMsg = e.target.closest(".btn-borrar-msg");
            if (btnBorrarMsg && esAdmin()) {
                const msgId = btnBorrarMsg.getAttribute("data-msg-id");
                mensajesAdmin = mensajesAdmin.filter((m) => m.id !== msgId);
                guardarStorage(CLAVES.mensajesAdmin, mensajesAdmin);
                renderHistorialAdmin();
            }
        });

        // Envío de comentarios en noticias
        document.addEventListener("submit", (e) => {
            const formCom = e.target.closest(".comentario-form");
            if (!formCom) return;
            e.preventDefault();
            if (!estaAutenticado()) return;

            const noticiaId = formCom.getAttribute("data-noticia-id");
            const inputCom = formCom.querySelector('input[name="comentario"]');
            const textoCom = (inputCom?.value || "").trim();
            if (!textoCom) return;

            const noticiaObj = noticias.find((n) => n.id === noticiaId);
            if (!noticiaObj) return;

            if (!Array.isArray(noticiaObj.comentarios)) noticiaObj.comentarios = [];
            noticiaObj.comentarios.push({
                autor: sesion.usuario,
                texto: textoCom
            });

            guardarStorage(CLAVES.noticias, noticias);
            renderNoticias();
        });
    });
})();

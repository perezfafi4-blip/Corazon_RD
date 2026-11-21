const REACCIONES_DESPLEGABLES = [
    { id: "like", emoji: "👍", nombre: "Me gusta" },
    { id: "love", emoji: "❤️", nombre: "Me encanta" },
    { id: "care", emoji: "🥰", nombre: "Me importa" },
    { id: "fire", emoji: "🔥", nombre: "Fuego" },
    { id: "wow", emoji: "😮", nombre: "Me asombra" },
    { id: "sad", emoji: "😢", nombre: "Me entristece" },
    { id: "angry", emoji: "😡", nombre: "Me enoja" }
];

function obtenerDatosReaccion(reaccionId) {
    return REACCIONES_DESPLEGABLES.find(r => r.id === reaccionId) || REACCIONES_DESPLEGABLES[0];
}

function escaparHtml(texto) {
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
    const cfg = window.CORAZON_RD_CONFIG || {};
    const ADMIN_DEFECTO = cfg.adminDefecto || {};
    const NOTICIAS_DEFECTO = Array.isArray(cfg.noticiasDefecto) ? cfg.noticiasDefecto : [];
    const PROTESTAS_DEFECTO = Array.isArray(cfg.protestasDefecto) ? cfg.protestasDefecto : [];
    const MENU_6_IDS = Array.isArray(cfg.menu6Ids) ? cfg.menu6Ids : [];

    if (cfg.patronUrl) {
        document.body.style.setProperty("--patron-url", `url("${cfg.patronUrl}")`);
    }

    // -----------------------------------------------------------------
    // CONTROLADOR UNIFICADO DE LOS 6 BOTONES DEL MENÚ (COMO 1 SOLO)
    // -----------------------------------------------------------------
    const menu6Contenedor = document.getElementById("menu-principal-6");
    const navLinks = menu6Contenedor ? Array.from(menu6Contenedor.querySelectorAll("a[data-menu-id]")) : [];
    const seccionesMenu6 = MENU_6_IDS.map(id => document.getElementById(id)).filter(Boolean);

    function activarBotonMenuUnificado(seccionId, desplazar) {
        if (!seccionId || !MENU_6_IDS.includes(seccionId)) return;
        navLinks.forEach(link => {
            link.classList.toggle("active", link.getAttribute("data-menu-id") === seccionId);
        });
        if (desplazar) {
            const target = document.getElementById(seccionId);
            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    }

    if (menu6Contenedor) {
        menu6Contenedor.addEventListener("click", (e) => {
            const link = e.target.closest("a[data-menu-id]");
            if (!link) return;
            e.preventDefault();
            activarBotonMenuUnificado(link.getAttribute("data-menu-id"), true);
        });
    }

    window.addEventListener("scroll", () => {
        let current = "";
        seccionesMenu6.forEach(section => {
            if (window.pageYOffset >= (section.offsetTop - 200)) {
                current = section.getAttribute("id");
            }
        });
        if (current) {
            activarBotonMenuUnificado(current, false);
        }
    });

    // -----------------------------------------------------------------
    // SESIÓN Y MODALES
    // -----------------------------------------------------------------
    const modalLogin = document.getElementById("modal-login");
    const modalCrear = document.getElementById("modal-crear-usuario");
    const btnTopLogin = document.getElementById("btn-top-login");
    const btnTopCrear = document.getElementById("btn-top-crear");
    const btnTopCerrar = document.getElementById("btn-top-cerrar");
    const badgeUsuarioActivo = document.getElementById("badge-usuario-activo");
    const btnBlogLogin = document.getElementById("btn-blog-login");
    const btnBlogCrear = document.getElementById("btn-blog-crear");
    const msgRegistro = document.getElementById("msg-registro");
    const msgLogin = document.getElementById("msg-login");

    function abrirModal(modal) {
        if (!modal) return;
        if (msgLogin) msgLogin.textContent = "";
        if (msgRegistro) msgRegistro.textContent = "";
        modal.classList.add("abierto");
    }

    function cerrarModales() {
        if (modalLogin) modalLogin.classList.remove("abierto");
        if (modalCrear) modalCrear.classList.remove("abierto");
    }

    function irAPaginaPrincipal() {
        cerrarModales();
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (window.location.hash !== "#inicio") {
            window.location.hash = "#inicio";
        }
    }

    if (btnTopLogin) btnTopLogin.addEventListener("click", () => abrirModal(modalLogin));
    if (btnTopCrear) btnTopCrear.addEventListener("click", () => abrirModal(modalCrear));
    if (btnBlogLogin) btnBlogLogin.addEventListener("click", () => abrirModal(modalLogin));
    if (btnBlogCrear) btnBlogCrear.addEventListener("click", () => abrirModal(modalCrear));

    document.querySelectorAll("[data-cerrar-modal]").forEach(btn => {
        btn.addEventListener("click", () => {
            const objetivo = document.getElementById(btn.getAttribute("data-cerrar-modal"));
            if (objetivo) objetivo.classList.remove("abierto");
        });
    });

    [modalLogin, modalCrear].forEach(modal => {
        if (!modal) return;
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.classList.remove("abierto");
        });
    });

    const CLAVE_USUARIOS = "corazon_rd_usuarios_v2";
    const CLAVE_SESION = "corazon_rd_sesion_activa";
    const CLAVE_NOTICIAS = "corazon_rd_noticias_v2";
    const CLAVE_MENSAJES_ADMIN = "corazon_rd_mensajes_admin_v2";
    const CLAVE_REACCIONES = "corazon_rd_reacciones_v4";

    function obtenerUsuarios() {
        let lista = [];
        try {
            lista = JSON.parse(localStorage.getItem(CLAVE_USUARIOS)) || [];
        } catch {
            lista = [];
        }
        if (ADMIN_DEFECTO.usuario) {
            const tieneAdmin = lista.some(u => u.usuario && u.usuario.toLowerCase() === ADMIN_DEFECTO.usuario.toLowerCase());
            if (!tieneAdmin) {
                lista.unshift(ADMIN_DEFECTO);
                localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(lista));
            }
        }
        return lista;
    }

    function guardarUsuarios(lista) {
        localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(lista));
    }

    function obtenerSesion() {
        return localStorage.getItem(CLAVE_SESION) || "";
    }

    function guardarSesion(usuario) {
        if (usuario) {
            localStorage.setItem(CLAVE_SESION, usuario);
        } else {
            localStorage.removeItem(CLAVE_SESION);
        }
    }

    function esUsuarioAdmin() {
        const actual = obtenerSesion().toLowerCase();
        if (!actual) return false;
        if (ADMIN_DEFECTO.usuario && actual === ADMIN_DEFECTO.usuario.toLowerCase()) return true;
        const u = obtenerUsuarios().find(item => item.usuario.toLowerCase() === actual);
        return Boolean(u && u.rol === "admin");
    }

    obtenerUsuarios();

    function obtenerNoticias() {
        try {
            const guardadas = JSON.parse(localStorage.getItem(CLAVE_NOTICIAS));
            if (Array.isArray(guardadas) && guardadas.length > 0) return guardadas;
        } catch {}
        localStorage.setItem(CLAVE_NOTICIAS, JSON.stringify(NOTICIAS_DEFECTO));
        return NOTICIAS_DEFECTO.slice();
    }

    function guardarNoticias(lista) {
        localStorage.setItem(CLAVE_NOTICIAS, JSON.stringify(lista));
    }

    function obtenerMensajesAdmin() {
        try {
            return JSON.parse(localStorage.getItem(CLAVE_MENSAJES_ADMIN)) || [];
        } catch {
            return [];
        }
    }

    function guardarMensajesAdmin(lista) {
        localStorage.setItem(CLAVE_MENSAJES_ADMIN, JSON.stringify(lista));
    }

    function obtenerEstadoReacciones() {
        try {
            const parsed = JSON.parse(localStorage.getItem(CLAVE_REACCIONES));
            if (parsed && typeof parsed === "object") {
                return {
                    conteos: parsed.conteos || {},
                    elegidos: parsed.elegidos || {},
                    usuarioActual: parsed.usuarioActual || {}
                };
            }
        } catch {}
        return { conteos: {}, elegidos: {}, usuarioActual: {} };
    }

    function guardarEstadoReacciones(estado) {
        localStorage.setItem(CLAVE_REACCIONES, JSON.stringify(estado));
    }

    // -----------------------------------------------------------------
    // REACCIONES CON EMOJIS
    // -----------------------------------------------------------------
    let menuReaccionesAbiertoId = null;

    function construirBarraReacciones(itemId, estadoReacciones, mantenerAbiertoId) {
        const conteosItem = (estadoReacciones.conteos && estadoReacciones.conteos[itemId]) || {};
        const elegidosItem = Array.isArray(estadoReacciones.elegidos && estadoReacciones.elegidos[itemId])
            ? estadoReacciones.elegidos[itemId]
            : [];
        const reaccionActivaUsuario = (estadoReacciones.usuarioActual && estadoReacciones.usuarioActual[itemId]) || "";
        const estaAbierto = mantenerAbiertoId === itemId ? "abierto" : "";
        const idsVisibles = elegidosItem.length > 0 ? elegidosItem : ["like"];

        const botonesVisiblesHtml = idsVisibles.map(idEmoji => {
            const info = obtenerDatosReaccion(idEmoji);
            const cantidad = conteosItem[idEmoji] || 0;
            const esActiva = reaccionActivaUsuario === idEmoji ? "activa" : "";
            return `
                <button type="button"
                    class="btn-reaccion-principal ${esActiva}"
                    data-principal-item-id="${escaparHtml(itemId)}"
                    data-reaccion-id="${escaparHtml(idEmoji)}"
                    title="${escaparHtml(info.nombre)}"
                    aria-label="${escaparHtml(info.nombre)}">
                    <span class="emoji-principal">${info.emoji}</span>
                    <span class="cantidad-principal">${cantidad}</span>
                </button>
            `;
        }).join("");

        const opcionesHtml = REACCIONES_DESPLEGABLES.map(r => {
            const cantidad = conteosItem[r.id] || 0;
            const claseActiva = reaccionActivaUsuario === r.id ? "activa" : "";
            return `
                <button type="button"
                    class="btn-reaccion-opcion ${claseActiva}"
                    data-item-id="${escaparHtml(itemId)}"
                    data-reaccion-id="${escaparHtml(r.id)}"
                    title="${escaparHtml(r.nombre)}"
                    aria-label="${escaparHtml(r.nombre)}">
                    <span class="reaccion-emoji">${r.emoji}</span>
                    <span class="reaccion-contador">${cantidad}</span>
                </button>
            `;
        }).join("");

        return `
            <div class="reacciones-bloque ${estaAbierto}" data-reaccion-wrapper="${escaparHtml(itemId)}">
                <div class="reacciones-fila-principal">
                    ${botonesVisiblesHtml}
                    <button type="button"
                        class="btn-abrir-emojis"
                        data-toggle-emojis="${escaparHtml(itemId)}"
                        title="Elegir otro emoji">+</button>
                </div>
                <div class="reacciones-desplegable" role="group" aria-label="Elegir reacción">
                    ${opcionesHtml}
                </div>
            </div>
        `;
    }

    function seleccionarReaccion(itemId, reaccionId) {
        const estado = obtenerEstadoReacciones();
        if (!estado.conteos[itemId]) estado.conteos[itemId] = {};
        if (!Array.isArray(estado.elegidos[itemId])) estado.elegidos[itemId] = [];

        const prevReaccion = estado.usuarioActual[itemId] || "";
        if (prevReaccion === reaccionId) {
            estado.conteos[itemId][reaccionId] = Math.max(0, (estado.conteos[itemId][reaccionId] || 0) - 1);
            delete estado.usuarioActual[itemId];
        } else {
            if (prevReaccion) {
                estado.conteos[itemId][prevReaccion] = Math.max(0, (estado.conteos[itemId][prevReaccion] || 0) - 1);
            }
            estado.conteos[itemId][reaccionId] = (estado.conteos[itemId][reaccionId] || 0) + 1;
            estado.usuarioActual[itemId] = reaccionId;
            if (!estado.elegidos[itemId].includes(reaccionId)) {
                estado.elegidos[itemId].push(reaccionId);
            }
        }

        guardarEstadoReacciones(estado);
        renderizarTodo(menuReaccionesAbiertoId);

        const wrapper = document.querySelector(`[data-reaccion-wrapper="${itemId}"]`);
        if (wrapper) {
            const btnEmoji = wrapper.querySelector(`.btn-reaccion-principal[data-reaccion-id="${reaccionId}"] .emoji-principal`);
            if (btnEmoji) {
                btnEmoji.classList.remove("emoji-animado-click");
                void btnEmoji.offsetWidth;
                btnEmoji.classList.add("emoji-animado-click");
            }
        }
    }

    function alternarDesplegable(itemId) {
        if (!itemId) return;
        menuReaccionesAbiertoId = (menuReaccionesAbiertoId === itemId) ? null : itemId;
        renderizarTodo(menuReaccionesAbiertoId);
    }

    document.addEventListener("click", (e) => {
        const btnToggle = e.target.closest(".btn-abrir-emojis");
        if (btnToggle) {
            e.preventDefault();
            e.stopPropagation();
            alternarDesplegable(btnToggle.getAttribute("data-toggle-emojis"));
            return;
        }

        const btnOpcion = e.target.closest(".btn-reaccion-opcion");
        if (btnOpcion) {
            e.preventDefault();
            e.stopPropagation();
            const itemId = btnOpcion.getAttribute("data-item-id");
            const reaccionId = btnOpcion.getAttribute("data-reaccion-id");
            if (itemId && reaccionId) {
                menuReaccionesAbiertoId = itemId;
                seleccionarReaccion(itemId, reaccionId);
            }
            return;
        }

        const btnPrincipal = e.target.closest(".btn-reaccion-principal");
        if (btnPrincipal) {
            e.preventDefault();
            e.stopPropagation();
            const itemId = btnPrincipal.getAttribute("data-principal-item-id");
            const reaccionId = btnPrincipal.getAttribute("data-reaccion-id");
            if (itemId && reaccionId) {
                menuReaccionesAbiertoId = itemId;
                seleccionarReaccion(itemId, reaccionId);
            }
            return;
        }

        if (!e.target.closest(".reacciones-bloque") && menuReaccionesAbiertoId !== null) {
            menuReaccionesAbiertoId = null;
            document.querySelectorAll(".reacciones-bloque.abierto").forEach(w => w.classList.remove("abierto"));
        }
    });

    // -----------------------------------------------------------------
    // RENDERIZADO DE PROTESTAS, BLOG Y MENSAJES ADMIN
    // -----------------------------------------------------------------
    const textoEstadoSesion = document.getElementById("texto-estado-sesion");
    const panelAdminBlog = document.getElementById("panel-admin-blog");
    const contenedorProtestas = document.getElementById("protesta-contenedor");
    const contenedorNoticias = document.getElementById("noticias-contenedor");
    const inputRemitenteAdmin = document.getElementById("admin-remitente");
    const inputTipoAdmin = document.getElementById("admin-tipo-evento");
    const inputSectorAdmin = document.getElementById("admin-sector");
    const inputAsuntoAdmin = document.getElementById("admin-asunto");
    const inputDetalleAdmin = document.getElementById("admin-detalle");
    const btnEnviarAdmin = document.getElementById("btn-enviar-admin");
    const btnSubirAdminImg = document.getElementById("btn-subir-admin-img");
    const avisoBloqueoAdmin = document.getElementById("aviso-bloqueo-admin");
    const msgAdminFeedback = document.getElementById("msg-admin-feedback");
    let mensajeOrigenId = "";
    let ultimaPublicacionId = "";
    let ultimaPublicacionTitulo = "";

    function renderizarProtestas(mantenerAbiertoId) {
        if (!contenedorProtestas) return;
        const estadoReacciones = obtenerEstadoReacciones();

        contenedorProtestas.innerHTML = PROTESTAS_DEFECTO.map((p, idx) => {
            const protestId = p.id || ("protesta-" + (idx + 1));
            return `
                <div class="card">
                    <img src="${escaparHtml(p.imagen)}" alt="${escaparHtml(p.titulo)}">
                    <div class="card-body">
                        <span>${escaparHtml(p.categoria)}</span>
                        <h3>${escaparHtml(p.titulo)}</h3>
                        ${construirBarraReacciones(protestId, estadoReacciones, mantenerAbiertoId)}
                    </div>
                </div>
            `;
        }).join("");
    }

    function renderizarNoticias(mantenerAbiertoId) {
        const usuarioActual = obtenerSesion();
        const adminActivo = esUsuarioAdmin();
        const noticias = obtenerNoticias();
        const estadoReacciones = obtenerEstadoReacciones();

        if (!contenedorNoticias) return;

        if (ultimaPublicacionId && !noticias.some(item => String(item.id) === String(ultimaPublicacionId))) {
            ultimaPublicacionId = "";
            ultimaPublicacionTitulo = "";
            ocultarBotonPublicada();
        }

        contenedorNoticias.innerHTML = noticias.map(n => {
            const comentariosHtml = (n.comentarios || []).map(c => `
                <div class="comentario-item">
                    <strong>@${escaparHtml(c.autor)}</strong>
                    <p>${escaparHtml(c.texto)}</p>
                </div>
            `).join("");

            const formularioComentarioHtml = usuarioActual
                ? `
                    <form class="comentario-form" data-noticia-id="${escaparHtml(n.id)}">
                        <input type="text" class="input-comentario" required placeholder="Escribe un comentario como @${escaparHtml(usuarioActual)}...">
                        <button type="submit" class="btn btn-donar btn-pequeno">Comentar</button>
                    </form>
                `
                : `
                    <p class="aviso-solo-lectura">
                        Inicia sesión o crea tu usuario para comentar. Sin registro solo puedes ver y reaccionar.
                    </p>
                `;

            const imgHtml = n.imagen ? `<img src="${escaparHtml(n.imagen)}" alt="${escaparHtml(n.titulo)}">` : "";
            const btnBorrarNoticia = adminActivo
                ? `<button type="button" class="btn btn-pequeno btn-borrar-noticia" data-borrar-noticia="${escaparHtml(n.id)}" style="margin-bottom:12px;">Eliminar publicación</button>`
                : "";

            return `
                <article class="noticia-card">
                    ${imgHtml}
                    <div class="noticia-cuerpo">
                        <div class="noticia-meta">${escaparHtml(n.categoria)} • ${escaparHtml(n.autor)} • ${escaparHtml(n.fecha)}</div>
                        <h3>${escaparHtml(n.titulo)}</h3>
                        <p class="noticia-texto">${escaparHtml(n.contenido)}</p>
                        ${btnBorrarNoticia}
                        <div>${construirBarraReacciones(n.id, estadoReacciones, mantenerAbiertoId)}</div>
                        <div class="comentarios-area">
                            <h4>Comentarios (${(n.comentarios || []).length})</h4>
                            ${comentariosHtml || '<p style="font-size:0.88rem; color:#bbbbbb; margin-bottom:8px;">Aún no hay comentarios.</p>'}
                            ${formularioComentarioHtml}
                        </div>
                    </div>
                </article>
            `;
        }).join("");

        document.querySelectorAll(".btn-borrar-noticia").forEach(btn => {
            btn.addEventListener("click", () => {
                if (!esUsuarioAdmin()) return;
                const idBorrar = btn.getAttribute("data-borrar-noticia");
                guardarNoticias(obtenerNoticias().filter(item => item.id !== idBorrar));
                renderizarTodo(null);
            });
        });

        document.querySelectorAll(".comentario-form").forEach(form => {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                const sesion = obtenerSesion();
                if (!sesion) {
                    abrirModal(modalLogin);
                    return;
                }
                const input = form.querySelector(".input-comentario");
                const texto = (input.value || "").trim();
                if (!texto) return;

                const noticiaId = form.getAttribute("data-noticia-id");
                const lista = obtenerNoticias();
                const objetivo = lista.find(item => item.id === noticiaId);
                if (objetivo) {
                    objetivo.comentarios = objetivo.comentarios || [];
                    objetivo.comentarios.push({ autor: sesion, texto });
                    guardarNoticias(lista);
                    input.value = "";
                    renderizarTodo(null);
                }
            });
        });
    }

    function renderizarTodo(mantenerAbiertoId) {
        const abiertoActual = mantenerAbiertoId !== undefined
            ? mantenerAbiertoId
            : menuReaccionesAbiertoId;
        renderizarProtestas(abiertoActual);
        renderizarNoticias(abiertoActual);
    }

    // Subir imagen en Blog
    const btnSubirImgArchivo = document.getElementById("btn-subir-imagen-archivo");
    const btnQuitarPubImg = document.getElementById("btn-quitar-pub-img");
    const inputArchivoImagen = document.getElementById("input-archivo-imagen");
    const nombreArchivoImagen = document.getElementById("nombre-archivo-imagen");
    const inputPubImagen = document.getElementById("pub-imagen");
    const vistaPreviaPubImg = document.getElementById("vista-previa-pub-img");
    let imagenSubidaDataUrl = "";

    function limpiarImagenPub() {
        imagenSubidaDataUrl = "";
        if (inputArchivoImagen) inputArchivoImagen.value = "";
        if (inputPubImagen) inputPubImagen.value = "";
        if (nombreArchivoImagen) nombreArchivoImagen.textContent = "";
        if (btnQuitarPubImg) btnQuitarPubImg.style.display = "none";
        if (vistaPreviaPubImg) {
            vistaPreviaPubImg.src = "";
            vistaPreviaPubImg.classList.remove("visible");
        }
    }

    if (btnSubirImgArchivo && inputArchivoImagen) {
        btnSubirImgArchivo.addEventListener("click", () => inputArchivoImagen.click());
        inputArchivoImagen.addEventListener("change", () => {
            const archivo = inputArchivoImagen.files && inputArchivoImagen.files[0];
            if (!archivo) return;
            const lector = new FileReader();
            lector.onload = (ev) => {
                imagenSubidaDataUrl = ev.target.result || "";
                if (inputPubImagen) inputPubImagen.value = "";
                if (nombreArchivoImagen) nombreArchivoImagen.textContent = archivo.name;
                if (btnQuitarPubImg) btnQuitarPubImg.style.display = "inline-block";
                if (vistaPreviaPubImg) {
                    vistaPreviaPubImg.src = imagenSubidaDataUrl;
                    vistaPreviaPubImg.classList.add("visible");
                }
            };
            lector.readAsDataURL(archivo);
        });
    }

    if (btnQuitarPubImg) btnQuitarPubImg.addEventListener("click", limpiarImagenPub);

    if (inputPubImagen) {
        inputPubImagen.addEventListener("input", () => {
            const urlVal = inputPubImagen.value.trim();
            if (urlVal) {
                imagenSubidaDataUrl = "";
                if (nombreArchivoImagen) nombreArchivoImagen.textContent = "";
                if (btnQuitarPubImg) btnQuitarPubImg.style.display = "inline-block";
                if (vistaPreviaPubImg) {
                    vistaPreviaPubImg.src = urlVal;
                    vistaPreviaPubImg.classList.add("visible");
                }
            } else if (!imagenSubidaDataUrl) {
                if (btnQuitarPubImg) btnQuitarPubImg.style.display = "none";
                if (vistaPreviaPubImg) {
                    vistaPreviaPubImg.src = "";
                    vistaPreviaPubImg.classList.remove("visible");
                }
            }
        });
    }

    const formPublicarNoticia = document.getElementById("form-publicar-noticia");
    const msgPubAdmin = document.getElementById("msg-pub-admin");

    function obtenerContenedorAccionPublicada() {
        if (!msgPubAdmin) return null;
        let cont = document.getElementById("accion-publicada-reciente");
        if (!cont) {
            cont = document.createElement("div");
            cont.id = "accion-publicada-reciente";
            cont.style.marginTop = "12px";
            cont.style.display = "flex";
            cont.style.flexWrap = "wrap";
            cont.style.alignItems = "center";
            cont.style.gap = "10px";
            msgPubAdmin.insertAdjacentElement("afterend", cont);
        }
        return cont;
    }

    function ocultarBotonPublicada() {
        const cont = document.getElementById("accion-publicada-reciente");
        if (cont) {
            cont.innerHTML = "";
        }
    }

    function mostrarBotonPublicada(noticiaId, tituloNoticia) {
        const cont = obtenerContenedorAccionPublicada();
        if (!cont) return;
        cont.innerHTML = `
            <button type="button" id="btn-estado-publicada" class="btn btn-pequeno" data-publicacion-id="${escaparHtml(noticiaId)}">
                PUBLICADA
            </button>
        `;
        const btnPub = document.getElementById("btn-estado-publicada");
        if (btnPub) {
            btnPub.addEventListener("click", () => {
                if (!esUsuarioAdmin()) {
                    abrirModal(modalLogin);
                    return;
                }
                const deseaEliminar = window.confirm(
                    `¿Quieres eliminar la publicación "${tituloNoticia || "sin título"}" del blog?`
                );
                if (!deseaEliminar) return;

                const restantes = obtenerNoticias().filter(item => String(item.id) !== String(noticiaId));
                guardarNoticias(restantes);
                ultimaPublicacionId = "";
                ultimaPublicacionTitulo = "";
                ocultarBotonPublicada();
                if (msgPubAdmin) {
                    msgPubAdmin.style.color = "#ffd166";
                    msgPubAdmin.textContent = "Publicación eliminada del blog.";
                }
                renderizarTodo(null);
            });
        }
    }

    if (formPublicarNoticia) {
        formPublicarNoticia.addEventListener("submit", (e) => {
            e.preventDefault();

            if (!obtenerSesion()) {
                if (msgPubAdmin) {
                    msgPubAdmin.style.color = "#ff7582";
                    msgPubAdmin.textContent = "Inicia sesión como administrador (fafi_admin) para publicar.";
                }
                abrirModal(modalLogin);
                return;
            }

            if (!esUsuarioAdmin()) {
                if (msgPubAdmin) {
                    msgPubAdmin.style.color = "#ff7582";
                    msgPubAdmin.textContent = "Solo la cuenta administradora (fafi_admin) puede publicar en el blog.";
                }
                return;
            }

            const campoTitulo = document.getElementById("pub-titulo");
            const campoCategoria = document.getElementById("pub-categoria");
            const campoContenido = document.getElementById("pub-contenido");

            const titulo = campoTitulo ? campoTitulo.value.trim() : "";
            const categoria = campoCategoria ? campoCategoria.value.trim() : "";
            const urlIngresada = inputPubImagen ? inputPubImagen.value.trim() : "";
            const imagenFinal = imagenSubidaDataUrl || urlIngresada;
            const contenido = campoContenido ? campoContenido.value.trim() : "";

            if (!titulo || !categoria || !contenido) {
                if (msgPubAdmin) {
                    msgPubAdmin.style.color = "#ff7582";
                    msgPubAdmin.textContent = "Completa el título, la categoría y el contenido antes de publicar.";
                }
                return;
            }

            const nuevaId = "noticia-" + Date.now();
            const lista = obtenerNoticias();
            lista.unshift({
                id: nuevaId,
                titulo,
                categoria,
                autor: obtenerSesion(),
                fecha: "Ahora",
                imagen: imagenFinal,
                contenido,
                comentarios: []
            });
            guardarNoticias(lista);

            if (mensajeOrigenId) {
                const restantes = obtenerMensajesAdmin().filter(m => String(m.id) !== String(mensajeOrigenId));
                guardarMensajesAdmin(restantes);
                mensajeOrigenId = "";
                renderizarMensajesAdmin();
            }

            formPublicarNoticia.reset();
            if (campoTitulo) campoTitulo.value = "";
            if (campoCategoria) campoCategoria.value = "";
            if (campoContenido) campoContenido.value = "";
            limpiarImagenPub();

            ultimaPublicacionId = nuevaId;
            ultimaPublicacionTitulo = titulo;

            if (msgPubAdmin) {
                msgPubAdmin.style.color = "#7dffb3";
                msgPubAdmin.textContent = "Noticia publicada y campos limpiados.";
            }
            mostrarBotonPublicada(nuevaId, titulo);
            renderizarTodo(null);
        });
    }

    // Subir imagen en Mensajes Admin
    const btnQuitarAdminImg = document.getElementById("btn-quitar-admin-img");
    const inputArchivoAdminImg = document.getElementById("input-archivo-admin-img");
    const nombreArchivoAdminImg = document.getElementById("nombre-archivo-admin-img");
    const vistaPreviaAdminImg = document.getElementById("vista-previa-admin-img");
    let imagenAdminDataUrl = "";

    function limpiarImagenAdmin() {
        imagenAdminDataUrl = "";
        if (inputArchivoAdminImg) inputArchivoAdminImg.value = "";
        if (nombreArchivoAdminImg) nombreArchivoAdminImg.textContent = "";
        if (btnQuitarAdminImg) btnQuitarAdminImg.style.display = "none";
        if (vistaPreviaAdminImg) {
            vistaPreviaAdminImg.src = "";
            vistaPreviaAdminImg.classList.remove("visible");
        }
    }

    if (btnSubirAdminImg && inputArchivoAdminImg) {
        btnSubirAdminImg.addEventListener("click", () => {
            if (!obtenerSesion()) {
                abrirModal(modalLogin);
                return;
            }
            inputArchivoAdminImg.click();
        });
        inputArchivoAdminImg.addEventListener("change", () => {
            const archivo = inputArchivoAdminImg.files && inputArchivoAdminImg.files[0];
            if (!archivo) return;
            const lector = new FileReader();
            lector.onload = (ev) => {
                imagenAdminDataUrl = ev.target.result || "";
                if (nombreArchivoAdminImg) nombreArchivoAdminImg.textContent = archivo.name;
                if (btnQuitarAdminImg) btnQuitarAdminImg.style.display = "inline-block";
                if (vistaPreviaAdminImg) {
                    vistaPreviaAdminImg.src = imagenAdminDataUrl;
                    vistaPreviaAdminImg.classList.add("visible");
                }
            };
            lector.readAsDataURL(archivo);
        });
    }

    if (btnQuitarAdminImg) btnQuitarAdminImg.addEventListener("click", limpiarImagenAdmin);

    const formMensajeAdmin = document.getElementById("form-mensaje-admin");
    const historialMensajesAdmin = document.getElementById("historial-mensajes-admin");

    function cargarMensajeEnBorradorBlog(mensaje) {
        if (!esUsuarioAdmin() || !mensaje) return;

        mensajeOrigenId = mensaje.id || "";
        const inputTitulo = document.getElementById("pub-titulo");
        const inputCategoria = document.getElementById("pub-categoria");
        const inputContenido = document.getElementById("pub-contenido");

        if (inputTitulo) inputTitulo.value = mensaje.asunto || "";
        if (inputCategoria) inputCategoria.value = mensaje.tipoEvento || "Reporte de Barrio";

        const cuerpoBase = mensaje.detalle || "";
        const notaSector = mensaje.sector ? `\n\nSector / Comunidad: ${mensaje.sector}` : "";
        if (inputContenido) {
            inputContenido.value = cuerpoBase.includes(mensaje.sector || "")
                ? cuerpoBase
                : `${cuerpoBase}${notaSector}`.trim();
        }

        limpiarImagenPub();
        if (mensaje.imagen) {
            imagenSubidaDataUrl = mensaje.imagen;
            if (nombreArchivoImagen) nombreArchivoImagen.textContent = "Imagen adjunta del mensaje";
            if (btnQuitarPubImg) btnQuitarPubImg.style.display = "inline-block";
            if (vistaPreviaPubImg) {
                vistaPreviaPubImg.src = mensaje.imagen;
                vistaPreviaPubImg.classList.add("visible");
            }
        }

        if (panelAdminBlog) panelAdminBlog.classList.add("visible");
        if (msgPubAdmin) {
            msgPubAdmin.style.color = "#ffd166";
            msgPubAdmin.textContent = "Borrador cargado desde Mensajes Admin: revisa o corrige el texto y pulsa 'Publicar Noticia'.";
        }

        const destino = panelAdminBlog || document.getElementById("blog");
        if (destino) {
            destino.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (inputTitulo) inputTitulo.focus();
    }

    function renderizarMensajesAdmin() {
        if (!historialMensajesAdmin) return;
        const sesion = obtenerSesion();
        const adminActivo = esUsuarioAdmin();
        const mensajes = obtenerMensajesAdmin().filter(
            m => adminActivo || (sesion && m.remitente.toLowerCase().includes(sesion.toLowerCase()))
        );

        if (mensajes.length === 0) {
            historialMensajesAdmin.innerHTML = "";
            return;
        }

        historialMensajesAdmin.innerHTML = mensajes.map(m => {
            const imgAdjunta = m.imagen ? `<img src="${escaparHtml(m.imagen)}" alt="Adjunto de ${escaparHtml(m.asunto)}">` : "";
            const btnPasarBlog = adminActivo
                ? `
                    <div class="admin-msg-acciones">
                        <button type="button"
                            class="btn btn-donar btn-pequeno btn-pasar-blog"
                            data-mensaje-id="${escaparHtml(m.id)}">
                            Pasar al Blog (corregir)
                        </button>
                    </div>
                `
                : "";

            return `
                <div class="admin-msg-item">
                    <strong>${escaparHtml(m.tipoEvento)} • ${escaparHtml(m.sector)} • De: ${escaparHtml(m.remitente)}</strong>
                    <h4>${escaparHtml(m.asunto)}</h4>
                    <p>${escaparHtml(m.detalle)}</p>
                    ${imgAdjunta}
                    ${btnPasarBlog}
                </div>
            `;
        }).join("");

        if (adminActivo) {
            const todosLosMensajes = obtenerMensajesAdmin();
            document.querySelectorAll(".btn-pasar-blog").forEach(btn => {
                btn.addEventListener("click", () => {
                    const idMsg = btn.getAttribute("data-mensaje-id");
                    const encontrado = todosLosMensajes.find(item => String(item.id) === String(idMsg));
                    cargarMensajeEnBorradorBlog(encontrado);
                });
            });
        }
    }

    if (formMensajeAdmin) {
        formMensajeAdmin.addEventListener("submit", (e) => {
            e.preventDefault();
            if (!obtenerSesion()) {
                abrirModal(modalLogin);
                return;
            }
            const remitente = inputRemitenteAdmin.value.trim();
            const tipoEvento = inputTipoAdmin.value;
            const sector = inputSectorAdmin.value.trim();
            const asunto = inputAsuntoAdmin.value.trim();
            const detalle = inputDetalleAdmin.value.trim();
            if (!remitente || !sector || !asunto || !detalle) return;

            const lista = obtenerMensajesAdmin();
            lista.unshift({
                id: "msg-admin-" + Date.now(),
                remitente,
                tipoEvento,
                sector,
                asunto,
                detalle,
                imagen: imagenAdminDataUrl
            });
            guardarMensajesAdmin(lista);
            formMensajeAdmin.reset();
            limpiarImagenAdmin();
            actualizarEstadoAccesoUI();
            if (msgAdminFeedback) {
                msgAdminFeedback.style.color = "#7dffb3";
                msgAdminFeedback.textContent = "Mensaje enviado a los administradores.";
            }
            renderizarMensajesAdmin();
        });
    }

    function actualizarEstadoAccesoUI() {
        const usuarioActual = obtenerSesion();
        const adminActivo = esUsuarioAdmin();

        if (usuarioActual) {
            if (badgeUsuarioActivo) {
                badgeUsuarioActivo.textContent = adminActivo ? ("@" + usuarioActual + " [ADMIN]") : ("@" + usuarioActual);
                badgeUsuarioActivo.classList.toggle("es-admin", adminActivo);
                badgeUsuarioActivo.style.display = "inline-block";
            }
            if (btnTopLogin) btnTopLogin.style.display = "none";
            if (btnTopCrear) btnTopCrear.style.display = "none";
            if (btnTopCerrar) btnTopCerrar.style.display = "inline-block";
            if (btnBlogLogin) btnBlogLogin.style.display = "none";
            if (btnBlogCrear) btnBlogCrear.style.display = "none";
            if (panelAdminBlog) panelAdminBlog.classList.toggle("visible", adminActivo);
            if (textoEstadoSesion) {
                textoEstadoSesion.textContent = adminActivo
                    ? "Sesión de administrador activa (@" + usuarioActual + "). Puedes publicar noticias, moderar y revisar mensajes."
                    : "Sesión iniciada como @" + usuarioActual + ". Puedes reaccionar, comentar y enviar mensajes a los administradores.";
            }
            if (avisoBloqueoAdmin) avisoBloqueoAdmin.textContent = "";
            [inputRemitenteAdmin, inputTipoAdmin, inputSectorAdmin, inputAsuntoAdmin, inputDetalleAdmin, btnEnviarAdmin, btnSubirAdminImg].forEach(el => {
                if (el) el.disabled = false;
            });
            if (inputRemitenteAdmin && !inputRemitenteAdmin.value.trim()) {
                inputRemitenteAdmin.value = "@" + usuarioActual;
            }
        } else {
            if (badgeUsuarioActivo) {
                badgeUsuarioActivo.textContent = "";
                badgeUsuarioActivo.classList.remove("es-admin");
                badgeUsuarioActivo.style.display = "none";
            }
            if (btnTopLogin) btnTopLogin.style.display = "inline-block";
            if (btnTopCrear) btnTopCrear.style.display = "inline-block";
            if (btnTopCerrar) btnTopCerrar.style.display = "none";
            if (btnBlogLogin) btnBlogLogin.style.display = "inline-block";
            if (btnBlogCrear) btnBlogCrear.style.display = "inline-block";
            if (panelAdminBlog) panelAdminBlog.classList.remove("visible");
            if (textoEstadoSesion) {
                textoEstadoSesion.textContent = "Todos los usuarios pueden reaccionar a las publicaciones; inicia sesión o crea tu usuario para comentar o enviar mensajes.";
            }
            if (avisoBloqueoAdmin) {
                avisoBloqueoAdmin.textContent = "Debes iniciar sesión o crear tu usuario para enviar mensajes a los administradores.";
            }
            [inputRemitenteAdmin, inputTipoAdmin, inputSectorAdmin, inputAsuntoAdmin, inputDetalleAdmin, btnEnviarAdmin, btnSubirAdminImg].forEach(el => {
                if (el) el.disabled = true;
            });
        }
        renderizarMensajesAdmin();
    }

    const formRegistro = document.getElementById("form-registro-usuario");
    if (formRegistro) {
        formRegistro.addEventListener("submit", (e) => {
            e.preventDefault();
            const usuario = document.getElementById("reg-usuario").value.trim();
            const comunidad = document.getElementById("reg-comunidad").value.trim();
            const email = document.getElementById("reg-email").value.trim().toLowerCase();
            const password = document.getElementById("reg-password").value;
            const confirmar = document.getElementById("reg-confirmar-password").value;

            if (!usuario || !comunidad || !email || !password || !confirmar) return;
            if (password !== confirmar) {
                if (msgRegistro) {
                    msgRegistro.style.color = "#ff7582";
                    msgRegistro.textContent = "Las contraseñas no coinciden.";
                }
                return;
            }

            const usuarios = obtenerUsuarios();
            if (usuarios.some(u => u.usuario.toLowerCase() === usuario.toLowerCase() || u.email === email)) {
                if (msgRegistro) {
                    msgRegistro.style.color = "#ff7582";
                    msgRegistro.textContent = "Ese usuario o correo ya está registrado.";
                }
                return;
            }

            usuarios.push({ usuario, comunidad, email, password, rol: "usuario" });
            guardarUsuarios(usuarios);
            guardarSesion(usuario);
            formRegistro.reset();
            actualizarEstadoAccesoUI();
            renderizarTodo(null);
            irAPaginaPrincipal();
        });
    }

    const formLogin = document.getElementById("form-login-usuario");
    if (formLogin) {
        formLogin.addEventListener("submit", (e) => {
            e.preventDefault();
            const identificador = document.getElementById("login-usuario").value.trim().toLowerCase();
            const password = document.getElementById("login-password").value;
            const encontrado = obtenerUsuarios().find(
                u => (u.usuario.toLowerCase() === identificador || (u.email && u.email === identificador)) && u.password === password
            );

            if (!encontrado) {
                if (msgLogin) {
                    msgLogin.style.color = "#ff7582";
                    msgLogin.textContent = "Usuario/correo o contraseña incorrectos.";
                }
                return;
            }

            guardarSesion(encontrado.usuario);
            formLogin.reset();
            actualizarEstadoAccesoUI();
            renderizarTodo(null);
            irAPaginaPrincipal();
        });
    }

    if (btnTopCerrar) {
        btnTopCerrar.addEventListener("click", () => {
            guardarSesion("");
            if (inputRemitenteAdmin) inputRemitenteAdmin.value = "";
            limpiarImagenAdmin();
            ocultarBotonPublicada();
            actualizarEstadoAccesoUI();
            renderizarTodo(null);
        });
    }

    // Donaciones: desplegar cuentas y copiar
    const btnQuieroDonar = document.getElementById("btn-quiero-donar");
    const panelCuentasDonacion = document.getElementById("panel-cuentas-donacion");

    if (btnQuieroDonar && panelCuentasDonacion) {
        btnQuieroDonar.addEventListener("click", () => {
            const estaVisible = panelCuentasDonacion.style.display === "grid";
            panelCuentasDonacion.style.display = estaVisible ? "none" : "grid";
            btnQuieroDonar.setAttribute("aria-expanded", String(!estaVisible));
        });
    }

    document.querySelectorAll(".btn-copiar-cuenta").forEach(btn => {
        btn.addEventListener("click", () => {
            const textoCopiar = btn.getAttribute("data-copiar") || "";
            if (!textoCopiar) return;
            navigator.clipboard.writeText(textoCopiar).then(() => {
                alert("Copiado: " + textoCopiar);
            }).catch(() => {
                alert(textoCopiar);
            });
        });
    });

    actualizarEstadoAccesoUI();
    renderizarTodo(null);
    renderizarMensajesAdmin();
});

    actualizarEstadoAccesoUI();
    renderizarTodo(null);
    renderizarMensajesAdmin();
});

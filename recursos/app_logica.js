/* =====================================================================
   CORAZÓN RD — app_logica.js
   Va en la carpeta "recursos" (recursos/app_logica.js).
   Maneja: menú móvil, icono de usuario, login (cédula), registro,
   blog, protestas, mensajes a administradores y donaciones.
   ===================================================================== */
(function () {
  "use strict";

  var DATOS = window.CORAZON_RD_DATOS || {};
  var PREFIJO = "corazonrd_";
  var REACCIONES = ["👍", "❤️", "🔥", "👏", "😢"];

  /* ---------- utilidades ---------- */
  function $(id) { return document.getElementById(id); }

  function el(etiqueta, clase, texto) {
    var nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (texto !== undefined && texto !== null) nodo.textContent = texto;
    return nodo;
  }

  function leer(clave, defecto) {
    try {
      var v = localStorage.getItem(PREFIJO + clave);
      return v ? JSON.parse(v) : defecto;
    } catch (e) { return defecto; }
  }

  function guardar(clave, valor) {
    try { localStorage.setItem(PREFIJO + clave, JSON.stringify(valor)); return true; }
    catch (e) { return false; }
  }

  function clonar(x) { return JSON.parse(JSON.stringify(x)); }

  function nuevoId(prefijo) {
    return prefijo + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function fechaHoy() {
    try {
      return new Date().toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });
    } catch (e) { return new Date().toLocaleDateString(); }
  }

  function mensaje(nodo, texto, bien) {
    if (!nodo) return;
    nodo.textContent = texto || "";
    nodo.style.color = bien === false ? "#ff8a8a" : "";
  }

  function hash(texto) {
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      return window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) {
          return ("0" + b.toString(16)).slice(-2);
        }).join("");
      });
    }
    return Promise.resolve("plano:" + btoa(unescape(encodeURIComponent(texto))));
  }

  function soloDigitos(t) { return String(t || "").replace(/\D/g, ""); }

  function formatearCedula(valor) {
    var d = soloDigitos(valor).slice(0, 11);
    var r = d.slice(0, 3);
    if (d.length > 3) r += "-" + d.slice(3, 10);
    if (d.length > 10) r += "-" + d.slice(10);
    return r;
  }

  /* ---------- sesión ---------- */
  function getSesion() {
    try {
      var a = sessionStorage.getItem(PREFIJO + "admin");
      if (a) return JSON.parse(a);
    } catch (e) { /* ignorar */ }
    return leer("sesion", null);
  }

  function esAdmin() {
    var s = getSesion();
    return !!(s && s.rol === "admin");
  }

  /* ---------- menú móvil (tres rayas) ---------- */
  var btnMenu = $("btn-menu-movil");
  var contAuth = $("barra-acceso");
  var btnAuth = $("btn-auth-movil");

  function setMenu(abierto) {
    document.body.classList.toggle("menu-abierto", abierto);
    if (btnMenu) {
      btnMenu.setAttribute("aria-expanded", abierto ? "true" : "false");
      btnMenu.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
    }
    if (abierto) setPanelAuth(false);
  }

  function setPanelAuth(abierto) {
    if (!contAuth) return;
    contAuth.classList.toggle("abierto", abierto);
    if (btnAuth) {
      btnAuth.setAttribute("aria-expanded", abierto ? "true" : "false");
      btnAuth.setAttribute("aria-label", abierto ? "Cerrar acceso de usuario" : "Abrir acceso de usuario");
    }
  }

  if (btnMenu) {
    btnMenu.addEventListener("click", function () {
      setMenu(!document.body.classList.contains("menu-abierto"));
    });
  }

  Array.prototype.forEach.call(
    document.querySelectorAll("#menu-principal-6 a, .btn-inicio-img, .logo-barra-movil"),
    function (a) { a.addEventListener("click", function () { setMenu(false); }); }
  );

  window.addEventListener("resize", function () {
    if (window.innerWidth > 768) setMenu(false);
  });

  /* logo de la barra negra del teléfono = logo del menú lateral */
  (function () {
    var destino = $("logo-barra-movil");
    var origen = document.querySelector(".sidebar-logo img");
    if (destino && origen && origen.getAttribute("src")) destino.src = origen.getAttribute("src");
  })();

  /* ---------- icono de usuario (PC y teléfono) ---------- */
  if (btnAuth) {
    btnAuth.addEventListener("click", function (e) {
      e.stopPropagation();
      setPanelAuth(!contAuth.classList.contains("abierto"));
    });
  }

  document.addEventListener("click", function (e) {
    if (contAuth && contAuth.classList.contains("abierto") && !contAuth.contains(e.target)) {
      setPanelAuth(false);
    }
  });

  /* ---------- ventanas (modales) ---------- */
  function abrirModal(id) {
    Array.prototype.forEach.call(document.querySelectorAll(".modal-overlay.abierto"), function (m) {
      m.classList.remove("abierto");
    });
    var modal = $(id);
    if (!modal) return;
    modal.classList.add("abierto");
    document.body.style.overflow = "hidden";
    setPanelAuth(false);
    setMenu(false);
    var primero = modal.querySelector("input");
    if (primero) setTimeout(function () { primero.focus(); }, 50);
  }

  function cerrarModales() {
    Array.prototype.forEach.call(document.querySelectorAll(".modal-overlay.abierto"), function (m) {
      m.classList.remove("abierto");
    });
    document.body.style.overflow = "";
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-cerrar-modal]"), function (b) {
    b.addEventListener("click", cerrarModales);
  });

  Array.prototype.forEach.call(document.querySelectorAll(".modal-overlay"), function (m) {
    m.addEventListener("click", function (e) { if (e.target === m) cerrarModales(); });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { cerrarModales(); setMenu(false); setPanelAuth(false); }
  });

  function abrirLogin() { mensaje($("msg-login"), ""); abrirModal("modal-login"); }
  function abrirRegistro() { mensaje($("msg-registro"), ""); abrirModal("modal-crear-usuario"); }

  [["btn-top-login", abrirLogin], ["btn-blog-login", abrirLogin],
   ["btn-top-crear", abrirRegistro], ["btn-blog-crear", abrirRegistro]].forEach(function (par) {
    var b = $(par[0]);
    if (b) b.addEventListener("click", par[1]);
  });

  var btnCerrarSesion = $("btn-top-cerrar");
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", function () {
      try { sessionStorage.removeItem(PREFIJO + "admin"); } catch (e) { /* ignorar */ }
      try { localStorage.removeItem(PREFIJO + "sesion"); } catch (e) { /* ignorar */ }
      setPanelAuth(false);
      actualizarSesion();
    });
  }

  /* ---------- máscara de cédula ---------- */
  var campoRegCedula = $("reg-cedula");
  if (campoRegCedula) {
    campoRegCedula.addEventListener("input", function () {
      campoRegCedula.value = formatearCedula(campoRegCedula.value);
    });
  }

  var campoLogin = $("login-usuario");
  if (campoLogin) {
    campoLogin.addEventListener("input", function () {
      if (/^[\d-]*$/.test(campoLogin.value)) campoLogin.value = formatearCedula(campoLogin.value);
    });
  }

  /* ---------- login ---------- */
  function iniciarSesionAdmin(usuario, clave) {
    return fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario: usuario, password: clave })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        return { estado: r.status, datos: d };
      });
    });
  }

  var formLogin = $("form-login-usuario");
  if (formLogin) {
    formLogin.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = $("msg-login");
      var entrada = $("login-usuario").value.trim();
      var clave = $("login-password").value;
      var boton = formLogin.querySelector("button[type=submit]");
      var nombreAdmin = String((DATOS.adminDefecto && DATOS.adminDefecto.usuario) || "").toLowerCase();

      if (!entrada || !clave) { mensaje(msg, "Escribe tu cédula y tu contraseña.", false); return; }
      if (boton) boton.disabled = true;
      mensaje(msg, "Verificando...");

      var fin = function () { if (boton) boton.disabled = false; };

      /* administrador: se valida en el servidor */
      if (nombreAdmin && entrada.toLowerCase() === nombreAdmin) {
        iniciarSesionAdmin(entrada, clave).then(function (res) {
          if (res.estado === 200 && res.datos.ok) {
            var ses = {
              rol: "admin",
              usuario: res.datos.usuario || entrada,
              comunidad: (DATOS.adminDefecto && DATOS.adminDefecto.comunidad) || ""
            };
            try { sessionStorage.setItem(PREFIJO + "admin", JSON.stringify(ses)); } catch (err) { /* ignorar */ }
            formLogin.reset();
            mensaje(msg, "");
            cerrarModales();
            actualizarSesion();
          } else if (res.estado === 429) {
            mensaje(msg, "Demasiados intentos. Espera unos minutos.", false);
          } else if (res.estado === 503) {
            mensaje(msg, "El administrador aún no está configurado en el servidor.", false);
          } else {
            mensaje(msg, "Usuario o contraseña incorrectos.", false);
          }
        }).catch(function () {
          mensaje(msg, "No se pudo conectar con el servidor.", false);
        }).then(fin);
        return;
      }

      /* usuario normal: cédula + contraseña */
      var cedula = soloDigitos(entrada);
      var usuarios = leer("usuarios", []);
      var encontrado = null;
      for (var i = 0; i < usuarios.length; i++) {
        if (usuarios[i].cedula === cedula) { encontrado = usuarios[i]; break; }
      }
      if (!encontrado) {
        mensaje(msg, "Esa cédula no está registrada. Crea tu usuario primero.", false);
        fin();
        return;
      }
      hash(cedula + ":" + clave).then(function (h) {
        if (h !== encontrado.clave) {
          mensaje(msg, "Cédula o contraseña incorrectos.", false);
          return;
        }
        guardar("sesion", {
          rol: "usuario",
          cedula: encontrado.cedula,
          usuario: encontrado.usuario,
          nombre: encontrado.nombre,
          comunidad: encontrado.comunidad
        });
        formLogin.reset();
        mensaje(msg, "");
        cerrarModales();
        actualizarSesion();
      }).then(fin, fin);
    });
  }

  /* ---------- registro ---------- */
  var formRegistro = $("form-registro-usuario");
  if (formRegistro) {
    formRegistro.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = $("msg-registro");
      var cedula = soloDigitos($("reg-cedula").value);
      var nombre = $("reg-nombre").value.trim();
      var usuario = $("reg-usuario").value.trim();
      var comunidad = $("reg-comunidad").value.trim();
      var correo = $("reg-email").value.trim();
      var clave = $("reg-password").value;
      var confirmar = $("reg-confirmar-password").value;

      if (cedula.length !== 11) { mensaje(msg, "La cédula debe tener 11 dígitos.", false); return; }
      if (nombre.split(/\s+/).length < 2) { mensaje(msg, "Escribe tu nombre completo (nombre y apellido).", false); return; }
      if (clave.length < 6) { mensaje(msg, "La contraseña debe tener al menos 6 caracteres.", false); return; }
      if (clave !== confirmar) { mensaje(msg, "Las contraseñas no coinciden.", false); return; }
      if (!$("reg-terminos").checked) { mensaje(msg, "Debes aceptar los términos y políticas.", false); return; }

      var adminNombre = String((DATOS.adminDefecto && DATOS.adminDefecto.usuario) || "").toLowerCase();
      if (usuario.toLowerCase() === adminNombre) { mensaje(msg, "Ese nombre de usuario no está disponible.", false); return; }

      var usuarios = leer("usuarios", []);
      for (var i = 0; i < usuarios.length; i++) {
        if (usuarios[i].cedula === cedula) { mensaje(msg, "Esa cédula ya tiene un usuario creado.", false); return; }
        if (usuarios[i].usuario.toLowerCase() === usuario.toLowerCase()) { mensaje(msg, "Ese nombre de usuario ya existe.", false); return; }
      }

      hash(cedula + ":" + clave).then(function (h) {
        usuarios.push({
          cedula: cedula, nombre: nombre, usuario: usuario,
          comunidad: comunidad, email: correo, clave: h, creado: Date.now()
        });
        if (!guardar("usuarios", usuarios)) {
          mensaje(msg, "No se pudo guardar el usuario en este navegador.", false);
          return;
        }
        guardar("sesion", { rol: "usuario", cedula: cedula, usuario: usuario, nombre: nombre, comunidad: comunidad });
        formRegistro.reset();
        mensaje(msg, "");
        cerrarModales();
        actualizarSesion();
      });
    });
  }

  /* ---------- subir imágenes (PC o teléfono) ---------- */
  function reducirImagen(archivo, callback) {
    var lector = new FileReader();
    lector.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 900;
        var ratio = Math.min(1, max / Math.max(img.width, img.height));
        var canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = function () { callback(""); };
      img.src = lector.result;
    };
    lector.onerror = function () { callback(""); };
    lector.readAsDataURL(archivo);
  }

  function configurarImagen(cfg) {
    var estado = { dataUrl: "" };
    var btn = $(cfg.btn), quitar = $(cfg.quitar), input = $(cfg.input);
    var nombre = $(cfg.nombre), previa = $(cfg.previa), url = cfg.url ? $(cfg.url) : null;

    function mostrar(src) {
      if (!previa) return;
      if (src) { previa.src = src; previa.classList.add("visible"); }
      else { previa.removeAttribute("src"); previa.classList.remove("visible"); }
    }

    if (btn && input) btn.addEventListener("click", function () { input.click(); });
    if (input) {
      input.addEventListener("change", function () {
        var archivo = input.files && input.files[0];
        if (!archivo) return;
        reducirImagen(archivo, function (data) {
          if (!data) return;
          estado.dataUrl = data;
          if (nombre) nombre.textContent = archivo.name;
          if (quitar) quitar.style.display = "";
          mostrar(data);
        });
      });
    }
    if (quitar) {
      quitar.addEventListener("click", function () { estado.reset(); });
    }
    if (url) {
      url.addEventListener("input", function () {
        if (!estado.dataUrl) mostrar(/^https?:\/\//i.test(url.value.trim()) ? url.value.trim() : "");
      });
    }

    estado.valor = function () {
      return estado.dataUrl || (url ? url.value.trim() : "");
    };
    estado.reset = function () {
      estado.dataUrl = "";
      if (input) input.value = "";
      if (nombre) nombre.textContent = "";
      if (quitar) quitar.style.display = "none";
      if (url) url.value = "";
      mostrar("");
    };
    return estado;
  }

  /* ---------- reacciones ---------- */
  function crearReacciones(item, alCambiar) {
    var mias = leer("mis_reacciones", {});
    if (!item.reacciones) item.reacciones = {};

    var bloque = el("div", "reacciones-bloque");
    var fila = el("div", "reacciones-fila-principal");
    var principal = el("button", "btn-reaccion-principal");
    principal.type = "button";
    var emojiPrincipal = el("span", "emoji-principal", "👍");
    var cantidadPrincipal = el("span", "cantidad-principal", "0");
    principal.appendChild(emojiPrincipal);
    principal.appendChild(cantidadPrincipal);
    fila.appendChild(principal);

    var desplegable = el("div", "reacciones-desplegable");
    var botones = {};

    REACCIONES.forEach(function (emoji) {
      var b = el("button", "btn-reaccion-opcion");
      b.type = "button";
      b.appendChild(el("span", "reaccion-emoji", emoji));
      var contador = el("span", "reaccion-contador", "0");
      b.appendChild(contador);
      b._contador = contador;
      botones[emoji] = b;
      b.addEventListener("click", function (ev) {
        ev.stopPropagation();
        var actual = mias[item.id];
        if (actual) item.reacciones[actual] = Math.max(0, (item.reacciones[actual] || 1) - 1);
        if (actual === emoji) { delete mias[item.id]; }
        else { item.reacciones[emoji] = (item.reacciones[emoji] || 0) + 1; mias[item.id] = emoji; }
        guardar("mis_reacciones", mias);
        alCambiar();
        pintar();
        bloque.classList.remove("abierto");
      });
      desplegable.appendChild(b);
    });

    function pintar() {
      var total = 0;
      REACCIONES.forEach(function (emoji) {
        var n = item.reacciones[emoji] || 0;
        total += n;
        botones[emoji]._contador.textContent = String(n);
        botones[emoji].classList.toggle("activa", mias[item.id] === emoji);
      });
      emojiPrincipal.textContent = mias[item.id] || "👍";
      cantidadPrincipal.textContent = String(total);
      principal.classList.toggle("activa", !!mias[item.id]);
    }

    principal.addEventListener("click", function (ev) {
      ev.stopPropagation();
      bloque.classList.toggle("abierto");
    });
    document.addEventListener("click", function () { bloque.classList.remove("abierto"); });

    bloque.appendChild(fila);
    bloque.appendChild(desplegable);
    pintar();
    return bloque;
  }

  /* ---------- blog ---------- */
  var noticias = leer("noticias", null);
  if (!noticias) { noticias = clonar(DATOS.noticiasDefecto || []); guardar("noticias", noticias); }

  function guardarNoticias() { guardar("noticias", noticias); }

  function pintarNoticias() {
    var cont = $("noticias-contenedor");
    if (!cont) return;
    cont.textContent = "";
    var ses = getSesion();

    noticias.forEach(function (n) {
      if (!n.comentarios) n.comentarios = [];
      var card = el("article", "noticia-card");
      if (n.imagen) {
        var img = el("img");
        img.src = n.imagen;
        img.alt = n.titulo || "Imagen de la publicación";
        img.loading = "lazy";
        card.appendChild(img);
      }
      var cuerpo = el("div", "noticia-cuerpo");
      cuerpo.appendChild(el("div", "noticia-meta",
        [n.categoria, n.autor, n.fecha].filter(Boolean).join(" • ")));
      cuerpo.appendChild(el("h3", "", n.titulo));
      cuerpo.appendChild(el("p", "noticia-texto", n.contenido));
      cuerpo.appendChild(crearReacciones(n, guardarNoticias));

      if (esAdmin()) {
        var borrar = el("button", "btn btn-pequeno", "Eliminar publicación");
        borrar.type = "button";
        borrar.addEventListener("click", function () {
          if (!confirm("¿Eliminar esta publicación?")) return;
          noticias = noticias.filter(function (x) { return x.id !== n.id; });
          guardarNoticias();
          pintarNoticias();
        });
        cuerpo.appendChild(borrar);
      }

      var area = el("div", "comentarios-area");
      area.appendChild(el("h4", "", "Comentarios (" + n.comentarios.length + ")"));
      n.comentarios.forEach(function (c) {
        var item = el("div", "comentario-item");
        item.appendChild(el("strong", "", c.autor));
        item.appendChild(el("p", "", c.texto));
        area.appendChild(item);
      });

      if (ses) {
        var form = el("div", "comentario-form");
        var campo = el("input");
        campo.type = "text";
        campo.maxLength = 400;
        campo.placeholder = "Escribe un comentario...";
        var enviar = el("button", "btn btn-pequeno btn-donar", "Comentar");
        enviar.type = "button";
        var publicar = function () {
          var texto = campo.value.trim();
          if (!texto) return;
          n.comentarios.push({ autor: ses.usuario, texto: texto });
          guardarNoticias();
          pintarNoticias();
        };
        enviar.addEventListener("click", publicar);
        campo.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); publicar(); } });
        form.appendChild(campo);
        form.appendChild(enviar);
        area.appendChild(form);
      } else {
        area.appendChild(el("p", "aviso-solo-lectura", "Inicia sesión o crea tu usuario para comentar."));
      }

      cuerpo.appendChild(area);
      card.appendChild(cuerpo);
      cont.appendChild(card);
    });
  }

  var imgNoticia = configurarImagen({
    btn: "btn-subir-imagen-archivo", quitar: "btn-quitar-pub-img", input: "input-archivo-imagen",
    nombre: "nombre-archivo-imagen", previa: "vista-previa-pub-img", url: "pub-imagen"
  });

  var formNoticia = $("form-publicar-noticia");
  if (formNoticia) {
    formNoticia.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = $("msg-pub-admin");
      if (!esAdmin()) { mensaje(msg, "Solo el administrador puede publicar.", false); return; }
      noticias.unshift({
        id: nuevoId("noticia"),
        titulo: $("pub-titulo").value.trim(),
        categoria: $("pub-categoria").value.trim(),
        autor: getSesion().usuario,
        fecha: fechaHoy(),
        imagen: imgNoticia.valor(),
        contenido: $("pub-contenido").value.trim(),
        comentarios: [],
        reacciones: {}
      });
      if (!guardar("noticias", noticias)) {
        mensaje(msg, "Publicada, pero la imagen es muy pesada para guardarla en este navegador.", false);
      } else {
        mensaje(msg, "Publicación creada.");
      }
      formNoticia.reset();
      imgNoticia.reset();
      pintarNoticias();
    });
  }

  /* ---------- protestas ---------- */
  var protestas = leer("protestas", null);
  if (!protestas) { protestas = clonar(DATOS.protestasDefecto || []); guardar("protestas", protestas); }

  function guardarProtestas() { guardar("protestas", protestas); }

  function pintarProtestas() {
    var cont = $("protesta-contenedor");
    if (!cont) return;
    cont.textContent = "";
    protestas.forEach(function (p) {
      var card = el("div", "card");
      if (p.imagen) {
        var img = el("img");
        img.src = p.imagen;
        img.alt = p.titulo || "Protesta";
        img.loading = "lazy";
        card.appendChild(img);
      }
      var cuerpo = el("div", "card-body");
      cuerpo.appendChild(el("span", "", p.categoria));
      cuerpo.appendChild(el("h3", "", p.titulo));
      if (p.mensaje) cuerpo.appendChild(el("p", "protesta-mensaje", p.mensaje));
      if (p.fecha) cuerpo.appendChild(el("span", "protesta-fecha", p.fecha));
      cuerpo.appendChild(crearReacciones(p, guardarProtestas));
      if (esAdmin()) {
        var borrar = el("button", "btn btn-pequeno btn-borrar-protesta", "Eliminar");
        borrar.type = "button";
        borrar.addEventListener("click", function () {
          if (!confirm("¿Eliminar esta protesta?")) return;
          protestas = protestas.filter(function (x) { return x.id !== p.id; });
          guardarProtestas();
          pintarProtestas();
        });
        cuerpo.appendChild(borrar);
      }
      card.appendChild(cuerpo);
      cont.appendChild(card);
    });
  }

  var imgProtesta = configurarImagen({
    btn: "btn-prot-subir-archivo", quitar: "btn-prot-quitar", input: "input-prot-archivo",
    nombre: "nombre-prot-archivo", previa: "vista-previa-prot", url: "prot-imagen"
  });

  var btnAbrirProtesta = $("btn-abrir-form-protesta");
  if (btnAbrirProtesta) {
    btnAbrirProtesta.addEventListener("click", function () {
      var panel = $("panel-admin-protesta");
      var abierto = panel.classList.toggle("visible");
      btnAbrirProtesta.setAttribute("aria-expanded", abierto ? "true" : "false");
    });
  }

  var formProtesta = $("form-publicar-protesta");
  if (formProtesta) {
    formProtesta.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = $("msg-prot-admin");
      if (!esAdmin()) { mensaje(msg, "Solo el administrador puede publicar.", false); return; }
      protestas.unshift({
        id: nuevoId("protesta"),
        titulo: $("prot-titulo").value.trim(),
        categoria: $("prot-categoria").value.trim(),
        mensaje: $("prot-mensaje").value.trim(),
        imagen: imgProtesta.valor(),
        fecha: fechaHoy(),
        reacciones: {}
      });
      if (!guardar("protestas", protestas)) {
        mensaje(msg, "Publicada, pero la imagen es muy pesada para guardarla en este navegador.", false);
      } else {
        mensaje(msg, "Protesta publicada.");
      }
      formProtesta.reset();
      imgProtesta.reset();
      pintarProtestas();
    });
  }

  /* ---------- mensajes a los administradores ---------- */
  var imgMensaje = configurarImagen({
    btn: "btn-subir-admin-img", quitar: "btn-quitar-admin-img", input: "input-archivo-admin-img",
    nombre: "nombre-archivo-admin-img", previa: "vista-previa-admin-img"
  });

  function pintarHistorialMensajes() {
    var cont = $("historial-mensajes-admin");
    if (!cont) return;
    cont.textContent = "";
    var ses = getSesion();
    if (!ses) return;
    var todos = leer("mensajes", []);
    var lista = esAdmin() ? todos : todos.filter(function (m) { return m.usuario === ses.usuario; });

    lista.forEach(function (m) {
      var item = el("div", "admin-msg-item");
      if (m.imagen) { var img = el("img"); img.src = m.imagen; img.alt = "Evidencia adjunta"; item.appendChild(img); }
      item.appendChild(el("strong", "", [m.tipo, m.sector].filter(Boolean).join(" • ")));
      item.appendChild(el("h4", "", m.asunto));
      item.appendChild(el("p", "", m.detalle));
      item.appendChild(el("p", "", "Enviado por " + m.remitente + " — " + m.fecha));

      if (esAdmin()) {
        var acciones = el("div", "admin-msg-acciones");
        var publicar = el("button", "btn btn-pequeno btn-donar", "Publicar en el blog");
        publicar.type = "button";
        publicar.addEventListener("click", function () {
          noticias.unshift({
            id: nuevoId("noticia"), titulo: m.asunto, categoria: m.tipo,
            autor: ses.usuario, fecha: fechaHoy(), imagen: m.imagen || "",
            contenido: m.detalle, comentarios: [], reacciones: {}
          });
          guardarNoticias();
          pintarNoticias();
        });
        var borrar = el("button", "btn btn-pequeno", "Eliminar");
        borrar.type = "button";
        borrar.addEventListener("click", function () {
          guardar("mensajes", leer("mensajes", []).filter(function (x) { return x.id !== m.id; }));
          pintarHistorialMensajes();
        });
        acciones.appendChild(publicar);
        acciones.appendChild(borrar);
        item.appendChild(acciones);
      }
      cont.appendChild(item);
    });
  }

  var formMensaje = $("form-mensaje-admin");
  if (formMensaje) {
    formMensaje.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = $("msg-admin-feedback");
      var ses = getSesion();
      if (!ses) { mensaje(msg, "Inicia sesión para enviar mensajes.", false); return; }
      var lista = leer("mensajes", []);
      lista.unshift({
        id: nuevoId("msg"),
        usuario: ses.usuario,
        remitente: $("admin-remitente").value.trim(),
        tipo: $("admin-tipo-evento").value,
        sector: $("admin-sector").value.trim(),
        asunto: $("admin-asunto").value.trim(),
        detalle: $("admin-detalle").value.trim(),
        imagen: imgMensaje.valor(),
        fecha: fechaHoy()
      });
      if (!guardar("mensajes", lista)) {
        lista[0].imagen = "";
        guardar("mensajes", lista);
        mensaje(msg, "Mensaje enviado (la imagen era muy pesada y no se adjuntó).");
      } else {
        mensaje(msg, "Mensaje enviado a los administradores.");
      }
      formMensaje.reset();
      imgMensaje.reset();
      $("admin-remitente").value = ses.usuario;
      pintarHistorialMensajes();
    });
  }

  /* ---------- donaciones ---------- */
  var btnDonar = $("btn-quiero-donar");
  if (btnDonar) {
    btnDonar.addEventListener("click", function () {
      var panel = $("panel-cuentas-donacion");
      var oculto = panel.style.display === "none";
      panel.style.display = oculto ? "block" : "none";
      btnDonar.setAttribute("aria-expanded", oculto ? "true" : "false");
    });
  }

  function copiarTexto(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(texto);
    }
    return new Promise(function (ok, fallo) {
      var t = document.createElement("textarea");
      t.value = texto;
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      try { document.execCommand("copy") ? ok() : fallo(); } catch (err) { fallo(err); }
      document.body.removeChild(t);
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll(".btn-copiar-cuenta"), function (b) {
    b.addEventListener("click", function () {
      var original = b.textContent;
      copiarTexto(b.getAttribute("data-copiar") || "").then(function () {
        b.textContent = "¡Copiado!";
      }, function () {
        b.textContent = "No se pudo copiar";
      }).then(function () {
        setTimeout(function () { b.textContent = original; }, 1600);
      });
    });
  });

  /* ---------- estado de sesión en toda la página ---------- */
  function mostrar(nodo, visible, tipo) {
    if (nodo) nodo.style.display = visible ? (tipo || "") : "none";
  }

  function actualizarSesion() {
    var ses = getSesion();
    var admin = !!(ses && ses.rol === "admin");

    var badge = $("badge-usuario-activo");
    if (badge) {
      badge.textContent = ses ? (admin ? "ADMIN · " : "👤 ") + ses.usuario : "";
      badge.classList.toggle("es-admin", admin);
      mostrar(badge, !!ses);
    }
    mostrar($("btn-top-login"), !ses);
    mostrar($("btn-top-crear"), !ses);
    mostrar($("btn-top-cerrar"), !!ses);
    mostrar($("btn-blog-login"), !ses);
    mostrar($("btn-blog-crear"), !ses);

    var texto = $("texto-estado-sesion");
    if (texto) {
      texto.textContent = ses
        ? (admin
          ? "Sesión de administrador activa: puedes publicar en el blog y en protestas."
          : "Sesión iniciada como " + ses.usuario + ": ya puedes comentar y enviar mensajes a los administradores.")
        : "Modo visitante: puedes ver y reaccionar a las publicaciones, pero debes iniciar sesión o crear tu usuario para comentar o enviar mensajes.";
    }

    var panelBlog = $("panel-admin-blog");
    if (panelBlog) panelBlog.classList.toggle("visible", admin);
    var barraProtesta = $("barra-admin-protesta");
    if (barraProtesta) barraProtesta.classList.toggle("visible", admin);

    /* formulario de mensajes: solo con sesión */
    if (formMensaje) {
      var aviso = $("aviso-bloqueo-admin");
      if (aviso) {
        aviso.textContent = ses ? "" : "Para enviar mensajes a los administradores debes iniciar sesión o crear tu usuario.";
        aviso.style.display = ses ? "none" : "";
      }
      Array.prototype.forEach.call(formMensaje.querySelectorAll("input, select, textarea, button"), function (c) {
        c.disabled = !ses;
      });
      var remitente = $("admin-remitente");
      if (remitente && ses && !remitente.value) remitente.value = ses.usuario;
    }

    pintarNoticias();
    pintarProtestas();
    pintarHistorialMensajes();
  }

  /* ---------- fondo de patrón y video principal ---------- */
  if (DATOS.patronUrl) {
    document.documentElement.style.setProperty("--patron-url", 'url("' + DATOS.patronUrl + '")');
  }

  (function () {
    var video = document.querySelector(".video-hero-principal");
    if (!video) return;
    video.muted = true;
    var intentar = function () { var p = video.play(); if (p && p.catch) p.catch(function () { /* ignorar */ }); };
    intentar();
    ["touchstart", "click"].forEach(function (ev) {
      document.addEventListener(ev, function once() {
        intentar();
        document.removeEventListener(ev, once);
      }, { passive: true });
    });
  })();

  actualizarSesion();
})();

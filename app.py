import base64
import functools
import http.server
import json
import os
import socketserver
import sys
import threading
import unicodedata
import webbrowser

# =====================================================================
# 🛠️ DETECCIÓN INTELIGENTE DE LOGO, PATRÓN Y COLLAGE TURÍSTICO
# =====================================================================
logo_src = "https://picsum.photos/id/10/140/60"
patron_src = ""
collage_src = ""

EXTENSIONES_IMAGEN = (".png", ".jpg", ".jpeg", ".webp", ".gif")


def normalizar_texto(texto):
  nfkd = unicodedata.normalize("NFKD", texto.lower())
  return "".join(c for c in nfkd if not unicodedata.combining(c))


def cargar_imagen_base64(ruta_archivo):
  nombre_lower = ruta_archivo.lower()
  with open(ruta_archivo, "rb") as img_file:
    encoded = base64.b64encode(img_file.read()).decode("utf-8")
    if nombre_lower.endswith(".png"):
      mime = "image/png"
    elif nombre_lower.endswith(".webp"):
      mime = "image/webp"
    elif nombre_lower.endswith(".gif"):
      mime = "image/gif"
    else:
      mime = "image/jpeg"
    return f"data:{mime};base64,{encoded}"


def obtener_rutas_busqueda():
  rutas = ["."]
  escritorios = [
      os.path.expanduser("~/Desktop"),
      os.path.expanduser("~/OneDrive/Desktop"),
      os.path.expanduser("~/OneDrive/Escritorio"),
      os.path.expanduser("~/Escritorio"),
  ]
  for esc in escritorios:
    if os.path.isdir(esc):
      rutas.append(esc)
      carpeta_rd = os.path.join(esc, "pagina rd")
      if os.path.isdir(carpeta_rd):
        rutas.append(carpeta_rd)
      for item in os.listdir(esc):
        sub = os.path.join(esc, item)
        if os.path.isdir(sub):
          rutas.append(sub)
  return list(dict.fromkeys(os.path.abspath(r) for r in rutas))


candidatos_logo = []
candidatos_patron = []
candidatos_collage = []

for carpeta in obtener_rutas_busqueda():
  try:
    archivos = os.listdir(carpeta)
  except OSError:
    continue

  for archivo in archivos:
    ruta_completa = os.path.join(carpeta, archivo)
    if not os.path.isfile(ruta_completa):
      continue

    nombre_norm = normalizar_texto(archivo)
    tiene_extension = nombre_norm.endswith(EXTENSIONES_IMAGEN)

    if "corazon dominicano tropical" in nombre_norm or nombre_norm.startswith(
        "logo_corazon"
    ):
      if tiene_extension or "." not in nombre_norm:
        prioridad = 0 if "corazon dominicano tropical" in nombre_norm else 1
        candidatos_logo.append((prioridad, ruta_completa))

    elif (
        "fondo_rd_muchas_repetible" in nombre_norm
        or "repetible" in nombre_norm
        or "fondo_rd" in nombre_norm
        or "patron" in nombre_norm
        or "banderas" in nombre_norm
    ):
      if tiene_extension or "." not in nombre_norm:
        prioridad = (
            0
            if "fondo_rd_muchas_repetible" in nombre_norm
            or "repetible" in nombre_norm
            else 1
        )
        candidatos_patron.append((prioridad, ruta_completa))

    elif (
        "playa_rd" in nombre_norm
        or "playas" in nombre_norm
        or "playa" in nombre_norm
        or "collage" in nombre_norm
        or "turistico" in nombre_norm
        or "republica" in nombre_norm
    ):
      prioridad = 0 if "playa_rd" in nombre_norm else 1
      candidatos_collage.append((prioridad, ruta_completa))

if candidatos_logo:
  candidatos_logo.sort(key=lambda x: x[0])
  logo_src = cargar_imagen_base64(candidatos_logo[0][1])

if candidatos_patron:
  candidatos_patron.sort(key=lambda x: x[0])
  patron_src = cargar_imagen_base64(candidatos_patron[0][1])

if candidatos_collage:
  candidatos_collage.sort(key=lambda x: x[0])
  collage_src = cargar_imagen_base64(candidatos_collage[0][1])


# =====================================================================
# 🧩 CONFIGURACIÓN Y LOS 6 BOTONES DEL MENÚ EN UN SOLO LUGAR
# =====================================================================
CONFIG_PAGINA = {
    "nombre_empresa": "CORAZÓN RD",
    "slogan_principal": "CORAZÓN RD",
    "descripcion_hero": (
        "Un espacio de coordinación ciudadana donde el pueblo hace valer su"
        " fuerza con hechos."
    ),
    "admin_defecto": {
        "usuario": "fafi_admin",
        "password": os.environ.get("FAFI_ADMIN_PASSWORD", "1234rd"),
        "comunidad": "Administración Central CORAZÓN RD",
        "email": "admin@corazonrd.org",
        "rol": "admin",
    },
    "ideales_bloque": {
        "badge": "EL PUEBLO TIENE EL PODER",
        "titulo": (
            "EL PUEBLO TIENE EL PODER CUANDO SE COORDINA, ⚠️ NO EN LAS PROMESAS"
            " DEL GOBIERNO"
        ),
        "pilares": [
            {
                "numero": "01",
                "titulo": "SIN DEPENDER DE NADIE",
                "texto": (
                    "El poder real no está en un cargo público; nace cuando la"
                    " gente deja de esperar salvadores y se organiza."
                ),
            },
            {
                "numero": "02",
                "titulo": "GRUPO COORDINADO",
                "texto": (
                    "Un grupo lo suficientemente grande, unido y con rumbo claro"
                    " tiene peso real para exigir y mover soluciones."
                ),
            },
            {
                "numero": "03",
                "titulo": "CERO PROMESAS FALSAS",
                "texto": (
                    "No creemos en discursos vacíos: coordinamos acción ciudadana"
                    " para que los compromisos se cumplan de verdad."
                ),
            },
        ],
    },
    "quienes_somos_bloque": {
        "badge": "PATRIOTAS POR EL FUTURO",
        "titulo": "QUIÉNES SOMOS",
        "cita": (
            "“SI LOS DE ABAJOS NOS UNIMOS, LOS DE ARRIBA PIERDEN EL CONTROL QUE"
            " CREEN QUE TIENEN”"
        ),
        "descripcion": (
            "Somos un grupo de patriotas que busca que el país tenga un mejor"
            " futuro para todos los dominicanos de hoy y el futuro que viene."
            " Todas las comunidades unidas —desde las juntas de vecinos hasta el"
            " que vende coco y limpia botas— tienen el poder para protestar por"
            " lo más mínimo sin que el gobierno haga lo que le plazca."
        ),
        "pilares_comunidad": [
            {
                "etiqueta": "BARRIO Y COMUNIDAD",
                "titulo": "JUNTAS DE VECINOS UNIDAS",
                "texto": (
                    "Cada calle, sector y comunidad organizada es el primer"
                    " frente para defender lo justo."
                ),
            },
            {
                "etiqueta": "TRABAJO DIGNO DE CALLE",
                "titulo": "DEL QUE VENDE COCO AL LIMPIABOTAS",
                "texto": (
                    "La gente trabajadora de todos los días tiene voz, peso y"
                    " derecho a exigir respeto."
                ),
            },
            {
                "etiqueta": "FIRMEZA CIUDADANA",
                "titulo": "PROTESTA POR LO MÍNIMO",
                "texto": (
                    "No normalizamos abusos ni caprichos: alzamos la voz unidos"
                    " para que no se haga lo que plazca."
                ),
            },
        ],
    },
    "blog_config": {
        "titulo_menu": "Blog",
        "titulo_seccion": "BLOG Y EVENTOS",
        "descripcion": (
            "Publicaciones comunitarias administradas por el equipo. Todos los"
            " usuarios pueden reaccionar a las publicaciones; para comentar o"
            " enviar mensajes a los administradores, inicia sesión o crea tu"
            " usuario."
        ),
        "noticias_iniciales": [
            {
                "id": "noticia-1",
                "titulo": (
                    "Juntas de vecinos se coordinan para exigir respuesta en sus"
                    " sectores"
                ),
                "categoria": "Comunidad",
                "autor": "fafi_admin",
                "fecha": "Hoy",
                "imagen": "https://picsum.photos/id/1018/600/350",
                "contenido": (
                    "Vecinos y trabajadores de distintos puntos coinciden en que"
                    " organizarse por barrio y mantener comunicación constante"
                    " permite defender lo más básico sin esperar promesas"
                    " vacías."
                ),
                "comentarios": [{
                    "autor": "Juan Pérez",
                    "texto": (
                        "Cuando los barrios se ponen de acuerdo de verdad, la voz"
                        " pesa más."
                    ),
                }],
            },
            {
                "id": "noticia-2",
                "titulo": (
                    "El valor del trabajo diario y la participación de toda la"
                    " gente"
                ),
                "categoria": "Voz del Pueblo",
                "autor": "fafi_admin",
                "fecha": "Ayer",
                "imagen": "https://picsum.photos/id/1015/600/350",
                "contenido": (
                    "Desde el que vende coco y el que limpia botas hasta"
                    " comerciantes y familias: cada persona que trabaja y"
                    " aporta tiene derecho a alzar la voz y exigir respeto."
                ),
                "comentarios": [],
            },
        ],
    },
    "mensajes_admin_config": {
        "titulo_menu": "Mensajes Admin",
        "titulo_seccion": "MENSAJES A LOS ADMINISTRADORES",
        "descripcion": (
            "Si tienes cuenta registrada y hay algún evento importante,"
            " asamblea comunitaria, protesta o situación urgente en tu sector,"
            " envíale el detalle a los administradores."
        ),
    },
    "donaciones": {
        "titulo_menu": "Donaciones",
        "titulo_seccion": "DONACIONES",
        "descripcion": (
            "Con un peso dominicano puedes apoyar a que mañana seamos un mejor"
            " país, este dinero es usado únicamente con el fin de ayudar a los"
            " eventos y protestas futuras en cualquier parte del país."
        ),
        "texto_boton": "QUIERO DONAR",
        "cuentas": [
            {
                "nombre": "PayPal",
                "etiqueta": "Cuenta / Enlace PayPal",
                "dato": "paypal.me/corazonrd",
            },
            {
                "nombre": "Banreservas",
                "etiqueta": "Cuenta de Ahorros Banreservas",
                "dato": "960-000000-1 (Corazón RD)",
            },
            {
                "nombre": "Popular",
                "etiqueta": "Cuenta Banco Popular",
                "dato": "800-000000-2 (Corazón RD)",
            },
            {
                "nombre": "BHD",
                "etiqueta": "Cuenta Banco BHD",
                "dato": "700-000000-3 (Corazón RD)",
            },
        ],
        "mensaje_motivador": (
            "Un peso suma cuando el pueblo camina junto: hoy es una semilla de"
            " dignidad, mañana es la fuerza que despierta a un país entero."
        ),
    },
    "logo_url": logo_src,
    "patron_url": patron_src,
    "collage_url": collage_src if collage_src else "playa_rd.png",
    "redes_sociales": {
        "facebook": "https://facebook.com",
        "instagram": "https://instagram.com",
        "linkedin": "https://linkedin.com",
        "youtube": "https://youtube.com",
        "tiktok": "https://tiktok.com",
    },
    "secciones": [
        {
            "id": "ideales",
            "titulo_menu": "Ideales",
            "titulo_seccion": "IDEALES",
            "subtitulo": "LO QUE DEFENDEMOS EN PALABRAS CLARAS",
            "descripcion": "",
            "proyectos": [],
        },
        {
            "id": "protesta",
            "titulo_menu": "Protesta",
            "titulo_seccion": "PROTESTA",
            "subtitulo": "ACCIÓN CIUDADANA ORGANIZADA",
            "descripcion": (
                "Expresión visual, denuncia y movilización coordinada para que"
                " las demandas del pueblo no se ignoren y cada compromiso se"
                " haga cumplir con hechos. Todos los usuarios pueden reaccionar a"
                " cada publicación."
            ),
            "proyectos": [
                {
                    "id": "protesta-1",
                    "titulo": "Voz Coordinada",
                    "categoria": "Acción Ciudadana",
                    "imagen": "https://picsum.photos/id/1025/600/400",
                },
                {
                    "id": "protesta-2",
                    "titulo": "Que Se Cumpla",
                    "categoria": "Fiscalización",
                    "imagen": "https://picsum.photos/id/1024/600/400",
                },
            ],
        },
        {
            "id": "quienes-somos",
            "titulo_menu": "Quiénes Somos",
            "titulo_seccion": "QUIÉNES SOMOS",
            "subtitulo": "PATRIOTAS POR UN MEJOR FUTURO",
            "descripcion": "",
            "proyectos": [],
        },
    ],
}

MENU_6_BOTONES = [
    {"id": "ideales", "titulo_menu": "Ideales"},
    {"id": "protesta", "titulo_menu": "Protesta"},
    {"id": "quienes-somos", "titulo_menu": "Quiénes Somos"},
    {"id": "blog", "titulo_menu": CONFIG_PAGINA["blog_config"]["titulo_menu"]},
    {
        "id": "mensajes-admin",
        "titulo_menu": CONFIG_PAGINA["mensajes_admin_config"]["titulo_menu"],
    },
    {
        "id": "donaciones",
        "titulo_menu": CONFIG_PAGINA["donaciones"]["titulo_menu"],
    },
]


def render_seccion_boton(boton_id):
  if boton_id == "ideales":
    ib = CONFIG_PAGINA["ideales_bloque"]
    pilares_html = "".join([
        f"""
            <div class="pilar-card">
                <span class="pilar-num">{item['numero']}</span>
                <h3>{item['titulo']}</h3>
                <p>{item['texto']}</p>
            </div>
            """
        for item in ib["pilares"]
    ])
    return f"""
        <section id="ideales" class="section">
            <div style="padding: 0 50px;">
                <div class="content-box ideales-box">
                    <span class="hero-badge">{ib['badge']}</span>
                    <h2 class="ideales-main-title">{ib['titulo']}</h2>

                    <div class="pilares-grid">
                        {pilares_html}
                    </div>
                </div>
            </div>
        </section>
        """

  if boton_id == "protesta":
    sec = next(
        (s for s in CONFIG_PAGINA["secciones"] if s["id"] == "protesta"), {}
    )
    desc_html = (
        f"<p>{sec['descripcion']}</p>" if sec.get("descripcion") else ""
    )
    return f"""
        <section id="protesta" class="section">
            <div style="padding: 0 50px;">
                <div class="content-box">
                    <div class="section-header">
                        <h2>{sec.get('titulo_seccion', 'PROTESTA')}</h2>
                        {desc_html}
                    </div>
                    <div id="protesta-contenedor" class="grid"></div>
                </div>
            </div>
        </section>
        """

  if boton_id == "quienes-somos":
    qs = CONFIG_PAGINA["quienes_somos_bloque"]
    comunidad_html = "".join([
        f"""
            <div class="comunidad-card">
                <span>{item['etiqueta']}</span>
                <h3>{item['titulo']}</h3>
                <p>{item['texto']}</p>
            </div>
            """
        for item in qs["pilares_comunidad"]
    ])
    return f"""
        <section id="quienes-somos" class="section">
            <div style="padding: 0 50px;">
                <div class="content-box quienes-somos-box">
                    <span class="hero-badge">{qs['badge']}</span>
                    <h2>{qs['titulo']}</h2>

                    <blockquote class="manifiesto-cita">
                        {qs['cita']}
                    </blockquote>

                    <p class="quienes-somos-desc">{qs['descripcion']}</p>

                    <div class="comunidad-grid">
                        {comunidad_html}
                    </div>
                </div>
            </div>
        </section>
        """

  if boton_id == "blog":
    blog = CONFIG_PAGINA["blog_config"]
    return f"""
        <section id="blog" class="section">
            <div style="padding: 0 50px;">
                <div class="content-box">
                    <div class="section-header">
                        <h2>{blog['titulo_seccion']}</h2>
                        <p>{blog['descripcion']}</p>
                    </div>

                    <div id="estado-sesion-blog" class="estado-sesion-banner">
                        <p id="texto-estado-sesion">Modo visitante: puedes ver y reaccionar a las publicaciones, pero debes iniciar sesión o crear tu usuario para comentar o enviar mensajes.</p>
                        <div style="display:flex; gap:10px; flex-wrap:wrap;">
                            <button type="button" id="btn-blog-login" class="btn btn-donar btn-pequeno">Iniciar Sesión</button>
                            <button type="button" id="btn-blog-crear" class="btn btn-pequeno">Crear Usuario</button>
                        </div>
                    </div>

                    <div id="panel-admin-blog" class="admin-panel-box">
                        <h3>Panel de Administración (fafi_admin) — Publicar en el Blog</h3>
                        <form id="form-publicar-noticia">
                            <div class="acceso-fila-dos">
                                <div class="campo-grupo">
                                    <label for="pub-titulo">Título de la publicación</label>
                                    <input type="text" id="pub-titulo" required placeholder="Título del evento o noticia...">
                                </div>
                                <div class="campo-grupo">
                                    <label for="pub-categoria">Categoría</label>
                                    <input type="text" id="pub-categoria" required placeholder="Ej. Movilización, Comunidad...">
                                </div>
                            </div>

                            <div class="campo-grupo">
                                <label for="pub-imagen">Imagen (sube desde tu PC/teléfono o pega URL)</label>
                                <div class="subir-imagen-fila">
                                    <button type="button" id="btn-subir-imagen-archivo" class="btn btn-pequeno">Subir imagen desde PC o teléfono</button>
                                    <button type="button" id="btn-quitar-pub-img" class="btn btn-pequeno" style="display:none;">Quitar imagen</button>
                                    <input type="file" id="input-archivo-imagen" accept="image/*" style="display:none;">
                                    <span id="nombre-archivo-imagen" style="font-size:0.84rem; color:#ffd166;"></span>
                                </div>
                                <input type="text" id="pub-imagen" placeholder="O pega aquí un enlace de imagen (opcional)">
                                <img id="vista-previa-pub-img" class="vista-previa-img" alt="Vista previa de imagen">
                            </div>

                            <div class="campo-grupo">
                                <label for="pub-contenido">Contenido</label>
                                <textarea id="pub-contenido" required placeholder="Escribe el mensaje o anuncio..."></textarea>
                            </div>
                            <button type="submit" class="btn btn-donar btn-pequeno">Publicar Noticia</button>
                        </form>
                        <p id="msg-pub-admin" class="mensaje-feedback"></p>
                    </div>

                    <div id="noticias-contenedor" class="noticias-lista"></div>
                </div>
            </div>
        </section>
        """

  if boton_id == "mensajes-admin":
    ma = CONFIG_PAGINA["mensajes_admin_config"]
    return f"""
        <section id="mensajes-admin" class="section">
            <div style="padding: 0 50px;">
                <div class="content-box">
                    <div class="section-header">
                        <h2>{ma['titulo_seccion']}</h2>
                        <p>{ma['descripcion']}</p>
                    </div>

                    <div class="admin-msg-box">
                        <p id="aviso-bloqueo-admin" class="aviso-solo-lectura" style="margin-bottom:14px;"></p>
                        <form id="form-mensaje-admin">
                            <div class="acceso-fila-dos">
                                <div class="campo-grupo">
                                    <label for="admin-remitente">Tu nombre o usuario</label>
                                    <input type="text" id="admin-remitente" required placeholder="Ej. Juan / @voz_barrio">
                                </div>
                                <div class="campo-grupo">
                                    <label for="admin-tipo-evento">Tipo de evento o aviso</label>
                                    <select id="admin-tipo-evento">
                                        <option value="Evento Importante">Evento Importante</option>
                                        <option value="Asamblea Comunitaria">Asamblea Comunitaria</option>
                                        <option value="Movilización / Protesta">Movilización / Protesta</option>
                                        <option value="Reporte de Barrio">Reporte de Barrio</option>
                                    </select>
                                </div>
                            </div>

                            <div class="acceso-fila-dos">
                                <div class="campo-grupo">
                                    <label for="admin-sector">Comunidad, junta de vecinos o lugar</label>
                                    <input type="text" id="admin-sector" required placeholder="Ej. Sector Pueblo Nuevo, Junta de Vecinos...">
                                </div>
                                <div class="campo-grupo">
                                    <label for="admin-asunto">Asunto del evento</label>
                                    <input type="text" id="admin-asunto" required placeholder="Título o motivo principal...">
                                </div>
                            </div>

                            <div class="campo-grupo">
                                <label>Foto o evidencia (opcional — desde PC o teléfono)</label>
                                <div class="subir-imagen-fila">
                                    <button type="button" id="btn-subir-admin-img" class="btn btn-pequeno">Subir imagen desde PC o teléfono</button>
                                    <button type="button" id="btn-quitar-admin-img" class="btn btn-pequeno" style="display:none;">Quitar imagen</button>
                                    <input type="file" id="input-archivo-admin-img" accept="image/*" style="display:none;">
                                    <span id="nombre-archivo-admin-img" style="font-size:0.84rem; color:#ffd166;"></span>
                                </div>
                                <img id="vista-previa-admin-img" class="vista-previa-img" alt="Vista previa adjunto para administradores">
                            </div>

                            <div class="campo-grupo">
                                <label for="admin-detalle">Detalles del evento (fecha, hora, lugar y qué pasa)</label>
                                <textarea id="admin-detalle" required placeholder="Explica los detalles para que los administradores revisen y publiquen el evento..."></textarea>
                            </div>

                            <button type="submit" id="btn-enviar-admin" class="btn btn-donar">Enviar Mensaje a Administradores</button>
                        </form>
                        <p id="msg-admin-feedback" class="mensaje-feedback"></p>
                    </div>

                    <div id="historial-mensajes-admin" class="admin-msg-historial"></div>
                </div>
            </div>
        </section>
        """

  if boton_id == "donaciones":
    don = CONFIG_PAGINA["donaciones"]
    cuentas_html = "".join([
        f"""
            <div class="cuenta-tarjeta">
                <span class="cuenta-banco">{c['nombre']}</span>
                <p class="cuenta-etiqueta">{c['etiqueta']}</p>
                <p class="cuenta-numero">{c['dato']}</p>
                <button type="button" class="btn btn-pequeno btn-copiar-cuenta" data-copiar="{c['nombre']}: {c['dato']}">Copiar</button>
            </div>
            """
        for c in don["cuentas"]
    ])
    return f"""
        <section id="donaciones" class="section">
            <div style="padding: 0 50px;">
                <div class="content-box">
                    <div class="section-header">
                        <h2>{don['titulo_seccion']}</h2>
                        <p>{don['descripcion']}</p>
                    </div>

                    <div class="donacion-accion-area">
                        <button type="button" class="btn btn-donar" id="btn-quiero-donar" aria-expanded="false" aria-controls="panel-cuentas-donacion">
                            {don['texto_boton']}
                        </button>

                        <div id="panel-cuentas-donacion" class="cuentas-desplegable" style="display:none;">
                            {cuentas_html}
                        </div>
                    </div>

                    <p class="mensaje-motivador-donacion">
                        {don['mensaje_motivador']}
                    </p>
                </div>
            </div>
        </section>
        """

  return ""


MENU_6_BOTONES_HTML = "".join([
    f'<li><a href="#{b["id"]}" data-menu-id="{b["id"]}">{b["titulo_menu"]}</a></li>'
    for b in MENU_6_BOTONES
])

SECCIONES_6_BOTONES_HTML = "".join(
    [render_seccion_boton(b["id"]) for b in MENU_6_BOTONES]
)

PROTESTAS_INICIALES = next(
    (s["proyectos"] for s in CONFIG_PAGINA["secciones"] if s["id"] == "protesta"),
    [],
)

DATOS_JS = json.dumps(
    {
        "adminDefecto": CONFIG_PAGINA["admin_defecto"],
        "noticiasDefecto": CONFIG_PAGINA["blog_config"]["noticias_iniciales"],
        "protestasDefecto": PROTESTAS_INICIALES,
        "menu6Ids": [b["id"] for b in MENU_6_BOTONES],
        "patronUrl": CONFIG_PAGINA["patron_url"],
    },
    ensure_ascii=False,
)

HTML_TEMPLATE = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{CONFIG_PAGINA['nombre_empresa']}</title>
    <link rel="stylesheet" href="recursos/estilos.css">
</head>
<body>

    <div class="top-left-auth" aria-label="Acceso de usuario">
        <span id="badge-usuario-activo" class="usuario-badge" style="display:none;"></span>
        <button type="button" class="btn btn-donar btn-pequeno" id="btn-top-login">Iniciar Sesión</button>
        <button type="button" class="btn btn-pequeno" id="btn-top-crear">Crear Usuario</button>
        <button type="button" class="btn btn-pequeno" id="btn-top-cerrar" style="display:none;">Cerrar Sesión</button>
    </div>

    <div id="modal-login" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-login">
        <div class="modal-ventana">
            <button type="button" class="modal-cerrar" data-cerrar-modal="modal-login" aria-label="Cerrar ventana">×</button>
            <h3 id="titulo-modal-login">Iniciar Sesión</h3>
            <p class="acceso-lema">Entra con tu cuenta para comentar y enviar mensajes a los administradores.</p>
            <form id="form-login-usuario">
                <div class="campo-grupo">
                    <label for="login-usuario">Usuario o correo</label>
                    <input type="text" id="login-usuario" required placeholder="Tu usuario o correo">
                </div>
                <div class="campo-grupo">
                    <label for="login-password">Contraseña</label>
                    <input type="password" id="login-password" required placeholder="Tu contraseña">
                </div>
                <button type="submit" class="btn btn-donar">Entrar</button>
            </form>
            <p id="msg-login" class="mensaje-feedback"></p>
        </div>
    </div>

    <div id="modal-crear-usuario" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-crear">
        <div class="modal-ventana">
            <button type="button" class="modal-cerrar" data-cerrar-modal="modal-crear-usuario" aria-label="Cerrar ventana">×</button>
            <h3 id="titulo-modal-crear">Crear Usuario</h3>
            <p class="acceso-lema">“SI LOS DE ABAJOS NOS UNIMOS, LOS DE ARRIBA PIERDEN EL CONTROL QUE CREEN QUE TIENEN”</p>
            <form id="form-registro-usuario">
                <div class="acceso-fila-dos">
                    <div class="campo-grupo">
                        <label for="reg-usuario">Nombre de usuario</label>
                        <input type="text" id="reg-usuario" required placeholder="Ej. voz_del_barrio">
                    </div>
                    <div class="campo-grupo">
                        <label for="reg-comunidad">Junta de vecinos, sector o oficio</label>
                        <input type="text" id="reg-comunidad" required placeholder="Ej. Junta de vecinos, vendedor de coco...">
                    </div>
                </div>

                <div class="campo-grupo">
                    <label for="reg-email">Correo electrónico</label>
                    <input type="email" id="reg-email" required placeholder="correo@ejemplo.com">
                </div>

                <div class="acceso-fila-dos">
                    <div class="campo-grupo">
                        <label for="reg-password">Contraseña</label>
                        <input type="password" id="reg-password" required placeholder="Crea una contraseña">
                    </div>
                    <div class="campo-grupo">
                        <label for="reg-confirmar-password">Confirmar contraseña</label>
                        <input type="password" id="reg-confirmar-password" required placeholder="Repite tu contraseña">
                    </div>
                </div>

                <button type="submit" class="btn btn-donar">Crear Usuario</button>
            </form>
            <p id="msg-registro" class="mensaje-feedback"></p>
        </div>
    </div>

    <div class="main-content">
        <section id="inicio" class="hero">
            <div class="collage-container">
                <img src="{CONFIG_PAGINA['collage_url']}" alt="Playas de República Dominicana">
            </div>

            <div class="hero-text-area">
                <div class="content-box">
                    <h1>{CONFIG_PAGINA['slogan_principal']}</h1>
                    <p>{CONFIG_PAGINA['descripcion_hero']}</p>
                    <div class="hero-actions">
                        <a href="#mensajes-admin" class="btn btn-donar">Avisar Evento a Admin</a>
                        <a href="#blog" class="btn">Ir al Blog</a>
                    </div>
                </div>
            </div>
        </section>

        {SECCIONES_6_BOTONES_HTML}
    </div>

    <div class="ticker-inferior" aria-label="Mensaje ciudadano en movimiento">
        <div class="ticker-pista">
            <div class="ticker-frase">
                🔥 EL PUEBLO UNIDO!!! <span class="resalte-alerta">•</span> UN GOBIERNO DE RODILLAS 🔥
            </div>
        </div>
    </div>

    <aside class="sidebar-border"></aside>

    <aside class="sidebar">
        <div class="sidebar-logo">
            <a href="#inicio" class="btn-inicio-img" title="Regresar al inicio" aria-label="Regresar al inicio">
                <img src="{CONFIG_PAGINA['logo_url']}" alt="Corazón Dominicano Tropical - Ir al inicio">
            </a>
        </div>

        <ul class="sidebar-nav" id="menu-principal-6">
            {MENU_6_BOTONES_HTML}
        </ul>

        <div class="sidebar-socials">
            <a href="{CONFIG_PAGINA['redes_sociales']['facebook']}" target="_blank" title="Facebook">
                <svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="{CONFIG_PAGINA['redes_sociales']['instagram']}" target="_blank" title="Instagram">
                <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a href="{CONFIG_PAGINA['redes_sociales']['linkedin']}" target="_blank" title="LinkedIn">
                <svg viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
            </a>
            <a href="{CONFIG_PAGINA['redes_sociales']['youtube']}" target="_blank" title="YouTube">
                <svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
            <a href="{CONFIG_PAGINA['redes_sociales']['tiktok']}" target="_blank" title="TikTok">
                <svg viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
            </a>
        </div>
    </aside>

    <script>
        window.CORAZON_RD_DATOS = {DATOS_JS};
    </script>
    <script src="recursos/app_logica.js"></script>
</body>
</html>
"""


class ManejadorCorazonRD(http.server.SimpleHTTPRequestHandler):
  def __init__(self, *args, **kwargs):
    super().__init__(*args, directory=".", **kwargs)

  def do_GET(self):
    ruta_limpia = self.path.split("?")[0]
    if ruta_limpia in ("", "/", "/index.html"):
      cuerpo = HTML_TEMPLATE.encode("utf-8")
      self.send_response(200)
      self.send_header("Content-Type", "text/html; charset=utf-8")
      self.send_header("Content-Length", str(len(cuerpo)))
      self.end_headers()
      self.wfile.write(cuerpo)
      return
    return super().do_GET()

  def log_message(self, format, *args):
    sys.stderr.write(f"[CorazonRD] {self.address_string()} - {format % args}\n")


class ServidorReutilizable(socketserver.ThreadingMixIn, http.server.HTTPServer):
  allow_reuse_address = True
  daemon_threads = True


def abrir_navegador_local(url):
  if not os.environ.get("RENDER"):
    threading.Timer(1.0, lambda: webbrowser.open(url)).start()


if __name__ == "__main__":
  puerto = int(os.environ.get("PORT", 8000))
  host = "0.0.0.0"
  servidor = ServidorReutilizable((host, puerto), ManejadorCorazonRD)
  print(f"Servidor CORAZÓN RD escuchando en http://{host}:{puerto}", flush=True)
  abrir_navegador_local(f"http://127.0.0.1:{puerto}")
  try:
    servidor.serve_forever()
  except KeyboardInterrupt:
    print("\nServidor detenido.", flush=True)
  finally:
    servidor.server_close()
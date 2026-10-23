# Landing informativa — Sede Cobán, UMG

Sitio estático de una sola página hecho como **proyecto académico estudiantil**. No es un canal oficial de la Universidad Mariano Gálvez de Guatemala. Usa solo HTML, CSS y JavaScript con archivos locales: no tiene backend, base de datos, formularios ni dependencias.

```
index.html        Contenido de todas las secciones
css/styles.css    Colores, tipografía y diseño adaptable
css/efectos.css   Animaciones y efectos interactivos
js/main.js        Menú, filtros, avisos, pestañas y modo revisión
js/efectos.js     Partículas, tarjetas que giran, contadores, inclinación 3D, etc.
imagenes/         Escudo y fotografías
```

## Efectos interactivos

- **Presentación:** red de partículas que reacciona al cursor, manchas de color en movimiento, palabra que se escribe sola (se edita en `data-words="carrera|futuro|..."`) y foto con inclinación 3D.
- **Carreras:** tarjetas que giran en 3D con un brillo de colores alrededor. En computadora giran al pasar el cursor. En celular giran al tocar el botón ↻. Con el teclado giran al llegar con Tab al enlace del reverso.
- **Servicios:** borde de colores que gira y luz que sigue al cursor.
- **Otros:** cinta en movimiento, contadores animados (calculados a partir de las tarjetas), paneles de fotos que se expanden, línea de tiempo de avisos que se dibuja al bajar, botones magnéticos con onda, preguntas que se abren suavemente y botón "volver arriba" con anillo de progreso.
- **Accesibilidad:** el botón **Pausar animaciones** del menú detiene todo el movimiento y la preferencia se recuerda en el navegador. Si el sistema tiene activada la opción de reducir movimiento, la página arranca sin animaciones.
- Si quitas `css/efectos.css` y `js/efectos.js` del `<head>`, la página sigue funcionando completa, solo que sin efectos.

## Fuente de los datos

La información se tomó del sitio oficial el **21/10/2026**:

- [umg.edu.gt/coban](https://www.umg.edu.gt/coban): oferta académica, direcciones, teléfonos, correo, horarios, servicios y cifras del campus.
- La página oficial de cada programa (por ejemplo, [umg.edu.gt/090](https://www.umg.edu.gt/090)): duración, modalidad y título que otorga.
- [umg.edu.gt/info/aspirantes](https://www.umg.edu.gt/info/aspirantes/): requisitos de inscripción.

Puntos a confirmar con la sede:

- El sitio oficial muestra **dos direcciones**: 6a. Avenida 2-33, zona 1, en el bloque de contacto, y 1ra. Calle 4-29, zona 5, como ubicación del campus. Por eso la página muestra las dos.
- Las **jornadas** de cada carrera en Cobán no aparecen en el sitio. Las páginas de programa son generales para toda la universidad.
- El sitio dice "16 carreras activas", pero lista 26 programas (17 licenciaturas, 6 profesorados, 2 maestrías y 1 curso libre). La landing muestra los 26 listados.
- Las **redes sociales** son las generales de la UMG. No se encontró una cuenta exclusiva de Cobán.
- El botón de mapa hace una búsqueda de la dirección en Google Maps. No es un enlace publicado por la universidad.
- El sitio no publica **avisos con fecha**, así que esa sección sigue con campos por completar.

## Editar el contenido

Todo el contenido está en `index.html`. Cada sección tiene un comentario `<!-- ==== NOMBRE ==== -->` para encontrarla rápido.

**Datos pendientes.** Lo que no está confirmado (teléfono, dirección, horarios, duración de carreras, avisos, etc.) aparece así:

```html
<span class="dato-pendiente" data-pendiente>[Teléfono de la sede]</span>
```

Para completarlo, reemplaza la etiqueta **completa** por el dato real. Para ver la lista de lo que falta, abre la página agregando `?revisar` a la dirección (por ejemplo, `index.html?revisar`). Aparece un panel con cada campo pendiente, y al hacer clic te lleva a él.

**Carreras.** Copia un bloque `<article class="program-card">`.
- `data-area` define el filtro de nivel: `licenciatura`, `profesorado`, `maestria` o `curso`.
- `data-modalidad` define el filtro de modalidad: `presencial`, `virtual` o `presencial virtual`.
- `data-search` agrega palabras clave para el buscador.
- El ícono se cambia en `<use href="#i-...">`. La lista de íconos está al inicio de `index.html`.
- La numeración y los contadores se actualizan solos.

**Servicios.** Edita las tarjetas `.service-card`. Usa `status-pending` con un dato pendiente para lo que no esté confirmado.

**Avisos.** Copia un bloque `<article class="notice">` y escribe la fecha en `data-fecha="AAAA-MM-DD"`. La página los ordena sola y muestra "Hoy", "Mañana", "En X días" o "Finalizado". Si dejas la fecha vacía, aparece "Fecha por confirmar". El botón *Próximos* oculta los avisos que ya pasaron.

**Contacto.** Cada `<dd data-contacto="telefono|correo|texto">` se convierte automáticamente en un enlace `tel:` o `mailto:` y recibe un botón **Copiar**. Para agregar otro teléfono, añade otro `<dd data-contacto="telefono">` en el mismo bloque. La ilustración del mapa no es un mapa real.

**Colores.** Están al inicio de `css/styles.css` (`--azul`, `--rojo`, etc.).

**Imágenes.** `logo-umg.png` es el escudo institucional. Antes de distribuir el sitio públicamente, verifica con la universidad las condiciones de uso. Las fotos `foto-*.jpg` son de Unsplash (licencia Unsplash), son solo ilustrativas y no muestran la sede. Para usar fotos reales de la sede, reemplázalas solo si tienes autorización y conserva el mismo nombre de archivo, o actualiza la ruta en `index.html` y el texto `alt`.

## Probar localmente

```powershell
Set-Location "C:\ruta\a\LandyingPage"
Start-Process .\index.html
```

Para probar la versión móvil, presiona F12 y activa el modo de dispositivo (anchos de 320 a 400 px). Revisa también la navegación solo con teclado: Tab, Enter, flechas en las pestañas y Escape en el menú.

## Publicar en IIS (Windows Server Core) desde PowerShell

Ejecuta PowerShell como administrador **desde la carpeta que contiene `index.html`**:

```powershell
# 1. Instalar IIS (omite este paso si ya está instalado)
Install-WindowsFeature -Name Web-Server
Import-Module WebAdministration

# 2. Copiar los archivos
$siteName = "SedeCoban"
$sitePath = "C:\inetpub\sede-coban"
New-Item -ItemType Directory -Path $sitePath -Force | Out-Null
Copy-Item -Path .\index.html, .\css, .\js, .\imagenes -Destination $sitePath -Recurse -Force

# 3. Crear el sitio (cambia el puerto 8080 si ya está ocupado)
New-Website -Name $siteName -PhysicalPath $sitePath -Port 8080 -IPAddress "*"
Set-WebConfigurationProperty -PSPath "IIS:\Sites\$siteName" -Filter "system.webServer/defaultDocument" -Name enabled -Value $true
Add-WebConfigurationProperty -PSPath "IIS:\Sites\$siteName" -Filter "system.webServer/defaultDocument/files" -Name "." -Value @{ value = "index.html" } -ErrorAction SilentlyContinue

# 4. Abrir el puerto en el firewall
New-NetFirewallRule -DisplayName "IIS Sede Coban 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow

# 5. Verificar
Invoke-WebRequest http://localhost:8080/ -UseBasicParsing | Select-Object StatusCode
```

Después de esto, el sitio queda disponible en `http://<IP-del-servidor>:8080/`. Si vas a usar un dominio, agrega un enlace con encabezado de host:

```powershell
New-WebBinding -Name $siteName -Protocol http -Port 80 -HostHeader "tu-dominio.edu.gt"
```

Para actualizar el contenido, vuelve a ejecutar solo el `Copy-Item` del paso 2. Como todas las rutas son relativas, el sitio funciona tanto por IP como por dominio. Solo se necesita internet si alguien abre los enlaces a las páginas oficiales de la UMG.

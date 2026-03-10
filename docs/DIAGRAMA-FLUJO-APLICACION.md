# Diagrama de flujo — Plataforma Küche

Diagrama de flujo de la aplicación **dividido en 4 partes** para que cada una sea fácil de leer y de visualizar en Mermaid.

---

## Diagrama único (todo en uno)

Un solo flujo con la información completa: sitio público, login por rol, área admin con sus acciones y área empleado. Para verlo bien, copia el bloque en [mermaid.live](https://mermaid.live) y usa zoom o exporta a PNG/SVG.

```mermaid
flowchart TB
    subgraph ENTRADA[" "]
        INICIO([Inicio /])
    end

    subgraph PUBLICO["Sitio público"]
        HOME["/ Inicio"]
        EXP["/experiencia"]
        CAT["/catalogo"]
        ACAB["/acabados"]
        AGENDAR["/agendar"]
        SEGUIM["/seguimiento"]
        AVISO["/aviso-de-privacidad"]
        LOGIN["/login"]
    end

    subgraph ROLES["Login"]
        D1{"¿Usuario?"}
        DASH_ADMIN["/admin Dashboard"]
        KANBAN_EMP["/dashboard/empleado Kanban"]
    end

    subgraph ADMIN["Área Admin"]
        D["Dashboard"]
        P["Precios"]
        DIS["Diseños"]
        OPS["Operaciones"]
        AG["Agenda"]
        P --> P1["Modificar precio / Nuevo material / Guardar / CSV"]
        DIS --> D1A{"¿Aprobar?"}
        D1A -->|Sí| AP["Aprobar"]
        D1A -->|No| FB["Solicitar cambios"]
        OPS --> O1["Ver Kanban / Filtrar por empleado"]
        O1 --> O2["Asignar tarea / Nuevo empleado / Mover columnas"]
        AG --> A1["Ver calendario / Filtrar"]
        A1 --> A2["Agendar / Editar / Asignar / Eliminar cita"]
    end

    subgraph EMPLEADO["Área Empleado"]
        K["Kanban empleado"]
        COT["Cotizador formal"]
        PREL["Cotizador preliminar"]
        LEV["Levantamiento"]
        K --> COT
        K --> PREL
        K --> LEV
        COT --> K
        PREL --> K
        LEV --> K
    end

    INICIO --> HOME
    HOME --> EXP
    HOME --> CAT
    HOME --> ACAB
    HOME --> AGENDAR
    HOME --> SEGUIM
    HOME --> LOGIN
    EXP --> AGENDAR
    CAT --> AGENDAR
    AGENDAR --> SEGUIM
    AVISO --> HOME

    LOGIN --> D1
    D1 -->|admin| DASH_ADMIN
    D1 -->|empleado| KANBAN_EMP
    DASH_ADMIN --> D
    KANBAN_EMP --> K
    D --> P
    D --> DIS
    D --> OPS
    D --> AG
    P --> D
    DIS --> D
    OPS --> D
    AG --> D
    DASH_ADMIN -->|Cerrar sesión| LOGIN
    KANBAN_EMP -->|Cerrar sesión| LOGIN
```

---

## Cómo está dividido

| Parte | Contenido | Uso |
|-------|-----------|-----|
| **1. Sitio público** | Inicio y páginas del Navbar (Experiencia, Catálogo, Acabados, Agendar, Seguimiento, Aviso, Login) | Flujo visitante/cliente |
| **2. Login y roles** | Pantalla de login y redirección a Admin o Empleado | Autenticación |
| **3. Área Admin** | Dashboard admin y sus 4 secciones (Precios, Diseños, Operaciones, Agenda) | Flujo interno admin |
| **4. Área Empleado** | Kanban empleado, Cotizador, Cotizador preliminar, Levantamiento | Flujo interno empleado |

Cada parte tiene su propio bloque Mermaid listo para copiar en [mermaid.live](https://mermaid.live).

---

## Parte 1 — Sitio público

Navegación desde Inicio y entre páginas públicas. El visitante puede ir a Agendar (CTA) o a Seguimiento (Mi proyecto).

```mermaid
flowchart LR
    subgraph PUBLICO["Sitio público"]
        HOME["/ Inicio"]
        EXP["/experiencia"]
        CAT["/catalogo"]
        ACAB["/acabados"]
        AGENDAR["/agendar"]
        SEGUIM["/seguimiento"]
        AVISO["/aviso-de-privacidad"]
        LOGIN["/login"]
    end

    HOME --> EXP
    HOME --> CAT
    HOME --> ACAB
    HOME --> AGENDAR
    HOME --> SEGUIM
    HOME --> LOGIN
    EXP --> AGENDAR
    CAT --> AGENDAR
    AGENDAR --> SEGUIM
    AVISO --> HOME
```

---

## Parte 2 — Login y roles

Una vez en `/login`, el usuario es redirigido según credenciales (demo: `admin` o `empleado`).

```mermaid
flowchart TB
    LOGIN["/login"]
    ADMIN["/admin — Dashboard"]
    EMP["/dashboard/empleado — Kanban"]

    LOGIN -->|"usuario: admin"| ADMIN
    LOGIN -->|"usuario: empleado"| EMP
    ADMIN -->|"Cerrar sesión"| LOGIN
    EMP -->|"Cerrar sesión"| LOGIN
```

---

## Parte 3 — Área Admin

El admin entra por el Dashboard y desde ahí accede a las 4 secciones. Cada sección tiene sus propias acciones (diagramas detallados más abajo).

### Diagrama único — Área Admin (3.1 a 3.5)

Versión simplificada: un nodo por sección con el resumen de acciones. Sin pasos "Entrar" ni "Ver"; solo lo que hace el admin en cada módulo.

```mermaid
flowchart TB
    DASH["Dashboard"]

    DIS["Diseños: Filtrar → Revisar → Aprobar o solicitar cambios"]
    P["Precios: Catálogo → Modificar / Nuevo / CSV → Guardar"]
    OPS["Operaciones: Kanban → Filtrar por empleado → Asignar / Equipo / Mover"]
    AG["Agenda: Calendario → Filtrar → Agendar / Editar / Asignar / Eliminar"]

    DASH --- DIS
    DASH --- P
    DASH --- OPS
    DASH --- AG
    DIS --- DASH
    P --- DASH
    OPS --- DASH
    AG --- DASH
```

### 3.1 Navegación del Admin

```mermaid
flowchart TB
    subgraph ADMIN["Área Admin"]
        DASH["/admin — Dashboard"]
        PRECIOS["/admin/precios"]
        DISENOS["/admin/disenos"]
        OPS["/admin/operaciones"]
        AGENDA["/admin/agenda"]
    end

    DASH --> PRECIOS
    DASH --> DISENOS
    DASH --> OPS
    DASH --> AGENDA
    PRECIOS --> DASH
    DISENOS --> DASH
    OPS --> DASH
    AGENDA --> DASH
```

### 3.2 Diseños — Aprobar o desaprobar

En **Aprobación de Diseños** el admin revisa los renders antes de presentar al cliente. Puede aprobar o solicitar cambios (feedback).

```mermaid
flowchart TB
    subgraph DISENOS["/admin/disenos"]
        ENTRAR["Entrar a Diseños"]
        FILTRAR["Filtrar: Todos / Pendientes / Aprobados"]
        REVISAR["Revisar diseño"]
        DECISION{"¿Aprobar?"}
        APROBAR["Aprobar diseño"]
        CAMBIOS["Solicitar cambios"]
        REVISION["Estado: Revisión"]
    end

    ENTRAR --> FILTRAR
    FILTRAR --> REVISAR
    REVISAR --> DECISION
    DECISION -->|Sí| APROBAR
    DECISION -->|No| CAMBIOS
    CAMBIOS --> REVISION
```

### 3.3 Precios — Modificar materiales

En **Catálogo y Precios** el admin actualiza los costos base que usan las cotizaciones. Puede modificar precios, agregar materiales y guardar (o importar/exportar CSV).

```mermaid
flowchart TB
    subgraph PRECIOS["/admin/precios"]
        ENTRAR["Entrar a Precios"]
        VER["Ver catálogo por categoría"]
        ACCION{"Acción"}
        EDITAR["Modificar precio de un material"]
        NUEVO["Agregar nuevo material"]
        GUARDAR["Guardar cambios"]
        CSV["Importar / Exportar CSV"]
    end

    ENTRAR --> VER
    VER --> ACCION
    ACCION -->|Editar precio| EDITAR
    ACCION -->|Nuevo material| NUEVO
    ACCION -->|Importar/Exportar| CSV
    EDITAR --> GUARDAR
    NUEVO --> GUARDAR
```

### 3.4 Operaciones — Pendientes y asignación

En **Operaciones y Taller** el admin ve todas las tareas en Kanban (Pendiente, En Progreso, Revisión, Completado), filtra por empleado para ver pendientes de cada uno, asigna nuevas tareas y gestiona el equipo.

```mermaid
flowchart TB
    subgraph OPS["/admin/operaciones"]
        ENTRAR["Entrar a Operaciones"]
        VER["Ver Kanban de tareas"]
        FILTRAR["Filtrar por empleado"]
        PENDIENTES["Ver pendientes por empleado"]
        ACCION{"Acción"}
        ASIGNAR["Asignar nueva tarea"]
        EMPLEADO["Nuevo empleado / Editar / Eliminar"]
        MOVER["Mover tarea entre columnas"]
    end

    ENTRAR --> VER
    VER --> FILTRAR
    FILTRAR --> PENDIENTES
    PENDIENTES --> ACCION
    ACCION -->|Nueva tarea| ASIGNAR
    ACCION -->|Equipo| EMPLEADO
    ACCION -->|Drag & drop| MOVER
```

### 3.5 Agenda — Citas y gestión

En **Agenda** el admin ve todas las citas en el calendario, filtra por empleado o por "Citas sin asignar", agenda nuevas visitas, edita o elimina citas y asigna responsable a cada una.

```mermaid
flowchart TB
    subgraph AGENDA["/admin/agenda"]
        ENTRAR["Entrar a Agenda"]
        VER["Ver calendario de citas"]
        FILTRAR["Filtrar: Todos / Por empleado / Sin asignar"]
        ACCION{"Acción"}
        NUEVA["Agendar nueva visita"]
        EDITAR["Editar cita"]
        ASIGNAR["Asignar responsable"]
        ELIMINAR["Eliminar cita"]
    end

    ENTRAR --> VER
    VER --> FILTRAR
    FILTRAR --> ACCION
    ACCION -->|Nueva| NUEVA
    ACCION -->|Editar| EDITAR
    ACCION -->|Asignar| ASIGNAR
    ACCION -->|Eliminar| ELIMINAR
```

---

## Parte 4 — Área Empleado

El empleado ve su **Dashboard de trabajo** y desde ahí usa **Cotización Pro (formal)**, **Cotización Preliminar** y **actualiza los detalles de proyectos de los clientes**.

### Diagrama único — Área Empleado

Versión simplificada: un nodo por módulo con el resumen de acciones. Kanban es el centro; los tres flujos salen y vuelven a él.

```mermaid
flowchart TB
    KANBAN["Kanban: Citas → Diseños → Cotización → Contrato / Filtrar / Mover tareas / Subir archivos"]

    COT["Cotizador: Proyecto, metros, gama, catálogo → Total → PDF / Imprimir"]
    PREL["Cotizador preliminar: Catálogo materiales → Cubiertas, frentes, herrajes → Resumen"]
    LEV["Levantamiento: Cliente → Geometría → Necesidades → Escenarios → Cierre"]

    KANBAN --- COT
    KANBAN --- PREL
    KANBAN --- LEV
    COT --- KANBAN
    PREL --- KANBAN
    LEV --- KANBAN
```

### Diagrama — Dashboard, Cotización Pro, Preliminar y detalles de proyectos

Flujo del empleado: entra al Dashboard de trabajo y elige Cotización Pro, Cotización Preliminar o actualizar detalles de proyectos de clientes; cada flujo vuelve al Dashboard.

```mermaid
flowchart TB
    subgraph ENTRADA[" "]
        E([Empleado])
    end

    E --> DASH["Dashboard de trabajo"]

    subgraph OPCIONES["Desde el Dashboard"]
        DASH --> D1{"¿Qué hace?"}
        D1 -->|Cotización Pro| CP["Cotización formal"]
        D1 -->|Cotización Preliminar| PREL["Cotización preliminar"]
        D1 -->|Proyectos de clientes| DET["Actualizar detalles de proyectos de clientes"]
    end

    subgraph COT_PRO["Cotización Pro (formal)"]
        CP --> CP1["Configura proyecto: tipo, metros, gama"]
        CP1 --> CP2["Catálogo y total"]
        CP2 --> CP3["PDF / Imprimir"]
        CP3 --> DASH
    end

    subgraph COT_PREL["Cotización Preliminar"]
        PREL --> PR1["Catálogo: cubiertas, frentes, herrajes"]
        PR1 --> PR2["Elegir materiales y ver resumen"]
        PR2 --> DASH
    end

    subgraph DETALLES["Actualizar detalles de proyectos"]
        DET --> DT1["Ver tareas: Citas, Diseños, Cotización, Contrato"]
        DT1 --> DT2["Abrir proyecto del cliente"]
        DT2 --> DT3["Editar datos / Subir archivos / Mover estado"]
        DT3 --> DASH
    end
```

---

## Flujo por rol

### 1. Visitante (público)

| Origen        | Destino típico   | Descripción                          |
|---------------|------------------|--------------------------------------|
| Inicio `/`    | Experiencia      | Conocer proceso Küche                |
| Inicio `/`    | Catálogo         | Ver proyectos / tipos               |
| Inicio `/`    | Acabados         | Ver materiales y acabados            |
| Inicio `/`    | Agendar          | CTA principal: agendar cita          |
| Inicio `/`    | Mi proyecto      | Seguimiento (con código)             |
| Cualquier página | Login         | Acceso interno (footer/nav)          |

### 2. Cliente (después de agendar)

| Paso   | Ruta / acción      | Descripción                                      |
|--------|--------------------|--------------------------------------------------|
| 1      | `/agendar`         | Elige fecha, horario y detalles del proyecto     |
| 2      | (Levantamiento)    | Sección en misma página: datos para levantamiento|
| 3      | `/seguimiento`     | Consulta “Mi proyecto” (código, timeline, pagos) |

### 3. Admin (login: `admin`)

| Paso   | Ruta / acción       | Descripción                                      |
|--------|---------------------|--------------------------------------------------|
| 1      | `/login`            | Usuario: `admin`                                 |
| 2      | `/admin`            | Dashboard: tareas, diseños, agenda, precios      |
| 3      | `/admin/operaciones`| Kanban de tareas / taller                        |
| 4      | `/admin/disenos`    | Aprobación de diseños                            |
| 5      | `/admin/agenda`     | Gestión de citas y asignación                    |
| 6      | `/admin/precios`    | Catálogo y precios                               |
| Salir  | Cerrar sesión       | Vuelve a `/login`                                |

### 4. Empleado (login: `empleado`)

| Paso   | Ruta / acción                | Descripción                                      |
|--------|------------------------------|--------------------------------------------------|
| 1      | `/login`                     | Usuario: `empleado`                              |
| 2      | `/dashboard/empleado`        | Kanban: Citas → Diseños → Cotización → Contrato  |
| 3      | Cotizador formal             | Ir a `/dashboard/cotizador` (cotización detallada)|
| 4      | Cotización preliminar        | Ir a `/dashboard/cotizador-preliminar`           |
| 5      | Levantamiento                | Ir a `/dashboard/levantamiento` (cliente, geometría, escenarios)|
| Salir  | Volver / Cerrar sesión       | Regreso a empleado o `/login`                    |

---

## Resumen de rutas

| Ruta | Quién | Descripción breve |
|------|--------|--------------------|
| `/` | Público | Inicio: hero, historia, proyectos, experiencia, testimonios, lead form, ubicación |
| `/experiencia` | Público | Experiencia de compra / proceso |
| `/catalogo` | Público | Catálogo de proyectos |
| `/acabados` | Público | Materiales y acabados |
| `/agendar` | Público | Agendar cita + datos levantamiento |
| `/seguimiento` | Público | Mi proyecto (seguimiento cliente) |
| `/aviso-de-privacidad` | Público | Aviso de privacidad |
| `/login` | Público | Login interno (admin / empleado) |
| `/admin` | Admin | Dashboard admin |
| `/admin/precios` | Admin | Precios y catálogo |
| `/admin/disenos` | Admin | Aprobación de diseños |
| `/admin/operaciones` | Admin | Operaciones y taller |
| `/admin/agenda` | Admin | Agenda |
| `/dashboard/empleado` | Empleado | Kanban del empleado |
| `/dashboard/cotizador` | Empleado | Cotizador formal (PDF, detalle) |
| `/dashboard/cotizador-preliminar` | Empleado | Cotización preliminar |
| `/dashboard/levantamiento` | Empleado | Levantamiento (cliente → geometría → necesidades → escenarios → cierre) |

---

## Notas técnicas

- **Layouts**: `layout.tsx` (raíz con Navbar), `admin/layout.tsx` (sidebar admin), `dashboard/layout.tsx` (contenedor dashboard).
- **Navbar**: No se muestra en rutas bajo `/admin`.
- **Auth**: Demo con usuario/contraseña en front; `admin` → `/admin`, `empleado` → `/dashboard/empleado`.
- **Persistencia**: Kanban, agenda y catálogo usan `localStorage` (demo).

Para ver el diagrama Mermaid renderizado, abre este archivo en GitHub, en un visor de Mermaid (por ejemplo [mermaid.live](https://mermaid.live)), o en un editor que soporte Mermaid (p. ej. VS Code con extensión Mermaid).

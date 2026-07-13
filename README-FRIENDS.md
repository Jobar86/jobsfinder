# Career-Ops + QA Job Dashboard — Setup Guide

Sistema para buscar, filtrar y trackear ofertas de trabajo QA remotas. Incluye scanner automático de portales + dashboard visual local.

---

## Qué incluye

| Componente | Para qué |
|---|---|
| **career-ops** | AI pipeline: evalúa ofertas, genera CVs, trackea aplicaciones |
| **Scanner** | Busca roles en Greenhouse, Ashby, Lever, Remotive, Himalayas, LinkedIn, etc. |
| **Dashboard** | Web app local para ver y trackear el status de cada oferta |
| **Liveness check** | Detecta ofertas expiradas automáticamente (💀 Dead) |

---

## Prerequisitos

Instala esto antes de empezar:

| Herramienta | Versión | Instalar |
|---|---|---|
| **Node.js** | 18+ | https://nodejs.org |
| **Claude Code** | Latest | https://claude.ai/code |
| **Git** | Cualquiera | Ya instalado en Mac/Linux |

---

## Setup (una sola vez)

### 1. Clonar el repo

```bash
git clone <URL-DE-ESTE-REPO>
cd career-ops
```

### 2. Instalar dependencias

```bash
npm install
npx playwright install chromium
```

> Playwright se usa para verificar si las ofertas siguen activas y para generar PDFs de CV.

### 3. Configurar tu perfil

Copia los archivos de ejemplo:

```bash
cp config/profile.example.yml config/profile.yml
cp templates/portals.example.yml portals.yml
```

Edita `config/profile.yml` con tus datos:

```yaml
name: Tu Nombre
email: tu@email.com
location: "Ciudad, País"
target_roles:
  - "QA Engineer"
  - "QA Analyst"
  - "Software Tester"
salary_target:
  min: 40000
  max: 70000
  currency: USD
```

### 4. Agregar tu CV

Crea el archivo `cv.md` en la raíz del proyecto con tu CV en Markdown:

```markdown
# Tu Nombre
Senior QA Engineer · Remote

## Professional Summary
[Tu resumen aquí]

## Experience
### Senior QA Engineer — Empresa X (2020–Present)
- Bullet 1
- Bullet 2

## Skills
Manual Testing · Agile · Jira · ...
```

### 5. Personalizar el scanner (opcional)

Edita `portals.yml` → sección `title_filter` para ajustar qué roles buscar:

```yaml
title_filter:
  positive:
    - QA
    - Quality Assurance
    - Tester
    - QA Analyst
  negative:
    - Junior        # excluir si buscas Senior
    - Automation    # excluir si buscas solo manual
    - SDET
    - Embedded
  seniority_boost:
    - Senior
    - Lead
    - Sr.
```

---

## Uso diario

### Buscar nuevas ofertas

Abre Claude Code en el directorio del proyecto y corre:

```
/career-ops scan
```

Esto busca en 40+ portales y agrega nuevas ofertas a `reports/manual-qa-jobs-YYYY-MM-DD.md`.

### Ver el dashboard

```bash
node dashboard-server.mjs
```

Abre http://localhost:4242 en tu browser.

Verás tus ofertas con:
- Filtros por región, portal, status
- Sort por fecha / empresa / status
- Status per oferta: Interested → Applied → Interview → Offer / Rejected
- Notas por oferta
- Vista Kanban

Los statuses se guardan en el browser (localStorage) — persisten aunque reinicies el servidor.

### Evaluar una oferta específica

Pega la URL de cualquier oferta en Claude Code:

```
/career-ops https://jobs.lever.co/empresa/uuid-aqui
```

Genera: evaluación A-F, match con tu CV, prep de entrevista, y PDF del CV personalizado.

### Verificar cuáles siguen activas

```bash
# Extraer URLs
grep -oP 'https?://[^\)]+' reports/manual-qa-jobs-*.md > reports/urls-to-check.txt

# Verificar (tarda ~20-30 min para 100+ URLs)
node check-liveness.mjs --file reports/urls-to-check.txt | tee reports/liveness-$(date +%Y-%m-%d).log

# Parsear resultados
node parse-liveness.mjs reports/liveness-$(date +%Y-%m-%d).log
```

Recarga el dashboard → ofertas expiradas se marcan como 💀 Dead automáticamente.

---

## Comandos disponibles en Claude Code

| Comando | Qué hace |
|---|---|
| `/career-ops scan` | Escanea portales, agrega nuevas ofertas |
| `/career-ops {URL}` | Evalúa oferta completa (A-F + PDF + tracker) |
| `/career-ops pipeline` | Procesa URLs pendientes en `data/pipeline.md` |
| `/career-ops oferta` | Solo evaluación, sin PDF |
| `/career-ops pdf` | Genera PDF del CV personalizado |
| `/career-ops tracker` | Status general de todas tus aplicaciones |
| `/career-ops contacto` | Busca contactos en LinkedIn + draft de mensaje |
| `/career-ops deep` | Investigación profunda de empresa |

---

## Estructura de archivos

```
career-ops/
├── cv.md                    ← Tu CV (tú lo creas)
├── portals.yml              ← Config del scanner (tú lo personalizas)
├── config/profile.yml       ← Tu perfil (tú lo llenas)
├── dashboard-server.mjs     ← Servidor del dashboard
├── reports/
│   └── dashboard.html       ← UI del dashboard
│   └── manual-qa-jobs-*.md  ← Jobs encontrados (auto-generado)
├── data/
│   ├── pipeline.md          ← URLs pendientes de evaluar
│   ├── applications.md      ← Tracker de aplicaciones
│   └── scan-history.tsv     ← Historial para dedup
└── modes/                   ← Lógica interna del sistema
```

---

## Troubleshooting

**Dashboard muestra `🟡 Offline`**
→ El servidor no está corriendo. Corre `node dashboard-server.mjs`.

**No aparecen jobs**
→ Corre `/career-ops scan` primero para generar el archivo de jobs.

**Error: `command not found: node`**
→ Instala Node.js desde https://nodejs.org (versión LTS).

**Puerto 4242 ocupado**
→ `pkill -f dashboard-server.mjs` para matar instancia anterior.

**Claude Code no reconoce `/career-ops`**
→ Asegúrate de estar en el directorio del proyecto al abrir Claude Code.

---

## Tips

- Corre `/career-ops scan` cada 3-5 días para no perder ofertas nuevas
- Marca como 💀 Dead las que den error 404 para mantener limpio el dashboard
- Usa el filtro `🌎 LATAM/Mexico` si buscas roles con zona horaria compatible
- El sistema aprende de tus evaluaciones — entre más lo uses, mejor te conoce

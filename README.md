# JobsFinder — QA Job Search System

Sistema para buscar, evaluar y trackear ofertas de trabajo QA remotas. Basado en [career-ops](https://github.com/santifer/career-ops) con un dashboard visual incluido.

---

## ¿Qué hace?

- **Scanner automático** — busca roles en Greenhouse, Ashby, Lever, Remotive, Himalayas, LinkedIn y más
- **Dashboard local** — visualiza y trackea el status de cada oferta en tu browser
- **Evaluador de ofertas** — con Claude Code, evalúa cualquier JD: match con tu CV, score A-F, prep de entrevista
- **Generador de CVs** — CV personalizado por oferta, optimizado para ATS
- **Liveness check** — detecta automáticamente ofertas expiradas (💀 Dead/404)

---

## Requisitos

| Herramienta | Versión | Link |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| Claude Code | Latest | https://claude.ai/code |

---

## Setup (primera vez)

```bash
# 1. Clonar
git clone https://github.com/Jobar86/jobsfinder.git
cd jobsfinder

# 2. Instalar dependencias
npm install
npx playwright install chromium

# 3. Crear tus archivos personales
node setup.mjs

# 4. Editar tu perfil y CV
#    → cv.md              (tu CV)
#    → config/profile.yml (nombre, email, roles target, salario)
#    → portals.yml        (keywords de búsqueda)

# 5. Validar setup
node doctor.mjs
```

---

## Uso diario

### Buscar nuevas ofertas

```
/career-ops scan
```

Busca en 40+ portales y guarda los resultados en `reports/`.

### Ver el dashboard

```bash
node dashboard-server.mjs
# → Abre http://localhost:4242
```

![Dashboard](docs/dashboard-preview.png)

Filtra por región, portal, status. Guarda notas. Vista Kanban incluida.

### Evaluar una oferta

Pega la URL en Claude Code:

```
/career-ops https://jobs.lever.co/empresa/uuid
```

Genera evaluación completa + CV personalizado.

### Verificar ofertas expiradas

```bash
# Extraer URLs
grep -oP 'https?://[^\)]+' reports/manual-qa-jobs-*.md > reports/urls-to-check.txt

# Verificar (~20-30 min para 100+ URLs)
node check-liveness.mjs --file reports/urls-to-check.txt | tee reports/liveness-$(date +%Y-%m-%d).log

# Generar dead-jobs.json
node parse-liveness.mjs reports/liveness-$(date +%Y-%m-%d).log
```

Recarga el dashboard — ofertas expiradas se auto-marcan como 💀.

---

## Comandos Claude Code

| Comando | Qué hace |
|---|---|
| `/career-ops scan` | Escanea portales, agrega nuevas ofertas |
| `/career-ops {URL}` | Evalúa oferta + genera CV personalizado |
| `/career-ops pipeline` | Procesa URLs pendientes |
| `/career-ops tracker` | Estado general de aplicaciones |
| `/career-ops pdf` | Genera PDF del CV |
| `/career-ops contacto` | Busca contactos LinkedIn + draft de mensaje |

---

## Archivos importantes

| Archivo | Qué es |
|---|---|
| `cv.md` | Tu CV (tú lo creas, gitignoreado) |
| `config/profile.yml` | Tu perfil personal (gitignoreado) |
| `portals.yml` | Config del scanner (gitignoreado) |
| `dashboard-server.mjs` | Servidor del dashboard (port 4242) |
| `setup.mjs` | Script de setup para nuevos usuarios |
| `reports/manual-qa-jobs-*.md` | Jobs encontrados (gitignoreado) |

---

## Personalizar keywords de búsqueda

Edita `portals.yml` → sección `title_filter`:

```yaml
title_filter:
  positive:
    - QA
    - Quality Assurance
    - Tester
  negative:
    - Junior
    - Automation Engineer
    - SDET
```

---

## Troubleshooting

| Problema | Solución |
|---|---|
| Dashboard muestra 🟡 Offline | Corre `node dashboard-server.mjs` |
| No aparecen jobs | Corre `/career-ops scan` primero |
| Puerto 4242 ocupado | `pkill -f dashboard-server.mjs` |
| Claude Code no reconoce `/career-ops` | Abre Claude Code desde el directorio del proyecto |

---

## Créditos

Basado en [career-ops](https://github.com/santifer/career-ops) por [@santifer](https://github.com/santifer).
Dashboard y mejoras por [@Jobar86](https://github.com/Jobar86).

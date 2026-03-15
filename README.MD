# 🔥 FORJA — Workout Tracker

> Aplicativo de organização e registro de treinos, 100% no navegador. Sem backend, sem instalação, sem conta.

---

## Sobre

**FORJA** é um Progressive Web App em HTML/CSS/JS puro para quem leva treino a sério. Você monta seus dias de treino, registra pesos e repetições em cada sessão, e acompanha a evolução por exercício ao longo do tempo.

Tudo roda no próprio dispositivo — os dados ficam no `localStorage` do navegador.

---

## Funcionalidades

### 📋 Plano
- Crie quantos dias de treino quiser (PUSH, PULL, LEG A, etc.)
- Adicione exercícios manualmente ou via **Biblioteca** com +110 exercícios pré-cadastrados
- Agrupe por músculo: Peito, Costas, Ombro, Bíceps, Tríceps, Quadríceps, Posterior, Glúteo, Panturrilha, Abdômen
- Ajuste séries e reps diretamente no card com spinners `−` / `＋`
- Edite o músculo alvo via select inline
- Layout sidebar fixo no desktop (≥900px)

### 💪 Treinar
- Selecione a data e o dia de treino
- Cada exercício vira um card com contador de progresso `séries feitas / total`
- Preencha peso (kg) e reps por série — o marcador fica laranja quando a série está completa
- Adicione séries extras a qualquer momento
- Salve a sessão com um toque — sobrescreve automaticamente se já existe sessão no mesmo dia

### 📅 Histórico
- Listagem de todas as sessões em ordem cronológica reversa
- Filtre por nome de exercício ou dia de treino
- Badge **PR** automático quando o peso bate o recorde pessoal
- Delete sessões individuais

### 📈 Stats
- Cards de resumo: total de sessões, séries e exercícios distintos
- Selecione qualquer exercício para ver:
  - Gráfico de linha: peso máximo, volume total ou média por sessão
  - Gráfico de barras: reps totais por sessão
  - Destaque do PR com data

---

## Biblioteca de Exercícios

+110 exercícios organizados por grupo muscular, com steppers de séries/reps por exercício antes de adicionar ao plano.

| Grupo | Exemplos |
|---|---|
| Peito | Supino Reto Barra, Peck Deck, Crossover, Pullover |
| Costas | Remada Curvada, Puxada Alta, Barra Fixa, Levantamento Terra |
| Ombro | Desenvolvimento Arnold, Elevação Lateral, Face Pull |
| Bíceps | Rosca Direta, Rosca Scott, Rosca Martelo, Rosca 21s |
| Tríceps | Tríceps Corda, Paralelas, Tríceps Francês, Mergulho |
| Quadríceps | Agachamento Livre, Hack Machine, Leg Press, Extensora |
| Posterior | Mesa Flexora, Stiff, Levantamento Terra Romeno |
| Glúteo | Hip Thrust, Kickback Máquina, Abdução de Quadril |
| Panturrilha | Panturrilha em Pé, Sentado, no Leg Press |
| Abdômen | Prancha, Russian Twist, Elevação de Pernas, Rollout |

---

## Tecnologias

| | |
|---|---|
| **Linguagem** | HTML5 + CSS3 + JavaScript (ES6+) |
| **Gráficos** | [Chart.js 4.4.1](https://www.chartjs.org/) via CDN |
| **Fontes** | Barlow Condensed + DM Mono (Google Fonts) |
| **Armazenamento** | `localStorage` — 100% client-side |
| **Backend** | Nenhum |
| **Dependências** | Nenhuma (exceto Chart.js via CDN) |

---

## Como usar

### Opção 1 — Direto no navegador
1. Faça download do arquivo `workout-tracker.html`
2. Abra no navegador (Chrome, Safari, Firefox)
3. Pronto — funciona offline após o primeiro carregamento

### Opção 2 — Servidor local
```bash
# Python
python -m http.server 8080

# Node.js
npx serve .
```
Acesse `http://localhost:8080/workout-tracker.html`

### Opção 3 — GitHub Pages / Netlify / Vercel
Suba o arquivo `.html` em qualquer serviço de hospedagem estática. Não requer configuração.

---

## Estrutura do arquivo

```
workout-tracker.html
├── <head>
│   ├── Google Fonts (Barlow Condensed, DM Mono)
│   └── Chart.js CDN
├── <style>          — Todo o CSS (~420 linhas)
├── <body>
│   ├── .topbar      — Logo + nav desktop
│   ├── .content
│   │   ├── #page-planner   — Sidebar de dias + cards de exercício
│   │   ├── #page-log       — Sessão de treino ativa
│   │   ├── #page-history   — Histórico de sessões
│   │   └── #page-charts    — Gráficos e stats
│   ├── .save-bar    — Botões fixos durante o treino
│   └── #lib-overlay — Modal da biblioteca de exercícios
└── <script>         — Toda a lógica (~700 linhas)
    ├── STATE        — Objeto S {days, sessions} + localStorage
    ├── NAV          — Roteamento entre páginas
    ├── PLANNER      — CRUD de dias e exercícios
    ├── LOG          — Sessão de treino em tempo real
    ├── HISTORY      — Listagem e filtros
    ├── CHARTS       — Chart.js + cálculo de PR
    ├── LIBRARY      — Base de 110+ exercícios + filtros
    └── UTILS        — uid, formatadores de data, getPR
```

---

## Estrutura dos dados (localStorage)

```json
{
  "days": [
    {
      "id": "abc123",
      "name": "PUSH",
      "exercises": [
        {
          "id": "def456",
          "name": "Supino Reto Barra",
          "sets": 4,
          "reps": 8,
          "muscle": "Peito"
        }
      ]
    }
  ],
  "sessions": [
    {
      "id": "ghi789",
      "date": "2025-03-15",
      "dayId": "abc123",
      "dayName": "PUSH",
      "exercises": [
        {
          "exId": "def456",
          "name": "Supino Reto Barra",
          "sets": [
            { "weight": 80, "reps": 8 },
            { "weight": 82.5, "reps": 7 }
          ]
        }
      ]
    }
  ]
}
```

---

## Mobile

Otimizado para uso diário na academia:

- Bottom navigation com 4 abas
- `font-size: 16px` em todos os inputs — sem zoom automático no iOS
- `inputmode="decimal"` / `inputmode="numeric"` — teclado numérico direto
- `safe-area-inset` para notch e home bar (iPhone)
- Botões pill com área de toque ≥44px
- Feedback visual em cada série completada
- `backdrop-filter` blur na bottom nav

---

## Limitações conhecidas

- **Dados ficam no navegador** — limpar cache apaga tudo. Exporte o JSON manualmente via DevTools se precisar de backup.
- **Sem sincronização** — cada dispositivo tem sua própria base de dados.
- **Sem PWA manifest** — pode ser adicionado para instalar como app na tela inicial.

---

## Licença

Projeto pessoal, uso livre.

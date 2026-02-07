# Clean Studio Design System

Design system baseado no conceito "Agency OS" - interface limpa, moderna e amigável para gestão de conteúdo automatizado.

## Filosofia

- **Minimalismo funcional**: Menos é mais, cada elemento tem propósito
- **Cantos arredondados**: Super rounded (2xl) para sensação amigável
- **Sombras suaves**: Profundidade sutil, nunca agressiva
- **Cores pastéis saturadas**: Acentos "pop" para ações e status

---

## Tipografia

### Font Family
```css
font-family: 'Manrope', sans-serif;
```

Google Fonts: `https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap`

### Pesos
| Peso | Uso |
|------|-----|
| 400 | Texto corpo |
| 500 | Labels, texto secundário |
| 600 | Subtítulos, botões secundários |
| 700 | Títulos, navegação |
| 800 | Headlines, números grandes |

### Tamanhos
| Classe | Uso |
|--------|-----|
| `text-xs` | Badges, timestamps, labels pequenos |
| `text-sm` | Botões, navegação, texto UI |
| `text-base` | Corpo de texto, conteúdo de posts |
| `text-lg` | Subtítulos, descrições |
| `text-xl` | Títulos de seção |
| `text-3xl` | Números de stats |
| `text-4xl` | Headlines de página |

---

## Paleta de Cores

### Base (Slate)
Usada para texto, backgrounds e bordas neutras.

| Token | Hex | Uso |
|-------|-----|-----|
| `slate-50` | #f8fafc | Background principal da página |
| `slate-100` | #f1f5f9 | Background de cards secundários, bordas suaves |
| `slate-200` | #e2e8f0 | Bordas, divisores |
| `slate-300` | #cbd5e1 | Bordas hover |
| `slate-400` | #94a3b8 | Texto terciário, ícones inativos |
| `slate-500` | #64748b | Texto secundário, labels |
| `slate-600` | #475569 | Texto em tags |
| `slate-700` | #334155 | Texto emphasis |
| `slate-800` | #1e293b | Hover de preto |
| `slate-900` | #0f172a | Texto principal, botões primários |

### Preto Suave
Nunca usar `#000000`. Usar slate-900 como "preto".

```css
black: {
  DEFAULT: '#0f172a',  /* slate-900 */
  hover: '#1e293b',    /* slate-800 */
}
```

### Cores Pop (Acentos)
Cores vibrantes para status, ações e feedback visual.

| Token | Hex | Tailwind | Uso |
|-------|-----|----------|-----|
| `pop-yellow` | #fbbf24 | amber-400 | Pendente, atenção |
| `pop-blue` | #38bdf8 | sky-400 | Links, hashtags, informação |
| `pop-green` | #4ade80 | green-400 | Sucesso, aprovado |
| `pop-red` | #f87171 | red-400 | Erro, rejeição, descarte |
| `pop-purple` | #c084fc | purple-400 | Detalhes decorativos |

### Estados de Ícones
Padrão de hover para ícones em cards:

```tsx
// Base (claro)
bg-amber-50 text-amber-500

// Hover (sólido)
group-hover:bg-amber-400 group-hover:text-white
```

Variantes: `amber`, `emerald`, `red`, `sky`

---

## Sombras

| Token | CSS | Uso |
|-------|-----|-----|
| `shadow-soft` | `0 4px 20px -2px rgba(0,0,0,0.05)` | Cards em repouso |
| `shadow-hover` | `0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.01)` | Cards em hover |
| `shadow-sm` | Tailwind default | Botões secundários |
| `shadow-lg` | Tailwind default | Botões primários ativos |
| `shadow-xl shadow-slate-200` | Combinado | Botões CTA principais |

---

## Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `rounded-lg` | 0.5rem | Badges pequenos |
| `rounded-xl` | 1rem | Botões, inputs, ícones |
| `rounded-2xl` | 1.25rem | Cards, containers |
| `rounded-full` | 50% | Avatares, badges circulares |

---

## Componentes

### Botão Primário (CTA)
```tsx
className="flex items-center gap-2 bg-black text-white rounded-xl px-4 py-2.5 text-sm font-bold shadow-xl shadow-slate-200 hover:-translate-y-0.5 transition-transform"
```

### Botão Secundário
```tsx
className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors"
```

### Botão Destrutivo (texto)
```tsx
className="text-red-500 font-bold text-xs hover:text-red-700 transition-colors"
```

### Card Base
```tsx
className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft hover:shadow-hover transition-all"
```

### Card Secundário (agendado/inativo)
```tsx
className="bg-slate-50 rounded-2xl p-6 border border-slate-200 opacity-80 hover:opacity-100 transition-all"
```

### Badge de Status
```tsx
// Pendente (amarelo com pulse)
className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700"
<span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />

// Agendado (verde)
className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700"
```

### Tag de Fonte
```tsx
className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold flex items-center gap-2"
```

### Navegação Ativa
```tsx
className="bg-black text-white shadow-lg shadow-slate-200 rounded-xl"
```

### Navegação Inativa
```tsx
className="text-slate-500 hover:bg-slate-50 hover:text-slate-900"
```

### Avatar
```tsx
// Grande (posts)
className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center text-xl font-bold border-4 border-white shadow-sm"

// Médio (sidebar)
className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm"
```

### Tabs
```tsx
// Container
className="flex items-center gap-2 border-b border-slate-200 pb-1"

// Tab ativa
className="px-4 py-2 text-sm font-bold text-slate-900 border-b-2 border-slate-900"

// Tab inativa
className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700"
```

---

## Layout

### Sidebar
- Largura fixa: `w-72` (288px)
- Posição: `fixed left-0 top-0 h-full`
- Background: `bg-white`
- Borda: `border-r border-slate-100`

### Main Content
- Offset: `ml-72` (para compensar sidebar)
- Padding: `p-12`
- Max width: `max-w-[1400px]`

### Grid de Stats
```tsx
className="grid grid-cols-4 gap-6"
```

---

## Ícones

Usar exclusivamente **Lucide React**:

```tsx
import { Command, Layers, Rss, BarChart2, Check, X, Zap, Clock } from 'lucide-react';
```

Tamanhos padrão:
- Navegação: `w-5 h-5`
- Botões: `w-4 h-4`
- Stats: `w-6 h-6`
- Tags pequenas: `w-3 h-3`

---

## Transições

| Tipo | Classe | Uso |
|------|--------|-----|
| Cores | `transition-colors` | Hover em textos, backgrounds |
| Todos | `transition-all` | Cards, elementos complexos |
| Transform | `transition-transform` | Botões com elevação |

Duração padrão: 150ms (Tailwind default)

---

## Acessibilidade

- Usar `aria-label` em botões de ícone
- Manter contraste mínimo 4.5:1 para texto
- Estados de foco visíveis
- Emojis com `role="img"` e `aria-label`

---

## Arquivos de Referência

- **Tailwind Config**: `tailwind.config.ts`
- **Global CSS**: `src/app/globals.css`
- **Design Original**: `S:\twitter-clone\studio-design.html`

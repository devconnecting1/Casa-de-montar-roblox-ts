# AGENTS.md — Casa-de-montar-roblox-ts

> Lido automaticamente por Claude, OpenCode e Muse Spark. Responda ao usuário em **português**.

## O que é

Casa(s) construída(s) bloco a bloco por código em **TypeScript (roblox-ts 3.0.0)**,
compilada para **Luau** e montada no Workspace do Roblox ao dar Play.
Preview 3D (Three.js) em `preview/` publicado no GitHub Pages a cada push na `main`.

## Comandos

```bash
npm install      # instala roblox-ts + @rbxts/types
npm run build    # rbxtsc: src/ -> out/*.luau (fonte de verdade do que vai ao Studio)
npm run typecheck# tsc puro — NÃO basta: o rbxtsc rejeita coisas que o tsc aceita
npm run watch    # rebuild a cada save
npx http-server ./preview -p 8080   # preview local
```

`out/`, `include/`, `node_modules/`, `*.rbxlx` são gerados/ignorados — nunca edite nem commite.

## Arquitetura (dependência só "para cima")

```
src/config.ts        ← FONTE DA VERDADE (medidas, vãos, telhado). Nada de número mágico fora daqui.
src/core/            ← blocks, builder (ModelBuilder.wall), palette, types, utils. Não importa mais nada.
src/house/           ← casa principal (bespoke, lê HOUSE) + variants.ts (casas paramétricas)
src/structures/yard.ts ← buildYard(): quintal canônico em 6 fases. É o ÚNICO quintal (src/yard/* foi removido).
src/scene.ts         ← buildScene(): fundação→paredes→telhado→casas→quintal; idempotente; imprime contagem
src/server/main.server.ts ← entry (vira Script no ServerScriptService)
preview/index.html   ← espelha config.ts; cada mesh = 1 Part
```

## Regras roblox-ts (aprendidas com erro de compilador — respeite)

- Sem getters/setters (`get x()` não compila). Use `readonly` ou método.
- Identificadores proibidos como variável: `local`, `next` (reservados do Luau/compilador).
- `Vector3` usa **maiúsculas**: `.X .Y .Z`. `CFrame`: `new CFrame(pos)` + `CFrame.Angles(...)` — nunca `CFrame.new()`.
- `Array.slice` **não existe**; itere por índice com `.size()`. `.push()` e `.size()` OK.
- `math.*` do Luau (`math.ceil/min/max/abs/rad/deg/sqrt/atan2/sin/floor/clamp/round`) OK.
- `task.wait`, `string.format`, `os.clock`, `game.GetService` OK.
- Sempre valide com **`npm run build`** (rbxtsc), não só typecheck.

## Regras da cena

- **Y=0 = topo da grama**; casa principal centrada na origem, fachada +Z, porta em x=0.
- **Sem `math.random`**: variação determinística via `hash01(seed)`.
- **Sem z-fighting**: peça sobre peça sempre com encaixe de 0.05–0.1 (nunca face com face); poste entra 0.1 no chão.
- **Cilindro Roblox cresce no eixo X**: tronco/haste vertical = `size [altura, d, d]` + `rotation [0,0,90]`.
- Novas casas: use `buildSmallHouse()` em `variants.ts` (posições atuais: cabana `[-38,-4]`, hóspedes `[38,-4]`); audite sobreposição com o script de checagem geométrica antes de commitar.
- Tudo `Anchored`; luzes reais via `PointLight` parentado na peça Neon.

## Git / deploy

- `origin` = `Casa-de-montar-roblox-ts` (`old-origin` = repo antigo, não usar).
- Push na `main` dispara **CI** (typecheck+build) e **Pages** (publica `preview/`).
- Nunca exponha tokens no chat/config; após usar PAT para push, Revogar em Settings → Tokens.

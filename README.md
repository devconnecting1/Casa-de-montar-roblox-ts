# 🏠 Casa Blocos de Montar — demonstração de engenharia (TypeScript → Luau/Roblox)

Uma casa inteira **construída bloco a bloco por código**: fundação, alvenaria com **junta escalonada**, portas e janelas **recortadas** nos blocos, telhado, chaminé e quintal cercado. Nada foi posicionado à mão no Studio — você roda `npm run build`, dá Play e a obra inteira aparece no Workspace, com centenas de `Part` ancoradas organizadas em Models.

Escrito em **TypeScript (roblox-ts)** e compilado para **Luau**. É o equivalente a montar uma casa de Lego com um manual escrito em linguagem de programação — cada bloco tem coordenada, cor e tamanho decididos por algoritmo.

## 🌐 Ver ao vivo (GitHub Pages)

**[Abrir o preview 3D](https://devconnecting1.github.io/Casa-de-montar-roblox-ts/)** — o visualizador Three.js de `preview/` (mesmas medidas de `src/config.ts`, cada caixa = 1 `Part`) publicado automaticamente a cada push na `main` pelo workflow `.github/workflows/pages.yml`. O workflow `ci.yml` valida `npm run typecheck` + `npm run build` (TypeScript → Luau) no mesmo push.

> Na primeira vez é preciso ativar: **Settings → Pages → Source: GitHub Actions** (uma única vez).

```
                              /---\
                            /-------\
                          /-----------\     +-----+
                        /---------------\   |#####|
                      /-------------------\ |#####|
                    /-----------------------|#####|
                  /-------------------------|#####|
                /---------------------------|#####|
              /-----------------------------|#####|
            /-------------------------------|#####|-\
          /---------------------------------|#####|---\
        /-----------------------------------------------\
      /---------------------------------------------------\
    /-------------------------------------------------------\
    /=======================================================\
        +-+---+---+---+---+---+---+---+---+---+---+---+-+
        | |   |   |   |   |   |   |   |   |   |   |   | |
        +---+---+---+---+---+---+---+---+---+---+---+---+
        |   |   |   |   |   |   |   |   |   |   |   |   |
        +-+---+---+---+---+---+---+---+---+---+---+---+-+
        | |   |   |   |   |   |   |   |   |   |   |   | |
        +---+--+-----+--+---+-------+---+--+-----+--+---+
        |   |  |  |  |  |   |       |   |  |  |  |  |   |
        +-+---+|  |  |+---+-|       |-+---+|  |  |+---+-+
        | |   ||  |  ||   | |       | |   ||  |  ||   | |
        +---+--+--+--+--+---|       |---+--+--+--+--+---+
        |   |  |  |  |  |   |       |   |  |  |  |  |   |
        +-+---+|  |  |+---+-|       |-+---+|  |  |+---+-+
        | |   ||  |  ||   | |       | |   ||  |  ||   | |
        +---+--+-----+--+---|       |---+--+-----+--+---+
        |   |   |   |   |   |       |   |   |   |   |   |
        +-+---+---+---+---+-|       |-+---+---+---+---+-+
        | |   |   |   |   | |       | |   |   |   |   | |
        +---+---+---+---+---|       |---+---+---+---+---+
        |   |   |   |   |   |       |   |   |   |   |   |
        +---+---+---+---+---|       |---+---+---+---+---+
    +=======================================================+
    |#######################################################|
    +=======================================================+
 ____________________________________________________________________
                           ...........
```

| No diagrama | Na cena (`Explorer`) | O que é |
|---|---|---|
| telhado `/---\` | `06_Telhado` | painéis inclinados com sobrebequeira |
| chaminé `#####` | `07_Chamine` | bloco saindo do telhado |
| parede `+-+---+` | `03_Paredes` | tijolos 3×1 com **junta escalonada** (fiadas alternadas meio bloco) |
| vão `\|  \|` | `04_Aberturas` | porta/janela **recortadas** bloco a bloco |
| base `###` | `01_Fundacao` | sapata meio enterrada + laje + rodapé |
| caminho `....` | `02_Caminho` | pedras da porta ao portão |

---

## O que você vai ver no Roblox

A cena nasce em **fases numeradas** — cada fase é um `Model` filho, então dá para abrir o Explorer e ver a obra organizada.

### A casa — `buildHouse()`

| Fase | Model | O que ela demonstra |
|---|---|---|
| 1 | `01_Fundacao` | sapata meio enterrada (não "flutua" no terreno) + laje + rodapé de pedras |
| 2 | `02_Piso` | laje interna exatamente sobre a fundação |
| 3 | `03_Paredes` | **alvenaria bloco a bloco**: fiadas alternadas deslocadas meio bloco (junta corrida/escalonada), com variação de tom por tijolo para as juntas aparecerem |
| 4 | `04_Aberturas` | **recorte de vãos**: portas e janelas nascem como buracos limpos — os blocos que invadiriam o vão são encurtados, nunca sobra furo torto |
| 5 | `05_Interior` | divisórias, mobília básica e detalhes internos |
| 6 | `06_Telhado` | telhado inclinado com **sobrebequeira** (avança além das paredes) e cumeeira |
| 7 | `07_Chamine` | chaminé atravessando o telhado |

### O quintal — `buildYard()`

| Fase | Model | O que ela demonstra |
|---|---|---|
| 1 | `00_Chao` | placa de terreno (grama) em Y=0 — o referencial de tudo |
| 2 | `01_Cerca` | cerca + portão em volta da pegada, com postes repetidos por código |
| 3 | `02_Caminho` | caminho de pedra alinhado com a porta e o portão |
| 4 | `03_Vegetacao` | árvores, arbustos e flores posicionados deterministicamente (sem `math.random`) |
| 5 | `04_Iluminacao` | postes, lustre e luz da varanda (`PointLight` de verdade) |
| 6 | `05_Detalhes` | caixa de correio, vaso, bancos — o "tempero" |

### Vendo a obra se montar

Se passar `stageDelay`, as fases entram **uma de cada vez**, com pausa entre elas — dá para ver a casa se levantando do chão, do alicerce ao telhado:

```ts
buildScene({ stageDelay: 0.4 }); // 0,4 s entre cada fase
```

Sem `stageDelay`, tudo aparece em um único frame e o Output imprime o diagnóstico:

```
[BlockHouseDemo] pronto: 742 blocos em 0.31s
```

---

## Requisitos

**Obrigatório**

- **Node.js 18+** (já vem com o `npm`) — é o que compila o TypeScript para Luau.
- **Roblox Studio** (gratuito) — é onde a cena roda.

**Opcional**

- **VS Code** — editor; o `tsconfig.json` já vem configurado.
- **Rojo** (<https://rojo.space>) + plugin no Studio — sincroniza `out/` com o Studio sem copiar e colar. Baixe na [página de releases](https://github.com/rojo-rbx/rojo/releases) (Windows/macOS/Linux) ou `cargo install rojo`.
- **Navegador** — para o preview 3D opcional (abaixo).

---

## Como rodar

```bash
npm install      # 1x por checkout: instala roblox-ts e tipos
npm run build    # compila src/ -> out/ (rbxtsc)
npm run watch    # recompila a cada salva (deixe aberto enquanto edita)
```

- `npm run clean` — apaga a pasta `out/` (útil quando sobrou lixo de build antigo).
- `npm run` — lista todos os scripts disponíveis no seu `package.json`.

---

## Ver sem abrir o Roblox (preview web)

O diretório `preview/` tem um visualizador Three.js que lê **as mesmas medidas de `src/config.ts`** — cada caixa = 1 `Part`:

```bash
npx http-server ./preview -p 8080
# abra http://localhost:8080
```

---

## Como colocar no Roblox (3 caminhos)

> ### ⚠️ Aviso antes de tudo
> O entry point **tem que ser um `Script` de SERVIDOR**, dentro de **`ServerScriptService`**.
> Se você criar um `LocalScript` (ou colocar o Script em `StarterPlayerScripts`/`StarterCharacterScripts`), as peças:
> - **não aparecem para os outros jogadores** (objeto criado no cliente não replica); e
> - podem nem aparecer pra você direito, já que a lógica roda no cliente.
>
> Servidor = `Script` + `ServerScriptService`. Ponto.

### Caminho A — Rojo (recomendado)

O projeto já tem `default.project.json`, que diz ao Rojo onde colocar cada arquivo gerado.

```bash
npm run build           # gera out/ (e include/, a RuntimeLib)
npx rojo serve          # fica ouvindo; a porta está em default.project.json
```

1. No Studio: instale o **plugin do Rojo** e clique nele → **Connect**.
2. O Sync monta a árvore do seu `default.project.json`: nesta versão, **`ServerScriptService/TS/…`** recebe todo o conteúdo de `out/` e **`ReplicatedStorage/rbxts_include/…`** recebe a pasta `include/`.
3. Confira que o arquivo de entrada virou um **Script** (não um `ModuleScript` — veja a nota abaixo) e dê **Play ▶**: ele cria o Model `BlockHouseDemo` no `Workspace`.

> **Nota:** o Rojo só cria `Script` a partir de arquivos `*.server.lua`; um `.lua` comum vira `ModuleScript`, que **não executa sozinho**. Se o entry aparecer como `ModuleScript`, aplique a correção da tabela "Solução de problemas".

Sem querer servidor aberto? Gere o place pronto:

```bash
npx rojo build -o BlockHouse.rbxlx
```

> O Rojo é opcional: sem ele, use o Caminho B.

### Caminho B — Sem Rojo (copiar e colar na mão)

1. Rode `npm run build` e abra a pasta `out/` no editor.
2. No Studio: **View → Explorer** e **View → Properties**.
3. Olhe no `default.project.json` para onde `out/` é mapeado — nesta versão, para uma pasta **`TS`** dentro de **ServerScriptService**. Crie essa pasta se não existir (se o seu mapeamento apontar direto para a raiz do serviço, pule este passo).
4. Dentro desse destino, crie um **Script** (o botão `+` → `Script`) chamado `index` e cole nele o conteúdo de **`out/index.lua`**.
5. Ainda na mesma raiz, crie uma **Folder** para cada pasta de `out/`, com o **MESMO nome**:
   - `core`
   - `structures`
   - `demo`
   ...e um **ModuleScript** chamado `config` para o `out/config.lua`, ao lado das pastas.
6. Dentro de cada pasta, crie um **ModuleScript** por arquivo `.lua`, com o **mesmo nome do arquivo** (sem a extensão):

   | Arquivo em `out/` | Vira |
   |---|---|
   | `out/config.lua` | `ModuleScript "config"` na raiz da árvore |
   | `out/core/blocks.lua` | `ModuleScript "blocks"` dentro da pasta `core` |
   | `out/core/builder.lua` | `ModuleScript "builder"` dentro de `core` |
   | `out/core/palette.lua` | `ModuleScript "palette"` dentro de `core` |
   | `out/core/types.lua` | `ModuleScript "types"` dentro de `core` |
   | `out/core/utils.lua` | `ModuleScript "utils"` dentro de `core` |
   | `out/structures/house.lua` | `ModuleScript "house"` dentro de `structures` |
   | `out/structures/yard.lua` | `ModuleScript "yard"` dentro de `structures` |
   | `out/demo/scene.lua` | `ModuleScript "scene"` dentro de `demo` |

   > Os `import` do TypeScript viram **`TS.import(script, …)`** no Luau — caminho relativo (`script.Parent.…`) ou absoluto (`game:GetService("ServerScriptService").…`), dependendo do que o `default.project.json` mapeia no momento do build. Por isso a árvore no Studio tem que **espelhar o `out/`** (e o entry tem que estar na mesma raiz). Abra o topo do seu `out/index.lua`: ele diz exatamente quais caminhos ele procura.
7. **RuntimeLib (`TS`):** se os `.lua` tiverem `local TS = require(…)` no topo, o código depende da RuntimeLib do compilador. O `rbxtsc` a copia para a pasta **`include/`** na raiz do projeto (`RuntimeLib.lua` + `Promise.lua`); replique essa pasta dentro de **`ReplicatedStorage/rbxts_include`** (é o que o `default.project.json` deste projeto faz). Confira no template oficial do roblox-ts da sua versão se o nome muda.
8. **Play ▶.** Se aparecer `[BlockHouseDemo] pronto: N blocos…` no Output, deu certo.

### Caminho C — Abrir o place já gerado

Se existir `BlockHouse.rbxlx` na raiz do projeto (gere com `npx rojo build -o BlockHouse.rbxlx`):

1. Studio → **File → Open from File…**
2. Escolha `BlockHouse.rbxlx` → **Play ▶**.

---

## Mapa de arquivos

```
src/
├── config.ts              ← FONTE DA VERDADE: medidas da casa, vãos, telhado, quintal
├── core/
│   ├── types.ts           ← tipos: BlockOptions, WallOpening, WallOptions
│   ├── palette.ts         ← cores compartilhadas (chave → Color3)
│   ├── utils.ts           ← geometria: toV3, tint, hash01, subtractIntervals
│   ├── blocks.ts          ← createBlock(): 1 Part ancorado, centro = posição
│   └── builder.ts         ← ModelBuilder.wall(): alvenaria com junta escalonada + recorte de vãos
├── structures/
│   ├── house.ts           ← buildHouse(): fases 01_Fundacao … 07_Chamine
│   └── yard.ts            ← buildYard(): fases 00_Chao … 05_Detalhes
├── demo/
│   └── scene.ts           ← buildScene(): junta quintal + casa num Model raiz só
└── index.ts               ← entry point (vira o Script no ServerScriptService)
docs/ARQUITETURA.md        ← detalhamento: contrato geométrico, algoritmos, hierarquia
preview/index.html         ← visualizador Three.js (mesmas medidas do config.ts)
out-exemplo/blocks.luau    ← exemplo comentado de "TS virar Luau"
default.project.json       ← mapa do Rojo (o que vai para qual serviço)
tsconfig.json              ← sai em out/, tipos do @rbxts/types
package.json               ← scripts npm (build, watch, clean…)
out/                       ← GERADO pelo rbxtsc — não edite à mão
```

**Fluxo de dados:** `src/*.ts` → (`rbxtsc`) → `out/*.lua` → (Rojo ou colagem) → `ServerScriptService` → Play ▶ → `Workspace.BlockHouseDemo`.

---

## Como customizar

### 1. Medidas — `src/config.ts`

Tudo que é número mora aqui (nenhum "mágico" espalhado pelo código):

| O quê | Onde |
|---|---|
| pegada da casa | `HOUSE.x0/x1/z0/z1` (atualize `width`/`depth` junto: `width = x1 - x0`) |
| altura/espessura da parede | `HOUSE.wallHeight`, `HOUSE.wallThickness` |
| formato do bloco | `HOUSE.blocks` (padrão: 3 × 1 studs) |
| porta | `HOUSE.door` (largura, altura, posição `x` — é centralizada na fachada) |
| janelas | `HOUSE.window` (`sill` = altura do peitoril, `height`, `width`) |
| telhado | `HOUSE.roof` (`overhang` = sobrebequeira, `rise` = altura da cumeeira) |
| terreno/cerca | `SCENE.groundSize`, `SCENE.fenceSide`, `PATH` |

Contrato geométrico: **Y=0 é o topo da grama**, a casa fica centrada na origem e a fachada vira para **+Z** — respeite isso e as peças continuam encaixando sem sobreposição.

### 2. Cores — `src/core/palette.ts`

Paleta por **chave** (`"brick"`, `"grass"`, `"roof"`…) em vez de `Color3` solto, pra casa e quintal usarem sempre a mesma tonalidade. Trocou a cor aqui, muda em tudo.

### 3. Alvenaria — `src/core/builder.ts`

`ModelBuilder.wall()` é o motor da parede. Opções úteis:

```ts
const paredes = new ModelBuilder("03_Paredes", casa);
paredes.wall({
  origin: [HOUSE.x0, HOUSE.baseY, HOUSE.z0], // canto mínimo da parede
  length: HOUSE.width,
  height: HOUSE.wallHeight,
  axis: "x",                       // "x" ou "z"
  brickLength: 3,                  // comprimento do bloco
  stagger: true,                   // fiadas alternadas (junta corrida)
  colorVariance: 0.05,             // variação de tom por bloco
  openings: [                      // vãos a recortar (relativos à parede)
    { from: 14, to: 20, fromY: 0, toY: 8 },
  ],
});
```

### 4. Ver a obra se montando — `stageDelay`

```ts
// src/index.ts
buildScene({ stageDelay: 0.4 });
```

Também vale para `buildHouse({ stageDelay })` e `buildYard({ stageDelay })` isoladamente.

### 5. Performance

- **Cada bloco é 1 `Part`.** O número de peças cresce com a *área* da parede ÷ área do bloco: dobrar `wallHeight` ou diminuir `blocks.length` quase dobra o total. Rode o jogo e olhe o Output — a contagem aparece toda vez.
- **`Anchored` é o que segura tudo.** `createBlock()` já nasce com `Anchored = true`; sem isso a física calcula colisão de centenas de peças e a casa desaba.
- **Agrupe em `Model`s** (é o que as fases `01_…`, `02_…` fazem): Explorer limpo, seleção em bloco, e dá pra desligar/destruir uma fase inteira de uma vez.
- Mantenha a cena na casa das **algumas centenas a poucos milhares de Parts** para rodar bem em máquinas fracas/mobile. Peças com `PointLight`, `Neon` e sombra custam mais — use nos pontos que importam.
- Variação de tom (`colorVariance`) não custa performance nenhuma: é só cor.

---

## Solução de problemas

| Sintoma | Causa e correção |
|---|---|
| `Cannot find module './structures/house'` (ou TS2307) | arquivo faltando ou caminho errado. Confira se `src/structures/house.ts` existe, se o `import` bate no nome **e** na maiúsculas (o projeto usa `forceConsistentCasingInFileNames`). |
| Erros estranhos de tipo (`@rbxts/types`) ou `Cannot find module '@rbxts/types'` | dependências desatualizadas/faltando: `npm install`. Se persistir: `rm -rf node_modules package-lock.json && npm install`. |
| O `rbxtsc` falha citando Rojo (`noRojoData`, "não achou dados do Rojo") | o `default.project.json` não mapeia o arquivo gerado. Todo o conteúdo de `out/` **e** a pasta `include/` (RuntimeLib) precisam estar mapeados na árvore do Rojo. |
| As peças só aparecem pra você / os outros jogadores não veem | você criou um **`LocalScript`** (ou colocou o Script em `StarterPlayerScripts`). Precisa ser **`Script` de servidor em `ServerScriptService`**. |
| As peças caem, a casa desaba ou "explode" | algo não está `Anchored`. `createBlock()` nasce ancorado — se você criou uma `Part` à mão, marque `Anchored` nas Properties. |
| Output mostra erro de `require` (módulo não encontrado / attempt to call a nil value) | a árvore de pastas/ModuleScripts no Studio não espelha `out/`, ou falta a RuntimeLib (`ReplicatedStorage/rbxts_include` — veja o Caminho B, passo 7). |
| O entry não roda: `index` apareceu como `ModuleScript` | o Rojo só cria `Script` a partir de `*.server.lua`. Correção rápida: crie um `Script` na mesma pasta, cole o conteúdo de `out/index.lua` e apague o ModuleScript. |
| Não existe `out/index.lua` | confira `tsconfig.json` (`rootDir`/`outDir`) e o que o `default.project.json` aponta como entry — em versões mais antigas do projeto o entry pode ser `out/server/main.server.lua`. |
| Erros `Invalid Luau identifier!` ou `Property 'x' does not exist on type 'Vector3'` | identificador/reservado do Luau ou API em outra forma: renomeie a variável (ex.: `local` é palavra reservada) e use as propriedades maiúsculas (`X`, `Y`, `Z`) ou `new CFrame(...)`. |
| Rojo não conecta | plugin do Rojo instalado e Studio aberto? porta igual a `servePort` do `default.project.json`? Sem Rojo, use o Caminho B ou C. |
| Dei Play e nada aconteceu | olhe o **Output** (o Script imprime `[BlockHouseDemo] pronto: N blocos…`). Rode `npm run build` de novo — o Studio executa o que está **salvo** em `out/`. |
| A casa aparece duplicada | algum outro Script também está chamando a construção. A cena é idempotente: remove a anterior com o mesmo nome antes de criar de novo. |

---

## Mais detalhes

[`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) — contrato geométrico, algoritmos (junta escalonada, recorte de vãos, tom determinístico), hierarquia de Models gerada e a tabela TypeScript → Luau.

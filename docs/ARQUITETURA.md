# Arquitetura — Casa Blocos de Montar

Detalhamento técnico da demonstração: como o código vira uma casa no `Workspace`, quais algoritmos sustentam a "alvenaria" e onde mexer para estender.

> Leia o [README](../README.md) primeiro para instalar, buildar e colocar a cena no Roblox.

---

## 1. Pipeline

```
src/**/*.ts  ── rbxtsc (npm run build) ──▶  out/**/*.lua  ── Rojo / colagem ──▶  ServerScriptService
                                                                                     │ Play ▶
                                                                          Workspace.BlockHouseDemo
```

- **`rbxtsc`** (roblox-ts) compila TypeScript → Luau com os tipos do Roblox (`@rbxts/types`).
- O build também gera **`include/`** na raiz do projeto: a RuntimeLib em Luau (`RuntimeLib.lua`, `Promise.lua`) que o código transpilado carrega no topo com `require(…)`.
- **`out/`** é artefato gerado: nunca edite à mão (é apagado por `npm run clean`).
- O entry point é **`src/index.ts`** → **`out/index.lua`** → um **`Script` de servidor**. Roda no servidor, logo as peças **replicam** para todos os jogadores.

---

## 2. Camadas

| Camada | Arquivos | Responsabilidade |
|---|---|---|
| **Configuração** | `src/config.ts` | única fonte de medidas (pegada, vãos, telhado, terreno) |
| **Núcleo** | `src/core/*` | primitivas genéricas: peça atômica, alvenaria, cor, matemática |
| **Estruturas** | `src/structures/house.ts`, `yard.ts` | as fases da obra, usando só o núcleo + config |
| **Demo** | `src/demo/scene.ts` | orquestra casa + quintal num Model raiz, mede tempo e conta peças |
| **Entry** | `src/index.ts` | 3 linhas: chama `buildScene()` |

Regra de dependência: **setas só para cima**. `core/` não importa nada de `structures/`; `structures/` não importa `demo/`. Assim dá para testar `wall()` sozinho ou montar uma cena diferente reaproveitando o núcleo.

---

## 3. Contrato geométrico (`src/config.ts`)

Toda a cena depende de três constantes — se elas estiverem certas, as peças encaixam sem sobreposição:

- **Y = 0** é o nível do chão (topo da placa de grama). A fundação ocupa `y = 0 … foundationThickness`.
- A casa fica **centrada na origem**, fachada para **+Z**, porta centrada em `x = 0`.
- **Parede é definida pelo canto mínimo** (`origin`) + comprimento + eixo:
  - parede no eixo **X**: ocupa `thickness` studs a partir de `origin.z` para +Z;
  - parede no eixo **Z**: ocupa `thickness` studs a partir de `origin.x` para +X.

Para a face externa bater com a pegada declarada (`x0/x1/z0/z1`):

| Face | `origin` |
|---|---|
| frente (+Z) | `z = z1 - thickness` |
| trás (−Z) | `z = z0` |
| esquerda (−X) | `x = x0` (encurtada nos cantos) |
| direita (+X) | `x = x1 - thickness` |

Essa "encurtada nos cantos" evita **z-fighting**: as laterais não invadem o volume das paredes de frente/trás. Mesma lógica no tapete (nível acima do piso) e na sapata (meio enterrada no terreno).

> `width`/`depth` são derivadas de `x1-x0`/`z1-z0` mas declaradas à mão — troque os dois juntos.

---

## 4. Primitivas (`src/core/`)

### `blocks.ts` — a peça atômica

`createBlock(options)` cria **1 `Part`** (ou `WedgePart`/cilindro/esfera via `form`):

- `position` é o **centro** da peça, nunca o canto (mentalmente mais fácil de calcular);
- `rotation` em **graus**, ordem XYZ;
- nasce com **`Anchored = true`**, `CanCollide = true`, superfícies `Smooth`, `CastShadow = true`;
- cor aceita `Color3` **ou** chave da paleta (`"brick"`).

`Anchored` por padrão é o que permite jogar 700+ peças no mundo sem a física ter que resolver nenhuma delas.

### `palette.ts` — cores por chave

`PALETTE` mapeia chaves → `Color3` (`resolveColor()` converte). Casa e quintal compartilham a mesma tonalidade sem importar arquivo nenhum. Trocar a paleta inteira = editar um arquivo.

### `utils.ts` — matemática da obra

| Função | Papel |
|---|---|
| `toV3` | aceita `[x, y, z]` ou `Vector3` (menos ruído que `new Vector3` em todo lugar) |
| `rotCFrame` | posição + rotação em graus → `CFrame` |
| `tint(color, fator)` | clareia/escurece um `Color3` multiplicando canais |
| `hash01(index)` | ruído **determinístico** 0..1 a partir de um índice |
| `subtractIntervals` | subtrai intervalos de um intervalo (é o tal do recorte) |

### `builder.ts` — `ModelBuilder.wall()`

O motor da alvenaria. Para cada parede:

1. Calcula `rows = ceil(height / brickHeight)` fiadas.
2. **Junta escalonada:** fiadas ímpares começam com `offset = -brickLength / 2` — é o meio-tijolo deslocado que dá a cara de alvenaria (`stagger: false` desliga).
3. Para cada fiada, coleta os **vãos que a cruzam** (overlap vertical entre `opening.fromY..toY` e a faixa da fiada).
4. Percorre a fiada em passos de `brickLength` e, para cada bloco, aplica `subtractIntervals()` — o bloco é **encurtado**, não apagado, então os batentes ficam retos:
   ```
   bloco [12, 15]  com vão [13.5, 15]  →  [12, 13.5]   (meio tijolo colado ao batente)
   ```
5. Cada segmento vira um `Part` dentro de um `Model` filho (`name` da parede), com cor tingida por `tint(base, 1 ± colorVariance * hash01(i))`.
6. Devolve a lista de peças (útil para conferências).

**Por que a variação de tom?** Sem ela, tijolos adjacentes com a mesma cor formam uma superfície contínua e a junta some — a parede parece uma placa única. `hash01` é uma função pura (`sin` + hash), então **a mesma casa nasce idêntica a cada Play**, sem `math.random`.

### Recorte de vãos — `subtractIntervals(from, to, cuts)`

Algoritmo de intervalos 1D: começa com `[from, to]` e, para cada corte, divide cada pedaço que sobrepõe em até dois (esquerda + direita). Corte que não encosta passa reto. É por isso que uma janela de 5 studs encaixa mesmo quando cai em cima de uma junta escalonada — nunca sobra furo torto nem bloco invadindo o vão.

---

## 5. Fases e hierarquia gerada

`buildHouse()` e `buildYard()` devolvem um `Model` (o nome do Model pai vem do parâmetro `name`, se você passar) e criam, **nesta ordem**, os Models filhos numerados. A ordem importa (fundação antes de parede, parede antes de telhado).

```
Workspace
└─ BlockHouseDemo                      (Model raiz — buildScene)
   ├─ Casa                             (buildHouse)
   │  ├─ 01_Fundacao                   sapata + laje + rodapé
   │  ├─ 02_Piso                       laje interna
   │  ├─ 03_Paredes                    alvenaria running bond, bloco a bloco
   │  ├─ 04_Aberturas                  portas/janelas recortadas + caixilhos
   │  ├─ 05_Interior                   divisórias e mobília
   │  ├─ 06_Telhado                    painéis inclinados + sobrebequeira
   │  └─ 07_Chamine                    atravessa o telhado
   └─ Quintal                          (buildYard)
      ├─ 00_Chao                        placa de terreno (Y=0)
      ├─ 01_Cerca                       cerca + portão
      ├─ 02_Caminho                     pedras porta → portão
      ├─ 03_Vegetacao                   árvores, arbustos, flores
      ├─ 04_Iluminacao                  postes + PointLights
      └─ 05_Detalhes                    correio, bancos, vaso
```

Cada fase é um `Model` separado **de propósito**: Explorer legível, seleção em bloco, e é isso que o **`stageDelay`** usa para revelar a obra fase a fase (`buildScene({ stageDelay: 0.4 })` → 0,4 s entre cada uma).

### `demo/scene.ts`

- destrói um `BlockHouseDemo` antigo **pelo nome** antes de criar (cena idempotente: dá Play 10x, 1 casa);
- monta terreno → casa → quintal;
- conta `BasePart`s com `GetDescendants()` e imprime `[BlockHouseDemo] pronto: N blocos em T s` no Output — esse número é a sua régua de performance.

---

## 6. Performance

| Custo | O que fazer |
|---|---|
| **Nº de `Part`s** | cresce com a área ÷ área do bloco (3×1). A fachada de 34×12 studs = 12 fiadas × ~12 blocos. Aumentar `wallHeight` ou diminuir `blocks.length` multiplica o total. |
| **Física** | `Anchored = true` em tudo: o solver não calcula nada. Nunca solte a casa. |
| **Luz/sombra** | cada `PointLight` + material `Neon` é renderização extra. Use em postes/lustre, não em cada bloco. |
| **Organização** | Models por fase permitem desligar/destruir grupos inteiros e deixam o `Workspace` tratado pelo streaming. |
| **Medir** | a contagem impressa no Output é o KPI. Centenas ~ poucos milhares = tranquilo. |

---

## 7. TypeScript → Luau (o que muda no caminho)

| TypeScript (`src/`) | Luau gerado (`out/`) |
|---|---|
| tipos, interfaces, `import type` | somem em tempo de compilação |
| `import { buildHouse } from "…"` | `TS.import(script, …)` (resolve pelo Rojo config) |
| `new Instance("Part")` | `Instance.new("Part")` |
| `array.push(x)` / `for..of` | `table.insert(...)` / laço numérico |
| `typeIs(x, "string")` | `typeof(x) == "string"` |
| `math.atan2(y, x)` | `math.atan(y, x)` |
| `Color3.fromHex("#a8503c")` | igual — runtime do Roblox |
| `strict: true` | erros pegos **antes** de chegar no Studio |

Ou seja: o runtime é o mesmo Roblox, sem camada de abstração visível — a única dependência é a **RuntimeLib** (`TS`), que o build copia para a pasta `include/` na raiz do projeto e que o código gerado localiza pelo caminho mapeado no `default.project.json`. Se o seu `out/index.lua` não tiver o `local TS = require(…)` no topo, não existe dependência nenhuma: é só Luau puro.

Quer ver o resultado real? `out-exemplo/blocks.luau` é um exemplo comentado do código transpilado, e após `npm run build` você pode abrir qualquer arquivo de `out/` para comparar com o `.ts` de origem.

---

## 8. Estender

- **Mover/porta/janela nova:** mexa só em `src/config.ts` (`HOUSE.door`, `HOUSE.window`) — as fases leem daqui.
- **Outra cor:** chave nova em `palette.ts` e referencie por string (`color: "brickDark"`).
- **Outra parede (muro, divisória):** chame `ModelBuilder.wall()` com outro `origin`/`length`/`openings`.
- **Peça não retangular:** `createBlock({ form: "wedge" | "cylinder" | "ball", rotation: [...] })`.
- **Fase nova:** crie `src/structures/<nome>.ts`, exporte `build*` no mesmo formato (`{ parent?, name?, stageDelay? }`) e chame em `src/demo/scene.ts`.
- **Telhado com `WedgePart`:** já suportado pelo `form: "wedge"` — troca o painel rotacionado por cunhas nativas.
- **Interatividade:** `ClickDetector` + `TweenService` em portas; `Lighting.ClockTime` + poste aceso à noite.

import { HOUSE, PATH, SCENE } from "../config";
import { createBlock } from "../core/blocks";
import { ModelBuilder } from "../core/builder";
import { PALETTE } from "../core/palette";
import { hash01, tint } from "../core/utils";

/**
 * Quintal da casa: chão, cerca, caminho, vegetação, ilumeração e detalhes.
 *
 * Tudo obedece ao contrato geométrico de `src/config.ts`:
 *  - chão com o TOPO em y = 0 (placa de 240 x 10 x 240 centrada em y = -5);
 *  - cerca quadrada de lado SCENE.fenceSide (120) => linhas em x = ±60 e z = ±60;
 *  - caminho centralizado em x = 0 com PATH.width (6), da porta (z = 12) até o
 *    portão (z = 62), topo em y ≈ 0.2;
 *  - a casa (outro agente) ocupa x ∈ [-17, 17], z ∈ [-12, 12] com a porta
 *    centrada em x = 0 na parede z = 12 — nada daqui entra nessa pegada.
 *
 * As 6 fases viram Models filhos com nomes FIXOS (a documentação lê esses nomes):
 * `00_Chao`, `01_Cerca`, `02_Caminho`, `03_Vegetacao`, `04_Iluminacao`, `05_Detalhes`.
 *
 * Três regras de ouro seguidas em todo o arquivo:
 *  1. toda peça nasce `Anchored` (o `createBlock` já garante);
 *  2. nenhum detalhe desce abaixo de y = -1 — só a placa de chão, que o contrato
 *     manda ter 10 studs de espessura (ela vai até y = -10);
 *  3. peça sobre peça SEMPRE com sobreposição de volume (0.05 a 0.1 de encaixe),
 *     nunca face encostada na face — é isso que evita z-fighting.
 */

/** Opções de construção do quintal. */
export interface YardOptions {
	parent?: Instance;
	name?: string; // padrão: "Quintal"
	/** Espera em segundos entre fases (0 = instantâneo). Padrão: 0. */
	stageDelay?: number;
}

// ---------------------------------------------------------------------------
// Constantes derivadas do contrato. Nada aqui é "chutado": tudo sai de
// SCENE/PATH/HOUSE para que casa e quintal nunca se atrofiem.
// ---------------------------------------------------------------------------

/** Metade do terreno: as linhas da cerca ficam em x = ±60 e z = ±60. */
const HALF = SCENE.fenceSide / 2;

/** Vão livre do portão em studs, centrado em x = 0 — o caminho precisa passar. */
const GATE_OPEN = 12;

/** Largura de um poste da cerca (1 x 1). */
const POST_W = 1;

/**
 * X dos postes do portão: 6.5 => as faces de dentro ficam em ±6 e o vão livre
 * dá exatamente os 12 studs pedidos.
 */
const GATE_POST_X = GATE_OPEN / 2 + POST_W / 2;

/** Altura dos postes da cerca (o contrato pede ~6). */
const FENCE_H = 6;

/** Duas travessas (rails) horizontais por trecho, nestas alturas. */
const RAIL_Y: number[] = [1.9, 4.3];

// --- z em que a varanda da casa vira "zona de risco" ------------------------
// Os degraus da varanda (src/house/porch.ts, peça de outro agente) descem em
// +Z a partir da porta em 3 níveis; o 1º ainda flutua (base em y = 0.6), mas o
// 2º e o 3º já encostam no nível do chão. Quem ocupa essa faixa são OS DEGRAUS,
// então o ladrilho do caminho não entra lá: as peças não podem se cruzar.
//   1º degrau: z = 12.6 .. 14.6 (flutua, o ladrilho passa por baixo)
//   2º degrau: z = 14.3 .. 16.3 (chão)  -> início da faixa proibida
//   3º degrau: z = 16.0 .. 18.0 (chão)  -> fim da faixa proibida
const DEGRAU_CHAO0 = HOUSE.z1 + 2.3; // 14.3
const DEGRAU_CHAO1 = HOUSE.z1 + 6; // 18.0

/** Capa do caminho encostada na fachada: começa em z = 12 e para antes do 2º degrau. */
const CAPA_A_FROM = PATH.fromZ; // 12
const CAPA_A_TO = DEGRAU_CHAO0 - 0.05; // 14.25

/** Capa de chegada em pé de varanda: 0.4 de folga depois do último degrau. */
const CAPA_B_FROM = DEGRAU_CHAO1 + 0.4; // 18.4
const CAPA_B_TO = CAPA_B_FROM + 3; // 21.4

/** Trecho de ladrilhos soltos: da capa de chegada até a linha do portão. */
const GRID_FROM = CAPA_B_TO + 0.4; // 21.8
const GRID_TO = PATH.toZ; // 62

/** Junta entre ladrilhos (é a junta que faz cada pedra ler como peça solta). */
const TILE_GAP = 0.45;

/** Altura do ladrilho: com o centro em y = 0, o TOPO fica em y = 0.2. */
const TILE_H = 0.4;

/**
 * 00_Chao — a placa de grama inteira.
 *
 * Peça única de 240 x 10 x 240 centrada em (0, -5, 0): o topo cai exatamente
 * em y = 0, que é o nível em que todo o resto da cena foi desenhado. Optei por
 * uma peça só (em vez de 4 quadrantes) para não deixar faces encostadas face a
 * face no centro do terreno.
 */
function buildChao(group: Model): void {
	createBlock({
		name: "Grama",
		size: [SCENE.groundSize, SCENE.groundThickness, SCENE.groundSize],
		position: [0, -SCENE.groundThickness / 2, 0],
		color: "grass",
		material: Enum.Material.Grass,
		parent: group,
	});
}

/**
 * 01_Cerca — perímetro completo com portão aberto virado para o caminho.
 *
 * Postes a cada 8 studs, duas travessas por trecho e um portão de 12 studs
 * centrado em x = 0 na linha z = 60 (o caminho sai por ele até z = 62).
 * A casa fica em ±17 / ±12 e a cerca em ±60: folga de mais de 40 studs, então
 * nada aqui chega perto da alvenaria.
 */
function buildCerca(group: Model): void {
	// Pé do poste 0.1 enterrado no gramado: se parasse em y = 0 a face de baixo
	// ficaria coplana com o topo da placa de grama (z-fighting na hora H).
	const postY = FENCE_H / 2 - 0.1;

	const addPost = (x: number, z: number, tag: string): void => {
		createBlock({
			name: `Poste_${tag}`,
			size: [POST_W, FENCE_H, POST_W],
			position: [x, postY, z],
			color: "woodDark",
			material: Enum.Material.Wood,
			parent: group,
		});
		// Tampa "afundada" 0.1 no poste (5.8..6.2 contra o topo 5.9) — encaixe,
		// não encostão: aí não há duas faces no mesmo plano.
		createBlock({
			name: `Poste_${tag}_Topo`,
			size: [POST_W + 0.3, 0.4, POST_W + 0.3],
			position: [x, FENCE_H, z],
			color: "wood",
			material: Enum.Material.Wood,
			parent: group,
		});
	};

	// Travessa: 0.45 de espessura passando pelo miolo dos postes de 1.0 —
	// sobra meio poste de cada lado e nenhuma face encosta na do carril.
	const addRail = (cx: number, cz: number, length: number, alongX: boolean, y: number): void => {
		createBlock({
			name: "Travessa",
			size: alongX ? [length, 0.5, 0.45] : [0.45, 0.5, length],
			position: [cx, y, cz],
			color: "wood",
			material: Enum.Material.Wood,
			parent: group,
		});
	};

	// Grade de postes: 120 / 8 = 15 intervalos => 16 posições por linha.
	// Os cantos entram uma vez só (as colunas laterais pulam k = 0 e k = 15,
	// que já nasceram nas fileiras de z = ±60).
	const last = SCENE.fenceSide / 8; // 15
	for (let k = 0; k <= last; k++) {
		const t = -HALF + k * 8;

		// Trás (-Z): linha fechada.
		addPost(t, -HALF, `Tras_${k}`);

		// Frente (+Z): pula x = ±4, que ficariam DENTRO do vão do portão.
		if (math.abs(t) >= GATE_POST_X + 0.5) {
			addPost(t, HALF, `Frente_${k}`);
		}

		// Laterais: só os intermediários.
		if (k > 0 && k < last) {
			addPost(-HALF, t, `Esq_${k}`);
			addPost(HALF, t, `Dir_${k}`);
		}
	}

	// Batentes do portão: vão livre exatamente de 12 studs (de -6 a +6).
	addPost(-GATE_POST_X, HALF, "Portao_E");
	addPost(GATE_POST_X, HALF, "Portao_D");

	// Duas travessas em cada lado.
	// Trás e laterais: linhas completas, terminando no miolo dos cantos.
	// Frente: dois trechos com o vão do portão no meio (senão o caminho ficaria
	// bloqueado por uma barra de madeira).
	const segLen = HALF - GATE_POST_X; // 53.5
	const segCx = GATE_POST_X + segLen / 2; // 33.25
	for (const y of RAIL_Y) {
		addRail(0, -HALF, SCENE.fenceSide, true, y);
		addRail(-HALF, 0, SCENE.fenceSide, false, y);
		addRail(HALF, 0, SCENE.fenceSide, false, y);
		addRail(segCx, HALF, segLen, true, y);
		addRail(-segCx, HALF, segLen, true, y);
	}

	// --- Folhas do portão, ABERTAS para fora (+Z) ---------------------------
	// Giradas 80°: dá para ver que é um portão (e não um buraco na cerca) e o
	// vão de 12 continua livre para o caminho passar.
	const leafLen = GATE_OPEN / 2; // 6 studs por folha
	const leafAngle = 80;
	const cosA = math.cos(math.rad(leafAngle));
	const sinA = math.sin(math.rad(leafAngle));
	// Centro de cada folha = dobradiça + metade do comprimento no eixo girado.
	const leaves: Array<{ x: number; z: number; rotY: number }> = [
		// esquerda: dobradiça em (-6.5, 60), gira -80° e sai em +Z
		{ x: -GATE_POST_X + (leafLen / 2) * cosA, z: HALF + (leafLen / 2) * sinA, rotY: -leafAngle },
		// direita: espelho perfeito
		{ x: GATE_POST_X - (leafLen / 2) * cosA, z: HALF + (leafLen / 2) * sinA, rotY: leafAngle },
	];

	for (const leaf of leaves) {
		// Eixo local X da folha já girada (para posicionar os batentes nela).
		const uX = math.cos(math.rad(leaf.rotY));
		const uZ = -math.sin(math.rad(leaf.rotY));

		// 3 ripas horizontais.
		for (const y of [1.5, 3.0, 4.5]) {
			createBlock({
				name: "Portao_Ripa",
				size: [leafLen, 0.5, 0.35],
				position: [leaf.x, y, leaf.z],
				rotation: [0, leaf.rotY, 0],
				color: "woodLight",
				material: Enum.Material.Wood,
				parent: group,
			});
		}

		// 2 batentes verticais (um na dobradiça, outro na ponta) fecham a cara
		// de portão; ambos ficam 0.25 antes das pontas das ripas.
		for (const s of [-1, 1]) {
			const off = (leafLen / 2 - 0.25) * s;
			createBlock({
				name: "Portao_Batente",
				size: [0.35, 3.9, 0.35],
				position: [leaf.x + uX * off, 3.0, leaf.z + uZ * off],
				rotation: [0, leaf.rotY, 0],
				color: "woodDark",
				material: Enum.Material.Wood,
				parent: group,
			});
		}
	}
}

/**
 * 02_Caminho — pedras soltas da porta até o portão.
 *
 * Três trechos: uma capa encostada na fachada, a capa de chegada em pé de
 * varanda e a grade de ladrilhos até z = 62. A faixa dos degraus (z 14.3..18)
 * fica vazia de propósito: quem "caminha" ali são os próprios degraus.
 *
 * Observação: `PATH.length` (34) está defasado em `config.ts` — o trecho útil é
 * `fromZ .. toZ` (12 .. 62 = 50 studs), então é daí que vêm as contas.
 */
function buildCaminho(group: Model): void {
	// Capa A: encosta exatamente no plano da fachada (z = 12) e para 0.05 antes
	// do 2º degrau. Passa por baixo da varanda, onde não há outro piso.
	createBlock({
		name: "Capa_Soleira",
		size: [PATH.width, TILE_H, CAPA_A_TO - CAPA_A_FROM],
		position: [0, 0, (CAPA_A_FROM + CAPA_A_TO) / 2],
		color: "concrete",
		material: Enum.Material.Concrete,
		parent: group,
	});

	// Capa B: patamar de chegada, 1.2 mais largo que o caminho (sensação de
	// "desembocar" saindo da varanda).
	createBlock({
		name: "Capa_Chegada",
		size: [PATH.width + 1.2, TILE_H, CAPA_B_TO - CAPA_B_FROM],
		position: [0, 0, (CAPA_B_FROM + CAPA_B_TO) / 2],
		color: "concrete",
		material: Enum.Material.Concrete,
		parent: group,
	});

	// Grade principal. O número de fileiras é calculado para que a última pedra
	// termine EXATAMENTE em z = 62 (nem 1 mm a mais, para não invadir o portão).
	const rows = math.max(1, math.round((GRID_TO - GRID_FROM) / 3.2)); // 13
	const pitch = (GRID_TO - GRID_FROM + TILE_GAP) / rows;
	const depth = pitch - TILE_GAP;

	// 2 colunas de 2.8 => junta de 0.2 no meio e 0.1 de folga nas bordas dos
	// 6 studs de PATH.width.
	const cols = [-1.5, 1.5];
	const tileW = 2.8;

	for (let r = 0; r < rows; r++) {
		const z = GRID_FROM + depth / 2 + r * pitch;
		for (let c = 0; c < cols.size(); c++) {
			// Tom variado com hash DETERMINÍSTICO: mesma cor a cada execução,
			// sem depender de `math.random` (e sem "manchas" repetidas).
			const base = hash01(r * 5 + c * 7 + 2) > 0.75 ? PALETTE.concrete : PALETTE.path;
			const shade = 0.92 + hash01(r * 11 + c * 3 + 5) * 0.16;

			createBlock({
				name: `Ladrilho_${r}_${c}`,
				size: [tileW, TILE_H, depth],
				position: [cols[c], 0, z],
				color: tint(base, shade),
				material: Enum.Material.Slate,
				parent: group,
			});
		}
	}
}

/** Árvore: tronco em cilindro vertical + copa em 3 blocos empilhados. */
function addTree(group: Model, x: number, z: number, scale: number, seed: number): void {
	// CILINDRO VERTICAL: no Roblox o cilindro cresce no eixo X da peça, por isso
	// o tamanho é [altura, d, d] girado 90° em Z (sem o giro o tronco deitaria).
	const trunkH = 8.5 * scale;
	const trunkD = 1.5 * scale;
	createBlock({
		name: `Tronco_${seed}`,
		size: [trunkH, trunkD, trunkD],
		position: [x, trunkH / 2 - 0.15, z],
		rotation: [0, 0, 90],
		color: "trunk",
		material: Enum.Material.Wood,
		form: "cylinder",
		parent: group,
	});

	// Copa em 3 bolas achatadas. Cada uma nasce 0.1..0.6 mais baixa que a peça
	// anterior, garantindo encaixe (nunca "boia" nem encosta face a face).
	const blobs: Array<[dy: number, d: number]> = [
		[1.6, 5.2],
		[4.2, 4.0],
		[6.4, 2.8],
	];
	blobs.forEach(([dy, size], i) => {
		const d = size * scale;
		const leafColor = i % 2 === 0 ? PALETTE.leafDark : PALETTE.leaf;
		createBlock({
			name: `Copa_${seed}_${i}`,
			size: [d, d * 0.85, d],
			position: [x, trunkH + dy * scale, z],
			color: tint(leafColor, 0.92 + hash01(seed * 13 + i) * 0.18),
			material: Enum.Material.Grass,
			form: "ball",
			parent: group,
		});
	});
}

/** Arbusto: uma bola meio enterrada (o pé fica 0.05d abaixo de y = 0). */
function addBush(group: Model, x: number, z: number, d: number, seed: number): void {
	createBlock({
		name: `Arbusto_${seed}`,
		size: [d, d * 0.8, d],
		position: [x, d * 0.35, z],
		color: tint(hash01(seed) > 0.5 ? PALETTE.leaf : PALETTE.leafDark, 0.95 + hash01(seed * 7) * 0.12),
		material: Enum.Material.Grass,
		form: "ball",
		parent: group,
	});
}

/**
 * 03_Vegetacao — árvores e arbustos.
 *
 * Nenhuma peça pousa sobre a casa (x ±18 / z ±13, mais a varanda até z = 18.7),
 * nenhuma pousa no caminho (faixa |x| <= 6 entre z = 12 e 62) e todas ficam a
 * pelo menos ~4 studs da cerca (|x| e |z| <= 56). As posições estão espalhadas
 * nos 4 quadrantes para o terreno não parecer um bosque de um só lado.
 */
function buildVegetacao(group: Model): void {
	// 5 árvores.
	const trees: Array<[x: number, z: number, scale: number, seed: number]> = [
		[-32, -30, 1.1, 1], // fundos, esquerda
		[33, -34, 0.95, 2], // fundos, direita
		[-44, 34, 1.0, 3], // frente, esquerda
		[44, 36, 1.2, 4], // frente, direita (a maior)
		[25, 47, 1.0, 5], // frente, entre o caminho e a cerca
	];
	for (const [x, z, scale, seed] of trees) {
		addTree(group, x, z, scale, seed);
	}

	// 6 arbustos: dois ladeando a varanda, dois nos fundos, dois junto ao caminho
	// (com 2.4 de folga para fora da faixa proibida, então não entram no ladrilho).
	const bushes: Array<[x: number, z: number, d: number, seed: number]> = [
		[-11, 17, 3.2, 1],
		[11, 17, 3.2, 2],
		[-24, -17, 3.6, 3],
		[24, -19, 3.2, 4],
		[-10, 34, 2.8, 5],
		[10, 42, 3.0, 6],
	];
	for (const [x, z, d, seed] of bushes) {
		addBush(group, x, z, d, seed);
	}
}

/** Poste de luz: base, haste cilíndrica, suporte, lanterna Neon e PointLight de verdade. */
function addPosteDeLuz(group: Model, x: number, z: number, tag: string): void {
	// Base: pé 0.05 enterrado (mesmo truque dos postes da cerca).
	createBlock({
		name: `Luz_${tag}_Base`,
		size: [1.6, 0.5, 1.6],
		position: [x, 0.2, z],
		color: "metal",
		material: Enum.Material.Metal,
		parent: group,
	});

	// Haste: cilindro vertical (girado 90° em Z, como os troncos).
	createBlock({
		name: `Luz_${tag}_Haste`,
		size: [5.5, 0.5, 0.5],
		position: [x, 2.95, z],
		rotation: [0, 0, 90],
		color: "metal",
		material: Enum.Material.Metal,
		form: "cylinder",
		parent: group,
	});

	// Suporte do topo: entra 0.3 na haste e 0.15 na lanterna.
	createBlock({
		name: `Luz_${tag}_Suporte`,
		size: [1.4, 0.4, 1.4],
		position: [x, 5.6, z],
		color: "metal",
		material: Enum.Material.Metal,
		parent: group,
	});

	// Lanterna: PALETTE.lamp, Neon e transparency 0 (brilha de verdade).
	const lantern = createBlock({
		name: `Luz_${tag}_Lanterna`,
		size: [1.5, 1.7, 1.5],
		position: [x, 6.5, z],
		color: PALETTE.lamp,
		material: Enum.Material.Neon,
		parent: group,
	});

	// Chapéu para a chuva não "apagar" a lanterna.
	createBlock({
		name: `Luz_${tag}_Chapeu`,
		size: [1.9, 0.35, 1.9],
		position: [x, 7.3, z],
		color: "metal",
		material: Enum.Material.Metal,
		parent: group,
	});

	// Luz real dentro da peça (sem isto a lanterna só parece acesa de dia).
	const light = new Instance("PointLight");
	light.Name = `Luz_${tag}`;
	light.Color = PALETTE.lamp;
	light.Brightness = 2.5;
	light.Range = 34;
	light.Shadows = true;
	light.Parent = lantern;
}

/**
 * 04_Iluminacao — 2 postes, um de cada lado do caminho.
 *
 * x = -5.5 na altura de z = 30 e x = +5.5 na altura de z = 50: as luzes se
 * alternam, o corredor fica iluminado sem virar um palheiro e os postes ficam
 * FORA dos ladrilhos (que chegam só a |x| = 2.9).
 */
function buildIluminacao(group: Model): void {
	addPosteDeLuz(group, -5.5, 30, "Esq");
	addPosteDeLuz(group, 5.5, 50, "Dir");
}

/**
 * 05_Detalhes — caixa de correio, banco e vasos.
 *
 * Tudo alinhado ao caminho: o correio encosta nele (x = 4), o banco é paralelo
 * a ele (cumprimento correndo em Z, virado para +X) e os vasos ladeiam a
 * chegada, sempre a pelo menos 6.4 de x (fora da faixa de circulação).
 */
function buildDetalhes(group: Model): void {
	// --- Caixa de correio (x = 4, z = 56, junto ao portão) ------------------
	createBlock({
		name: "Correio_Poste",
		size: [0.5, 3.4, 0.5],
		position: [4, 1.6, 56],
		color: "woodDark",
		material: Enum.Material.Wood,
		parent: group,
	});
	createBlock({
		name: "Correio_Caixa",
		size: [1.6, 1.4, 2.4],
		position: [4, 3.95, 56], // 3.25..4.65, encaixando 0.05 no poste (topo 3.3)
		color: PALETTE.mailRed,
		material: Enum.Material.Metal,
		parent: group,
	});
	createBlock({
		name: "Correio_Tampa",
		size: [1.4, 0.2, 2.2],
		position: [4, 4.6, 56], // afundada na caixa (topo 4.65), não encostada
		color: "trim",
		material: Enum.Material.Metal,
		parent: group,
	});
	createBlock({
		name: "Correio_Bandeira",
		size: [0.25, 1.2, 0.6],
		position: [4.85, 5.15, 56], // sobe pelo lado de fora do caminho (+X)
		color: PALETTE.mailRed,
		material: Enum.Material.SmoothPlastic,
		parent: group,
	});

	// --- Banco virado para o caminho (x = -8, z = 44) -----------------------
	// Costas para -X, assento olhando para +X: quem senta olha as pedras.
	const bx = -8;
	const bz = 44;
	for (const dz of [-1.9, 1.9]) {
		createBlock({
			name: "Banco_Pe",
			size: [1.6, 1.5, 0.6],
			position: [bx, 0.7, bz + dz], // -0.05..1.45: pé enterrado, topo encaixa no assento
			color: "woodDark",
			material: Enum.Material.Wood,
			parent: group,
		});
	}
	createBlock({
		name: "Banco_Assento",
		size: [2.0, 0.5, 5.0],
		position: [bx, 1.65, bz], // 1.4..1.9, mordendo 0.05 nos pés
		color: "wood",
		material: Enum.Material.Wood,
		parent: group,
	});
	createBlock({
		name: "Banco_Encosto",
		size: [0.3, 1.5, 5.0],
		position: [bx - 0.85, 2.6, bz], // 1.85..3.35, encaixado no assento (topo 1.9)
		color: "wood",
		material: Enum.Material.Wood,
		parent: group,
	});

	// --- Vasos ladeando a chegada do caminho -------------------------------
	for (const x of [-7.5, 7.5]) {
		createBlock({
			name: "Vaso_Terro",
			size: [2.2, 1.4, 2.2],
			position: [x, 0.65, 21], // -0.05..1.35
			color: "brickDark",
			material: Enum.Material.Brick,
			parent: group,
		});
		createBlock({
			name: "Vaso_Terra",
			size: [1.8, 0.25, 1.8],
			position: [x, 1.3, 21], // 1.175..1.425, embutida no vaso
			color: "dirt",
			material: Enum.Material.Ground,
			parent: group,
		});
		createBlock({
			name: "Vaso_Folha",
			size: [1.3, 1.3, 1.3],
			position: [x, 1.95, 21],
			color: PALETTE.leaf,
			material: Enum.Material.Grass,
			form: "ball",
			parent: group,
		});
		// Florzinha neon: mesmo truque da lanterna, um detalhe que "acende".
		createBlock({
			name: "Vaso_Flor",
			size: [0.55, 0.55, 0.55],
			position: [x, 2.6, 21],
			color: PALETTE.mailRed,
			material: Enum.Material.Neon,
			form: "ball",
			parent: group,
		});
	}
}

/**
 * Monta o quintal inteiro em 6 fases.
 *
 * Cada fase vira um Model filho com nome fixo (`00_Chao` ... `05_Detalhes`) e,
 * se `stageDelay > 0`, espera esse tempo antes da próxima — assim dá para ver
 * a obra "crescendo" no Explorer/render.
 */
export function buildYard(options?: YardOptions): Model {
	const parent = options?.parent ?? game.GetService("Workspace");
	const name = options?.name ?? "Quintal";
	const stageDelay = options?.stageDelay ?? 0;

	const builder = new ModelBuilder(name, parent);

	// Só espera se o chamador pedir: com 0 a cena nasce inteira num frame.
	const fimDeFase = (): void => {
		if (stageDelay > 0) {
			task.wait(stageDelay);
		}
	};

	// Fase 1 — a placa de grama (topo em y = 0).
	buildChao(builder.group("00_Chao"));
	fimDeFase();

	// Fase 2 — a cerca com o portão aberto em x = 0 / z = 60.
	buildCerca(builder.group("01_Cerca"));
	fimDeFase();

	// Fase 3 — as pedras do caminho, da fachada até o portão.
	buildCaminho(builder.group("02_Caminho"));
	fimDeFase();

	// Fase 4 — árvores e arbustos, sempre fora da casa e fora do caminho.
	buildVegetacao(builder.group("03_Vegetacao"));
	fimDeFase();

	// Fase 5 — os 2 postes de luz com PointLight de verdade.
	buildIluminacao(builder.group("04_Iluminacao"));
	fimDeFase();

	// Fase 6 — caixa de correio, banco e vasos.
	buildDetalhes(builder.group("05_Detalhes"));
	fimDeFase();

	return builder.finish();
}

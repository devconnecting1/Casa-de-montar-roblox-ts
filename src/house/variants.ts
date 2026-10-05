import { createBlock, createModel } from "../core/blocks";
import { ModelBuilder } from "../core/builder";
import type { WallOpening } from "../core/types";

/**
 * Casas 2 e 3 — paramétricas (NÃO leem `HOUSE` global).
 *
 * A casa principal (`house/walls.ts`, `roof.ts`, ...) é bespoke e presa ao
 * contrato de `src/config.ts`. Estas aqui provam que o núcleo (`ModelBuilder`,
 * `createBlock`, paleta) reaproveita para construir QUALQUER casa: é só passar
 * centro, tamanho e cores. Cada uma sai com fundação, paredes em running-bond,
 * telhado de duas águas, porta/janelas e **interior completo**.
 */

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface SmallHouseSpec {
	/** Nome do Model raiz (ex.: `"Casa_Cabana"`). */
	name: string;
	/** Centro da casa no mundo. */
	center: [x: number, z: number];
	/** Pegada. */
	width: number;
	depth: number;
	/** Altura das paredes acima da laje. */
	wallHeight: number;
	/** Cor das paredes / do telhado. */
	wallColor: "brick" | "brickLight" | "wood" | "concrete" | "stone";
	roofColor: "roof" | "roofDark" | "woodDark" | "leafDark";
	/** Porta: largura/altura e deslocamento em X em relação ao centro. */
	door: { width: number; height: number; offsetX: number };
	/** Quantas janelas por face (frente já desconta a porta). */
	windowsPerFace: number;
}

export interface PlacedHouse {
	model: Model;
	/** Pegada mundial (para auditoria de sobreposição). */
	footprint: { x0: number; x1: number; z0: number; z1: number; ridgeY: number };
}

// ---------------------------------------------------------------------------
// Peças compartilhadas
// ---------------------------------------------------------------------------

function slab(group: Model, cx: number, cz: number, w: number, d: number, baseY: number): void {
	createBlock({
		name: "Laje",
		size: [w + 1, 1, d + 1],
		position: [cx, baseY - 0.5, cz],
		color: "concrete",
		material: Enum.Material.Concrete,
		parent: group,
	});
}

function gableRoof(
	group: Model,
	cx: number,
	topY: number,
	w: number,
	d: number,
	rise: number,
	overhang: number,
	color: SmallHouseSpec["roofColor"],
): number {
	const halfSpan = d / 2 + overhang;
	const panelW = w + overhang * 2;
	const slopeLen = math.sqrt(halfSpan * halfSpan + rise * rise);
	const angleDeg = math.deg(math.atan2(rise, halfSpan));
	const midY = topY + rise / 2;
	const midZ = halfSpan / 2;

	createBlock({
		name: "Agua_Frente",
		size: [panelW, 0.5, slopeLen],
		position: [cx, midY, midZ],
		rotation: [angleDeg, 0, 0],
		color,
		material: Enum.Material.Slate,
		parent: group,
	});
	// Água de trás espelha em Z ao redor do centro (não da origem!).
	createBlock({
		name: "Agua_Tras",
		size: [panelW, 0.5, slopeLen],
		position: [cx, midY, -midZ],
		rotation: [-angleDeg, 0, 0],
		color,
		material: Enum.Material.Slate,
		parent: group,
	});
	createBlock({
		name: "Cumeeira",
		size: [panelW + 0.4, 0.7, 1],
		position: [cx, topY + rise + 0.3, 0],
		color: "roofDark",
		material: Enum.Material.Slate,
		parent: group,
	});
	return topY + rise;
}

function doorLeaf(group: Model, cx: number, baseY: number, z: number, w: number, h: number): void {
	createBlock({
		name: "Porta",
		size: [w - 0.4, h - 0.2, 0.35],
		position: [cx, baseY + (h - 0.2) / 2, z],
		color: "door",
		material: Enum.Material.WoodPlanks,
		parent: group,
	});
	createBlock({
		name: "Macaneta",
		size: [0.5, 0.5, 0.5],
		position: [cx + w / 2 - 0.9, baseY + h / 2 - 0.5, z + 0.4],
		color: "metal",
		material: Enum.Material.Metal,
		form: "ball",
		parent: group,
	});
}

function windowUnit(group: Model, cx: number, cy: number, z: number, alongX: boolean, w: number, h: number): void {
	createBlock({
		name: "Vidro",
		size: alongX ? [w - 0.3, h - 0.3, 0.25] : [0.25, h - 0.3, w - 0.3],
		position: [cx, cy, z],
		color: "glass",
		material: Enum.Material.Glass,
		transparency: 0.35,
		parent: group,
	});
	createBlock({
		name: "Moldura_Cima",
		size: alongX ? [w + 0.4, 0.4, 1.2] : [1.2, 0.4, w + 0.4],
		position: [cx, cy + h / 2 + 0.1, z],
		color: "trim",
		material: Enum.Material.SmoothPlastic,
		parent: group,
	});
	createBlock({
		name: "Peitoril",
		size: alongX ? [w + 0.6, 0.35, 1.6] : [1.6, 0.35, w + 0.6],
		position: [cx, cy - h / 2 - 0.3, z],
		color: "concrete",
		material: Enum.Material.Concrete,
		parent: group,
	});
}

function ceilingLamp(group: Model, x: number, y: number, z: number, tag: string): void {
	const bulb = createBlock({
		name: `Lampada_${tag}`,
		size: [1.1, 1.1, 1.1],
		position: [x, y, z],
		color: "lamp",
		material: Enum.Material.Neon,
		form: "ball",
		parent: group,
	});
	const light = new Instance("PointLight");
	light.Name = `Luz_${tag}`;
	light.Brightness = 2;
	light.Range = 30;
	light.Color = Color3.fromRGB(255, 225, 160);
	light.Parent = bulb;
}

// ---------------------------------------------------------------------------
// Construtor genérico
// ---------------------------------------------------------------------------

function spread(count: number, length: number, margin: number): number[] {
	// Centros distribuídos sem encostar nas bordas (evita janela no canto).
	const out: number[] = [];
	for (let i = 0; i < count; i++) {
		out.push(-length / 2 + margin + ((length - margin * 2) * (i + 0.5)) / count);
	}
	return out;
}

export function buildSmallHouse(parent: Instance, spec: SmallHouseSpec, baseY: number): PlacedHouse {
	const root = createModel(spec.name, parent);
	const [cx, cz] = spec.center;
	const t = 1;
	const x0 = cx - spec.width / 2;
	const x1 = cx + spec.width / 2;
	const z0 = cz - spec.depth / 2;
	const z1 = cz + spec.depth / 2;
	const winW = 4;
	const winH = 3;
	const sill = 3.5;

	slab(root, cx, cz, spec.width, spec.depth, baseY);

	const builder = new ModelBuilder(`${spec.name}_Paredes`, root);
	const sideLen = spec.depth - 2 * t;

	// Vãos da frente (eixo local 0..width a partir de x0).
	const doorCX = cx + spec.door.offsetX;
	const doorFrom = doorCX - spec.door.width / 2 - x0;
	const frontOpenings: WallOpening[] = [
		{ from: doorFrom, to: doorFrom + spec.door.width, fromY: 0, toY: spec.door.height },
	];
	for (const off of spread(spec.windowsPerFace, spec.width, 5)) {
		const wx = cx + off;
		// Pula janela que colidiria com a porta.
		if (math.abs(wx - doorCX) < spec.door.width / 2 + winW / 2 + 0.5) {
			continue;
		}
		const localX = wx - x0;
		frontOpenings.push({ from: localX - winW / 2, to: localX + winW / 2, fromY: sill, toY: sill + winH });
	}
	const backOpenings: WallOpening[] = spread(spec.windowsPerFace + 1, spec.width, 5).map((off) => {
		const localX = cx + off - x0;
		return { from: localX - winW / 2, to: localX + winW / 2, fromY: sill, toY: sill + winH };
	});
	const sideOpenings: WallOpening[] = spread(2, sideLen, 4).map((c) => ({
		from: c - winW / 2,
		to: c + winW / 2,
		fromY: sill,
		toY: sill + winH,
	}));

	builder.wall({
		name: "Frente",
		origin: [x0, baseY, z1 - t],
		length: spec.width,
		height: spec.wallHeight,
		axis: "x",
		thickness: t,
		color: spec.wallColor,
		material: Enum.Material.Brick,
		openings: frontOpenings,
		parent: root,
	});
	builder.wall({
		name: "Tras",
		origin: [x0, baseY, z0],
		length: spec.width,
		height: spec.wallHeight,
		axis: "x",
		thickness: t,
		color: spec.wallColor,
		material: Enum.Material.Brick,
		openings: backOpenings,
		parent: root,
	});
	builder.wall({
		name: "Esquerda",
		origin: [x0, baseY, z0 + t],
		length: sideLen,
		height: spec.wallHeight,
		axis: "z",
		thickness: t,
		color: spec.wallColor,
		material: Enum.Material.Brick,
		openings: sideOpenings,
		parent: root,
	});
	builder.wall({
		name: "Direita",
		origin: [x1 - t, baseY, z0 + t],
		length: sideLen,
		height: spec.wallHeight,
		axis: "z",
		thickness: t,
		color: spec.wallColor,
		material: Enum.Material.Brick,
		openings: sideOpenings,
		parent: root,
	});

	const topY = baseY + spec.wallHeight;
	const ridge = gableRoof(root, cx, topY, spec.width, spec.depth, spec.wallHeight * 0.55, 1.8, spec.roofColor);

	// Porta + janelas (mesmos centros dos vãos; índice 0 é a porta).
	const winCY = baseY + sill + winH / 2;
	doorLeaf(root, doorCX, baseY, z1 - t / 2, spec.door.width, spec.door.height);
	for (let i = 1; i < frontOpenings.size(); i++) {
		const o = frontOpenings[i];
		windowUnit(root, x0 + (o.from + o.to) / 2, winCY, z1 - t / 2, true, winW, winH);
	}
	for (const o of backOpenings) {
		windowUnit(root, x0 + (o.from + o.to) / 2, winCY, z0 + t / 2, true, winW, winH);
	}
	for (const o of sideOpenings) {
		const wz = z0 + t + (o.from + o.to) / 2;
		windowUnit(root, x0 + t / 2, winCY, wz, false, winW, winH);
		windowUnit(root, x1 - t / 2, winCY, wz, false, winW, winH);
	}

	// Piso interno (0.15 acima da laje para não dar z-fighting).
	createBlock({
		name: "Piso",
		size: [spec.width - 2.2, 0.3, spec.depth - 2.2],
		position: [cx, baseY + 0.15, cz],
		color: "wood",
		material: Enum.Material.WoodPlanks,
		parent: root,
	});

	return { model: root, footprint: { x0, x1, z0, z1, ridgeY: ridge } };
}

// ---------------------------------------------------------------------------
// Casa 2 — Cabana do Caseiro (16×12): quarto+sala+cozinha num cômodo
// ---------------------------------------------------------------------------

export function buildCabin(parent: Instance): PlacedHouse {
	const placed = buildSmallHouse(
		parent,
		{
			name: "Casa_Cabana",
			center: [-38, -4],
			width: 16,
			depth: 12,
			wallHeight: 8,
			wallColor: "wood",
			roofColor: "woodDark",
			door: { width: 5, height: 7, offsetX: 0 },
			windowsPerFace: 2,
		},
		1,
	);
	const root = placed.model;
	const [cx, cz] = [-38, -4];
	const fy = 1.3; // topo do piso

	// Cama de solteiro encostada no fundo.
	createBlock({ name: "Cama_Base", size: [4.5, 1, 7], position: [cx - 4.5, fy + 0.5, cz - 1.5], color: "woodDark", material: Enum.Material.Wood, parent: root });
	createBlock({ name: "Cama_Colchao", size: [4.2, 0.7, 6.7], position: [cx - 4.5, fy + 1.3, cz - 1.5], color: "trim", material: Enum.Material.Fabric, parent: root });
	createBlock({ name: "Cama_Travesseiro", size: [3, 0.5, 1.4], position: [cx - 4.5, fy + 1.9, cz - 4], color: "glass", material: Enum.Material.Fabric, parent: root });

	// Mesa + 2 cadeiras (blocos) no centro.
	createBlock({ name: "Mesa_Tampo", size: [5, 0.5, 3.4], position: [cx + 1, fy + 2.2, cz + 1], color: "woodDark", material: Enum.Material.Wood, parent: root });
	for (const dx of [-1.9, 1.9]) {
		for (const dz of [-1.2, 1.2]) {
			createBlock({ name: "Mesa_Pe", size: [0.6, 2.2, 0.6], position: [cx + 1 + dx, fy + 1.1, cz + 1 + dz], color: "woodDark", material: Enum.Material.Wood, parent: root });
		}
	}
	for (const dz of [-2.6, 2.6]) {
		createBlock({ name: "Cadeira_Assento", size: [1.6, 0.4, 1.6], position: [cx + 1, fy + 1, cz + 1 + dz], color: "woodLight", material: Enum.Material.Wood, parent: root });
		createBlock({ name: "Cadeira_Encosto", size: [1.6, 1.6, 0.35], position: [cx + 1, fy + 1.9, cz + 1 + dz + (dz > 0 ? 0.8 : -0.8)], color: "woodLight", material: Enum.Material.Wood, parent: root });
	}

	// Fogão a lenha no canto (caixa + chapa + cano que sobe até o telhado).
	createBlock({ name: "Fogao_Corpo", size: [3, 2.6, 2.6], position: [cx + 5, fy + 1.3, cz - 3.4], color: "metal", material: Enum.Material.Metal, parent: root });
	createBlock({ name: "Fogao_Chapa", size: [3.2, 0.3, 2.8], position: [cx + 5, fy + 2.7, cz - 3.4], color: "stoneDark", material: Enum.Material.Slate, parent: root });
	createBlock({ name: "Fogao_Cano", size: [0.8, 7, 0.8], position: [cx + 5, fy + 6, cz - 3.4], color: "metal", material: Enum.Material.Metal, form: "cylinder", parent: root });

	// Prateleira + tapete + lustre.
	createBlock({ name: "Prateleira", size: [0.8, 0.3, 5], position: [cx + 7.2, fy + 4, cz + 1], color: "wood", material: Enum.Material.Wood, parent: root });
	createBlock({ name: "Tapete", size: [6, 0.1, 4.5], position: [cx, fy + 0.25, cz + 2.5], color: "brickLight", material: Enum.Material.Fabric, parent: root });
	ceilingLamp(root, cx, 1 + 8 - 1.4, cz, "Cabana");

	return placed;
}

// ---------------------------------------------------------------------------
// Casa 3 — Casa de Hóspedes (20×14): beliche + cozinha + banheiro
// ---------------------------------------------------------------------------

export function buildGuestHouse(parent: Instance): PlacedHouse {
	const placed = buildSmallHouse(
		parent,
		{
			name: "Casa_Hospedes",
			center: [38, -4],
			width: 20,
			depth: 14,
			wallHeight: 9,
			wallColor: "brickLight",
			roofColor: "roof",
			door: { width: 5, height: 7, offsetX: -4 },
			windowsPerFace: 3,
		},
		1,
	);
	const root = placed.model;
	const [cx, cz] = [38, -4];
	const fy = 1.3;

	// Beliche no quarto dos fundos (2 colchões + 4 postes + escada).
	for (const px of [-2, 2]) {
		for (const pz of [-2.6, 2.6]) {
			createBlock({ name: "Beliche_Poste", size: [0.5, 5.4, 0.5], position: [cx - 6 + px, fy + 2.7, cz - 2.5 + pz], color: "woodDark", material: Enum.Material.Wood, parent: root });
		}
	}
	createBlock({ name: "Beliche_Cama1", size: [4.6, 0.8, 5.8], position: [cx - 6, fy + 1, cz - 2.5], color: "wood", material: Enum.Material.Wood, parent: root });
	createBlock({ name: "Beliche_Colchao1", size: [4.2, 0.6, 5.4], position: [cx - 6, fy + 1.7, cz - 2.5], color: "glass", material: Enum.Material.Fabric, parent: root });
	createBlock({ name: "Beliche_Cama2", size: [4.6, 0.8, 5.8], position: [cx - 6, fy + 3.6, cz - 2.5], color: "wood", material: Enum.Material.Wood, parent: root });
	createBlock({ name: "Beliche_Colchao2", size: [4.2, 0.6, 5.4], position: [cx - 6, fy + 4.3, cz - 2.5], color: "trim", material: Enum.Material.Fabric, parent: root });

	// Cozinha: bancada em L + pia (bloco água) + armário.
	createBlock({ name: "Cozinha_Bancada", size: [7, 1.6, 2], position: [cx + 4.5, fy + 0.8, cz - 4.6], color: "concrete", material: Enum.Material.Concrete, parent: root });
	createBlock({ name: "Cozinha_Pia", size: [2.4, 0.3, 1.4], position: [cx + 3, fy + 1.7, cz - 4.6], color: "water", material: Enum.Material.SmoothPlastic, parent: root });
	createBlock({ name: "Cozinha_Armario", size: [3, 2.4, 1.4], position: [cx + 6.5, fy + 3.4, cz - 5.2], color: "woodLight", material: Enum.Material.Wood, parent: root });
	createBlock({ name: "Cozinha_Fogao", size: [2.2, 1.8, 2], position: [cx - 0.5, fy + 0.9, cz - 4.6], color: "metal", material: Enum.Material.Metal, parent: root });

	// Banheiro no canto: box (piso água) + vaso (base+tanque) + chuveiro.
	createBlock({ name: "Banho_Piso", size: [4.4, 0.25, 4.4], position: [cx + 6.5, fy + 0.2, cz + 3.5], color: "glass", material: Enum.Material.SmoothPlastic, parent: root });
	createBlock({ name: "Vaso_Base", size: [1.4, 1.2, 1.8], position: [cx + 5.2, fy + 0.6, cz + 4.2], color: "trim", material: Enum.Material.SmoothPlastic, parent: root });
	createBlock({ name: "Vaso_Tanque", size: [1.6, 1.4, 0.7], position: [cx + 5.2, fy + 1.9, cz + 5.2], color: "trim", material: Enum.Material.SmoothPlastic, parent: root });
	createBlock({ name: "Chuveiro_Haste", size: [0.3, 2.6, 0.3], position: [cx + 8, fy + 2.6, cz + 4.8], color: "metal", material: Enum.Material.Metal, form: "cylinder", parent: root });
	createBlock({ name: "Chuveiro_Ducha", size: [1.2, 0.3, 1.2], position: [cx + 8, fy + 3.9, cz + 4.2], color: "water", material: Enum.Material.Neon, form: "cylinder", parent: root });

	// Sala: mesa de jantar + 4 cadeiras + tapete + 2 lustres.
	createBlock({ name: "Jantar_Tampo", size: [6, 0.5, 3.6], position: [cx - 3, fy + 2.2, cz + 3.4], color: "woodDark", material: Enum.Material.Wood, parent: root });
	for (const dx of [-2.4, 2.4]) {
		for (const dz of [-1.3, 1.3]) {
			createBlock({ name: "Jantar_Pe", size: [0.6, 2.2, 0.6], position: [cx - 3 + dx, fy + 1.1, cz + 3.4 + dz], color: "woodDark", material: Enum.Material.Wood, parent: root });
		}
	}
	for (const [ox, oz] of [[-3, -2.8], [-3, 2.8], [-6.4, 0], [0.4, 0]] as Array<[number, number]>) {
		createBlock({ name: "Jantar_Cadeira", size: [1.4, 1.4, 1.4], position: [cx + ox, fy + 0.7, cz + 3.4 + oz], color: "woodLight", material: Enum.Material.Wood, parent: root });
	}
	createBlock({ name: "Tapete_Sala", size: [8, 0.1, 6], position: [cx - 3, fy + 0.25, cz + 3.4], color: "mailRed", material: Enum.Material.Fabric, parent: root });
	ceilingLamp(root, cx - 4, 1 + 9 - 1.4, cz, "Hospedes_Q");
	ceilingLamp(root, cx + 5, 1 + 9 - 1.4, cz + 1, "Hospedes_S");

	return placed;
}

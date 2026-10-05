import { HOUSE } from "../config";
import { createBlock, createModel } from "../core/blocks";

/**
 * Telhado de duas águas (cumeeira no eixo X).
 *
 * Geometria (tudo derivado de HOUSE.roof):
 *  - base do telhado = topo das paredes (baseY + wallHeight)
 *  - meio-vão = depth/2 + overhang
 *  - cumeeira = base + rise
 *  - cada água = painel inclinado de largura (width + 2*overhang)
 *
 * Oitões (triângulos nas laterais) são feitos em ESCADA de blocos —
 * de propósito: mantém a estética "blocos de montar" e evita
 * dor de cabeça com orientação de WedgePart.
 */
export function buildRoof(parent: Instance): Model {
	const root = createModel("04_Telhado", parent);

	const topY = HOUSE.baseY + HOUSE.wallHeight;
	const halfSpan = HOUSE.depth / 2 + HOUSE.roof.overhang;
	const rise = HOUSE.roof.rise;
	const ridgeY = topY + rise;
	const panelWidth = HOUSE.width + HOUSE.roof.overhang * 2;

	const slopeLen = math.sqrt(halfSpan * halfSpan + rise * rise);
	const angleDeg = math.deg(math.atan2(rise, halfSpan));

	// Forro / laje do teto (fecha a casa por cima, evita ver o céu de dentro).
	createBlock({
		name: "Forro",
		size: [HOUSE.width, 0.5, HOUSE.depth],
		position: [(HOUSE.x0 + HOUSE.x1) / 2, topY + 0.25, (HOUSE.z0 + HOUSE.z1) / 2],
		color: "woodLight",
		material: Enum.Material.WoodPlanks,
		parent: root,
	});

	// Duas águas: painéis inclinados.
	// Centro de cada água = metade do meio-vão em Z, metade da cumeeira em Y.
	const midY = topY + rise / 2;
	const midZ = halfSpan / 2;

	// Água da frente (+Z): desce em direção a +Z.
	createBlock({
		name: "Agua_Frente",
		size: [panelWidth, 0.6, slopeLen],
		position: [0, midY + 0.3, midZ],
		rotation: [angleDeg, 0, 0],
		color: "roof",
		material: Enum.Material.Slate,
		parent: root,
	});
	// Água de trás (-Z): espelho.
	createBlock({
		name: "Agua_Tras",
		size: [panelWidth, 0.6, slopeLen],
		position: [0, midY + 0.3, -midZ],
		rotation: [-angleDeg, 0, 0],
		color: "roof",
		material: Enum.Material.Slate,
		parent: root,
	});

	// Cumeeira (viga do topo).
	createBlock({
		name: "Cumeeira",
		size: [panelWidth + 0.6, 0.8, 1.2],
		position: [0, ridgeY + 0.4, 0],
		color: "roofDark",
		material: Enum.Material.Slate,
		parent: root,
	});

	// Beirais (eaves): acabamento claro nas bordas inferiores.
	for (const s of [1, -1]) {
		createBlock({
			name: "Beiral",
			size: [panelWidth + 0.6, 0.5, 0.8],
			position: [0, topY + 0.1, s * halfSpan],
			color: "trim",
			material: Enum.Material.SmoothPlastic,
			parent: root,
		});
	}

	// Oitões em escada: 8 fiadas, cada uma mais curta que a anterior.
	// Fiada i (0 = base): largura = depth * (1 - i/8), centrada em z=0.
	const rows = 8;
	const gableBaseY = topY + 0.5;
	for (let i = 0; i < rows; i++) {
		const frac = 1 - i / rows;
		const rowDepth = (HOUSE.depth - 1) * frac;
		if (rowDepth < 0.6) {
			continue;
		}
		const y = gableBaseY + i + 0.5;
		for (const sx of [HOUSE.x0 + 0.5, HOUSE.x1 - 0.5]) {
			createBlock({
				name: "Oitao",
				size: [1, 1, rowDepth],
				position: [sx, y, 0],
				color: i % 2 === 0 ? "brick" : "brickDark",
				material: Enum.Material.Brick,
				parent: root,
			});
		}
	}

	return root;
}

/** Altura da cumeeira (mundo Y) — útil para chaminé e câmera. */
export function ridgeY(): number {
	return HOUSE.baseY + HOUSE.wallHeight + HOUSE.roof.rise;
}

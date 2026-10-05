import { HOUSE } from "../config";
import { createBlock, createModel } from "../core/blocks";
import type { Vec3Tuple } from "../core/types";

/**
 * Fundação: laje + sapata + rodapé.
 *
 * - A laje ocupa exatamente a pegada da casa (HOUSE.width × HOUSE.depth).
 * - Topo da laje = HOUSE.baseY (é daqui que as paredes nascem).
 * - Tudo `Anchored`, material concreto/pedra.
 */
export function buildFoundation(parent: Instance): Model {
	const root = createModel("01_Fundacao", parent);

	const cx = (HOUSE.x0 + HOUSE.x1) / 2;
	const cz = (HOUSE.z0 + HOUSE.z1) / 2;

	// Sapata: um pouco maior, meio enterrada (evitairat "flutuar" no terreno).
	const footingSize: Vec3Tuple = [HOUSE.width + 2, 1, HOUSE.depth + 2];
	createBlock({
		name: "Sapata",
		size: footingSize,
		position: [cx, HOUSE.baseY - HOUSE.foundationThickness, cz],
		color: "stoneDark",
		material: Enum.Material.Concrete,
		parent: root,
	});

	// Laje principal.
	createBlock({
		name: "Laje",
		size: [HOUSE.width, HOUSE.foundationThickness, HOUSE.depth],
		position: [cx, HOUSE.baseY - HOUSE.foundationThickness / 2, cz],
		color: "concrete",
		material: Enum.Material.Concrete,
		parent: root,
	});

	// Rodapé: fiada de pedras ao redor (cara de "bloco de montar").
	const skirtY = HOUSE.baseY + 0.25;
	const skirtH = 0.5;
	const t = 0.6;
	const skirt: Array<{ size: Vec3Tuple; pos: Vec3Tuple }> = [
		{ size: [HOUSE.width + 0.6, skirtH, t], pos: [cx, skirtY, HOUSE.z1 - t / 2] },
		{ size: [HOUSE.width + 0.6, skirtH, t], pos: [cx, skirtY, HOUSE.z0 + t / 2] },
		{ size: [t, skirtH, HOUSE.depth - 0.6], pos: [HOUSE.x0 + t / 2, skirtY, cz] },
		{ size: [t, skirtH, HOUSE.depth - 0.6], pos: [HOUSE.x1 - t / 2, skirtY, cz] },
	];
	for (const s of skirt) {
		createBlock({
			name: "Rodape",
			size: s.size,
			position: s.pos,
			color: "stone",
			material: Enum.Material.Cobblestone,
			parent: root,
		});
	}

	return root;
}

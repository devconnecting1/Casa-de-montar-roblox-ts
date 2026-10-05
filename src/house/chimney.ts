import { HOUSE } from "../config";
import { createBlock, createModel } from "../core/blocks";
import { ridgeY } from "./roof";

/**
 * Chaminé de tijolos + capa de pedra.
 * Posição fixa e proposital: atravessa a água de trás do telhado.
 */
export function buildChimney(parent: Instance): Model {
	const root = createModel("05_Chamine", parent);

	const cx = 10;
	const cz = -6;
	const baseY = HOUSE.baseY + HOUSE.wallHeight; // 13
	const topY = ridgeY() + 3; // passa 3 studs da cumeeira
	const h = topY - (HOUSE.baseY + 2);
	const cy = HOUSE.baseY + 2 + h / 2;

	// Corpo.
	createBlock({
		name: "Chamine_Corpo",
		size: [3, h, 3],
		position: [cx, cy, cz],
		color: "brickDark",
		material: Enum.Material.Brick,
		parent: root,
	});

	// Faixas claras a cada 4 studs (cara de bloco + marcação de altura).
	let bandY = baseY + 2;
	while (bandY < topY - 1) {
		createBlock({
			name: "Chamine_Faixa",
			size: [3.4, 0.6, 3.4],
			position: [cx, bandY, cz],
			color: "mortar",
			material: Enum.Material.Concrete,
			parent: root,
		});
		bandY += 4;
	}

	// Capa + boca escura.
	createBlock({
		name: "Chamine_Capa",
		size: [5, 1, 5],
		position: [cx, topY + 0.5, cz],
		color: "stone",
		material: Enum.Material.Concrete,
		parent: root,
	});
	createBlock({
		name: "Chamine_Boca",
		size: [2, 0.6, 2],
		position: [cx, topY + 1.1, cz],
		color: "metal",
		material: Enum.Material.SmoothPlastic,
		parent: root,
	});

	return root;
}

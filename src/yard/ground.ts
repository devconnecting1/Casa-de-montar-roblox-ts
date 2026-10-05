import { SCENE } from "../config";
import { createBlock, createModel } from "../core/blocks";

/** Placa de grama + mancha de terra sob a casa. */
export function buildGround(parent: Instance): Model {
	const root = createModel("10_Terreno", parent);

	// Placa principal: topo em y=0 (centro em -thickness/2).
	createBlock({
		name: "Grama",
		size: [SCENE.groundSize, SCENE.groundThickness, SCENE.groundSize],
		position: [0, -SCENE.groundThickness / 2, 0],
		color: "grass",
		material: Enum.Material.Grass,
		parent: root,
	});

	// Mancha de terra sob a casa (evita "grama nascendo" dentro do piso).
	createBlock({
		name: "Terra_Sob_Casa",
		size: [44, 0.2, 34],
		position: [0, 0.1, 0],
		color: "dirt",
		material: Enum.Material.Ground,
		parent: root,
	});

	return root;
}

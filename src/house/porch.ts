import { HOUSE } from "../config";
import { createBlock, createModel } from "../core/blocks";

/**
 * Varanda da frente: escada + patamar + 2 pilares + toldo.
 * Tudo centrado na porta (HOUSE.door.x = 0).
 */
export function buildPorch(parent: Instance): Model {
	const root = createModel("06_Varanda", parent);
	const cx = HOUSE.door.x;
	const zFront = HOUSE.z1;

	// 3 degraus descendo para o caminho (+Z).
	const stepW = HOUSE.door.width + 3; // 9
	for (let i = 0; i < 3; i++) {
		createBlock({
			name: `Degrau_${i + 1}`,
			size: [stepW - i * 1.2, 0.6, 2],
			position: [cx, HOUSE.baseY - 0.1 - i * 0.55, zFront + 1.6 + i * 1.7],
			color: "stone",
			material: Enum.Material.Concrete,
			parent: root,
		});
	}

	// Patamar em frente à porta.
	createBlock({
		name: "Patamar",
		size: [stepW + 1, 0.5, 3],
		position: [cx, HOUSE.baseY + 0.05, zFront + 1.2],
		color: "concrete",
		material: Enum.Material.Concrete,
		parent: root,
	});

	// 2 pilares de madeira.
	const postH = 9;
	const postY = HOUSE.baseY + postH / 2;
	for (const px of [cx - 4.5, cx + 4.5]) {
		createBlock({
			name: "Pilar",
			size: [0.9, postH, 0.9],
			position: [px, postY, zFront + 2.4],
			color: "woodDark",
			material: Enum.Material.Wood,
			parent: root,
		});
		// Base e capitel de pedra.
		createBlock({
			name: "Pilar_Base",
			size: [1.6, 0.6, 1.6],
			position: [px, HOUSE.baseY + 0.3, zFront + 2.4],
			color: "stoneDark",
			material: Enum.Material.Concrete,
			parent: root,
		});
	}

	// Toldo / mini-telhado da varanda.
	createBlock({
		name: "Toldo",
		size: [stepW + 2, 0.5, 4.5],
		position: [cx, HOUSE.baseY + postH + 0.4, zFront + 1.6],
		rotation: [8, 0, 0],
		color: "roofDark",
		material: Enum.Material.Slate,
		parent: root,
	});

	// Luminária da varanda (com luz de verdade).
	const lampY = HOUSE.baseY + postH - 0.6;
	const lampPart = createBlock({
		name: "Lampada_Varanda",
		size: [1, 1, 1],
		position: [cx, lampY, zFront + 0.6],
		color: "lamp",
		material: Enum.Material.Neon,
		form: "ball",
		parent: root,
	});

	const light = new Instance("PointLight");
	light.Name = "Luz_Varanda";
	light.Color = Color3.fromRGB(255, 217, 138);
	light.Brightness = 2;
	light.Range = 30;
	light.Parent = lampPart;

	return root;
}

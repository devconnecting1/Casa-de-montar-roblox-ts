import { SCENE } from "../config";
import { createBlock, createModel } from "../core/blocks";

/**
 * Cerca de madeira ao redor do terreno + portão alinhado ao caminho (eixo X=0).
 *
 * - Perímetro quadrado de lado SCENE.fenceSide, centrado na origem.
 * - Frente (+Z) tem um vão de 8 studs para o portão.
 * - Postes a cada 10 studs, 2 travessas longas por lado.
 */
export function buildFence(parent: Instance): Model {
	const root = createModel("12_Cerca", parent);
	const half = SCENE.fenceSide / 2;
	const postH = 4;
	const postY = postH / 2;
	const gateHalf = 4; // vão do portão: x = -4..4 na frente

	const addPost = (x: number, z: number, name: string) => {
		createBlock({
			name,
			size: [1, postH, 1],
			position: [x, postY, z],
			color: "woodDark",
			material: Enum.Material.Wood,
			parent: root,
		});
		createBlock({
			name: `${name}_Topo`,
			size: [1.3, 0.5, 1.3],
			position: [x, postY + postH / 2 + 0.2, z],
			color: "wood",
			material: Enum.Material.Wood,
			parent: root,
		});
	};

	const addRail = (cx: number, cz: number, len: number, alongX: boolean, y: number) => {
		createBlock({
			name: "Travessa",
			size: alongX ? [len, 0.6, 0.5] : [0.5, 0.6, len],
			position: [cx, y, cz],
			color: "wood",
			material: Enum.Material.Wood,
			parent: root,
		});
	};

	// Postes + travessas: frente dividida em 2 trechos (portão no meio).
	const step = 10;

	// Trás (-Z): linha completa em X.
	for (let x = -half; x <= half + 0.01; x += step) {
		addPost(x, -half, `Poste_Tras_${x}`);
	}
	addRail(0, -half, SCENE.fenceSide, true, 1.4);
	addRail(0, -half, SCENE.fenceSide, true, 3);

	// Frente (+Z): dois trechos, com vão no meio.
	for (let x = -half; x <= half + 0.01; x += step) {
		if (math.abs(x) < gateHalf + 1) {
			continue; // pula o vão do portão
		}
		addPost(x, half, `Poste_Frente_${x}`);
	}
	// Travessas da frente (esquerda e direita do portão).
	const segLen = half - gateHalf;
	addRail(-(gateHalf + segLen / 2), half, segLen, true, 1.4);
	addRail(-(gateHalf + segLen / 2), half, segLen, true, 3);
	addRail(gateHalf + segLen / 2, half, segLen, true, 1.4);
	addRail(gateHalf + segLen / 2, half, segLen, true, 3);

	// Laterais (±X): linhas completas em Z.
	for (let z = -half; z <= half + 0.01; z += step) {
		addPost(-half, z, `Poste_Esq_${z}`);
		addPost(half, z, `Poste_Dir_${z}`);
	}
	addRail(-half, 0, SCENE.fenceSide, false, 1.4);
	addRail(-half, 0, SCENE.fenceSide, false, 3);
	addRail(half, 0, SCENE.fenceSide, false, 1.4);
	addRail(half, 0, SCENE.fenceSide, false, 3);

	// Portão: 2 folhas baixas abertas (charme) + batentes.
	for (const s of [-1, 1]) {
		createBlock({
			name: "Portao_Folha",
			size: [3.6, 2.2, 0.4],
			position: [s * (gateHalf - 1.6), 1.5, half + 1.2],
			rotation: [0, s * 35, 0],
			color: "woodLight",
			material: Enum.Material.Wood,
			parent: root,
		});
		addPost(s * gateHalf, half, `Batente_${s}`);
	}

	return root;
}

import { createBlock, createModel } from "../core/blocks";
import { hash01 } from "../core/utils";

/**
 * Jardim: árvores, arbustos, flores, caixa de correio e poste.
 * Posições fixas (determinísticas) para a cena ficar idêntica a cada execução.
 */

function buildTree(parent: Instance, x: number, z: number, scale: number, seed: number): void {
	const trunkH = 8 * scale;
	createBlock({
		name: "Tronco",
		size: [1.6 * scale, trunkH, 1.6 * scale],
		position: [x, trunkH / 2, z],
		color: "trunk",
		material: Enum.Material.Wood,
		form: "cylinder",
		parent,
	});
	// 3 copas empilhadas.
	const blobs: Array<[number, number, number, number]> = [
		[0, trunkH + 1.5 * scale, 0, 5 * scale],
		[0, trunkH + 4 * scale, 0, 3.8 * scale],
		[0, trunkH + 6 * scale, 0, 2.4 * scale],
	];
	blobs.forEach(([dx, dy, dz, d], i) => {
		createBlock({
			name: `Copa_${seed}_${i}`,
			size: [d, d * 0.85, d],
			position: [x + dx, dy, z + dz],
			color: (hash01(seed * 10 + i) > 0.5 ? "leaf" : "leafDark") as "leaf" | "leafDark",
			material: Enum.Material.Grass,
			form: "ball",
			parent,
		});
	});
}

function buildBush(parent: Instance, x: number, z: number, d: number, seed: number): void {
	createBlock({
		name: `Arbusto_${seed}`,
		size: [d, d * 0.8, d],
		position: [x, d * 0.4, z],
		color: seed % 2 === 0 ? "leaf" : "leafDark",
		material: Enum.Material.Grass,
		form: "ball",
		parent,
	});
}

function buildFlower(parent: Instance, x: number, z: number, seed: number): void {
	createBlock({
		name: `Haste_${seed}`,
		size: [0.3, 1.6, 0.3],
		position: [x, 0.8, z],
		color: "leafDark",
		material: Enum.Material.Grass,
		form: "cylinder",
		parent,
	});
	const petal: Array<"mailRed" | "lamp" | "glass" | "trim"> = ["mailRed", "lamp", "glass", "trim"];
	createBlock({
		name: `Flor_${seed}`,
		size: [1, 1, 1],
		position: [x, 2, z],
		color: petal[seed % petal.size()],
		material: Enum.Material.Neon,
		form: "ball",
		parent,
	});
}

export function buildGarden(parent: Instance): Model {
	const root = createModel("13_Jardim", parent);

	// Árvores: fundo + lateral (fora da casa, dentro da cerca de 120).
	buildTree(root, -38, -28, 1.2, 1);
	buildTree(root, 40, -20, 1.0, 2);
	buildTree(root, -42, 25, 0.9, 3);

	// Arbustos ladeando a fachada.
	for (const [x, z, i] of [
		[-12, 14, 1],
		[12, 14, 2],
		[-19, 8, 3],
		[19, 8, 4],
	] as Array<[number, number, number]>) {
		buildBush(root, x, z, 3, i);
	}

	// Canteiro de flores ao longo do caminho (x = ±5).
	for (let i = 0; i < 6; i++) {
		const z = 20 + i * 6;
		buildFlower(root, -5.5, z, i * 2);
		buildFlower(root, 5.5, z + 3, i * 2 + 1);
	}

	// Caixa de correio perto do portão.
	createBlock({
		name: "Correio_Poste",
		size: [0.5, 4, 0.5],
		position: [7, 2, 56],
		color: "woodDark",
		material: Enum.Material.Wood,
		parent: root,
	});
	createBlock({
		name: "Correio_Caixa",
		size: [1.6, 1.2, 2.6],
		position: [7, 4.6, 56],
		color: "mailRed",
		material: Enum.Material.Metal,
		parent: root,
	});
	createBlock({
		name: "Correio_Bandeira",
		size: [0.3, 1.4, 0.3],
		position: [7.9, 5.6, 56],
		color: "mailRed",
		material: Enum.Material.SmoothPlastic,
		parent: root,
	});

	// Poste de luz no meio do caminho.
	createBlock({
		name: "Poste",
		size: [0.8, 12, 0.8],
		position: [-8, 6, 40],
		color: "metal",
		material: Enum.Material.Metal,
		form: "cylinder",
		parent: root,
	});
	const head = createBlock({
		name: "Poste_Cabeca",
		size: [1.6, 1.6, 1.6],
		position: [-8, 12.6, 40],
		color: "lamp",
		material: Enum.Material.Neon,
		form: "ball",
		parent: root,
	});
	const glow = new Instance("PointLight");
	glow.Name = "Luz_Poste";
	glow.Brightness = 3;
	glow.Range = 40;
	glow.Color = Color3.fromRGB(255, 217, 138);
	glow.Parent = head;

	return root;
}

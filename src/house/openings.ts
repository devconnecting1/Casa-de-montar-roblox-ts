import { HOUSE } from "../config";
import { createBlock, createModel } from "../core/blocks";

/**
 * Porta + janelas: caixilho, vidro, peitoril e verga.
 *
 * As posições DERIVAM do mesmo HOUSE usado em `walls.ts`,
 * então o caixilho sempre cai dentro do vão recortado.
 */

function frame(parent: Instance, name: string, size: [number, number, number], pos: [number, number, number]) {
	return createBlock({
		name,
		size,
		position: pos,
		color: "trim",
		material: Enum.Material.SmoothPlastic,
		parent,
	});
}

export function buildOpenings(parent: Instance): Model {
	const root = createModel("03_Portas_Janelas", parent);
	const t = HOUSE.wallThickness;
	const baseY = HOUSE.baseY;

	// ---- Porta principal (fachada +Z) -------------------------------------
	const doorCX = HOUSE.door.x;
	const doorZ = HOUSE.z1 - t / 2;

	// Folha da porta (um pouco mais estreita que o vão, para a moldura aparecer).
	createBlock({
		name: "Porta_Folha",
		size: [HOUSE.door.width - 0.6, HOUSE.door.height - 0.2, 0.4],
		position: [doorCX, baseY + (HOUSE.door.height - 0.2) / 2, doorZ],
		color: "door",
		material: Enum.Material.WoodPlanks,
		parent: root,
	});
	// Maçaneta.
	createBlock({
		name: "Macaneta",
		size: [0.6, 0.6, 0.6],
		position: [doorCX + HOUSE.door.width / 2 - 1.2, baseY + 4, doorZ + 0.5],
		color: "metal",
		material: Enum.Material.Metal,
		form: "ball",
		parent: root,
	});
	// Moldura: 2 ombreiras + verga.
	const jambH = HOUSE.door.height + 0.4;
	frame(root, "Moldura_Esq", [0.6, jambH, t + 0.6], [doorCX - HOUSE.door.width / 2 - 0.1, baseY + jambH / 2, doorZ]);
	frame(root, "Moldura_Dir", [0.6, jambH, t + 0.6], [doorCX + HOUSE.door.width / 2 + 0.1, baseY + jambH / 2, doorZ]);
	frame(root, "Verga_Porta", [HOUSE.door.width + 0.8, 0.6, t + 0.6], [doorCX, baseY + HOUSE.door.height + 0.3, doorZ]);
	// Degrau da soleira.
	createBlock({
		name: "Soleira",
		size: [HOUSE.door.width + 1, 0.4, 1.6],
		position: [doorCX, baseY + 0.2, doorZ + 0.4],
		color: "stone",
		material: Enum.Material.Concrete,
		parent: root,
	});

	// ---- Janelas ------------------------------------------------------------
	// Mesma lista de centros usada em walls.ts (não duplicar "números mágicos"
	// à toa: aqui viram caixilhos de verdade).
	const sillTop = (sill: number) => baseY + sill;
	const winH = HOUSE.window.height;
	const winW = HOUSE.window.width;

	const addWindow = (cx: number, cy: number, z: number, alongX: boolean) => {
		// Vidro.
		createBlock({
			name: "Vidro",
			size: alongX ? [winW - 0.4, winH - 0.4, 0.3] : [0.3, winH - 0.4, winW - 0.4],
			position: [cx, cy, z],
			color: "glass",
			material: Enum.Material.Glass,
			transparency: 0.35,
			parent: root,
		});
		// Cruzeta (montantes).
		createBlock({
			name: "Montante_V",
			size: alongX ? [0.3, winH - 0.4, 0.35] : [0.35, winH - 0.4, 0.3],
			position: [cx, cy, z],
			color: "trim",
			material: Enum.Material.SmoothPlastic,
			parent: root,
		});
		createBlock({
			name: "Montante_H",
			size: alongX ? [winW - 0.4, 0.3, 0.35] : [0.35, 0.3, winW - 0.4],
			position: [cx, cy, z],
			color: "trim",
			material: Enum.Material.SmoothPlastic,
			parent: root,
		});
		// Moldura + peitoril + verga.
		const f = 0.5;
		if (alongX) {
			frame(root, "Moldura", [winW + 0.6, 0.5, t + 0.5], [cx, cy + winH / 2 + 0.15, z]);
			frame(root, "Moldura", [winW + 0.6, 0.5, t + 0.5], [cx, cy - winH / 2 - 0.15, z]);
			frame(root, "Moldura", [0.5, winH + 0.6, t + 0.5], [cx - winW / 2 - 0.15, cy, z]);
			frame(root, "Moldura", [0.5, winH + 0.6, t + 0.5], [cx + winW / 2 + 0.15, cy, z]);
			createBlock({
				name: "Peitoril",
				size: [winW + 1.2, 0.4, t + 1.2],
				position: [cx, cy - winH / 2 - 0.5, z],
				color: "concrete",
				material: Enum.Material.Concrete,
				parent: root,
			});
		} else {
			frame(root, "Moldura", [t + 0.5, 0.5, winW + 0.6], [cx, cy + winH / 2 + 0.15, z]);
			frame(root, "Moldura", [t + 0.5, 0.5, winW + 0.6], [cx, cy - winH / 2 - 0.15, z]);
			frame(root, "Moldura", [t + 0.5, winH + 0.6, 0.5], [cx, cy, z - winW / 2 - 0.15]);
			frame(root, "Moldura", [t + 0.5, winH + 0.6, 0.5], [cx, cy, z + winW / 2 + 0.15]);
			createBlock({
				name: "Peitoril",
				size: [t + 1.2, 0.4, winW + 1.2],
				position: [cx, cy - winH / 2 - 0.5, z],
				color: "concrete",
				material: Enum.Material.Concrete,
				parent: root,
			});
		}
	};

	const cyFront = sillTop(HOUSE.window.sill) + winH / 2;
	// Fachada: x = -10 e +10.
	for (const wx of [-10, 10]) {
		addWindow(wx, cyFront, HOUSE.z1 - t / 2, true);
	}
	// Fundos: x = -10, 0, 10.
	for (const wx of [-10, 0, 10]) {
		addWindow(wx, cyFront, HOUSE.z0 + t / 2, true);
	}
	// Laterais: 2 por lado (mesmos terços de walls.ts).
	const sideLen = HOUSE.depth - 2 * t;
	for (const f of [0.3, 0.7]) {
		const wz = HOUSE.z0 + t + sideLen * f;
		addWindow(HOUSE.x0 + t / 2, cyFront, wz, false);
		addWindow(HOUSE.x1 - t / 2, cyFront, wz, false);
	}

	// Expor a altura da porta para quem precisar (varanda, caminho).
	return root;
}

/** Topo da porta em Y do mundo (útil para toldo/varanda). */
export function doorTopY(): number {
	return HOUSE.baseY + HOUSE.door.height;
}

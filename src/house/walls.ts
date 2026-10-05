import { HOUSE } from "../config";
import { ModelBuilder } from "../core/builder";
import type { WallOpening } from "../core/types";

/**
 * Paredes bloco a bloco (running bond) com vãos recortados.
 *
 * Convenção do `ModelBuilder.wall`:
 *  - `origin` = canto mínimo da pegada da parede;
 *  - parede em X ocupa `thickness` para +Z a partir de origin.z;
 *  - parede em Z ocupa `thickness` para +X a partir de origin.x.
 *
 * Para as faces externas coincidirem com HOUSE.x0/x1/z0/z1:
 *  - frente (+Z): origin.z = z1 - thickness
 *  - trás   (-Z): origin.z = z0
 *  - esquerda:   origin.x = x0 (encurtada para não sobrepor os cantos)
 *  - direita:    origin.x = x1 - thickness
 */

function frontOpenings(): WallOpening[] {
	const half = HOUSE.width / 2;
	const doorFrom = half - HOUSE.door.width / 2;
	const openings: WallOpening[] = [
		// Porta central: do chão (0) até door.height.
		{ from: doorFrom, to: doorFrom + HOUSE.door.width, fromY: 0, toY: HOUSE.door.height },
	];
	// Duas janelas flanqueando a porta (mundo x = -10 e +10).
	for (const wx of [-10, 10]) {
		const lx = wx - HOUSE.x0; // 0..width (`local` é palavra reservada em Luau)
		openings.push({
			from: lx - HOUSE.window.width / 2,
			to: lx + HOUSE.window.width / 2,
			fromY: HOUSE.window.sill,
			toY: HOUSE.window.sill + HOUSE.window.height,
		});
	}
	return openings;
}

function backOpenings(): WallOpening[] {
	const openings: WallOpening[] = [];
	for (const wx of [-10, 0, 10]) {
		const lx = wx - HOUSE.x0;
		openings.push({
			from: lx - HOUSE.window.width / 2,
			to: lx + HOUSE.window.width / 2,
			fromY: HOUSE.window.sill,
			toY: HOUSE.window.sill + HOUSE.window.height,
		});
	}
	return openings;
}

function sideOpenings(sideLength: number): WallOpening[] {
	// Duas janelas por lateral, centralizadas nos terços.
	const centers = [sideLength * 0.3, sideLength * 0.7];
	return centers.map((c) => ({
		from: c - HOUSE.window.width / 2,
		to: c + HOUSE.window.width / 2,
		fromY: HOUSE.window.sill,
		toY: HOUSE.window.sill + HOUSE.window.height,
	}));
}

export function buildWalls(parent: Instance): Model {
	const builder = new ModelBuilder("02_Paredes", parent);
	const t = HOUSE.wallThickness;
	const h = HOUSE.wallHeight;
	const y = HOUSE.baseY;
	const bl = HOUSE.blocks.length;
	const bh = HOUSE.blocks.height;
	const sideLength = HOUSE.depth - 2 * t;

	// Frente (+Z) — com porta + 2 janelas.
	builder.wall({
		name: "Parede_Frente",
		origin: [HOUSE.x0, y, HOUSE.z1 - t],
		length: HOUSE.width,
		height: h,
		axis: "x",
		thickness: t,
		brickLength: bl,
		brickHeight: bh,
		color: "brick",
		material: Enum.Material.Brick,
		openings: frontOpenings(),
		parent: builder.root,
	});

	// Trás (-Z) — 3 janelas.
	builder.wall({
		name: "Parede_Tras",
		origin: [HOUSE.x0, y, HOUSE.z0],
		length: HOUSE.width,
		height: h,
		axis: "x",
		thickness: t,
		brickLength: bl,
		brickHeight: bh,
		color: "brick",
		material: Enum.Material.Brick,
		openings: backOpenings(),
		parent: builder.root,
	});

	// Esquerda (-X).
	builder.wall({
		name: "Parede_Esquerda",
		origin: [HOUSE.x0, y, HOUSE.z0 + t],
		length: sideLength,
		height: h,
		axis: "z",
		thickness: t,
		brickLength: bl,
		brickHeight: bh,
		color: "brick",
		material: Enum.Material.Brick,
		openings: sideOpenings(sideLength),
		parent: builder.root,
	});

	// Direita (+X).
	builder.wall({
		name: "Parede_Direita",
		origin: [HOUSE.x1 - t, y, HOUSE.z0 + t],
		length: sideLength,
		height: h,
		axis: "z",
		thickness: t,
		brickLength: bl,
		brickHeight: bh,
		color: "brick",
		material: Enum.Material.Brick,
		openings: sideOpenings(sideLength),
		parent: builder.root,
	});

	return builder.finish();
}

import { createBlock, createModel } from "./blocks";
import { resolveColor } from "./palette";
import type { BlockOptions, WallOptions } from "./types";
import { hash01, subtractIntervals, tint, toV3, type Interval } from "./utils";

/**
 * `ModelBuilder` é o "capataz" da obra: reúne os blocos de uma peça
 * (casa, quintal, parede...) dentro de um `Model` organizado no Explorer.
 *
 * Hierarquia gerada:
 *   Model "Casa"
 *     ├─ Model "01_Fundacao"
 *     ├─ Model "02_Parede_Frente"   (blocos bloco a bloco)
 *     └─ ...
 */
export class ModelBuilder {
	public readonly root: Model;

	constructor(name: string, parent?: Instance) {
		this.root = createModel(name, parent);
	}

	/** Cria um Model filho organizado (ex.: `"02_Paredes"`). */
	group(name: string): Model {
		return createModel(name, this.root);
	}

	/** Cria um bloco dentro do builder. */
	add(options: BlockOptions): BasePart {
		return createBlock({ ...options, parent: options.parent ?? this.root });
	}

	/**
	 * Monta uma parede BLOCO A BLOCO com junta escalonada (running bond).
	 *
	 * As fiadas alternadas começam meio bloco deslocadas, é o que dá a cara de
	 * alvenaria. Os vãos (portas/janelas) são recortados com precisão: os
	 * blocos que invadiriam o vão são encurtados, nunca deixam buraco torto.
	 */
	wall(options: WallOptions): BasePart[] {
		const origin = toV3(options.origin);
		const axis = options.axis ?? "x";
		const length = options.length;
		const height = options.height;
		const thickness = options.thickness ?? 1;
		const brickLength = options.brickLength ?? 3;
		const brickHeight = options.brickHeight ?? 1;
		const stagger = options.stagger ?? true;
		const variance = options.colorVariance ?? 0.05;
		const openings = options.openings ?? [];
		const baseColor = resolveColor(options.color ?? "brick");
		const material = options.material ?? Enum.Material.Brick;

		const container = createModel(options.name ?? "Wall", options.parent ?? this.root);
		const parts: BasePart[] = [];
		const rows = math.ceil(height / brickHeight);
		let brickIndex = 0;

		for (let row = 0; row < rows; row++) {
			const rowFrom = row * brickHeight;
			const rowTo = math.min(rowFrom + brickHeight, height);

			// fiadas ímpares começam meio bloco "para trás" -> junta corrida
			const offset = stagger && row % 2 === 1 ? -brickLength / 2 : 0;

			// cortes (vãos) que cruzam esta fiada
			const cuts: Interval[] = [];
			for (const opening of openings) {
				if (opening.fromY < rowTo && opening.toY > rowFrom) {
					cuts.push([opening.from, opening.to]);
				}
			}

			let cursor = offset;
			while (cursor < length) {
				const from = math.max(cursor, 0);
				const to = math.min(cursor + brickLength, length);

				if (to > from) {
					for (const segment of subtractIntervals(from, to, cuts)) {
						const segmentLength = segment[1] - segment[0];
						if (segmentLength > 0.05) {
							const along = (segment[0] + segment[1]) / 2;
							const centerY = origin.Y + (rowFrom + rowTo) / 2;
							const sizeY = rowTo - rowFrom;

							let size: Vector3;
							let position: Vector3;
							if (axis === "x") {
								size = new Vector3(segmentLength, sizeY, thickness);
								position = new Vector3(origin.X + along, centerY, origin.Z + thickness / 2);
							} else {
								size = new Vector3(thickness, sizeY, segmentLength);
								position = new Vector3(origin.X + thickness / 2, centerY, origin.Z + along);
							}

							// tom ligeiramente diferente por bloco: sem isso as juntas
							// somem e a parede parece uma placa sólida única.
							const color = tint(baseColor, 1 + (hash01(brickIndex) - 0.5) * 2 * variance);

							parts.push(
								this.add({
									name: "Block",
									size,
									position,
									color,
									material,
									parent: container,
								}),
							);
							brickIndex++;
						}
					}
				}
				cursor += brickLength;
			}
		}

		return parts;
	}

	/** Devolve o Model pronto (já parentado, se o construtor recebeu um pai). */
	finish(): Model {
		return this.root;
	}
}

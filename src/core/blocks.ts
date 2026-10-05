import { resolveColor } from "./palette";
import type { BlockOptions } from "./types";
import { rotCFrame, toV3 } from "./utils";

/** Cria (mas ainda NÃO parenta) um `Model` vazio. */
export function createModel(name: string, parent?: Instance): Model {
	const model = new Instance("Model");
	model.Name = name;
	if (parent !== undefined) {
		model.Parent = parent;
	}
	return model;
}

/**
 * Cria um bloco de montar: a peça atômica de toda a demonstração.
 *
 * Regras fixas para a cena ficar estável:
 *  - toda peça nasce `Anchored` (não cai, não é puxada pela física);
 *  - `position` é o CENTRO da peça;
 *  - rotação é em graus, ordem XYZ.
 */
export function createBlock(options: BlockOptions): BasePart {
	const form = options.form ?? "block";
	let part: BasePart;

	if (form === "wedge") {
		part = new Instance("WedgePart");
	} else {
		const box = new Instance("Part");
		if (form === "cylinder") {
			box.Shape = Enum.PartType.Cylinder;
		} else if (form === "ball") {
			box.Shape = Enum.PartType.Ball;
		} else {
			box.Shape = Enum.PartType.Block;
		}
		part = box;
	}

	part.Name = options.name ?? "Block";
	part.Size = toV3(options.size);
	part.CFrame = rotCFrame(toV3(options.position), options.rotation);
	part.Color = resolveColor(options.color ?? "stone");
	part.Material = options.material ?? Enum.Material.SmoothPlastic;
	part.Anchored = options.anchored ?? true;
	part.CanCollide = options.canCollide ?? true;
	part.Transparency = options.transparency ?? 0;
	part.Reflectance = options.reflectance ?? 0;
	part.CastShadow = true;

	const surface = options.topSurface ?? Enum.SurfaceType.Smooth;
	part.TopSurface = surface;
	part.BottomSurface = surface;

	if (options.parent !== undefined) {
		part.Parent = options.parent;
	}
	return part;
}

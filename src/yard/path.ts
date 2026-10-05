import { PATH } from "../config";
import { createBlock, createModel } from "../core/blocks";
import { hash01 } from "../core/utils";

/**
 * Caminho de pedras: da porta (+Z) até o portão da cerca.
 * Pedras com tom alternado (hash determinístico, sem random).
 */
export function buildPath(parent: Instance): Model {
	const root = createModel("11_Caminho", parent);

	const cx = 0;
	const zStart = PATH.fromZ + 3;
	const zEnd = PATH.toZ;
	const count = 12;

	for (let i = 0; i < count; i++) {
		const t = i / (count - 1);
		const z = zStart + (zEnd - zStart) * t;
		const wobble = (hash01(i * 3 + 1) - 0.5) * 0.8;
		createBlock({
			name: `Pedra_${i + 1}`,
			size: [PATH.width - 1 + (hash01(i) - 0.5), 0.4, 2.6],
			position: [cx + wobble, 0.2, z],
			color: i % 2 === 0 ? "path" : "concrete",
			material: Enum.Material.Slate,
			parent: root,
		});
	}

	return root;
}

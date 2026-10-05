import { SCENE } from "./config";
import { buildChimney } from "./house/chimney";
import { buildFoundation } from "./house/foundation";
import { buildInterior } from "./house/interior";
import { buildOpenings } from "./house/openings";
import { buildPorch } from "./house/porch";
import { buildRoof } from "./house/roof";
import { buildWalls } from "./house/walls";
import { buildFence } from "./yard/fence";
import { buildGarden } from "./yard/garden";
import { buildGround } from "./yard/ground";
import { buildPath } from "./yard/path";

/**
 * Cena completa: monta o `Model BlockHouseDemo` no Workspace.
 *
 * Ordem importa (fundação → paredes → telhado → resto).
 * Idempotente: se já existir um Model com o mesmo nome, remove antes
 * para não duplicar a casa a cada Play.
 */
export function buildScene(workspace = game.GetService("Workspace")): Model {
	const t0 = os.clock();

	const old = workspace.FindFirstChild(SCENE.rootName);
	if (old !== undefined) {
		old.Destroy();
	}

	const root = new Instance("Model");
	root.Name = SCENE.rootName;
	root.Parent = workspace;

	// Terreno primeiro (a casa senta em cima dele).
	buildGround(root);
	buildFoundation(root);
	buildWalls(root);
	buildOpenings(root);
	buildRoof(root);
	buildChimney(root);
	buildPorch(root);
	buildInterior(root);

	// Quintal.
	buildPath(root);
	buildFence(root);
	buildGarden(root);

	// Diagnóstico de engenharia: quantas peças e quanto tempo.
	let parts = 0;
	for (const d of root.GetDescendants()) {
		if (d.IsA("BasePart")) {
			parts += 1;
		}
	}
	print(`[${SCENE.name}] pronto: ${parts} blocos em ${string.format("%.2f", os.clock() - t0)}s`);

	return root;
}

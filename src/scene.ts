import { SCENE } from "./config";
import { buildChimney } from "./house/chimney";
import { buildFoundation } from "./house/foundation";
import { buildInterior } from "./house/interior";
import { buildOpenings } from "./house/openings";
import { buildPorch } from "./house/porch";
import { buildRoof } from "./house/roof";
import { buildCabin, buildGuestHouse } from "./house/variants";
import { buildWalls } from "./house/walls";
import { buildYard } from "./structures/yard";

/**
 * Cena completa: monta o `Model BlockHouseDemo` no Workspace.
 *
 * Ordem importa (fundação → paredes → telhado → resto).
 * Idempotente: se já existir um Model com o mesmo nome, remove antes
 * para não duplicar a casa a cada Play.
 *
 * Conteúdo:
 *  - Casa principal (origem, 34×24) + varanda + chaminé + interior;
 *  - Cabana do Caseiro (oeste, 16×12) e Casa de Hóspedes (leste, 20×14),
 *    cada uma com interior próprio (`house/variants.ts`);
 *  - Quintal em 6 fases (`structures/yard.ts`: chão, cerca, caminho,
 *    vegetação com troncos cilíndricos corretos, iluminação, detalhes).
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

	// Casa principal.
	buildFoundation(root);
	buildWalls(root);
	buildOpenings(root);
	buildRoof(root);
	buildChimney(root);
	buildPorch(root);
	buildInterior(root);

	// Casas 2 e 3 (paramétricas, com interior).
	buildCabin(root);
	buildGuestHouse(root);

	// Quintal (faseado, com nomes fixos 00_Chao ... 05_Detalhes).
	buildYard({ parent: root, name: "10_Quintal" });

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

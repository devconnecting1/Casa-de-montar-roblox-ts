import { HOUSE } from "../config";
import { createBlock, createModel } from "../core/blocks";

/**
 * Interior mínimo — só com blocos, para provar a escala:
 * piso, mesa + bancos, cama e tapete. Tudo `CanCollide` padrão
 * para o player conseguir andar e sentar (Seat pronto p/ VehicleSeat).
 */
export function buildInterior(parent: Instance): Model {
	const root = createModel("07_Interior", parent);
	const cx = (HOUSE.x0 + HOUSE.x1) / 2;
	const cz = (HOUSE.z0 + HOUSE.z1) / 2;
	const floorY = HOUSE.baseY + 0.15;

	// Piso de madeira (dentro das paredes).
	createBlock({
		name: "Piso",
		size: [HOUSE.width - 2.2, 0.3, HOUSE.depth - 2.2],
		position: [cx, floorY, cz],
		color: "wood",
		material: Enum.Material.WoodPlanks,
		parent: root,
	});

	// Tapete da sala (fino para não dar z-fighting: 0.05 acima do piso).
	createBlock({
		name: "Tapete",
		size: [10, 0.1, 8],
		position: [-5, floorY + 0.2, 2],
		color: "mailRed",
		material: Enum.Material.Fabric,
		parent: root,
	});

	// Mesa: tampo + 4 pernas.
	const tableTopY = floorY + 2.6;
	createBlock({
		name: "Mesa_Tampo",
		size: [8, 0.6, 5],
		position: [-5, tableTopY, 2],
		color: "woodDark",
		material: Enum.Material.Wood,
		parent: root,
	});
	for (const dx of [-3.4, 3.4]) {
		for (const dz of [-1.9, 1.9]) {
			createBlock({
				name: "Mesa_Perna",
				size: [0.7, 2.6, 0.7],
				position: [-5 + dx, floorY + 1.3, 2 + dz],
				color: "woodDark",
				material: Enum.Material.Wood,
				parent: root,
			});
		}
	}

	// 2 bancos.
	for (const dz of [-2.2, 2.2]) {
		createBlock({
			name: "Banco",
			size: [7, 0.6, 1.2],
			position: [-5, floorY + 1.3, 2 + dz * 2],
			color: "woodLight",
			material: Enum.Material.Wood,
			parent: root,
		});
	}

	// Cama no fundo: base + colchão + travesseiro.
	const bedX = 10;
	const bedZ = -7;
	createBlock({
		name: "Cama_Base",
		size: [6, 1.2, 8],
		position: [bedX, floorY + 0.6, bedZ],
		color: "woodDark",
		material: Enum.Material.Wood,
		parent: root,
	});
	createBlock({
		name: "Cama_Colchao",
		size: [5.6, 0.8, 7.6],
		position: [bedX, floorY + 1.6, bedZ],
		color: "trim",
		material: Enum.Material.Fabric,
		parent: root,
	});
	createBlock({
		name: "Cama_Travesseiro",
		size: [4, 0.6, 1.6],
		position: [bedX, floorY + 2.2, bedZ - 2.6],
		color: "glass",
		material: Enum.Material.Fabric,
		parent: root,
	});

	// Luminária interna de teto.
	const lamp = createBlock({
		name: "Lustre",
		size: [1.4, 1.4, 1.4],
		position: [0, HOUSE.baseY + HOUSE.wallHeight - 1.5, 0],
		color: "lamp",
		material: Enum.Material.Neon,
		form: "ball",
		parent: root,
	});
	const pl = new Instance("PointLight");
	pl.Name = "Luz_Interna";
	pl.Brightness = 2.5;
	pl.Range = 60;
	pl.Color = Color3.fromRGB(255, 225, 160);
	pl.Parent = lamp;

	return root;
}

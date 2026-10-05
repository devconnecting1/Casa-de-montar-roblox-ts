/**
 * Contrato geométrico da cena.
 *
 * TODOS os módulos (casa, quintal, cena) leem daqui, para que as peças se
 * encaixem sem sobreposição e sem "z-fighting".
 *
 * Sistema de coordenadas:
 *  - Y = 0 é o nível do chão (topo da placa de grama).
 *  - A casa fica centrada na origem, com a fachada virando para +Z.
 *  - A porta principal fica CENTRADA na fachada: x = HOUSE.frontDoorX (0).
 */
export const SCENE = {
	name: "BlockHouseDemo",
	/** Lado da placa de grama (centrada na origem). */
	groundSize: 240,
	/** Espessura da placa: ela ocupa y = -groundThickness até y = 0. */
	groundThickness: 10,
	/** Lado do terreno cercado (centrado na origem). */
	fenceSide: 120,
	/** Nome do Model raiz criado pela cena. */
	rootName: "BlockHouseDemo",
} as const;

export const HOUSE = {
	// --- pegada (footprint) ------------------------------------------------
	/** Canto mínimo em X (parede esquerda). */
	x0: -17,
	/** Canto máximo em X (parede direita). */
	x1: 17,
	/** Canto mínimo em Z (parede de trás). */
	z0: -12,
	/** Canto máximo em Z (parede da frente / fachada). */
	z1: 12,
	/** Extensão em X (studs). */
	width: 34,
	/** Extensão em Z (studs). */
	depth: 24,

	// --- estrutura ---------------------------------------------------------
	/** Topo da laje de fundação: daqui para cima nascem as paredes. */
	baseY: 1,
	/** Espessura da laje (y = 0 até y = foundationThickness). */
	foundationThickness: 1,
	wallHeight: 12,
	wallThickness: 1,

	// --- "blocos de montar" ------------------------------------------------
	blocks: {
		/** Comprimento nominal do bloco (studs). */
		height: 1,
		length: 3,
	},

	// --- vãos (portas e janelas) ------------------------------------------
	door: {
		/** A porta é centrada na fachada (+Z) neste eixo X. */
		x: 0,
		height: 8,
		width: 6,
	},
	window: {
		/** Altura do peitoril em relação à base da parede. */
		height: 4,
		sill: 4,
		width: 5,
	},

	// --- telhado -----------------------------------------------------------
	roof: {
		/** Sobrebequeira: quanto o telhado avança além das paredes. */
		overhang: 2.5,
		/** Altura da cumeeira acima do topo das paredes. */
		rise: 8,
	},
} as const;

/** Caminho de pedra: da porta da casa (+Z) até o portão da cerca. */
export const PATH = {
	fromZ: HOUSE.z1,
	length: 34,
	toZ: 62,
	width: 6,
} as const;

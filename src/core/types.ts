import type { PaletteKey } from "./palette";

/** Tripleto simples: mais curto de escrever que `new Vector3(...)`. */
export type Vec3Tuple = [x: number, y: number, z: number];

/** Aceita tanto `Vector3` quanto `[x, y, z]`. */
export type Vec3Like = Vector3 | Vec3Tuple;

/** Aceita um `Color3` ou uma chave da paleta (`"brick"`, `"grass"`, ...). */
export type ColorLike = Color3 | PaletteKey;

/** Forma do bloco: caixa, cunha (wedge), cilindro ou esfera. */
export type BlockForm = "block" | "wedge" | "cylinder" | "ball";

/** Eixo de uma parede: cresce ao longo de X ou de Z. */
export type WallAxis = "x" | "z";

/** Especificação de um bloco isolado. */
export interface BlockOptions {
	name?: string;
	size: Vec3Like;
	/** Centro do bloco (não é o canto!). */
	position: Vec3Like;
	color?: ColorLike;
	material?: Enum.Material;
	form?: BlockForm;
	/** Rotação em GRAUS (ordem XYZ). */
	rotation?: Vec3Like;
	/** Padrão: `true`. */
	anchored?: boolean;
	/** Padrão: `true`. */
	canCollide?: boolean;
	/** 0 = opaco, 1 = invisível. Padrão: `0`. */
	transparency?: number;
	reflectance?: number;
	topSurface?: Enum.SurfaceType;
	/** Se informado, o bloco vai para esse pai em vez do Model atual. */
	parent?: Instance;
}

/**
 * Vão (porta/janela) recortado numa parede.
 * Todas as medidas são RELATIVAS à origem da parede:
 *  - `from`/`to`: distância ao longo do eixo da parede (0 .. length)
 *  - `fromY`/`toY`: altura acima da base da parede (0 .. height)
 */
export interface WallOpening {
	from: number;
	to: number;
	fromY: number;
	toY: number;
}

/** Uma parede montada bloco a bloco com junta escalonada (running bond). */
export interface WallOptions {
	/** Nome do Model filho que recebe os blocos. Padrão: `"Wall"`. */
	name?: string;
	/** Canto mínimo (x, y, z) da pegada da parede. */
	origin: Vec3Like;
	/** Comprimento ao longo do eixo da parede. */
	length: number;
	/** Altura da parede. */
	height: number;
	/** Eixo de crescimento. Padrão: `"x"`. */
	axis?: WallAxis;
	/** Espessura (profundidade). Padrão: `1`. */
	thickness?: number;
	/** Padrão: `3`. */
	brickLength?: number;
	/** Padrão: `1`. */
	brickHeight?: number;
	/** Escalona as fiadas alternadas (junta corrida). Padrão: `true`. */
	stagger?: boolean;
	color?: ColorLike;
	material?: Enum.Material;
	/** Variação de tom por bloco (0 .. 0.2 sugestivo). Padrão: `0.05`. */
	colorVariance?: number;
	/** Portas/janelas recortadas nos blocos. */
	openings?: WallOpening[];
	parent?: Instance;
}

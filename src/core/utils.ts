import type { Vec3Like, Vec3Tuple } from "./types";

/** Converte `[x, y, z]` ou `Vector3` em `Vector3`. */
export function toV3(value: Vec3Like): Vector3 {
	return typeIs(value, "Vector3") ? value : new Vector3(value[0], value[1], value[2]);
}

/** Converte graus em radianos (atalho legível). */
export function rad(degrees: number): number {
	return math.rad(degrees);
}

/** `CFrame` com posição + rotação em graus. */
export function rotCFrame(position: Vector3, rotation?: Vec3Tuple | Vector3): CFrame {
	const cframe = CFrame.new(position);
	if (rotation === undefined) {
		return cframe;
	}
	const r = toV3(rotation);
	return cframe.mul(CFrame.Angles(math.rad(r.x), math.rad(r.y), math.rad(r.z)));
}

/** Clareia/escurece uma cor multiplicando os canais (fator 1 = original). */
export function tint(color: Color3, factor: number): Color3 {
	const channel = (value: number) => math.clamp(math.floor(value * 255 * factor + 0.5), 0, 255);
	return Color3.fromRGB(channel(color.R), channel(color.G), channel(color.B));
}

/**
 * Ruído determinístico em 0..1 a partir de um índice.
 * Assim os blocos variam de tom SEM depender de `math.random` (resultado
 * idêlico toda vez que você roda o jogo).
 */
export function hash01(index: number): number {
	const value = math.sin(index * 12.9898) * 43758.5453;
	return value - math.floor(value);
}

/** Intervalo 1D `[início, fim]` usado para recortar vãos nas paredes. */
export type Interval = [from: number, to: number];

/**
 * Subtrai uma lista de cortes de um intervalo.
 * Retorna 0..N pedaços que sobraram (usado para recortar portas/janelas).
 */
export function subtractIntervals(from: number, to: number, cuts: Interval[]): Interval[] {
	let pieces: Interval[] = [[from, to]];
	for (const cut of cuts) {
		const next: Interval[] = [];
		for (const piece of pieces) {
			if (cut[1] <= piece[0] || cut[0] >= piece[1]) {
				next.push(piece); // não encosta neste pedaço
			} else {
				if (cut[0] > piece[0]) {
					next.push([piece[0], cut[0]]);
				}
				if (cut[1] < piece[1]) {
					next.push([cut[1], piece[1]]);
				}
			}
		}
		pieces = next;
	}
	return pieces;
}

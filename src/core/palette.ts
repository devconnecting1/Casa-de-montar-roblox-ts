/**
 * Paleta compartilhada da demonstração.
 * Chaves em vez de cores soltas para que casa e quintal usem sempre a MESMA tonalidade.
 */
export const PALETTE = {
	// terreno
	grass: Color3.fromHex("#5aa34a"),
	grassDark: Color3.fromHex("#4a8c3d"),
	dirt: Color3.fromHex("#7a5a3a"),

	// pedra / concreto
	stone: Color3.fromHex("#9aa0a6"),
	stoneDark: Color3.fromHex("#7b8187"),
	concrete: Color3.fromHex("#b9bcbe"),
	path: Color3.fromHex("#c9c2b4"),
	mortar: Color3.fromHex("#d8d3c7"),

	// tijolos e madeira
	brick: Color3.fromHex("#a8503c"),
	brickDark: Color3.fromHex("#8d3f30"),
	brickLight: Color3.fromHex("#bd6249"),
	wood: Color3.fromHex("#8a5a2b"),
	woodDark: Color3.fromHex("#5f3d1d"),
	woodLight: Color3.fromHex("#b07f45"),

	// telhado e caixilhos
	roof: Color3.fromHex("#7d3b3b"),
	roofDark: Color3.fromHex("#613030"),
	trim: Color3.fromHex("#f2f0e8"),

	// aberturas
	glass: Color3.fromHex("#a9d7e8"),
	door: Color3.fromHex("#5a3a1e"),

	// vegetação
	leaf: Color3.fromHex("#3f8f3a"),
	leafDark: Color3.fromHex("#2f7030"),
	trunk: Color3.fromHex("#6b4a2f"),

	// detalhes
	metal: Color3.fromHex("#3a3f45"),
	mailRed: Color3.fromHex("#c73b3b"),
	lamp: Color3.fromHex("#ffd98a"),
	water: Color3.fromHex("#3f7fbf"),
} as const;

export type PaletteKey = keyof typeof PALETTE;

/** Resolve uma cor: aceita um `Color3` direto ou uma chave da paleta. */
export function resolveColor(color: Color3 | PaletteKey): Color3 {
	return typeIs(color, "string") ? PALETTE[color] : color;
}

--!strict
-- EXEMPLO do que o roblox-ts gera (rbxtsc) a partir de src/core/blocks.ts.
-- Arquivo real após `npm run build`: out/core/blocks.lua
-- Demonstra: TypeScript -> Luau é quase 1:1, só tipagem some e `new Instance` vira `Instance.new`.

local Palette = require(script.Parent.palette)

local function createBlock(options)
	local form = options.form
	if form == nil then
		form = "block"
	end

	local part
	if form == "wedge" then
		part = Instance.new("WedgePart")
	else
		local box = Instance.new("Part")
		if form == "cylinder" then
			box.Shape = Enum.PartType.Cylinder
		elseif form == "ball" then
			box.Shape = Enum.PartType.Ball
		else
			box.Shape = Enum.PartType.Block
		end
		part = box
	end

	part.Name = options.name or "Block"
	part.Size = options.size -- Vector3 já resolvido pelo toV3 no TS
	part.CFrame = options.cframe
	part.Color = Palette.resolve(options.color or "stone")
	part.Material = options.material or Enum.Material.SmoothPlastic
	part.Anchored = true
	part.CanCollide = true
	part.CastShadow = true

	if options.parent ~= nil then
		part.Parent = options.parent
	end
	return part
end

return { createBlock = createBlock }

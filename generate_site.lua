U = {
	lfs = require "lfs",
	lunajson = require "lunajson",
	read = function(path)
		local f = io.open(path, "r")
		if not f then return nil end
		local content = f:read("*a")
		f:close()
		return content
	end,
	mkdir_recursive = function(path)
		local current_path = ""
		for part in path:gmatch("[^/]+") do
			if current_path ~= "" then
				current_path = current_path .. "/" .. part
			else
				current_path = part
			end
			if not U.lfs.attributes(current_path, "mode") then
				U.lfs.mkdir(current_path)
			end
		end
	end,
	write = function(path, content)
		local dir = path:match("(.*)/")
		if dir and dir ~= "" then
			U.mkdir_recursive(dir)
		end
		local f = io.open(path, "w")
		if not f then return false end
		f:write(content)
		f:close()
		return true
	end,
	copy = function(src, dest)
		local f = io.open(src, "rb")
		if not f then return false end
		local content = f:read("*a")
		f:close()
		return U.write(dest, content)
	end,

}



local function load_hacks()
	print("Loading hacks...")
	local hacks_dir = "hacks/"
	local hacks = {}

	for hack_dir in U.lfs.dir(hacks_dir) do
		if hack_dir ~= "." and hack_dir ~= ".." then
			local hack = {
				id = hack_dir,
				raw = U.read(hacks_dir .. hack_dir .. "/info.json"),
				screenshots = {}
			}

			for file in U.lfs.dir(hacks_dir .. hack_dir) do
				if file:match("^cover%.") then
					hack.cover = true
				elseif file:match("^screenshot_%d%d%.") then
					table.insert(hack.screenshots, file)
				end
			end

			if hack.raw then
				local details = U.lunajson.decode(hack.raw)
				for key, value in pairs(details) do
					hack[key] = value
				end
				print("	found:", hack.id)
				table.insert(hacks, hack)
			end
		end
	end

	print("done!")
	return hacks
end


local function render_hack_cards(hacks)
	print("	rendering hack cards...")
	local template = require "misc.hack_card"
	local out = ""
	for _, hack in ipairs(hacks) do
		local hack_html = template(hack)
		print("		rendered", hack.id)
		out = out .. hack_html
	end
	print("	done rendering hack cards")
	return out
end

-- main build function
local function build()
	local hacks = load_hacks()

	-- insert cards into index
	print("assembling index...")
	local cards_html = render_hack_cards(hacks)
	local index_html = U.read("misc/index.html")
	index_html = index_html:gsub("{{CARDS}}", cards_html)
	-- write index.html
	U.write("out/index.html", index_html)
	print("done assembling index")

	-- make individual hack pages
	print("making hack pages...")
	for _, hack in ipairs(hacks) do
		print("	making", hack.id)

		-- make html
		local card_html = require "misc.hack_page" (hack)
		U.write("out/h/" .. hack.id .. "/index.html", card_html)
		print("	html done!")

		-- copy images
		if hack.cover then
			U.copy("hacks/" .. hack.id .. "/cover.png", "out/h/" .. hack.id .. "/cover.png")
		end
		for _, file in ipairs(hack.screenshots) do
			U.copy("hacks/" .. hack.id .. "/" .. file, "out/h/" .. hack.id .. "/" .. file)
		end
		print("	images done!")
	end
	print("done making card pages!")

	print("build complete!")
end

build()

local pretty = U.lunajson.decode(U.read("static/pretty.json"))

local function prettify_and_join(tags, pretty_map)
	if not tags or #tags == 0 then
		return "N/A"
	end
	local pretty_tags = {}
	for _, tag in ipairs(tags) do
		table.insert(pretty_tags, pretty_map[tag] or tag)
	end
	return table.concat(pretty_tags, ", ")
end

return function(hack)
	-- Prettify single-value fields using the pretty.json map.
	local pretty_base = pretty.base[hack.base]
	local pretty_status = pretty.status[hack.status]
	local pretty_story = pretty.story[hack.story]
	local pretty_length = pretty.length[hack.length]
	local pretty_difficulty = pretty.difficulty[hack.difficulty]

	-- Prettify and concatenate array fields.
	local languages = prettify_and_join(hack.languages, pretty.language)
	local pokedex = prettify_and_join(hack.pokedex, pretty.pokedex)
	local features = prettify_and_join(hack.features, pretty.features)

	-- Generate HTML for the links section.
	local links_html = ""
	if hack.links then
		for name, url in pairs(hack.links) do
			links_html = links_html .. [[
				<div class="infoline">
					<a href="]] .. url .. [[">🔗]] .. name .. [[</a>
				</div>]]
		end
	end

	-- Construct the cover image URL, assuming hack.id is available, like in hack_card.lua.
	local cover_url = "/h/" .. hack.id .. "/cover.png"

	-- Construct the final HTML page by embedding the processed data.
	return [[<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="description" content="A database of Pokemon ROM hacks.">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>PokéHack Database - ]] .. hack.title .. [[</title>
	<link rel="author" href="https://kwikle.me/">
	<meta name="robots" content="index,follow">
	<link rel="stylesheet" type="text/css" href="/style/index.css">
	<link rel="stylesheet" type="text/css" href="/style/hack.css">

</head>
<body>
	<header>
		<a href="https://pkHdb.moonlemon.nexus"><h1>PKHDB</h1></a>
	</header>
	<main>
		<article>
			<section id="titlebar">
				<div id="back">
					<a href="/">< back</a>
				</div>
				<div id="title-container">
					<h2>]] .. hack.title .. [[</h2>
					<p>a hack of ]] .. pretty_base .. [[ by ]] .. (hack.creator or "Unknown") .. [[</p>
				</div>
				<div id="options">

				</div>
			</section>
			<section id="infobox">
				<img src="]] .. (cover_url or "/images/placeholder.png") .. [[" alt="]] .. hack.title .. [[ cover" class="cover">
				<div class="infoline">
					<p>Created by</p>
					<p>]] .. (hack.creator or "N/A") .. [[</p>
				</div>
				<div class="infoline">
					<p>Status</p>
					<p>]] .. (pretty_status or "N/A") .. [[</p>
				</div>
				<div class="infoline">
					<p>Hack of</p>
					<p>]] .. pretty_base .. [[</p>
				</div>
				<div class="infoline">
					<p>Languages</p>
					<p>]] .. languages .. [[</p>
				</div>
				<div class="infoline">
					<p>Initial release</p>
					<p>]] .. (hack.initial_release or "N/A") .. [[</p>
				</div>
				<div class="infoline">
					<p>Last update</p>
					<p>]] .. (hack.last_update or "N/A") .. [[</p>
				</div>
				<div class="infoline">
					<p>Story</p>
					<p>]] .. (pretty_story or "N/A") .. [[</p>
				</div>
				<div class="infoline">
					<p>Length</p>
					<p>]] .. (pretty_length or "N/A") .. [[</p>
				</div>
				<div class="infoline">
					<p>Difficulty</p>
					<p>]] .. (pretty_difficulty or "N/A") .. [[</p>
				</div>
				<div class="infoline">
					<p>Pokedex:</p>
					<p>]] .. (pokedex or "N/A") .. [[</p>
				</div>
				<div class="infoline">
					<p>Features:</p>
					<p>]] .. (features or "N/A") .. [[</p>
				</div>]] .. links_html .. [[
			</section>
			<section id="main-container">
				<div id="description">
					<p>]] .. hack.description .. [[</p>
				</div>
			</section>
		</article>
	</main>
	<script>
		document.querySelector('#back a').addEventListener('click', function(event) {
			event.preventDefault();
			history.back();
		});

	</script>
</body>
</html>
]]
end

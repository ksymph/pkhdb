local pretty = U.lunajson.decode(U.read("static/pretty.json"))



return function(hack)
	-- concat and prettify arrays
	local languages = ""
	for _, language in ipairs(hack.languages) do
		languages = languages .. language .. ", "
	end
	languages = languages:sub(1, -3) -- remove trailing comma and space
	local pokedex = ""
	for _, tag in ipairs(hack.pokedex) do
		pokedex = pokedex .. pretty.pokedex[tag] .. ", "
	end
	pokedex = pokedex:sub(1, -3) -- remove trailing comma and space
	local features = ""
	for _, feature in ipairs(hack.features) do
		features = features .. pretty.features[feature] .. ", "
	end
	features = features:sub(1, -3) -- remove trailing comma and space

	return [[ <div class="card">
  <a class="card-link" href="h/]] .. hack.id .. [[">
    <div class="top">
      <span class="title">]] .. hack.title .. [[</span>
      <div>
        <span class="status ]] .. hack.status .. [[">]] .. pretty.status[hack.status] .. [[</span>
        <span class="]] .. hack.base .. [[">]] .. pretty.base[hack.base] .. [[</span>
      </div>
    </div>
    <div class="cover">
      <img src="h/]] .. hack.id .. [[/cover.png" alt="cover">
      <div>
        <span>by ]] .. hack.creator .. [[</span>
        <span>]] .. languages .. [[</span>
      </div>
    </div>
  </a>
  ]] .. (hack.difficulty and [[<div class="info">
    <span>Difficulty</span>
    <span>]] .. pretty.difficulty[hack.difficulty] .. [[</span>
  </div>]] or "") ..
		 (hack.story and [[<div class="info">
    <span>Story</span>
    <span>]] .. pretty.story[hack.story] .. [[</span>
  </div>]] or "") ..
		 (hack.last_updated and [[<div class="info">
    <span>Last updated</span>
    <span>]] .. (hack.last_updated or "N/A") .. [[</span>
  </div>]] or "") ..
		 (hack.length and [[<div class="info">
    <span>Length</span>
    <span>]] .. pretty.length[hack.length] .. [[</span>
  </div>]] or "") ..
		 (pokedex and [[<div class="info-full">
    <span>Pokédex: ]] .. pokedex .. [[</span>
  </div>]] or "") ..
		 (features and [[<div class="info-full">
    <span>Features: ]] .. features .. [[</span>
  </div>]] or "") .. [[
</div>

]]
end

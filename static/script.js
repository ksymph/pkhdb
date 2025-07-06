document.addEventListener("DOMContentLoaded", () => {
	// --- DOM Elements ---
	const resultsContainer = document.getElementById("results-container");
	const filtersForm = document.getElementById("filters-form");

	// --- State ---
	let allHacks = [];

	// --- Helper Functions for Formatting ---

	// Map for pretty-printing base game names
	const GAME_NAMES = {
		red: "Red",
		green: "Green",
		blue: "Blue",
		yellow: "Yellow",
		gold: "Gold",
		silver: "Silver",
		crystal: "Crystal",
		ruby: "Ruby",
		sapphire: "Sapphire",
		emerald: "Emerald",
		firered: "FireRed",
		leafgreen: "LeafGreen",
		diamond: "Diamond",
		pearl: "Pearl",
		platinum: "Platinum",
		heartgold: "HeartGold",
		soulsilver: "SoulSilver",
		black: "Black",
		white: "White",
		black2: "Black 2",
		white2: "White 2",
	};

	// Map for pretty-printing filter tags and other values
	const TAG_NAMES = {
		// Status
		in_progress: "In Progress",
		stale: "Stale",
		complete: "Complete",
		ongoing: "Ongoing",
		// Pokedex
		vanilla: "Vanilla",
		expanded: "Expanded",
		backports: "Backports",
		fakemon: "Fakemon",
		all_fakemon: "All Fakemon",
		alt_forms: "Alternate Forms",
		completable: "Completable",
		new_types: "New Types",
		backport_types: "Backported Types",
		new_abilities: "New Abilities",
		new_moves: "New Moves",
		balance_tweaks: "Balance Tweaks",
		// Story
		vanilla_plus: "Vanilla+",
		new: "New",
		// Length
		short: "Short",
		long: "Long",
		very_long: "Very Long",
		// Difficulty
		hard: "Hard",
		kaizo: "Kaizo",
		flexible: "Flexible",
		// Features
		postgame: "Postgame",
		nuzlocke: "Nuzlocke",
		quests: "Quests",
		phys_spec_split: "Physical/Special Split",
		non_linear: "Non-linear",
		misc_qol: "General Qol",
	};

	function formatTag(tag) {
		return TAG_NAMES[tag] || tag.charAt(0).toUpperCase() + tag.slice(1);
	}

	function formatGameName(base) {
		return GAME_NAMES[base] || base.charAt(0).toUpperCase() + base.slice(1);
	}

	// --- Core Functions ---

	/**
	 * Renders an array of hack objects into the results container.
	 * @param {Array<Object>} hacksToRender - The array of hacks to display.
	 */
	function renderCards(hacksToRender) {
		resultsContainer.innerHTML = ""; // Clear previous results

		if (hacksToRender.length === 0) {
			resultsContainer.innerHTML =
				'<p class="no-results">No hacks found matching your criteria.</p>';
			return;
		}

		hacksToRender.forEach((hack) => {
			const pokedexInfo =
				hack.pokedex.length > 0
					? `<span>Pokédex: ${hack.pokedex.map(formatTag).join(", ")}</span>`
					: "";

			const featuresInfo =
				hack.features.length > 0
					? `<span>Features: ${hack.features.map(formatTag).join(", ")}</span>`
					: "";

			const lastUpdateDate = new Date(hack.last_update);
			const lastUpdate = !isNaN(lastUpdateDate.getTime())
				? lastUpdateDate.toLocaleDateString()
				: "N/A";

			const cardHTML = `
                <div class="card">
                    <a class="card-link" href="h/${hack.id}">
                        <div class="top">
                            <span class="title">${hack.title}</span>
                            <div>
                                <span class="status ${hack.status}">${formatTag(hack.status)}</span>
                                <span class="${hack.base}">${formatGameName(hack.base)}</span>
                            </div>
                        </div>
                        <div class="cover">
                            <img src="h/${hack.id}/cover.png" alt="Cover for ${hack.title}" onerror="this.parentElement.style.display='none'">
                            <div>
                                <span>by ${hack.creator}</span>
                                <span>${hack.languages.map((lang) => lang.toUpperCase()).join(", ")}</span>
                            </div>
                        </div>
                    </a>
                    <div class="info">
                        <span>Difficulty</span>
                        <span>${formatTag(hack.difficulty)}</span>
                    </div>
                    <div class="info">
                        <span>Story</span>
                        <span>${formatTag(hack.story)}</span>
                    </div>
                    <div class="info">
                        <span>Last updated</span>
                        <span>${lastUpdate}</span>
                    </div>
                    <div class="info">
                        <span>Length</span>
                        <span>${formatTag(hack.length)}</span>
                    </div>
                    ${pokedexInfo ? `<div class="info-full">${pokedexInfo}</div>` : ""}
                    ${featuresInfo ? `<div class="info-full">${featuresInfo}</div>` : ""}
                </div>`;

			resultsContainer.insertAdjacentHTML("beforeend", cardHTML);
		});
	}

	/**
	 * Filters the global 'allHacks' array based on form inputs and triggers a re-render.
	 */
	function applyFilters() {
		const formData = new FormData(filtersForm);
		const search = formData.get("search").toLowerCase();

		const filters = {
			base: formData.getAll("base[]"),
			status: formData.getAll("status[]"),
			pokedex: formData.getAll("pokedex[]"),
			story: formData.getAll("story[]"),
			length: formData.getAll("length[]"),
			difficulty: formData.getAll("difficulty[]"),
			features: formData.getAll("features[]"),
			language: formData.getAll("language[]"),
		};

		const filteredHacks = allHacks.filter((hack) => {
			// 1. Text Search Filter (checks title, creator, and description)
			const searchMatch =
				hack.title.toLowerCase().includes(search) ||
				hack.creator.toLowerCase().includes(search) ||
				hack.description.toLowerCase().includes(search);
			if (!searchMatch) return false;

			// 2. Checkbox Filters
			for (const key in filters) {
				const selectedValues = filters[key];
				if (selectedValues.length === 0) continue; // Skip if no filter is selected for this category

				// Handle the key name mismatch: form name is 'language', db property is 'languages'
				const hackKey = key === "language" ? "languages" : key;
				const hackValue = hack[hackKey];

				if (Array.isArray(hackValue)) {
					// For properties that are arrays (e.g., features, pokedex, languages)
					// The hack must have at least one of the selected values.
					if (!hackValue.some((val) => selectedValues.includes(val))) {
						return false;
					}
				} else {
					// For properties with a single value (e.g., base, status, story)
					if (!selectedValues.includes(hackValue)) {
						return false;
					}
				}
			}

			// If the hack survived all filters, include it
			return true;
		});

		renderCards(filteredHacks);
	}

	/**
	 * Fetches data, sets up event listeners, and performs the initial render.
	 */
	async function init() {
		try {
			const response = await fetch("db.json");
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			allHacks = await response.json();

			// Perform initial render with all hacks
			renderCards(allHacks);

			// Add event listeners to the form for real-time filtering
			filtersForm.addEventListener("input", applyFilters);
			filtersForm.addEventListener("submit", (e) => e.preventDefault());
		} catch (error) {
			console.error("Could not load hack database:", error);
			resultsContainer.innerHTML =
				'<p class="error">Failed to load hack database. Please try again later.</p>';
		}
	}

	// --- Start the application ---
	init();
});

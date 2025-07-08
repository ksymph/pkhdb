document.addEventListener("DOMContentLoaded", () => {
	// --- DOM Elements ---
	const resultsContainer = document.getElementById("results-container");
	const filtersForm = document.getElementById("filters-form");

	// --- State ---
	let allHacks = [];
	let prettyNames = {}; // Will be populated from misc/pretty.json

	// --- Helper Functions for Formatting ---

	/**
	 * Looks up the "pretty" display name for a given category and key.
	 * @param {string} category - The category of the value (e.g., 'base', 'status').
	 * @param {string} key - The raw value from the database (e.g., 'firered', 'in_progress').
	 * @returns {string} The formatted display name.
	 */
	function formatValue(category, key) {
		// Check if category and key exist in the loaded prettyNames object
		if (prettyNames[category] && prettyNames[category][key]) {
			return prettyNames[category][key];
		}
		// Fallback for keys not found in pretty.json
		console.warn(
			`No pretty name found for category '${category}' with key '${key}'.`,
		);
		return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
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
				(hack.pokedex || []).length > 0
					? `<span>Pokédex: ${(hack.pokedex || []).map((p) => formatValue("pokedex", p)).join(", ")}</span>`
					: "";

			const featuresInfo =
				(hack.features || []).length > 0
					? `<span>Features: ${(hack.features || []).map((f) => formatValue("features", f)).join(", ")}</span>`
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
                                <span class="status ${hack.status}">${formatValue("status", hack.status || "N/A")}</span>
                                <span class="${hack.base}">${formatValue("base", hack.base)}</span>
                            </div>
                        </div>
                        <div class="cover">
                            <img src="${hack.cover ? `h/${hack.id}/${hack.cover}` : "/placeholder.png"}" alt="cover" onerror="this.parentElement.style.display='none'">
                            <div>
                                <span>by ${hack.creator}</span>
                                <span>${hack.languages?.join(", ") || "N/A"}</span>
                            </div>
                        </div>
                    </a>
                    ${
								hack.difficulty
									? `<div class="info">
                        <span>Difficulty</span>
                        <span>${formatValue("difficulty", hack.difficulty)}</span>
                    </div>`
									: ""
							}
                    ${
								hack.story
									? `<div class="info">
                        <span>Story</span>
                        <span>${formatValue("story", hack.story)}</span>
                    </div>`
									: ""
							}
                    ${
								lastUpdate !== "N/A"
									? `<div class="info">
                        <span>Last updated</span>
                        <span>${lastUpdate}</span>
                    </div>`
									: ""
							}
                    ${
								hack.length
									? `<div class="info">
                        <span>Length</span>
                        <span>${formatValue("length", hack.length)}</span>
                    </div>`
									: ""
							}
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
			const searchMatch = hack.title.toLowerCase().includes(search);
			if (!searchMatch) return false;

			// 2. Checkbox Filters
			for (const key in filters) {
				const selectedValues = filters[key];
				if (selectedValues.length === 0) continue;

				// Handle the key name mismatch: form name is 'language', db property is 'languages'
				const hackKey = key === "language" ? "languages" : key;
				const hackValue = hack[hackKey];

				if (Array.isArray(hackValue)) {
					// For properties that are arrays (e.g., features, pokedex, languages)
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

			return true;
		});

		renderCards(filteredHacks);
	}

	/**
	 * Fetches data, sets up event listeners, and performs the initial render.
	 */
	async function init() {
		try {
			// Fetch both database and formatting names concurrently
			const [hacksResponse, prettyResponse] = await Promise.all([
				fetch("db.json"),
				fetch("pretty.json"),
			]);

			if (!hacksResponse.ok)
				throw new Error(
					`Failed to load db.json: ${hacksResponse.statusText}`,
				);
			if (!prettyResponse.ok)
				throw new Error(
					`Failed to load pretty.json: ${prettyResponse.statusText}`,
				);

			allHacks = await hacksResponse.json();
			prettyNames = await prettyResponse.json();

			// Perform initial render with all hacks
			renderCards(allHacks);

			// Add event listeners to the form for real-time filtering
			filtersForm.addEventListener("input", applyFilters);
			filtersForm.addEventListener("submit", (e) => e.preventDefault());
		} catch (error) {
			console.error("Could not initialize the application:", error);
			resultsContainer.innerHTML = `<p class="error">Failed to load required data: ${error.message}. Please try again later.</p>`;
		}
	}

	// --- Start the application ---
	init();
});

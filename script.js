const SUPABASE_URL = "https://ghteiwpgzifmmbgtlbeg.supabase.co";
const SUPABASE_KEY = "sb_publishable_QKP33S0B2ABkIJoNKbWW7Q_RJaYp9be";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// Get the four barrels from the database
async function getBarrels() {

    const { data, error } = await supabaseClient
        .from("barrels")
        .select("*")
        .order("id");

    if (error) {

        console.error("Error loading barrels:", error);

        document.getElementById("barrels").textContent =
            "Couldn't load the Slurpee barrels 😭";

        return [];
    }

    return data;
}


// Display the barrels on the website
async function displayBarrels() {

    const barrels = await getBarrels();

    const container = document.getElementById("barrels");

    container.innerHTML = "";

    barrels.forEach(barrel => {

        const card = document.createElement("div");

        card.className = "barrel";

        card.innerHTML = `
            <h2>Barrel ${barrel.id}</h2>

            <h3>${barrel.flavour || "Unknown flavour"}</h3>

            <p>${barrel.description || ""}</p>

            <button onclick="reportStatus(${barrel.id}, true)">
                🟢 Working
            </button>

            <button onclick="reportStatus(${barrel.id}, false)">
                🔴 Not working
            </button>
        `;

        container.appendChild(card);
    });
}


// Submit a report
async function reportStatus(barrelId, status) {

    const { error } = await supabaseClient
        .from("reports")
        .insert({
            barrel: barrelId,
            status: status
        });

    if (error) {

        console.error("Error submitting report:", error);

        document.getElementById("message").textContent =
            "Something went wrong 😭";

        return;
    }

    document.getElementById("message").textContent =
        "Report submitted! Thanks 🥤";
}


// Load the barrels when the page opens
displayBarrels();

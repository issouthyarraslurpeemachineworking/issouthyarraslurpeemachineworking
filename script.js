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


// Get recent reports for one barrel
async function getBarrelStatus(barrelId) {

    const { data, error } = await supabaseClient
        .from("reports")
        .select("*")
        .eq("barrel", barrelId)
        .order("created_at", { ascending: false })
        .limit(20);

    if (error) {

        console.error("Error loading reports:", error);

        return null;
    }

    // Nobody has reported this barrel
    if (data.length === 0) {

        return {
            status: "unknown",
            confidence: null,
            working: 0,
            broken: 0
        };
    }

    const working = data.filter(
        report => report.status === true
    ).length;

    const broken = data.filter(
        report => report.status === false
    ).length;

    const confidence = working / data.length;


    if (confidence >= 0.75) {

        return {
            status: "working",
            confidence: confidence,
            working: working,
            broken: broken
        };

    } else if (confidence >= 0.40) {

        return {
            status: "uncertain",
            confidence: confidence,
            working: working,
            broken: broken
        };

    } else {

        return {
            status: "broken",
            confidence: confidence,
            working: working,
            broken: broken
        };
    }
}


// Display the barrels
async function displayBarrels() {

    const barrels = await getBarrels();

    const container = document.getElementById("barrels");

    container.innerHTML = "";


    for (const barrel of barrels) {

        const result = await getBarrelStatus(barrel.id);

        const card = document.createElement("div");

        card.className = "barrel";


        let statusText;
        let statusEmoji;

        if (result.status === "working") {

            statusText = "LIKELY WORKING";
            statusEmoji = "🟢";

        } else if (result.status === "broken") {

            statusText = "LIKELY NOT WORKING";
            statusEmoji = "🔴";

        } else if (result.status === "uncertain") {

            statusText = "UNCERTAIN";
            statusEmoji = "🟡";

        } else {

            statusText = "NO REPORTS";
            statusEmoji = "⚪";
        }


        let confidenceText = "";

        if (result.confidence !== null) {

            confidenceText =
                `${Math.round(result.confidence * 100)}% confidence`;

        }


        card.innerHTML = `

            <h2>🥤 Barrel ${barrel.id}</h2>

            <h3>${barrel.flavour || "Unknown flavour"}</h3>

            <p>${barrel.description || ""}</p>

            <h2>
                ${statusEmoji} ${statusText}
            </h2>

            <p>${confidenceText}</p>

            <p>
                ${result.working} working ·
                ${result.broken} not working
            </p>

            <button onclick="reportStatus(${barrel.id}, true)">
                🟢 Working
            </button>

            <button onclick="reportStatus(${barrel.id}, false)">
                🔴 Not working
            </button>

        `;

        container.appendChild(card);
    }
}


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

    // Immediately reload the barrel statuses
    await displayBarrels();
}


// Load everything
displayBarrels();

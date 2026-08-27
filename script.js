const SUPABASE_URL = "https://ghteiwpgzifmmbgtlbeg.supabase.co";
const SUPABASE_KEY = "sb_publishable_QKP33S0B2ABkIJoNKbWW7Q_RJaYp9be";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// Get all barrels
async function getBarrels() {

    const { data, error } = await supabaseClient
        .from("barrels")
        .select("*")
        .order("id");

    if (error) {
        console.error("Error loading barrels:", error);
        return [];
    }

    return data;
}


// Get reports for one barrel
async function getBarrelStatus(barrelId) {

    const { data, error } = await supabaseClient
        .from("reports")
        .select("status, created_at")
        .eq("barrel", barrelId)
        .order("created_at", { ascending: false })
        .limit(20);

    if (error) {
        console.error("Error loading reports:", error);
        return null;
    }

    // No reports
    if (data.length === 0) {
        return {
            status: "unknown",
            confidence: null,
            working: 0,
            broken: 0,
            lastReported: null
        };
    }

    const working = data.filter(
        report => report.status === true
    ).length;

    const broken = data.filter(
        report => report.status === false
    ).length;

    const confidence = working / data.length;


    let status;

    if (confidence >= 0.75) {
        status = "working";
    } else if (confidence >= 0.40) {
        status = "uncertain";
    } else {
        status = "broken";
    }


    return {
        status: status,
        confidence: confidence,
        working: working,
        broken: broken,
        lastReported: data[0].created_at
    };
}


// Display all barrels
async function displayBarrels() {

    const barrels = await getBarrels();

    const container = document.getElementById("barrels");

    container.innerHTML = "";


    for (const barrel of barrels) {

        const result = await getBarrelStatus(barrel.id);

        const card = document.createElement("div");

        card.className = "barrel";


        let statusEmoji;
        let statusText;


        if (!result) {

            statusEmoji = "❓";
            statusText = "ERROR";

        } else if (result.status === "working") {

            statusEmoji = "🟢";
            statusText = "LIKELY WORKING";

        } else if (result.status === "broken") {

            statusEmoji = "🔴";
            statusText = "LIKELY NOT WORKING";

        } else if (result.status === "uncertain") {

            statusEmoji = "🟡";
            statusText = "UNCERTAIN";

        } else {

            statusEmoji = "⚪";
            statusText = "NO REPORTS";
        }


        let confidenceText = "";

        if (result && result.confidence !== null) {

            confidenceText =
                `${Math.round(result.confidence * 100)}% confidence`;
        }


        let reportText = "";

        if (result) {

            reportText =
                `${result.working} working · ${result.broken} not working`;
        }


        card.innerHTML = `
            
            <h2>🥤 Barrel ${barrel.id}</h2>

            <h3>${barrel.flavour || "Unknown flavour"}</h3>

            <p>${barrel.description || ""}</p>

            <h2>
                ${statusEmoji} ${statusText}
            </h2>

            <p>${confidenceText}</p>

            <p>${reportText}</p>

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


    await displayBarrels();
}


// Start the website
displayBarrels();

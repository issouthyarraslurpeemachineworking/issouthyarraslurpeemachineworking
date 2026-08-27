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

        document.getElementById("barrels").textContent =
            "Couldn't load the Slurpee barrels 😭";

        return [];
    }

    return data;
}


// Get the status of one barrel
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


    // No reports yet
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
        broken: broken
    };
}


// Display the barrels
async function displayBarrels() {

    const barrels = await getBarrels();

    const container = document.getElementById("barrels");

    container.innerHTML = "";


    for (const barrel of barrels) {

        const result = await getBarrelStatus(barrel.id);


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


        const card = document.createElement("div");

        card.className = `barrel status-${result.status}`;
        card.id = `barrel-${barrel.id}`;


        card.innerHTML = `

            <h2>🥤 Barrel ${barrel.id}</h2>

            <h3>${barrel.flavour || "Unknown flavour"}</h3>

            <p>${barrel.description || ""}</p>

            <div class="status">
                <strong>${statusEmoji} ${statusText}</strong>
            </div>

            <p class="confidence">${confidenceText}</p>
            
            <p class="report-count">${reportText}</p>
            
            <div class="buttons">

                <button onclick="reportStatus(${barrel.id}, true)">
                    🟢 Working
                </button>

                <button onclick="reportStatus(${barrel.id}, false)">
                    🔴 Not working
                </button>

            </div>

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


    // Find the existing card
    const card = document.getElementById(`barrel-${barrelId}`);

    if (!card) {
        return;
    }


    // Get the current numbers displayed on the card
    const reportCount = card.querySelector(".report-count");

    const text = reportCount.textContent;

    const match = text.match(/(\d+) working · (\d+) not working/);


    if (!match) {
        return;
    }


    let working = parseInt(match[1]);
    let broken = parseInt(match[2]);


    // Add the new report
    if (status === true) {
        working++;
    } else {
        broken++;
    }


    const total = working + broken;

    const confidence = working / total;


    // Work out the new status
    let statusEmoji;
    let statusText;


    if (confidence >= 0.75) {

        statusEmoji = "🟢";
        statusText = "LIKELY WORKING";

    } else if (confidence >= 0.40) {

        statusEmoji = "🟡";
        statusText = "UNCERTAIN";

    } else {

        statusEmoji = "🔴";
        statusText = "LIKELY NOT WORKING";
    }


    // Update ONLY this card
card.querySelector(".status").innerHTML =
    `<strong>${statusEmoji} ${statusText}</strong>`;

card.classList.remove(
    "status-working",
    "status-uncertain",
    "status-broken",
    "status-unknown"
);

card.classList.add(`status-${result.status}`);

card.querySelector(".confidence").textContent =
    confidenceText;

card.querySelector(".report-count").textContent =
    `${result.working} working · ${result.broken} not working`;

// Start the website
displayBarrels();

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
        .limit(50);

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
            broken: 0,
            lastReported: null
        };
    }


    let workingWeight = 0;
    let brokenWeight = 0;

    let working = 0;
    let broken = 0;

    // The newest report is the first one
    let lastReported = data[0].created_at;


    // Work out how much each report should count
    for (const report of data) {

        const ageMinutes =
            (Date.now() - new Date(report.created_at).getTime()) / 60000;


        let weight;


        if (ageMinutes < 15) {

            weight = 1.00;

        } else if (ageMinutes < 60) {

            weight = 0.90;

        } else if (ageMinutes < 180) {

            weight = 0.75;

        } else if (ageMinutes < 360) {

            weight = 0.55;

        } else if (ageMinutes < 720) {

            weight = 0.40;

        } else if (ageMinutes < 1440) {

            weight = 0.25;

        } else if (ageMinutes < 2880) {

            weight = 0.12;

        } else if (ageMinutes < 4320) {

            weight = 0.05;

        } else {

            // Older than 3 days — ignore it
            weight = 0;
        }


        // Ignore reports older than 3 days
        if (weight === 0) {
            continue;
        }


        if (report.status === true) {

            workingWeight += weight;
            working++;

        } else {

            brokenWeight += weight;
            broken++;
        }
    }


    const totalWeight =
        workingWeight + brokenWeight;


    // All reports are older than 3 days
    if (totalWeight === 0) {

        return {
            status: "unknown",
            confidence: null,
            working: 0,
            broken: 0,
            lastReported: lastReported
        };
    }


    const confidence =
        workingWeight / totalWeight;


    let status;


    if (confidence >= 0.70) {

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
        lastReported: lastReported
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

        card.className = `barrel status-${result ? result.status : "unknown"}`;
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


// Update the card colour
card.classList.remove(
    "status-working",
    "status-uncertain",
    "status-broken",
    "status-unknown"
);

let newStatus;

if (confidence >= 0.75) {
    newStatus = "working";
} else if (confidence >= 0.40) {
    newStatus = "uncertain";
} else {
    newStatus = "broken";
}

card.classList.add(`status-${newStatus}`);


// Update confidence
card.querySelector(".confidence").textContent =
    `${Math.round(confidence * 100)}% confidence`;


// Update report count
card.querySelector(".report-count").textContent =
    `${working} working · ${broken} not working`;

}


// Start the website
displayBarrels();

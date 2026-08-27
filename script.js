const SUPABASE_URL = "ghteiwpgzifmmbgtlbeg";
const SUPABASE_KEY = "sb_publishable_QKP33S0B2ABkIJoNKbWW7Q_RJaYp9be";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

document.getElementById("working").addEventListener("click", async () => {

    const { error } = await supabaseClient
        .from("reports")
        .insert({
            status: true
        });

    if (error) {
        console.error(error);
        document.getElementById("message").textContent =
            "Something went wrong 😭";
        return;
    }

    document.getElementById("message").textContent =
        "Report submitted! 🥤";
});


document.getElementById("broken").addEventListener("click", async () => {

    const { error } = await supabaseClient
        .from("reports")
        .insert({
            status: false
        });

    if (error) {
        console.error(error);
        document.getElementById("message").textContent =
            "Something went wrong 😭";
        return;
    }

    document.getElementById("message").textContent =
        "Report submitted! 😔";
});

async function getReports() {

    const { data, error } = await supabaseClient
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return [];
    }

    return data;
}

async function updateStatus() {

    const reports = await getReports();

    if (reports.length === 0) {
        document.getElementById("status").textContent =
            "No reports yet";
        return;
    }

    const recentReports = reports.slice(0, 20);

    const working = recentReports.filter(
        report => report.status === true
    ).length;

    const confidence = working / recentReports.length;

    if (confidence >= 0.75) {

        document.getElementById("status").textContent =
            `🟢 LIKELY WORKING — ${Math.round(confidence * 100)}%`;

    } else if (confidence >= 0.4) {

        document.getElementById("status").textContent =
            `🟡 UNCERTAIN — ${Math.round(confidence * 100)}%`;

    } else {

        document.getElementById("status").textContent =
            `🔴 LIKELY BROKEN — ${Math.round(confidence * 100)}%`;

    }
}

updateStatus();

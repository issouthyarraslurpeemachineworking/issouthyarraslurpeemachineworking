const SUPABASE_URL =
    "https://ghteiwpgzifmmbgtlbeg.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_QKP33S0B2ABkIJoNKbWW7Q_RJaYp9be";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ============================
// LOGIN
// ============================

async function login() {

    const email =
        document.getElementById("email").value;

    const password =
        document.getElementById("password").value;


    const { error } =
        await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });


    if (error) {

        document.getElementById("login-message").textContent =
            "Login failed 😭";

        console.error(error);

        return;
    }


    showAdmin();
}


// ============================
// LOGOUT
// ============================

async function logout() {

    await supabaseClient.auth.signOut();

    document.getElementById("admin-panel").style.display =
        "none";

    document.getElementById("login").style.display =
        "block";
}


// ============================
// SHOW ADMIN PANEL
// ============================

async function showAdmin() {

    document.getElementById("login").style.display =
        "none";

    document.getElementById("admin-panel").style.display =
        "block";

    loadBarrels();
}


// ============================
// LOAD BARRELS
// ============================

async function loadBarrels() {

    const { data, error } =
        await supabaseClient
            .from("barrels")
            .select("*")
            .order("id");


    if (error) {

        console.error(error);

        document.getElementById("admin-barrels").textContent =
            "Couldn't load barrels 😭";

        return;
    }


    const container =
        document.getElementById("admin-barrels");

    container.innerHTML = "";


    for (const barrel of data) {

        const card =
            document.createElement("div");

        card.className = "barrel";


        card.innerHTML = `

            <h2>🥤 Barrel ${barrel.id}</h2>


            <label>
                Flavour
            </label>

            <input
                type="text"
                id="flavour-${barrel.id}"
                value="${barrel.flavour || ""}"
            >


            <label>
                Description
            </label>

            <textarea
                id="description-${barrel.id}"
            >${barrel.description || ""}</textarea>


            <label>
                Availability
            </label>

            <label>
                <input
                    type="checkbox"
                    id="active-${barrel.id}"
                    ${barrel.active ? "checked" : ""}
                >
                Currently available
            </label>


            <button onclick="saveBarrel(${barrel.id})">
                Save Barrel ${barrel.id}
            </button>

        `;


        container.appendChild(card);
    }
}


// ============================
// SAVE BARREL
// ============================

async function saveBarrel(barrelId) {

    const flavour =
        document.getElementById(
            `flavour-${barrelId}`
        ).value;


    const description =
        document.getElementById(
            `description-${barrelId}`
        ).value;


    const active =
        document.getElementById(
            `active-${barrelId}`
        ).checked;


    const { error } =
        await supabaseClient
            .from("barrels")
            .update({
                flavour: flavour,
                description: description,
                active: active
            })
            .eq("id", barrelId);


    if (error) {

        console.error(error);

        document.getElementById("admin-message").textContent =
            "Couldn't save changes 😭";

        return;
    }


    document.getElementById("admin-message").textContent =
        `Barrel ${barrelId} updated! 🥤`;
}


// ============================
// CHECK LOGIN ON PAGE LOAD
// ============================

async function checkLogin() {

    const { data } =
        await supabaseClient.auth.getSession();


    if (data.session) {

        showAdmin();

    } else {

        document.getElementById("login").style.display =
            "block";

        document.getElementById("admin-panel").style.display =
            "none";
    }
}


checkLogin();

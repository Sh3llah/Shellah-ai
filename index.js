const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");

// Ensure AUTH_FOLDER exists
const fs = require("fs");
const path = require("path");
const authFolder = process.env.AUTH_FOLDER || "auth_info_baileys";
if (!fs.existsSync(authFolder)) {
    fs.mkdirSync(authFolder, { recursive: true });
}
const { Boom } = require("@hapi/boom");
const P = require("pino");
const path = require("path");
const OWNER_NUMBER = process.env.OWNER_NUMBER;

async function startBot() {
    const AUTH_FOLDER = process.env.AUTH_FOLDER || "./auth_info_baileys";
    const { state, saveCreds } = await useMultiFileAuthState(path.resolve(__dirname, AUTH_FOLDER));
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
        version,
        printQRInTerminal: true,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, P({ level: "silent" })),
        },
        logger: P({ level: "silent" }),
        browser: ["RenderBot", "Chrome", "1.0.0"],
    });

    sock.ev.on("creds.update", saveCreds);
    
    sock.ev.on("connection.update", (update) => {
        const { connection, qr, lastDisconnect } = update;

        if (qr) {
            console.log("====== Scan this QR Code with WhatsApp ======");
            console.log(qr);
            console.log("=============================================");
        }

        if (connection === "close") {
            const shouldReconnect = (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut);
            console.log("connection closed due to", lastDisconnect.error, ", reconnecting", shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === "open") {
            console.log("Connected to WhatsApp");
        }
    });


    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        await sock.sendMessage(msg.key.remoteJid, { text: "Hello from Render Bot!" });
    });
}

startBot();
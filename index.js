// index.js (ESM version)
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys"
import express from "express"
import bodyParser from "body-parser"
import axios from "axios"
import qrcode from "qrcode-terminal"

const SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxcx1RmnlFqR6YruH5wL7sT5vCGZIHiTxaMUEOuJ-qr0qV2LaK6mRjY_v1GSDoyNzUksQ/exec"
  //"https://script.google.com/macros/s/AKfycbw46ZgzQMUGksCKA8dLt3c7mBRi1vDHSfEZDs9A8KxRvmLRxLGC0f2kJhl9AOrrnV-pRw/exec" 
const PORT = 3000

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth")
  const sock = makeWASocket({
    auth: state
  })

  // Event koneksi
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr) {
      console.log("📌 Scan QR di link ini:")
      console.log("https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(qr))
      // console.clear()
      // console.log("📌 Scan QR berikut untuk login WhatsApp:\n")
      // qrcode.generate(qr, { small: true })
    }
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      if (shouldReconnect) {
        startBot()
      } else {
        console.log("❌ Bot logged out.")
      }
    } else if (connection === "open") {
      console.log("✅ WhatsApp bot connected")
    }
  })

  sock.ev.on("creds.update", saveCreds)

  // Server API Express
  const app = express()
  app.use(bodyParser.json())

  // Endpoint untuk kirim pesan
  app.post("/send", async (req, res) => {
    try {
      const { whatsapp, message, sheetName } = req.body
      if (!whatsapp || !message || !sheetName) {
        return res.status(400).json({ error: "Missing whatsapp, message, or sheetName" })
      }

      const jid = whatsapp.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
      await sock.sendMessage(jid, { text: message })

      // Update status ke Google Sheets
      try {
        await axios.post(SHEETS_WEBAPP_URL, {
          whatsapp: whatsapp,
          status: "Terkirim",
          sheetName: sheetName   // 🔑 kirim balik sheetName
        })
      } catch (err) {
        console.error("⚠️ Gagal update Sheets:", err.message)
      }

      res.json({ success: true })
    } catch (err) {
      console.error("❌ Error kirim:", err.message)
      res.status(500).json({ error: err.message })
    }
  })

  app.listen(PORT, () => {
    console.log(`🚀 API server running on http://localhost:${PORT}`)
  })
}

startBot()

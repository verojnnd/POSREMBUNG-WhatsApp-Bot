// index.js (ESM version)
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys"
import express from "express"
import bodyParser from "body-parser"
import axios from "axios"
import qrcode from "qrcode-terminal"

const SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbw46ZgzQMUGksCKA8dLt3c7mBRi1vDHSfEZDs9A8KxRvmLRxLGC0f2kJhl9AOrrnV-pRw/exec" // ganti dengan URL WebApp Apps Script
const PORT = 22 //3000

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth")
  const sock = makeWASocket({
    auth: state
  })

  // event koneksi WhatsApp
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr) {
      console.log("📌 Scan QR berikut untuk login WhatsApp:")
      qrcode.generate(qr, { small: true })
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

  // server API Express
  const app = express()
  app.use(bodyParser.json())

  // endpoint untuk kirim pesan
  app.post("/send", async (req, res) => {
    try {
      const { whatsapp, message } = req.body
      if (!whatsapp || !message) {
        return res.status(400).json({ error: "Missing whatsapp or message" })
      }

      const jid = whatsapp.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
      await sock.sendMessage(jid, { text: message })

      // update status ke Google Sheets
      try {
        await axios.post(SHEETS_WEBAPP_URL, {
          whatsapp: whatsapp,
          status: "Terkirim"
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

// const {
//     DisconnectReason,
//     useMultiFileAuthState
// } = require('@whiskeysockets/baileys');
// const makeWASocket = require('@whiskeysockets/baileys').default;
// const axios = require('axios');
// const qrcode = require('qrcode-terminal'); // tambahan untuk cetak QR di terminal

// async function startSock() {
//     const { state, saveCreds } = await useMultiFileAuthState('./auth');
//     const sock = makeWASocket({
//         auth: state
//         // ❌ hapus printQRInTerminal
//     });

//     // Tampilkan QR manual
//     sock.ev.on('connection.update', (update) => {
//         const { connection, lastDisconnect, qr } = update;

//         if (qr) {
//             console.log("📲 Scan QR berikut untuk login WhatsApp:");
//             qrcode.generate(qr, { small: true }); // tampilkan QR ke terminal
//         }

//         if (connection === 'close') {
//             const shouldReconnect =
//                 lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
//             console.log('connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
//             if (shouldReconnect) {
//                 startSock();
//             }
//         } else if (connection === 'open') {
//             console.log('✅ WhatsApp bot connected');
//         }
//     });

//     // Simpan kredensial login
//     sock.ev.on('creds.update', saveCreds);

//     // Event saat pesan baru masuk
//     sock.ev.on('messages.upsert', async (m) => {
//         const msg = m.messages[0];
//         if (!msg.message || msg.key.fromMe) return;

//         const from = msg.key.remoteJid;
//         const pesan = msg.message.conversation || msg.message.extendedTextMessage?.text;

//         console.log("📩 Pesan dari:", from);
//         console.log("Isi pesan:", pesan);

//         if (pesan?.toLowerCase() === 'cek status') {
//             try {
//                 const res = await axios.get(
//                     "https://script.google.com/macros/s/AKfycbw46ZgzQMUGksCKA8dLt3c7mBRi1vDHSfEZDs9A8KxRvmLRxLGC0f2kJhl9AOrrnV-pRw/exec?whatsapp=" +
//                     from.replace('@s.whatsapp.net', '')
//                 );
//                 const { success, data } = res.data;
//                 if (success) {
//                     const reply = `Halo kak ${data.nama}\n\nStatus laundry Anda:\nNo. Order: ${data.no_order}\nTotal Bayar: ${data.total_bayar}\nStatus: ${data.status}\n\nTerima kasih telah menggunakan layanan laundry kami.`;
//                     await sock.sendMessage(from, { text: reply });
//                 } else {
//                     await sock.sendMessage(from, { text: "Data tidak ditemukan, pastikan nomor Anda sudah terdaftar." });
//                 }
//             } catch (err) {
//                 console.error(err);
//                 await sock.sendMessage(from, { text: "Terjadi kesalahan saat mengambil data." });
//             }
//         } else {
//             await sock.sendMessage(from, {
//                 text: 'Maaf, perintah tidak dikenal. Silakan kirim *cek status* untuk memeriksa status laundry Anda.'
//             });
//         }
//     });
// }

// startSock();

// const {
//   DisconnectReason,
//   useMultiFileAuthState
// } = require('@whiskeysockets/baileys');
// const makeWASocket = require('@whiskeysockets/baileys').default;
// const express = require('express');
// const bodyParser = require('body-parser');
// const qrcode = require('qrcode-terminal');

//#################################################
// import makeWASocket, { DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys";
// import express from "express";
// import bodyParser from "body-parser";
// import qrcode from "qrcode-terminal";

// async function startSock() {
//   const { state, saveCreds } = await useMultiFileAuthState('./auth');
//   const sock = makeWASocket({ auth: state });

//   // QR Code
//   sock.ev.on('connection.update', (update) => {
//     const { connection, lastDisconnect, qr } = update;

//     if (qr) {
//       console.log("📲 Scan QR untuk login WhatsApp:");
//       qrcode.generate(qr, { small: true });
//     }

//     if (connection === 'close') {
//       const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
//       console.log('connection closed, reconnecting ', shouldReconnect);
//       if (shouldReconnect) startSock();
//     } else if (connection === 'open') {
//       console.log('✅ WhatsApp bot connected');
//     }
//   });

//   sock.ev.on('creds.update', saveCreds);

//   // Express API untuk menerima request dari Google Sheet
//   const app = express();
//   app.use(bodyParser.json());

//   app.post('/send', async (req, res) => {
//     const { whatsapp, message } = req.body;

//     if (!whatsapp || !message) {
//       return res.status(400).json({ error: 'nomor WA dan pesan wajib diisi' });
//     }

//     try {
//       const jid = whatsapp.replace(/\D/g, '') + "@s.whatsapp.net";
//       await sock.sendMessage(jid, { text: message });
//       console.log("Pesan terkirim ke", jid);
//       res.json({ success: true });
//     } catch (err) {
//       console.error("Gagal kirim pesan:", err);
//       res.status(500).json({ error: err.message });
//     }
//   });

//   app.listen(3000, () => {
//     console.log("🚀 API berjalan di http://localhost:3000");
//   });
// }

// startSock();

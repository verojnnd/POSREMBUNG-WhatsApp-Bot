const COL_NOMOR_WA = 38;  // Kolom AL (Nomor WA)
const COL_STATUS   = 39;  // Kolom AM (Status)

// Alamat VPS
const API_URL = "http://31.97.110.147:3000/send";

/**
 * Trigger onEdit di Google Sheets
 */
function sendWhatsApp(e) {
  const sheet = e.source.getActiveSheet();
  const range = e.range;

  // Hanya jalankan kalau edit terjadi di kolom Nomor WA
  if (range.getColumn() === COL_NOMOR_WA) {
    const row = range.getRow();
    const nomorWA   = range.getValue();
    const statusCell = sheet.getRange(row, COL_STATUS);
    const status    = statusCell.getValue();

    if (nomorWA && status !== "Terkirim") {
      const dataRow = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

      const nama          = dataRow[1];  // Kolom B
      const rawTanggal    = dataRow[5];  // Kolom F
      // kalau memang berisi tanggal, format ke dd/MM/yyyy
      let tanggal;
      if (rawTanggal instanceof Date) {
        tanggal = Utilities.formatDate(rawTanggal, Session.getScriptTimeZone(), "dd/MM/yyyy");
      } else {
        tanggal = rawTanggal; // kalau ternyata teks biasa, biarkan saja
      }
      let   umur          = dataRow[6];  // Kolom G
      if (typeof umur === "number") umur = umur.toFixed(2);
      const jeniskelamin  = dataRow[2];  // Kolom C
      const statusgizi    = dataRow[10]; // Kolom K
      const statuskek     = dataRow[12]; // Kolom M
      const hb            = dataRow[14]; // Kolom O
      const tekanandarah  = dataRow[18]; // Kolom S
      const aktivitas     = dataRow[21]; // Kolom V
      const anemia        = dataRow[19]; // Kolom T
      const sarapan       = dataRow[29]; // Kolom AD
      const makan         = dataRow[30]; // Kolom AE
      const ttd           = dataRow[28]; // Kolom AC
      const diagnosis     = dataRow[31]; // Kolom AF
      const intervensi    = dataRow[32]; // Kolom AG
      let   kebutuhangizi = dataRow[33]; // Kolom AH
      if (typeof kebutuhangizi === "number") kebutuhangizi = kebutuhangizi.toFixed(2);
      const monev         = dataRow[35]; // Kolom AJ
      const petugas       = dataRow[36]; // Kolom AK

      const message =
        `🎯 *Aksi Bergizi dengan NutriTeens Pro*\n\n` +
        `Pesan Gizi untuk GenZi\n\n` +

        `Yth.\n` +
        `Kak ${nama} (${jeniskelamin}, ${umur} tahun)\n\n` +
        `Terima kasih sudah melakukan pemeriksaan kesehatan rutin\n\n` +
        `${tanggal}\n` +
        `*HASIL PEMERIKSAAN*\n\n` +
        `💌 *Antropometri*\n` +
        `*Status Gizi:* ${statusgizi}\n` +
        `*Status KEK:* ${statuskek}\n\n` +
        `💌 *Biokimia*\n` +
        `*Keterangan Hb:* ${hb}\n\n` +
        `💌 *Clinis Fisik*\n` +
        `*Keterangan Tekanan Darah:* ${tekanandarah}\n` +
        `*Aktivitas Fisik:* ${aktivitas}\n` +
        `*Tanda Gejala Anemia:* ${anemia}\n\n` +
        `💌 *Dietary History*\n` +
        `*Kebiasaan Sarapan:* ${sarapan}\n` +
        `*Kebiasaan Makan:* ${makan}\n` +
        `*Konsumsi TTD:* ${ttd}\n\n` +
        `🔍 *Diagnosis Gizi:* ${diagnosis}\n\n` +
        `⏳ *Intervensi:* ${intervensi}\n\n` +
        `🔜 *Monev:* ${monev}\n\n` +
        `👩🏻‍💼 *Petugas:* ${petugas}\n\n` +
        `Ayo ‼‼\n` + 
        `🏋🏻Aktivitas fisik -- olahraga @30 menit untuk 5 hari (150 menit/minggu).\n` +
        `⏰Mulai tidur jam <22.00 WIB, tidur malam cukup selama 8 jam.\n` +
        `📱Screentime sehari paling lama 3 jam.\n` +
        `🍱Biasakan makan pagi (sarapan).\n` +
        `🍽Makan sesuai pedoman Isi Piringku.\n` +
        `🩸Untuk remaja putri -- Konsumsi Tablet Tambah Darah (TTD) seminggu 1x 1 tablet.\n\n` +
        `⛔Jangan konsumsi TTD bersamaan dengan minum susu. Jangan minum teh setelah makan. Kurangi konsumsi kopi instant.\n\n` +
        `🥦Contoh makanan pendukung pembentukan hemoglobin (mencegah anemia) : telur ayam, daging ayam, daging sapi, ikan nila, ikan lele, ikan kembung, sayuran hijau bayam, brokoli, kangkung, buncis, pepaya, jeruk, pisang, semangka.\n\n` +
        `☕Contoh makanan penghambat pembentukan hemoglobin : teh, coklat, kopi.\n\n` +
        `Yuk, remaja NutriTeens Pro! Jangan lupa rutin periksa kesehatan, karena generasi emas Indonesia lahir dari jiwa yang sehat dan tubuh yang kuat ✨🇮🇩`;

      try {
        const payload = {
          whatsapp: nomorWA.toString(),
          message: message,
          sheetName: sheet.getName()   // 🔑 Kirim nama sheet juga
        };

        const options = {
          method: "post",
          contentType: "application/json",
          payload: JSON.stringify(payload)
        };

        const res = UrlFetchApp.fetch(API_URL, options);
        if (res.getResponseCode() === 200) {
          statusCell.setValue("Terkirim");
        } else {
          statusCell.setValue("Gagal: HTTP " + res.getResponseCode());
        }
      } catch (err) {
        statusCell.setValue("Error: " + err.message);
      }
    }
  }
}

/**
 * Endpoint WebApp untuk menerima callback dari VPS
 * VPS akan POST { whatsapp, status, sheetName }
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(data.sheetName); // 🔑 Tentukan sheet berdasarkan nama

    if (!sheet) {
      return ContentService.createTextOutput("Error: Sheet not found").setMimeType(ContentService.MimeType.TEXT);
    }

    const values = sheet.getDataRange().getValues();

    for (let i = 1; i < values.length; i++) {
      if (values[i][COL_NOMOR_WA - 1].toString() === data.whatsapp.toString()) {
        sheet.getRange(i + 1, COL_STATUS).setValue(data.status);
        break;
      }
    }

    return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}

import { NextResponse } from "next/server";
import { google } from "googleapis";

const SHEETS = {
  EXPENSES: "Expenses",
  TARGETS: "BudgetTargets",
  PROFILE: "Profile",
};

async function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.SHEET_ID;

  if (!clientEmail || !privateKey || !spreadsheetId) {
    throw new Error("Missing env vars");
  }

  privateKey = privateKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  return { sheets, spreadsheetId };
}

function rowsToObjects(rows) {
  if (!rows || rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map((row, i) => {
    const obj = { _row: i + 1 };
    headers.forEach((h, idx) => {
      obj[h] = row[idx] ?? "";
    });
    return obj;
  });
}

async function getSheetId(sheets, spreadsheetId, title) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = meta.data.sheets.find(s => s.properties.title === title);
  return sheet.properties.sheetId;
}

export async function GET() {
  try {
    const { sheets, spreadsheetId } = await getSheetsClient();

    const res = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: [SHEETS.EXPENSES, SHEETS.TARGETS, SHEETS.PROFILE],
    });

    const [expensesSheet, targetsSheet, profileSheet] = res.data.valueRanges;

    return NextResponse.json({
      expenses: rowsToObjects(expensesSheet.values || []),
      targets:  rowsToObjects(targetsSheet.values  || []),
      profile:  rowsToObjects(profileSheet.values  || []),
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — append a new expense row only
export async function POST(req) {
  try {
    const body = await req.json();
    const { sheets, spreadsheetId } = await getSheetsClient();

    const values = [[
      body.date,
      body.category,
      body.subcategory,
      body.amount,
      body.type,
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: SHEETS.EXPENSES,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT — update an existing row in BudgetTargets or Profile
// Body shape:
//   { sheet: "BudgetTargets", row: 3, values: ["Groceries", 8000, "Needs"] }
//   { sheet: "Profile",       row: 1, values: [29, 1000000, 600000, 400000] }
//   { sheet: "Expenses",      row: 5, values: ["2025-03-01", "Needs", "Groceries", 500, "Expense"] }
export async function PUT(req) {
  try {
    const body = await req.json();
    const { sheet, row, values } = body;

    console.log("[PUT /api/sheets] body:", JSON.stringify(body));

    if (!sheet || row == null || !values) {
      console.log("[PUT /api/sheets] rejected — missing field");
      return NextResponse.json({ error: "Missing sheet, row, or values" }, { status: 400 });
    }

    const { sheets, spreadsheetId } = await getSheetsClient();

    // _row is 1-based index into data rows (row 0 = header).
    // Actual sheet row = _row + 1 (to skip the header).
    const sheetRow = row + 1;
    const range = `${sheet}!A${sheetRow}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { sheet, row } = await req.json();
    const { sheets, spreadsheetId } = await getSheetsClient();
    const sheetId = await getSheetId(sheets, spreadsheetId, sheet);

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: row,
              endIndex: row + 1,
            },
          },
        }],
      },
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
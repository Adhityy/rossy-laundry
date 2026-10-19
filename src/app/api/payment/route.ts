import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { orderId, grossAmount } = await req.json();

    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    if (!serverKey) return NextResponse.json({ error: "Server key missing" }, { status: 500 });

    const authString = Buffer.from(`${serverKey}:`).toString("base64");

    // Bikin ID unik buat Midtrans (ID asli + timestamp)
    // Contoh: RL-261018-1234-171344123
    const uniqueMidtransId = `${orderId}-${Date.now()}`;

    const response = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: uniqueMidtransId,
          gross_amount: Math.round(grossAmount),
        },
        // custom_field1 ini bakal ditangkep sama webhook buat nyari ID asli di database
        custom_field1: orderId,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Midtrans Error:", data);
      return NextResponse.json({ 
        error: data.error_messages ? data.error_messages.join(", ") : "Gagal buat transaksi" 
      }, { status: 500 });
    }

    return NextResponse.json({ token: data.token });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
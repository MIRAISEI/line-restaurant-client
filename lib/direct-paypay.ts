interface PaypayProp {
    orderid: string;
    amount: number;
    description: string;
}
const directPaypay = async ({ orderid, amount, description }: PaypayProp) => {


    try {
        const res = await fetch("/api/paypay/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderid: orderid, amount: amount, description: description }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Create payment failed", data);
            alert(data?.error || "Failed to create payment. See console.");

            return;
        }

        const url = data?.body?.data?.url || data?.body?.data?.link || null;

        if (!url) {
            console.error("No URL in PayPay response", data);
            alert("No payment URL returned by PayPay");
            return;
        }

        // Redirect to PayPay Web Cashier
        window.location.href = url;
    } catch (err: unknown) {
        console.error(err);
    }
}

export default directPaypay
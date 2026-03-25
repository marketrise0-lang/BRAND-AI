import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import fs from "fs";

dotenv.config();

// Initialize Firebase Admin
const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const db = getFirestore(getApp(), firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Neero Payment Initialization
  app.post("/api/payment/neero", async (req, res) => {
    const { amount, currency, customerEmail, planName, userId } = req.body;

    try {
      const neeroApiKey = process.env.NEERO_API_KEY;
      const neeroMerchantId = process.env.NEERO_MERCHANT_ID;

      if (!neeroApiKey || !neeroMerchantId) {
        return res.status(500).json({ error: "Neero configuration missing" });
      }

      const orderId = `${userId}_${Date.now()}`;

      // Create a pending order in Firestore
      await db.collection("orders").doc(orderId).set({
        id: orderId,
        userId: userId,
        amount: amount,
        currency: currency || "XAF",
        paymentStatus: "pending",
        paymentMethod: "mobile money",
        planName: planName,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Example Neero API call (Replace with actual Neero API endpoint)
      const response = await axios.post("https://api.neero.io/v1/payments", {
        merchant_id: neeroMerchantId,
        amount: amount,
        currency: currency || "XAF",
        order_id: orderId,
        description: `Abonnement Pack ${planName}`,
        customer_email: customerEmail,
        callback_url: `${process.env.APP_URL}/api/payment/neero/webhook`,
        return_url: `${process.env.APP_URL}/dashboard?payment=success`,
        cancel_url: `${process.env.APP_URL}/checkout?payment=cancelled`,
      }, {
        headers: {
          'Authorization': `Bearer ${neeroApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      res.json({ paymentUrl: response.data.payment_url });
    } catch (error: any) {
      console.error("Neero Payment Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to initialize Neero payment" });
    }
  });

  // Neero Webhook (Callback)
  app.post("/api/payment/neero/webhook", async (req, res) => {
    const { order_id, status, transaction_id } = req.body;

    try {
      const orderRef = db.collection("orders").doc(order_id);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        return res.status(404).send("Order not found");
      }

      const orderData = orderDoc.data();
      const userId = orderData?.userId;
      const planName = orderData?.planName;

      if (status === "SUCCESS") {
        // Update order status
        await orderRef.update({
          paymentStatus: "paid",
          transactionId: transaction_id,
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Create or update subscription
        const subscriptionId = `sub_${userId}`;
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription

        await db.collection("subscriptions").doc(subscriptionId).set({
          id: subscriptionId,
          userId: userId,
          plan: planName.toLowerCase(),
          status: "active",
          startedAt: FieldValue.serverTimestamp(),
          expiresAt: Timestamp.fromDate(expiresAt),
        });

        // Update user profile role if needed
        await db.collection("users").doc(userId).update({
          role: planName.toLowerCase() === "free" ? "user" : planName.toLowerCase(),
        });

        console.log(`Payment successful for order ${order_id}. User ${userId} upgraded to ${planName}.`);
      } else if (status === "FAILED") {
        await orderRef.update({
          paymentStatus: "failed",
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      res.status(200).send("OK");
    } catch (error: any) {
      console.error("Webhook Error:", error.message);
      res.status(500).send("Internal Server Error");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

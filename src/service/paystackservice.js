import axios from "axios";
import Event from "../models/eventmodel.js";
import dotenv from "dotenv";

dotenv.config();


const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});


export const initializePayment = async (
  email, amount, ticketId, eventId
) => {

  // Prefer explicit server base URL, fallback to legacy var, then localhost
  const serverBaseUrl = process.env.SERVER_BASE_URL || process.env.APP_BASE_URL || "http://localhost:2000/tixhub";
  // Server route is mounted at /tixhub and tickets router path is singular: /ticket
  const callbackUrl = `${serverBaseUrl}/ticket/verify-payment/event/${eventId}/ticket/${ticketId}/callback`;

  const payload = {
    email,
    amount: amount * 100,
    callback_url: callbackUrl, 
  };

  // Log the callback URL for diagnostics
  try {
    console.log("Initializing Paystack with callback_url:", callbackUrl);
  } catch {}

  try {
    const response = await paystack.post("/transaction/initialize", payload);
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error("Payment initialization failed");
  }
};


export const verifyPayment = async (reference) => {
  try {
    const response = await paystack.get(`/transaction/verify/${reference}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error("Payment verification failed");
  }
};


  
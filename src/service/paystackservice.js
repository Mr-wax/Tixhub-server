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
  email,amount
) => {

  
  const payload = {
    email,
    amount:amount * 100,
    callback_url: "http://ticketdorm.netlify.app/verify-payment/callback?", 
  };

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


  
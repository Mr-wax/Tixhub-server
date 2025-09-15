import nodemailer from "nodemailer";
import Ticket from "../models/ticketsmodel.js";
import Event from "../models/eventmodel.js";
import {
  initializePayment,
  verifyPayment,
} from "../service/paystackservice.js";
import generateQRCode from "../utils/qrcodegenerator.js";
import createTicketHTML from "../utils/createticketHtml.js";
import generateTicketPDF from "../utils/generateTicketPdf.js";
import generateUniqueCode from "../utils/generatecode.js";
import dotenv from "dotenv";
import { create } from "qrcode";

dotenv.config();

export const buyTicket = async (req, res) => {
  const eventId = req.params.id;
  const {
    eventName,
    eventLocation,
    eventTime,
    eventDate,
    ticketPrice,
    postedBy,
  } = await Event.findById(eventId, {
    eventTime: 1,
    eventName: 1,
    eventLocation: 1,
    eventDate: 1,
    ticketPrice: 1,
    postedBy: 1,
  });

  if (
    !eventName ||
    !eventLocation ||
    !eventTime ||
    !eventDate ||
    !ticketPrice ||
    !postedBy
  ) {
    return res.status(404).json({ message: "Event ticket not found" });
  }

  const { event, buyer, email, phoneNumber } = req.body;

  try {
    let qrCodeBuffer;
    const type = "General Admission";
    const uniqueCode = generateUniqueCode();

    const eventDetails = {
      event: eventName,
      date: eventDate,
      location: eventLocation,
      buyer,
      time: eventTime,
      ticketType: type,
      orderNumber: uniqueCode,
    };
    console.log(eventDetails);

    const newTicket = new Ticket({
      postedBy,
      event: eventName,
      buyer,
      email,
      phoneNumber,
      date: eventDate,
      time: eventTime,
      location: eventLocation,
      ticketType: type,
      orderNumber: uniqueCode,
      eventDetails: eventDetails,
      eventId: eventId,
    });

    await newTicket.save();

    console.log(newTicket);

    // Initialize payment with ticket and event IDs
    const paymentResponse = await initializePayment(email, ticketPrice, newTicket._id, eventId);

    res.status(200).json({
      success: newTicket,
      authorization_url: paymentResponse.data.authorization_url,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    console.error("Error generating QR code:", error);
    res.status(500).json({ error: error.message });
  }
};

export const handleCallback = async (req, res) => {
  const reference = req.query.reference;

  let qrCodeBuffer;
  try {
    if (!reference) {
      console.error("Missing reference in Paystack callback query params");
      return res.status(400).json({ message: "Missing payment reference" });
    }

    const verification = await verifyPayment(reference);

    console.log("Paystack verification payload:", {
      topLevelStatus: verification?.status,
      txStatus: verification?.data?.status,
      reference,
    });
    if (verification) {
      const topLevelStatus = verification.status === true;
      const txStatus = verification.data?.status;

      const { ticketId, eventId } = req.params;
      const ticket = await Ticket.findById(ticketId);

      const event = await Event.findById(eventId, {
        eventLocation: 1,
      });

      if (!event) {
        console.error("Event not found with id:", eventId);
        return res.status(404).json({ message: "Event not found" });
      }
      if (!topLevelStatus || txStatus !== "success") {
        return res.status(400).json({ message: "Payment not successful" });
      }
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      qrCodeBuffer = await generateQRCode(`${ticket.buyer}`, `${ticket.event}`);

      const eventDetails = {
        event: ticket.event,
        date: ticket.date,
        location: event.eventLocation,
        buyer: ticket.buyer,
        time: ticket.time,
        ticketType: ticket.ticketType,
        orderNumber: ticket.orderNumber,
      };
      const ticketHTML = createTicketHTML(
        ticket.event,
        eventDetails.buyer,
        eventDetails.orderNumber
      );
      const pdfBytes = await generateTicketPDF(eventDetails, qrCodeBuffer);

      const mailOptions = {
        from: {
          name: "Tixhub",
          address: process.env.EMAIL_USER,
        },
        to: ticket.email,
        subject: "e-Ticket",
        html: ticketHTML,
        attachments: [
          {
            filename: "ticket.pdf",
            content: Buffer.from(pdfBytes),
            contentType: "application/pdf",
          },
        ],
      };

      const info = await transporter.sendMail(mailOptions);

      console.log("Email sent successfully:", info.response);
      console.log("Email details:", {
        to: ticket.email,
        subject: "e-Ticket",
        messageId: info.messageId
      });
      
      res.status(200).json({
        success: info.response,
        ticket,
        verification,
        emailSent: true,
        messageId: info.messageId
      });
    } else {
      console.error("Unexpected verification structure:", verification);
      res.status(500).json({ error: "Unexpected response structure" });
    }
  } catch (error) {
    console.error("Error in handleCallback:", error);
    
    // Check if it's an email-related error
    if (error.message.includes('email') || error.message.includes('smtp') || error.message.includes('auth')) {
      console.error("Email service error:", error.message);
      res.status(500).json({ 
        error: "Email service error", 
        details: error.message,
        emailSent: false 
      });
    } else {
      res.status(500).json({ 
        error: error.message,
        emailSent: false 
      });
    }
  }
};

export const freeTicket = async (req, res) => {
  const eventId = req.params.id;
  const { eventName, eventLocation, eventTime, eventDate, postedBy } =
    await Event.findById(eventId, {
      eventTime: 1,
      eventName: 1,
      eventLocation: 1,
      eventDate: 1,
      postedBy: 1,
    });

  if (!eventName || !eventLocation || !eventTime || !eventDate || !postedBy) {
    return res.status(404).json({ message: "Event ticket not found" });
  }

  const { buyer, email, phoneNumber } = req.body;
  try {
    let qrCodeBuffer;
    const type = "Free Admisssion";
    const uniqueCode = generateUniqueCode();
    qrCodeBuffer = await generateQRCode(`${buyer}`, `${eventName}`);

    const eventDetails = {
      event: eventName,
      date: eventDate,
      location: eventLocation,
      buyer,
      time: eventTime,
      ticketType: type,
      orderNumber: uniqueCode,
    };
    console.log(eventDetails);

    const newTicket = new Ticket({
      postedBy,
      event: eventName,
      buyer,
      email,
      phoneNumber,
      date: eventDate,
      time: eventTime,
      location: eventLocation,
      ticketType: type,
      orderNumber: uniqueCode,
      eventDetails: eventDetails,
      eventId: eventId,
    });

    await newTicket.save();

    console.log(newTicket);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const ticketHTML = createTicketHTML(
      eventName,
      buyer,
      eventDetails.orderNumber
    );

    const pdfBytes = await generateTicketPDF(eventDetails, qrCodeBuffer);
    const mailOptions = {
      from: {
        name: "Tixhub",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: "e-Ticket",
      html: ticketHTML,
      attachments: [
        {
          filename: "ticket.pdf",
          content: Buffer.from(pdfBytes),
          contentType: "application/pdf",
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Free ticket email sent successfully:", info.response);
    console.log("Email details:", {
      to: email,
      subject: "e-Ticket",
      messageId: info.messageId
    });
    
    res.status(200).json({
      success: info.response,
      newTicket,
      emailSent: true,
      messageId: info.messageId
    });
  } catch (error) {
    console.error("Error in freeTicket:", error);
    
    // Check if it's an email-related error
    if (error.message.includes('email') || error.message.includes('smtp') || error.message.includes('auth')) {
      console.error("Email service error:", error.message);
      res.status(500).json({ 
        error: "Email service error", 
        details: error.message,
        emailSent: false 
      });
    } else {
      res.status(500).json({ 
        error: error.message,
        emailSent: false 
      });
    }
  }
};

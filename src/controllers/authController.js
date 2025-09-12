import cryptoHash from "crypto";
import User from "../models/usermodel.js";
import {
  signUpValidator,
  signInValidator,
} from "../validation/authValidation.js";
import { formatZodError } from "../utils/errorMessage.js";
import generateTokenAndSetCookie from "../utils/generateTokenAndSetCookie.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

function hashValue(value) {
  const hash = cryptoHash.createHash("sha256");
  hash.update(value);
  return hash.digest("hex");
}

function comparePasswords(inputPassword, hashedPassword) {
  return hashValue(inputPassword) === hashedPassword;
}

function generateOTP() {
  let otp = "";
  for (let i = 0; i < 4; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
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

// Generic mail sender for this controller
async function sendMail(to, subject, html) {
  const mailOptions = {
    from: {
      name: "Tixhub",
      address: process.env.EMAIL_USER,
    },
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

const sendNewMail = async (email, firstname, res) => {
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
  const mailOptions = {
    from: {
      name: "Tixhub",
      address: process.env.EMAIL_USER,
    },
    to: email,
    subject: "e-Ticket",
    text: `Welcome to Tixhub.`,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border-radius: 10px; background-color: #f4f4f4;">
  
  <!-- Header -->
  <div style="text-align: center; background: linear-gradient(135deg, #007bff, #0056b3); padding: 20px; border-radius: 10px 10px 0 0;">
    <h2 style="color: #fff; margin: 0; font-size: 24px;">Welcome to <span style="color: #ffd700;">Tixhub</span> 🎟️</h2>
  </div>
  
  <!-- Body -->
  <div style="padding: 20px; background-color: #fff; border-radius: 0 0 10px 10px; text-align: center;">
    <p style="font-size: 16px; color: #333;">Thank you for signing up ${firstname}! Now you can access exciting events.</p>

    <br/>
    <p style="font-size: 14px; color: #777;">Best regards,</p>
    <p style="font-size: 16px; font-weight: bold; color: #007bff;">Tixhub Team</p>

    <!-- Footer -->
    <div style="margin-top: 20px; font-size: 12px; color: #aaa; text-align: center;">
      <p>&copy; 2025 Tixhub. All rights reserved.</p>
    </div>
  </div>
</div>
 `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Email sent: " + info.response, mailOptions);
  //   res.status(200).json({message: 'User registered succesfully',newUser})
};

export const signUp = async (req, res) => {
  const registerResults = signUpValidator.safeParse(req.body);
  if (!registerResults) {
    return res.status(400).json(formatZodError(registerResults.error.issues));
  }
  try {
    const { email } = req.body;
    const user = await User.findOne({ $or: [{ email }] });
    if (user) {
      res.status(409).json({ messaage: "User already exists", user});
    } else {
      const { firstname, lastname, password, confirmPassword, email } =
        req.body;

      if (password !== confirmPassword) {
        return res
          .status(403)
          .json({ message: "Password and confirmPassword do not match" });
      }
      const encryption = hashValue(password);
      const otp = generateOTP();
      const otpExpiry = Date.now() + 10 * 60 * 1000;

      const newUser = new User({
        firstname,
        lastname,
        password: encryption,
        email,
        isVerified: false,
        otp,
        otpExpiry,
      });

     
      await newUser.save();
    
         res.status(200).json({ message: "User saved successfully", newUser });
      console.log("User saved succesfully", newUser);

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

      const mailOptions = {
        from: {
          name: "Tixhub",
          address: process.env.EMAIL_USER,
        },
        to: email,
        subject: "e-Ticket",
        text: `Your OTP for two-step verification is ${otp}. It will expire in 1 hour.`,
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border-radius: 10px; background-color: #f4f4f4;">
  
  <!-- Header -->
  <div style="text-align: center; background: linear-gradient(135deg, #007bff, #0056b3); padding: 20px; border-radius: 10px 10px 0 0;">
    <h2 style="color: #fff; margin: 0; font-size: 24px;">Welcome to <span style="color: #ffd700;">Tixhub</span> 🎟️</h2>
  </div>
  
  <!-- Body -->
  <div style="padding: 20px; background-color: #fff; border-radius: 0 0 10px 10px; text-align: center;">
    <p style="font-size: 16px; color: #333;">Thank you for signing up! Use the OTP below to verify your email and access exciting events.</p>

    <!-- OTP Box -->
    <div style="font-size: 26px; font-weight: bold; color: #007bff; background-color: #f8f9fa; padding: 15px; border-radius: 8px; display: inline-block; margin: 20px auto; border: 2px dashed #007bff;">
      ${otp}
    </div>

    <p style="font-size: 14px; color: #555;">This OTP is valid for <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>

    <br/>
    <p style="font-size: 14px; color: #777;">Best regards,</p>
    <p style="font-size: 16px; font-weight: bold; color: #007bff;">Tixhub Team</p>

    <!-- Footer -->
    <div style="margin-top: 20px; font-size: 12px; color: #aaa; text-align: center;">
      <p>&copy; 2025 Tixhub. All rights reserved.</p>
    </div>
  </div>
</div>
 `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent: " + info.response, mailOptions);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log("INTERNAL SERVER ERROR", error.message);
    console.error("Error sending email:", error);
  }
};

export const verifyOtp = async (req, res) => {
  const { email } = req.body;
  const provided = req.body.otp ?? req.body.token ?? req.body.code;
  try {
    if (!email || provided === undefined || provided === null) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const submittedOtp = String(provided).trim();
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Invalid or expired OTP" });
    }

    const storedOtp = user.otp ? String(user.otp).trim() : null;
    const isExpired = user.otpExpiry < Date.now();

    if (!storedOtp || submittedOtp !== storedOtp || isExpired) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const accessToken = generateTokenAndSetCookie(user._id, res);

    sendNewMail(user.email, user.firstname);
    res.status(200).json({ message: "OTP verified successfully.", accessToken, user });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPasswordMail = async (req, res) => {
  const { Id }= req.params;
  const userId = await User.findById(Id,{_id:1});

 

  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

     const resetURL = `https://ticketdorm.netlify.app/reset-password/${user._id}`;
    if (!user) {
      const response = {
        statusCode: 404,
        message: "User not found",
      };
      res.status(404).json(response);
    }
    const mailOptions = {
      from: {
        name: "Tixhub",
        address: process.env.EMAIL_USER,
      },
      to: user.email,
      subject: "Account password reset",
      text: `Password Reset`,
      html: ` <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border-radius: 10px; background-color: #f4f4f4;">
        <div style="text-align: center; background: linear-gradient(135deg, #007bff, #0056b3); padding: 20px; border-radius: 10px 10px 0 0;">
          <h2 style="color: #fff; margin: 0;">Password Reset Request</h2>
        </div>
        <div style="padding: 20px; background-color: #fff; border-radius: 0 0 10px 10px; text-align: center;">
          <p style="font-size: 16px; color: #333;">You requested a password reset. Use the OTP below to reset your password.</p>
          <div style="font-size: 26px; font-weight: bold; color: #007bff; background-color: #f8f9fa; padding: 15px; border-radius: 8px; display: inline-block; margin: 20px auto; border: 2px dashed #007bff;">
            ${resetURL}
          </div>
          <p style="font-size: 14px; color: #555;">This OTP is valid for <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>
          <p style="font-size: 14px; color: #777;">Best regards,</p>
          <p style="font-size: 16px; font-weight: bold; color: #007bff;">Tixhub Team</p>
        </div>
      </div>
    `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response, mailOptions);
    return res
      .status(200)
      .json({ message: "Password reset link sent to your email" });
  } catch (error) {
    const response = {
      statusCode: 500,
      message: "Internal server error",
      error: { message: error.message },
    };
    return res.status(500).json(response);
  }
};

export const resetPassword = async (req, res) => {
  const {id}  = req.params;
  const { password } = req.body;
  try {
    const user = await User.findById(id);

    if (!user) {
      const response = {
        statusCode: 404,
        message: "User not found",
      };
      res.status(404).json(response);
    }
    const hashedPassword = hashValue(password);
    user.password = hashedPassword;

    await user.save();

    const response = {
      statusCode: 200,
      message: "password reset successfully",
      data: { user: user },
    };
    return res.status(200).json(response);
  } catch (error) {
    const response = {
      statusCode: 500,
      message: "Internal server error",
      error: { message: error.message },
    };
    return res.status(500).json(response);
  }
};

export const signIn = async (req, res, next) => {
  const loginResults = signInValidator.safeParse(req.body);
  if (!loginResults) {
    return res.status(400).json(formatZodError(loginResults.error.issues));
  }
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User with email not found" });
    }
    const comparePass = comparePasswords(password, user.password);
    if (!comparePass) {
      return res.status(400).json({ message: "Password is incorrect" });
    }
    const accessToken = generateTokenAndSetCookie(user._id, res);

    res.status(200).json({ message: "User Login successful", accessToken,user });
    console.log("User Login successful", accessToken);
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log("INTERNAL SERVER ERROR", error.message);
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists and is not already verified
    const user = await User.findOne({ email });
    if (!user || user.isVerified) {
      return res.status(400).json({ message: "User not found or already verified" });
    }

    // Generate new 4-digit OTP
    const newOTP = Math.floor(1000 + Math.random() * 9000).toString();
    user.otp = newOTP;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    // Styled HTML template for the OTP email
    const otpEmailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border-radius: 10px; background-color: #f4f4f4;">
        
        <!-- Header -->
        <div style="text-align: center; background: linear-gradient(135deg, #007bff, #0056b3); padding: 20px; border-radius: 10px 10px 0 0;">
          <h2 style="color: #fff; margin: 0; font-size: 24px;">Tixhub - OTP Resend 🎟️</h2>
        </div>

        <!-- Body -->
        <div style="padding: 20px; background-color: #fff; border-radius: 0 0 10px 10px; text-align: center;">
          <p style="font-size: 16px; color: #333;">Here is your new OTP to verify your email:</p>

          <!-- OTP Box -->
          <div style="font-size: 26px; font-weight: bold; color: #007bff; background-color: #f8f9fa; padding: 15px; border-radius: 8px; display: inline-block; margin: 20px auto; border: 2px solid #007bff;">
            ${newOTP}
          </div>

          <p style="font-size: 14px; color: #555;">This OTP is valid for <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>

          <br/>
          <p style="font-size: 14px; color: #777;">Best regards,</p>
          <p style="font-size: 16px; font-weight: bold; color: #007bff;">Tixhub Team</p>

          <!-- Footer -->
          <div style="margin-top: 20px; font-size: 12px; color: #aaa; text-align: center;">
            <p>&copy; 2025 Tixhub. All rights reserved.</p>
          </div>
        </div>
      </div>
    `;

    // Send the OTP via email with the styled template
    await sendMail(email, "Resend OTP", otpEmailTemplate);

    res.status(200).json({ message: "A new OTP has been sent to your email." });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res, next) => {
  try {
    res.clearCookie("jwt");

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
    console.error("INTERNAL SERVER ERROR", error.message);
  }
};

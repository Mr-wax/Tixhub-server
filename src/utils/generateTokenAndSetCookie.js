import jwt from "jsonwebtoken";

const generateTokenAndSetCookie = (userId, res) => {
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1d" });
  
	res.cookie("jwt", token, {
	  httpOnly: true,
	  secure: process.env.NODE_ENV === "production",
	  sameSite: "strict",
	  maxAge: 24 * 60 * 60 * 1000, // 1 day
	});
  
	return token;
  };
  
export default generateTokenAndSetCookie;

import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  //   const token = req.headers.authorization;
  //   if (!token) {
  //     return res.status(401).json({
  //       success: false,
  //       message: "Unauthorized",
  //     });
  //   }
  //   next();
  try {
    const token =
      req.cokkies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return new ApiError(401, "Unauthorized");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      // NEXT: Discuss About Frontend
      return new ApiError(401, "Invalid Access Token");
    }
    req.user = user;
    next();
  } catch (error) {
    return new ApiError(401, error?.message || "Invalid Access Token");
  }
});

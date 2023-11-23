import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOncloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // 1 - Get user Details from Front-End (user Model se lai lainge)

  const { fullName, email, username, password } = req.body;
  console.log("email:", email, "fullName:", fullName);

  // 2 - validation on Every Point - Not Empty check kre

  // if (fullName === "") {
  //   throw new ApiError(400, "Full Name is Required");
  // }

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // 3 - Check if User alredy have Account/Register kisi bhi field se chek kre yaha (Username,Email)

  const existedUsr = User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUsr) throw new ApiError(409, "User existed");

  // 4 - Chek kre files hai ki nhi jaise Avatar

  const avatarLoacalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLoacalPath) throw new ApiError(400, "Avatar is required");

  // 5 - Upload them on Cloudinary wha response se URL nikalo

  const avatar = await uploadOncloudinary(avatarLoacalPath);
  const coverImage = await uploadOncloudinary(coverImageLocalPath);

  // 6 - Chek avatar on Cloudinary pr shi se uplaod hua ki nahi

  if (!avatar) throw new ApiError(400, "Avatar is required");

  // 7 - Create User Object (MongoDB ke Liye) Create Entry In DB

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  // 8 - Remove Password and refresh Token feed from response
  const createdUser = await User.findById(user._id).select(
    "-password -refereshToken"
  );
  // 9 - Check for User Creation
  if (!createdUser)
    throw new ApiError(500, "Something went wrong while registering the user");

  // 10 - Return Response

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Succesfully"));
});

export { registerUser };

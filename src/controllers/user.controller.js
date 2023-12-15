import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOncloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const genrateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Internal Server Error while generating access and referesh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // 1 - Get user Details from Front-End (user Model se lai lainge)

  const { fullName, email, username, password } = req.body;
  // console.log("email:", email, "fullName:", fullName);

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

  const existedUsr = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUsr) throw new ApiError(409, "User existed");
  // console.log(req.files);
  // 4 - Chek kre files hai ki nhi jaise Avatar

  const avatarLoacalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
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

const loginUser = asyncHandler(async (req, res) => {
  // req body=>data,

  const { email, username, password } = req.body;

  // username or email
  if (!(username || email)) {
    throw new ApiError(400, "Username or Email is required");
  }
  // find the user
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(400, "Invalid Credentials");
  }
  // password check

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid  Pasword Credentials");
  }
  // access and reference token
  const { accessToken, refreshToken } = await genrateAccessAndRefereshTokens(
    user._id
  );
  // send secure cookies

  const loggedInUser = await User.findById(user._id).select(
    "-password refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Succesfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Succesfully"));
});

export { registerUser, loginUser, logoutUser };

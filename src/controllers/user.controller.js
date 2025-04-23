import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user data from frontend
  // validate user data - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token filed from response
  // check for user creation
  // return res

  const { fullName, email, username, password } = req.body;
  // console.log("full name ", fullName);
  // console.log("email ", email);
  // console.log("username ", username);
  // console.log("password ", password);

  // if (fullName === "") {
  //   throw new ApiError(400, "Full name is required");
  // }
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "Username or email already exists");
  }
  // console.log("Request files: ",req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path; // This avatar is present in the local file system not on the cloudinary
  // const coverImageLocalPath = req.files?.coverImage[0]?.path; // This coverImage is present in the local file system not on the cloudinary

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath); // This function will upload the avatar to the cloudinary and return the cloudinary url
  const coverImage = await uploadOnCloudinary(coverImageLocalPath); // This function will upload the coverImage to the cloudinary and return the cloudinary url

  if (!avatar) {
    throw new ApiError(400, "Avatar upload failed");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // in new version of mongoose, it is now not accepting the findById method without a callback function
  // const createdUser = await User.findById(user._id, (err, user) => {}).select(
  //   "-password -refreshToken"
  // );

  const createdUser = await User.findById(user._id)
    .select("-password -refreshToken")
    .exec(); // You can use .exec() to explicitly execute the query if you want

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  // return res
  //   .status(201)
  //   .json(
  //     new ApiResponse(
  //       200,
  //       { user: createdUser },
  //       "User registered successfully"
  //     ).json()
  //   );

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        { user: createdUser },
        "User registered successfully"
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  // get user data from frontend -- req.body --> data
  // username or email based on which user is trying to login
  // check if user exists
  // check if password is correct
  // generate access token and refresh token
  // send cookie

  const { username, email, password } = req.body;

  if (!usename || !email) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    // or is the mongoDB operator for finding documents with either username or email
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
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
        "User logged in Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(
    req.user._id,
    {
      $unset: {
        // refreshToken: 1, // remove refreshToken from user document
        refreshToken: undefined,
      },
    },
    {
      new: true, // return updated document instead of the original
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
    .json(new ApiResponse(200, {}, "User logged Out"));
});

export { registerUser, loginUser, logoutUser };

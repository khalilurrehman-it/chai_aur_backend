import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user data from frontend ✔
  // validate user data - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token filed from response
  // check for user creation
  // return res

  const { fullName, email, username, password } = req.body;
  console.log("full name ", fullName);
  console.log("email ", email);
  console.log("username ", username);
  console.log("password ", password);

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
  const coverImageLocalPath = req.files?.coverImage[0]?.path; // This coverImage is present in the local file system not on the cloudinary

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

  const createdUser = await User.findById(user._id, (err, user) => {}).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        { user: createdUser },
        "User registered successfully"
      ).json()
    );
});

export { registerUser };

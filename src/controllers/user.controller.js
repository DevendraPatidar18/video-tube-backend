import {asyncHandler} from "../utils/async_handler.js"
import { HandleError } from "../utils/handle_errors.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudnary } from "../utils/cloudinary.js"
import { HandleResponse } from "../utils/handle_response.js"
import jwt from "jsonwebtoken"


const generateAccessAndRefereshToken = async(userId)=>{
    
    try {
        const user = await User.findById(userId)  
        const accessToken =  user.generateAccessToken()
        const refreshToken =  user.generateRefreshToken()

        user.refreshToken = refreshToken
        user.save({validateBeforeSave: false})

        return {accessToken ,refreshToken}
        
    } catch (error) {
        throw new HandleError(500,"token generation faild")
    }
}



const registerUser = asyncHandler(async (req, res) => {
    // get user detail form fontend 
    // validate user deatils
    // ckeck user is aleady exist or not: username ,email
    // check for image, check for avatar 
    // upload image on cloudinary,avatar
    // create user object - create entry in db
    // remove password and refresh token field from  response
    // check for user creation
    // return res

    const {fullName, email, username, password} = req.body
    console.log('email:',email);

    if([fullName, email, username,password].some((field)  => field?.trim === ""))
    {
        throw new HandleError(400, "All field are required")
    }

    const existedUser = await User.findOne(
        {
            $or: [{username},{email}]
        }
    )
    if(existedUser) {
        throw new HandleError(409, "User with email or username already exist")
    }
    
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new HandleError(400,"Avatar is required")
    }

    const avatar = await uploadOnCloudnary(avatarLocalPath)
    const coverImage = await uploadOnCloudnary(coverImageLocalPath)

    if(!avatar){
        throw new HandleError(400,"Avatart file is required")
    }
    

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -__v"
    )

    if(!createdUser){
        throw new HandleError(500,"Somthing went wrong while registering user")
    }

    return res.status(201).json(
        new HandleResponse(200, createdUser,"user created successfully")
    )
})

const loginUser = asyncHandler(async (req, res,) => {
    // get users deatail
    // find user by username or email
    // check password
    // generate access and refresh token
    // send tokens to user 

    const {username, email, password}  = req.body

    if(!(username || email )){
        throw new HandleError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new HandleError(400,"user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new HandleError(401, "Invalid Password")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefereshToken(user._id)

    const loggedInUser  =  await User.findById(user._id).
    select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.
    status(200).
    cookie("accessToken", accessToken, options).
    cookie("refreshToken", refreshToken, options).
    json(
        new HandleResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "user logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new HandleResponse(200, {},"User logged out"))
})

const refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new HandleError(401, "Refresh token is required")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new HandleError(401, "Invalid token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new HandleError(401, "refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure:true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new HandleResponse(
                200,
                {
                    accessToken: accessToken,
                    refreshToken: newRefreshToken
                },
                "access token refreshed"
    
            )
        )
    } catch (error) {
        throw new HandleError(401, error?.message || "invalid refresh token");
        
    }
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}
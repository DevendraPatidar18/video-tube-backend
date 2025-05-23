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
        console.log(`refreshToken ${refreshToken}`);
        

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
        return res.status(400).json(new HandleError(400,{},"All field are required"))
    }

    const existedUser = await User.findOne(
        {
            $or: [{username},{email}]
        }
    )
    if(existedUser) {
        return res.status(409).json(new HandleError(400,{},"User with email or username already exist"))
        
    }
    
    const avatarLocalPath = req.files?.avatar?.[0]?.path || null
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path || null
    console.log(avatarLocalPath);
    console.log(coverImageLocalPath);
    
    
    

    if(!avatarLocalPath){
        return res.status(400).json( new HandleError(400,{},"Avatar is required"))
    }
    let coverImage = null;
    const avatar = await uploadOnCloudnary(avatarLocalPath)
    if(coverImageLocalPath){
        const coverImage = await uploadOnCloudnary(coverImageLocalPath)
    }
    
    
    

    if(!avatar){
        return res.status(400).json(new HandleError(400,{},"Avatar file is required"))
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
        return res.status(500).json(new HandleError(500,{},"Somthing went wrong while registering user"))
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
        //throw new HandleError(400, "username or email is required")
        return res.status(400).json(new HandleError(400,{},"username or email is required"))
    }

    const user = await User.findOne({
        $or: [{username: username},{email: email}]
    })

    if(!user){
        //throw new HandleError(400,"user does not exist")
        return res.status(400).json(new HandleError(400,{},"user does not exist"))
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        //throw new HandleError(401, "Invalid Password")
        return res.status(401).json(new HandleError(401,{},"Invalid password"))
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
        req.use._id,
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
    
        const {accessToken, refreshToken} = await generateAccessAndRefereshToken(user._id)
        console.log(accessToken);
        console.log(refreshToken);
        
        
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new HandleResponse(
                200,
                {
                    accessToken: accessToken,
                    refreshToken: refreshToken
                },
                "access token refreshed"
    
            )
        )
    } catch (error) {
        throw new HandleError(401, error?.message || "invalid refresh token");
        
    }
})

const getUser = asyncHandler( async (req, res) => {
    //get user from middleware
    const user = await User.findById(req.user._id)

    if(!user){
        return res.status(401).json(new HandleError(401,{},"invalid Token"));
    }
    
    const userData = await User.findById(user._id).select(
        "-password -refreshToken -__v"
    )

    if(!userData){
        return res.status(500).json( new HandleError(500,{},"Somthing went wrong while geting user data"))
    }

    return res.status(200).json( 
        new HandleResponse(
            200,
            userData,
            "user Fatched successfully"

        )
    )
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getUser
}
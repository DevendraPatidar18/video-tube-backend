import {asyncHandler} from "../utils/async_handler.js"
import { HandleError } from "../utils/handle_errors.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudnary } from "../utils/cloudinary.js"
import { HandleResponse } from "../utils/handle_response.js"



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
    const coverImageLocalPath = req.files?.avatar[0]?.path

    if(!avatarLocalPath){
        throw new HandleError(400,"Avatar is required")
    }

    const avatar = await uploadOnCloudnary(avatarLocalPath)
    const coverImage = await uploadOnCloudnary(coverImageLocalPath)

    if(!avatar){
        throw new HandleError(400,"Avatart file is required")
    }
    
    fs.unlinkSync(avatarLocalPath)

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

export {registerUser}
import { asyncHandler } from "../utils/async_handler.js"
import { HandleError } from "../utils/handle_errors.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"


export const verifyJWT = asyncHandler(async (req ,res, next) => {
    try {
        const token =  req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if(!token){
            throw new HandleError(401, "Unauthorized request");
        }
    
        const verifyedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(verifyedToken._id)
        .select("-password -refreshToken")
    
        if(!user){
            throw new HandleError(401, "Invalid access token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new HandleError(401 ,"error?.message" || "Invalid access token")
        
    }
    
})
import { asyncHandler } from "../utils/async_handler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudnary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { HandleError } from "../utils/handle_errors.js";
import { HandleResponse } from "../utils/handle_response.js";


const uploadVideo = asyncHandler(async (req, res) => {
    const {title, description, duration,views} = req.body

    if([title, description,].some((field)  => field?.trim === ""))
        {
            return res.status(400).json(new HandleError(400,{},"All field are required"))
        }
        const owner  = await User.findById(req.user._id)

        if(!owner){
            return res.status(400).json(new HandleError(400,{},"Unothorized Request"))
        }

        const videoOwner =  await User.findById(owner._id).select(
            "-password -__v,"
        )
        
        const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path || null
        const videoLocalPath = req.files?.video?.[0]?.path || null
        const d  = req.files?.video?.[0]?.duration

        if(!thumbnailLocalPath){
            return res.status(400).json( new HandleError(400,{},"thumbnail is required"))
        }
        if(!videoLocalPath){
            return res.status(400).json( new HandleError(400,{},"video file is required"))
        }

        const thumbnail = await uploadOnCloudnary(thumbnailLocalPath);
        const video = await uploadOnCloudnary(videoLocalPath);
        const videoDuration = video.duration;
        if(!thumbnail){
            return res.status(500).json(new HandleError(500,{},"Error while uploading thumbnail"))
        }
        if(!video){
            return res.status(500).json(new HandleError(500,{},"Video upload fiald"))
        }
        const uploadedVideo = await Video.create({
            title: title,
            description: description,
            thumbnail: thumbnail.url,
            videoFile: video.url,
            views,
            duration: videoDuration,
            owner: owner,
        })

        if(!uploadedVideo){
            return res.status(500).json(new HandleError(500,{},"Error while uploading video"))
        }
        
        return res.status(200).json(new HandleResponse(200,uploadedVideo,"video uploaded"))
})

export {
    uploadVideo
}
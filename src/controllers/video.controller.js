import { asyncHandler } from "../utils/async_handler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudnary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { HandleError } from "../utils/handle_errors.js";
import { HandleResponse } from "../utils/handle_response.js";


const uploadVideo = asyncHandler(async (req, res) => {
    const { title, description, views, thumbnail, video, duration } = req.body

    if ([title, description, thumbnail, video, duration].some((field) => field?.trim === "")) {
        return res.status(400).json(new HandleError(400, {}, "All field are required"))
    }
    const owner = await User.findById(req.user._id)

    if (!owner) {
        return res.status(400).json(new HandleError(400, {}, "Unothorized Request"))
    }

    const videoOwner = await User.findById(owner._id).select(
        "-password -__v,"
    )

    const uploadedVideo = await Video.create({
        title: title,
        description: description,
        thumbnail: thumbnail,
        videoFile: video,
        views,
        duration: duration,
        owner: owner,
    })

    if (!uploadedVideo) {
        return res.status(500).json(new HandleError(500, {}, "Error while uploading video"))
    }

    return res.status(200).json(new HandleResponse(200, uploadedVideo, "video uploaded"))
})

const getVideos = asyncHandler(async (req, res) => {
    try {
        const lastId = req.query.lastId;
        const limit = 10;
        //const query = lastId?{_id:{ $gt: new ObjectId}}

        const videos = await Video.aggregate([
            ...(lastId ? [{ $match: { _id: { $gt: new mongoose.Types.ObjectId(lastId) } } }]
                : []),
            // Sort and limit
            { $sort: { _id: 1 } },
            { $limit: 10 },

            // Lookup user data from `users` collection
            {
                $lookup: {
                    from: 'users',
                    localField: 'owner',
                    foreignField: '_id',
                    as: 'ownerData'
                }
            },
            {
                $project:{
                    id_ : 1,
                    title : 1,
                    thumbnail : 1,
                    videoFile : 1,
                    views : 1,
                    owner : 1,
                    "ownerData._id" : 1,
                    "ownerData._name" : 1,
                    "ownerData.username" : 1,
                    "ownerData.avatar" : 1,
                    "ownerData.subscribers" :1

                }
            },
            

            // Unwind the array to make it a single object
            { $unwind: '$ownerData' }
        ])


        res.json(videos);
    } catch (e) {
        res.status(500).json({ "error": e.message })
    }
});

export {
    uploadVideo,
    getVideos
}
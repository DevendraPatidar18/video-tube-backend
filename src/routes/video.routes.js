import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getVideos, uploadVideo } from "../controllers/video.controller.js";

const videoRouter = Router()

videoRouter.route("/uploade-video").post(
    upload.fields([
            {
                name: "thumbnail",
                maxCount: 1
            },
            {
                name: "video",
                maxCount: 1
            }
        ])
    ,verifyJWT,
    uploadVideo
)

videoRouter.route("/get-videos").get(getVideos);

export {videoRouter}
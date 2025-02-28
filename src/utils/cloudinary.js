import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

// Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });


    const uploadOnCloudnary = async (localFilePath) => {
        if(!localFilePath) return console.log("Local File is Null")
        // Upload an image
        const uploadedFile = await cloudinary
        .uploader
        .upload(localFilePath,
            {
                resource_type: "auto"
            }
        )
        //file has been uploaded successfuly
        console.log("file is uploaded on cloudinary",uploadedFile.url)
        return uploadedFile
        
        .catch((error) => {
            //Remove the temparay uploaded file on the server
            fs.unlinkSync(localFilePath) 
           return null
       });
    }
      
    export {uploadOnCloudnary}

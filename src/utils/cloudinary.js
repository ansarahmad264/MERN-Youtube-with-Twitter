import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePatch,{
            recource_type: "auto"
        })
        //file has been uploaded siccesfully
        console.log("File has been sucessfully Uploaded", response.url)
        return response;
    }catch(error){
        fs.unlinkSync(localFilePath)
        return null;
    }
}

export {upoadOnCloudinary}
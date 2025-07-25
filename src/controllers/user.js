import {asyncHandler} from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.js'
import{uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from "jsonwebtoken"
import mongoose from 'mongoose'

const registerUser = asyncHandler( async(req,res) => {
    //get user details from frontend
    //validate user details - not empty
    //check if user already exist
    //check for images and avatar
    //create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res

    const {fullName, email, password, username } = req.body
    console.log("email:", email)
    
    //method_01 - we can check each field one by one
    if(username == ""){
        throw new console.error("username must not be empty", 400);
    }

    //method_02 - we can check all fields together using the some function
    if(
        [fullName, email, password, username].some((fields) => {
            fields?.trim() == ""})
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{email}, {username}]
    })

    if(existedUser){
        throw new ApiError(409, "user with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required 1")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required 2")   
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500,"Server was unable to seve user to the Database")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})


// USER LOGIN 
const generateAccessAndRefreshToken = async(userId) => {
    try{
        const user  = await User.findById(userId)
        const accessToken =  user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    }catch(error){
     throw new ApiError(500,"something Went wrong while generating Refresh and Access Token")   
    }
}

const loginUser = asyncHandler( async(req,res) => {
    //req body <- data
    //username or email
    //find user
    //password
    //access and refresh token
    //send cookie

    const {email, password} = req.body;

    if(!email){
        throw new ApiError(400,"email or password cannot be empty")
    }

    const user = await  User.findOne({email})
    if(!user){
        throw new ApiError(404, "This User Doesnot Exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(404,"Invalid User Credentials")
    }

    const {accessToken, refreshToken} =  await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
            user: loggedInUser, accessToken, refreshToken
            },
            "User Logged in Successfully"
        )
    )
})

const logoutUser = asyncHandler( async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User Logged out Successfully")
    )
})

const refreshAccessToken = asyncHandler(async(req,res) => {
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incommingRefreshToken){
        throw new ApiError( 401, "Unathurized request")
    }

    const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user  = await User.findById(decodedToken?._id)

    if(!user){
        throw new ApiError(401, "Invalid Refresh Token")
    }

    if(incommingRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "Refresh Token Expired or used ")
    }

    const {newAccessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)

    options ={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken", newAccessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                accessToken,
                refreshToken: newRefreshToken
            },
            "AccessTokenRefreshed"
        )
    )


})

const changeCurrentPassword = asyncHandler(async(req,res) => {
    const {oldPassword, newPassword} = req.body

    const user = await user.findById(req.user?._id)
    isPasswordCorrect = user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid Old Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password has been Changed Successfully"))
})

const getCurrentUser = asyncHandler(async(req,res) => {
    return res.json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {email, fullName} = req.body
    if(!email || !fullName){
        throw new ApiError(400, "All Fields are Required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "user Account Detials Updated SUccessfully"))
})

const updateUserAvatar = asyncHandler(async(req,res) => {
   const avatarLocalPath = req.file?.path
   if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is missing")
   } 

   const avatar = uploadOnCloudinary(avatarLocalPath)
   if(!avatar.url){
    throw new ApiError(400,"Error while uploading the file")
   }

   const user = await User.findByIdAndUpdate(
    req.user._id,
    {
        $set: {
            avatar: avatar.url
        }
    },
    {new: true}
   ).select("-password")

   return res
    .status(200)
    .json(new ApiResponse(200,user,"User Avatar Updated Successfully"))
})

const updateUserCoverImage = asyncHandler(async(req,res) => {
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
     throw new ApiError(400, "coverImage file is missing")
    } 
 
    const coverImage = uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
     throw new ApiError(400,"Error while uploading the file")
    }
 
    const user = await User.findByIdAndUpdate(
     req.user._id,
     {
         $set: {
             coverImage: coverImage.url
         }
     },
     {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"User Cover Image Updated Successfully"))
 })

const getUserChannelProfile = asyncHandler(async (req,res) => {
    const {username} = req.params
    if(!username?.trim()){
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggreagate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from:"subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from:"subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount:{
                    $size: "$subscribers"
                },
                channelSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond: {
                        if:{$in:[req.user?._id, "$subscribers.subscribers"]}
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelSubscribedToCount:1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email:1,
            }
        }

    ])

    if(!channel?.length){
        throw new ApoError(404, "Channel doesnot exists")
    }

    return res.
    status(200)
    .ApiResponse(200, channel[0], "user Channel fetched Sucessfully")
})

const getWatchHistory = asyncHandler(async (req,res) =>{
    const user = await user.aggreagate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField:"watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project:{
                                        fullName:1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory,"watch History fetched Successfully"))
})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}
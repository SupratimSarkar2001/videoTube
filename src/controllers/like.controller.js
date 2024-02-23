import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
 const { videoId } = req.params

 if (!isValidObjectId(videoId)) {
  throw new ApiError(400, "Invalid video id")
 }

 const like = await Like.findOne({ video: videoId, likedBy: req.user._id })

 if (like) {
  await Like.findByIdAndDelete(like._id);
  
  return res.
   status(200).
   json(new ApiResponse(200, {}, "Like Removed successfully"))
 }

 const newLike = await Like.create({
  video: videoId,
  likedBy: req.user._id
 })
 return res.
  status(200).
  json(new ApiResponse(200, newLike, "Like created successfully"))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
 const { commentId } = req.params
 
 if (!isValidObjectId(commentId)) {
  throw new ApiError(400, "Invalid comment id")
 }

 const like = await Like.findOne({ comment: commentId, likedBy: req.user._id })

 if (like) {
  await Like.findByIdAndDelete(like._id);
  
  return res.
   status(200).
   json(new ApiResponse(200, {}, "Like Removed successfully"))
 }

 const newLike = await Like.create({
  comment: commentId,
  likedBy: req.user._id
 })
 return res.
  status(200).
  json(new ApiResponse(200, newLike, "Like created successfully"))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
 const { tweetId } = req.params

 if (!isValidObjectId(tweetId)) {
  throw new ApiError(400, "Invalid tweet id")
 }

 const like = await Like.findOne({ tweet: tweetId, likedBy: req.user._id })

 if (like) {
  await Like.findByIdAndDelete(like._id);
  
  return res.
   status(200).
   json(new ApiResponse(200, {}, "Like Removed successfully"))
 }

 const newLike = await Like.create({
  tweet: tweetId,
  likedBy: req.user._id
 })
 return res.
  status(200).
  json(new ApiResponse(200, newLike, "Like created successfully"))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
 const { _id } = req.user;

 const likedVideos = await Like.aggregate([
  {
   $match: {
    likedBy: new mongoose.Types.ObjectId(_id),
    video: {
     $ne: null
    }
   }
  },
  {
   $lookup: {
    from: "videos",
    localField: "video",
    foreignField: "_id",
    as: "video"
   }
  }
 ])

 return res.
  status(200).
  json(new ApiResponse(200, likedVideos, "Likes fetched successfully"))
})

export {
 toggleCommentLike,
 toggleTweetLike,
 toggleVideoLike,
 getLikedVideos
}
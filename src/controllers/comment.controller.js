import mongoose,{isValidObjectId} from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
 const { videoId } = req.params
 const { page = 1, limit = 10 } = req.query

 if (!isValidObjectId(videoId)) {
  throw new ApiError(400, "Invalid video id")
 }

 const comments = await Comment.aggregate([
  {
   $match: {
    video: new mongoose.Types.ObjectId(videoId)
   }
  },
  {
   $lookup: {
    from: "users",
    localField: "owner",
    foreignField: "_id",
    as: "owner",
    pipeline: [
     {
      $project: {
       password: 0,
       refreshToken: 0,
       watchHistory: 0,
       createdAt: 0,
       updatedAt: 0,
       coverImage: 0
      }
     }
    ]
   }
  },
  {
   $addFields: {
    owner: {
     $first: "$owner"
    }
   }
  },
  {
    $lookup :{
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
            {
                $project: {
                    _id: 1,
                    thumbnail:1,
                    title:1,
                    description:1,
                    owner:1
                }
            }
        ]
    }
  },
  {
   $addFields: {
    video: {
     $first: "$video"
    }
   }
  }
 ]).skip(limit * (page - 1)).limit(limit)

 return res.
  status(200).
  json(new ApiResponse(200, comments, "Comments fetched successfully"))
})

const addComment = asyncHandler(async (req, res) => {

 const { videoId } = req.params

 if (!isValidObjectId(videoId)) {
  throw new ApiError(400, "Invalid video id")
 }

 const { content } = req.body

 if (!content || content.trim().length === 0) {
  throw new ApiError(400, "Content is required")
 }

 const comment = await Comment.create({
  content,
  video: videoId,
  owner: req.user._id
 })

 return res.
  status(201).
  json(new ApiResponse(201, comment, "Comment created successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
 const {content} = req.body

 if (!content || content.trim().length === 0) {
  throw new ApiError(400, "Content is required")
 }

 if (!isValidObjectId(req.params.commentId)) {
  throw new ApiError(400, "Invalid comment id")
 }

 const comment = await Comment.findByIdAndUpdate(req.params.commentId, {
  content
 }, {
  new: true
 })

 return res.
  status(200).
  json(new ApiResponse(200, comment, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
 const { commentId }= req.params

 if (!isValidObjectId(commentId)) {
  throw new ApiError(400, "Invalid comment id")
 }

 const comment = await Comment.findByIdAndDelete(commentId)

 return res.
  status(200).
  json(new ApiResponse(200, comment, "Comment deleted successfully"))
})

export {
 getVideoComments,
 addComment,
 updateComment,
 deleteComment
}
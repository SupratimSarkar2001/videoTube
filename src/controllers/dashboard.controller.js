import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
 const totalVideos = await Video.countDocuments({ owner: req.user._id })
 const totalSubscribers = await Subscription.countDocuments({ channel: req.user._id })
 const totalVideoViews = await Video.aggregate([
  {
   $match: {
    owner: new mongoose.Types.ObjectId(req.user._id)
   }
  },
  {
   $group: {
    _id: null,
    totalViews: {
     $sum: "$views"
    }
   }
  }
 ])

 return res.status(200).json(
  new ApiResponse(
   200,
   {
    totalVideos,
    totalSubscribers,
    totalVideoViews: totalVideoViews[0]?.totalViews || 0
   },
   "Channel stats fetched successfully"
  )
 )
})

const getChannelVideos = asyncHandler(async (req, res) => {
 const video = await Video.aggregate([
  {
   $match: {
    owner: new mongoose.Types.ObjectId(req.user._id)
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
       _id: 1,
       username: 1,
       email: 1,
       fullName: 1,
       avatar: 1
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
  }
 ])

 res.status(200).json(new ApiResponse(200, video, "Channel videos fetched successfully"))
})

export {
 getChannelStats,
 getChannelVideos
}
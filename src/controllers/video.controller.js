import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteFileCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id")
  }

  //TODO: Query

  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId)
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
  ]).skip((page - 1) * limit).limit(limit).sort({ [sortBy]: sortType })


  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body

  if (
    [title, description].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required")
  }

  const videoLocalPath = req.files?.videoFile[0]?.path

  if (!videoLocalPath) {
    throw new ApiError(400, "Video is required")
  }

  const thumbnailLocalPath = req.files?.thumbnail[0]?.path

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required")
  }

  const video = await uploadOnCloudinary(videoLocalPath)
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

  if (!video) {
    throw new ApiError(500, "Failed to upload video")
  }

  if (!thumbnail) {
    throw new ApiError(500, "Failed to upload thumbnail")
  }

  const finalVideo = await Video.create({
    title,
    description,
    videoFile: video.url,
    thumbnail: thumbnail.url,
    owner: req.user._id,
    duration: video.duration
  })

  res.
    status(201).
    json(
      new ApiResponse(200, finalVideo, "Video published successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id")
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId)
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
    }
  ])

  if (!video) {
    throw new ApiError(404, "Video not found")
  }

  res.
    status(200).
    json(
      new ApiResponse(200, video, "Video fetched successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  const { title, description } = req.body

  if (
    [title, description].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required")
  }

  const video = await Video.findById(videoId)

  if (!video) {
    throw new ApiError(404, "Video not found")
  }

  const oldThumbnail = video.thumbnail

  const thumbnailLocalPath = req.file?.path

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required")
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

  if (!thumbnail) {
    throw new ApiError(500, "Failed to upload thumbnail")
  }

  if (oldThumbnail) {
    await deleteFileCloudinary(oldThumbnail)
  }

  const finalVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnail.url
      }
    },
    {
      new: true
    }
  )

  res.
    status(200).
    json(
      new ApiResponse(200, finalVideo, "Video updated successfully")
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id")
  }

  const video = await Video.findById(videoId)

  const oldVideo = video.videoFile
  const oldThumbnail = video.thumbnail

  if (oldVideo) {
    await deleteFileCloudinary(oldVideo)
  }

  if (oldThumbnail) {
    await deleteFileCloudinary(oldThumbnail)
  }

  if (!video) {
    throw new ApiError(404, "Video not found")
  }

  await video.deleteOne()

  res.
    status(200).
    json(
      new ApiResponse(200, {}, "Video deleted successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id")
  }

  const video = await Video.findById(videoId)

  if (!video) {
    throw new ApiError(404, "Video not found")
  }

  const finalVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished
      }
    },
    {
      new: true
    }
  )

  return res.
    status(200).
    json(
      new ApiResponse(200, finalVideo, "Video Published Toggled successfully")
    )
})

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus
}
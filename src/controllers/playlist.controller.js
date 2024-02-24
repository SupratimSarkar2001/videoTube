import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
 const { name, description } = req.body

 if (!name || name.trim().length === 0) {
  throw new ApiError(400, "Name is required")
 }

 if (!description || description.trim().length === 0) {
  throw new ApiError(400, "Description is required")
 }

 const playlist = await Playlist.create({
  name,
  description,
  owner: req.user._id
 })

 res.status(201).json(
  new ApiResponse(201, playlist, "Playlist created successfully")
 )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
 const { userId } = req.params

 if (!isValidObjectId(userId)) {
  throw new ApiError(400, "Invalid user id")
 }

 const playlists = await Playlist.aggregate([
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
  },
  {
   $lookup: {
    from: "videos",
    localField: "videos",
    foreignField: "_id",
    as: "videos"
   }
  }
 ])

 return res
  .status(200)
  .json(new ApiResponse(200, playlists, "Playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
 const { playlistId } = req.params

 if (!isValidObjectId(playlistId)) {
  throw new ApiError(400, "Invalid playlist id")
 }

 const playlist = await Playlist.aggregate([
  {
   $match: {
    _id: new mongoose.Types.ObjectId(playlistId)
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
  },
  {
   $lookup: {
    from: "videos",
    localField: "videos",
    foreignField: "_id",
    as: "videos"
   }
  },

 ])

 return res
  .status(200)
  .json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
 const { playlistId, videoId } = req.params

 if (!isValidObjectId(playlistId)) {
  throw new ApiError(400, "Invalid playlist id")
 }

 if (!isValidObjectId(videoId)) {
  throw new ApiError(400, "Invalid video id")
 }

 const playlist = await Playlist.findById(playlistId)

 if (!playlist) {
  throw new ApiError(404, "Playlist not found")
 }

 const video = await Video.findById(videoId)

 if (!video) {
  throw new ApiError(404, "Video not found")
 }

 if (playlist.videos.includes(video._id)) {
  throw new ApiError(404, "Video already in playlist")
 }

 playlist.videos.push(video._id)
 await playlist.save({ validateBeforeSave: false });

 res
  .status(200)
  .json(new ApiResponse(200, playlist, "Video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
 const { playlistId, videoId } = req.params

 if (!isValidObjectId(playlistId)) {
  throw new ApiError(400, "Invalid playlist id")
 }

 if (!isValidObjectId(videoId)) {
  throw new ApiError(400, "Invalid video id")
 }

 const playlist = await Playlist.findById(playlistId)

 if (!playlist) {
  throw new ApiError(404, "Playlist not found")
 }

 const video = await Video.findById(videoId)

 if (!video) {
  throw new ApiError(404, "Video not found")
 }

 if (!playlist.videos.includes(video._id)) {
  throw new ApiError(404, "Video not found in playlist")
 }

 playlist.videos.pull(video._id)
 await playlist.save({ validateBeforeSave: false });

 res
  .status(200)
  .json(new ApiResponse(200, playlist, "Video removed from playlist successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
 const { playlistId } = req.params

 if (!isValidObjectId(playlistId)) {
  throw new ApiError(400, "Invalid playlist id")
 }

 const playlist = await Playlist.findById(playlistId)

 if (!playlist) {
  throw new ApiError(404, "Playlist not found")
 }

 await Playlist.findByIdAndDelete(playlistId)

 res
  .status(200)
  .json(new ApiResponse(200, {}, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
 const { playlistId } = req.params
 const { name, description } = req.body

 if (!isValidObjectId(playlistId)) {
  throw new ApiError(400, "Invalid playlist id")
 }

 const playlist = await Playlist.findById(playlistId)

 if (!playlist) {
  throw new ApiError(404, "Playlist not found")
 }
 
 if (!name || name.trim() === "") {
  throw new ApiError(400, "Playlist name is required")
 }

 if (!description || description.trim() === "") {
  throw new ApiError(400, "Playlist description is required")
 }

 playlist.name = name
 playlist.description = description
 await playlist.save({ validateBeforeSave: false });

 res
  .status(200)
  .json(new ApiResponse(200, playlist, "Playlist updated successfully"))
})

export {
 createPlaylist,
 getUserPlaylists,
 getPlaylistById,
 addVideoToPlaylist,
 removeVideoFromPlaylist,
 deletePlaylist,
 updatePlaylist
}
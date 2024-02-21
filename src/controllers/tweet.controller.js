import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
 const { content } = req.body;

 if (!content) {
  throw new ApiError(400, "Content is required")
 }

 const tweet = await Tweet.create({
  content,
  owner: req.user._id
 })

 const finalTweet = await Tweet.aggregate([
  {
   $match: {
    // Find the tweet with the given ID
    _id: new mongoose.Types.ObjectId(tweet._id)
   }
  },
  {
   // Find the user that owns the tweet by its id
   $lookup: {
    from: "users",
    localField: "owner",
    foreignField: "_id",
    as: "owner",
    pipeline: [
     {
      $project: {
       password: 0,
       refreshToken: 0
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

 res.status(201).json(
  new ApiResponse(201, finalTweet[0], "Tweet created successfully")
 )
})

const getUserTweets = asyncHandler(async (req, res) => {
 const { userId } = req.params;

 if (!isValidObjectId(userId)) {
  throw new ApiError(400, "Invalid user id")
 }
 const tweets = await Tweet.aggregate(
  [
   {
    // Find the tweet with than belongs to the given user
    $match: {
     owner: new mongoose.Types.ObjectId(userId)
    }
   },
   {
    // Find the user that owns the tweet
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
    // Add the user to the tweet
    $addFields: {
     owner: {
      $first: "$owner"
     }
    }
   }
  ]
 )

 res.status(200).json(
  new ApiResponse(200, tweets, "User tweets fetched successfully")
 )
})

const updateTweet = asyncHandler(async (req, res) => {
 const { tweetId } = req.params;
 const { content } = req.body;

 if (!isValidObjectId(tweetId)) {
  throw new ApiError(400, "Invalid tweet id")
 }

 const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, {
  content
 }, {
  new: true
 })

 if (!updatedTweet) {
  throw new ApiError(404, "Tweet not found");
 }
 
 const finalTweet = await Tweet.aggregate([
  {
   // After update the tweet find the updated tweet using the tweet id
   $match: {
    _id: new mongoose.Types.ObjectId(tweetId)
   }
  },
  {
   // populate the details of the owner
   $lookup:{
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

 res.status(200).json(
  new ApiResponse(200, finalTweet[0], "Tweet updated successfully")
 )
})

const deleteTweet = asyncHandler(async (req, res) => {
 const { tweetId } = req.params;

 if (!isValidObjectId(tweetId)) {
  throw new ApiError(400, "Invalid tweet id")
 }

 const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
 if (!deletedTweet) {
  throw new ApiError(404, "Tweet not found");
 }

 res.status(200).json(
  new ApiResponse(203, deletedTweet, "Tweet deleted successfully")
 )
})

export {
 createTweet,
 getUserTweets,
 updateTweet,
 deleteTweet
}
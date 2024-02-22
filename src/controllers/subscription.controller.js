import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
 const { channelId } = req.params

 if (!isValidObjectId(channelId)) {
  throw new ApiError(400, "Invalid channel id")
 }

 const subscription = await Subscription.findOne({
  channel: new mongoose.Types.ObjectId(channelId),
  subscriber: req.user._id
 })

 if (subscription) {
  await Subscription.findByIdAndDelete(subscription._id)
 } else {
  await Subscription.create({
   channel: channelId,
   subscriber: req.user._id
  })
 }

 return res
  .status(200)
  .json(new ApiResponse(200, {}, "Subscription toggled successfully"))

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
 const { channelId } = req.params

 const subscribers = await Subscription.aggregate([
  {
    $match: { channel: new mongoose.Types.ObjectId(channelId) },
  },
  {
    $lookup: {
      from: "users",
      localField: "subscriber",
      foreignField: "_id",
      as: "subscriber",
      pipeline: [
        {
          $project: {
            _id: 1,
            username: 1,
            fullName: 1,
            avatar: 1,
          },
        },
      ],
    }
  },
]);

 return res
  .status(200)
  .json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
 const { subscriberId } = req.params

 const channels = await Subscription.aggregate([
  {
    $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) },
  },
  {
    $lookup: {
      from: "users",
      localField: "channel",
      foreignField: "_id",
      as: "channel",
      pipeline: [
        {
          $project: {
            _id: 1,
            username: 1,
            fullName: 1,
            avatar: 1,
          },
        },
      ],
    }
  },
]);

 return res
  .status(200)
  .json(new ApiResponse(200, channels, "Channels fetched successfully"))
})

export {
 toggleSubscription,
 getUserChannelSubscribers,
 getSubscribedChannels
}
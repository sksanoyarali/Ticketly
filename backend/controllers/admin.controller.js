import User from '../models/user.model.js'
import Booking from '../models/booking.model.js'
import Show from '../models/show.model.js'

const isAdmin = async (req, res) => {
  res.json({ success: true, isAdmin: true })
}

// api to get dashboard data
const getDashBoardData = async (req, res) => {
  try {
    const bookings = await Booking.find({ isPaid: true })

    const activeShows = await Show.find({
      showDateTime: { $gte: new Date() },
    }).populate('movie')

    const totalUser = await User.countDocuments()

    const dashboardData = {
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((acc, booking) => acc + booking.amount, 0),
      activeShows,
      totalUser,
    }

    return res.status(200).json({
      success: true,
      dashboardData,
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

//api to get all shows
const getAllShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } })
      .populate('movie')
      .sort({ showDateTime: 1 })

    return res.status(200).json({
      success: true,
      shows,
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
// api to get all booking
const getAllbookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('user')
      .populate({
        path: 'show',
        populate: { path: 'movie' },
      })
      .sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      bookings,
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export { isAdmin, getDashBoardData, getAllShows, getAllbookings }

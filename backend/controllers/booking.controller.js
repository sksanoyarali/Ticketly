// function to check availability of selected seats for a show

import Booking from '../models/booking.model.js'
import Show from '../models/show.model.js'

const checkSeatsAvailability = async (showId, selectedSeats) => {
  try {
    const showData = await Show.findById(showId)
    if (!showData) {
      return false
    }
    const occupiedSeats = showData.occupiedSeats

    const isAnySeatTaken = selectedSeats.some((seat) => occupiedSeats[seat])
    if (isAnySeatTaken) {
      return false
    }
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}
const createBooking = async (req, res) => {
  try {
    const { userId } = req.auth()
    const { showId, selectedSeats } = req.body
    const { origin } = req.headers
    const isAvailable = await checkSeatsAvailability(showId, selectedSeats)
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Selected Seats are not available',
      })
    }
    const showData = await Show.findById(showId).populate('movie')
    // create a new booking
    const booking = await Booking.create({
      user: userId,
      show: showId,
      amount: showData.showPrice * selectedSeats.length,
      bookedSeats: selectedSeats,
    })

    selectedSeats.map((seat) => {
      showData.occupiedSeats[seat] = userId
    })

    showData.markModified('occupiedSeats')
    await showData.save()
    // stripe Gateway Initialize

    res.status(201).json({
      success: true,
      message: 'booked successfully',
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
const getOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params

    const showData = await Show.findById(showId)
    const occupiedSeats = Object.keys(showData.occupiedSeats)

    res.status(200).json({
      success: true,
      message: error.message,
      occupiedSeats,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
export { createBooking, getOccupiedSeats }

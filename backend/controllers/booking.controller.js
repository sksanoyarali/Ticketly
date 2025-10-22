// function to check availability of selected seats for a show

import { inngest } from '../inngest/index.js'
import Booking from '../models/booking.model.js'
import Show from '../models/show.model.js'
import stripe from 'stripe'
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
    console.log(userId)

    const { showId, selectedSeats } = req.body

    const { origin } = req.headers
    console.log('show', showId)
    console.log('selectedSeats', selectedSeats)
    console.log('origin', origin)

    const isAvailable = await checkSeatsAvailability(showId, selectedSeats)
    console.log(isAvailable)

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
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

    // creating line items for stripe
    const line_items = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: showData.movie.title,
          },
          unit_amount: Math.floor(booking.amount) * 100,
        },
        quantity: 1,
      },
    ]
    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/loading/my-bookings`,
      cancel_url: `${origin}/my-bookings`,
      line_items: line_items,
      mode: 'payment',
      metadata: {
        bookingId: booking._id.toString(),
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, //expires in 30 minutes
    })
    booking.paymentLink = session.url

    await booking.save()
    // run inngest scheduler function to check payment status after 10 minutes
    await inngest.send({
      name: 'app/checkpayment',
      data: { bookingId: booking._id.toString() },
    })
    res.status(201).json({
      success: true,
      url: session.url,
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
      message: 'error.message',
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

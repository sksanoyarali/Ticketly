import { Inngest } from 'inngest'
import 'dotenv/config'
import User from '../models/user.model.js'
import Booking from '../models/booking.model.js'
import Show from '../models/show.model.js'
import sendEmail from '../configs/nodemailer.js'
export const inngest = new Inngest({
  id: 'movie-ticket-booking-app',
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
})
// inngest functions to save user data to adatbase
const syncUserCreation = inngest.createFunction(
  { id: 'sync-user-from-clerk' },
  { event: 'clerk/user.created' },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + ' ' + last_name,
      image: image_url,
    }
    await User.create(userData)
  }
)

// inngest function to delete user from database
const syncUserDeletion = inngest.createFunction(
  { id: 'delete-user-with-clerk' },
  { event: 'clerk/user.deleted' },
  async ({ event }) => {
    const { id } = event.data
    await User.findByIdAndDelete(id)
  }
)
// inngest function to update user from database
const syncUserUpdation = inngest.createFunction(
  { id: 'update-user-from-clerk' },
  { event: 'clerk/user.updated' },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + ' ' + last_name,
      image: image_url,
    }
    await User.findByIdAndUpdate(id, userData)
  }
)
//Inngest function to cancel bookings and release
//seats of show after 10 minutes of booking created if payment is not made

const releaseSeatsAndDeleteBooking = inngest.createFunction(
  { id: 'release-seats-delete-booking' },
  { event: 'app/checkpayment' },
  async ({ event, step }) => {
    const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000)
    await step.sleepUntil('wait-for-10-minutes', tenMinutesLater)

    await step.run('check-payment-status', async () => {
      const bookingId = event.data.bookingId
      const booking = await Booking.findById(bookingId)
      if (!booking.isPaid) {
        const show = await Show.findById(booking.show)
        booking.bookedSeats.forEach((seat) => {
          delete show.occupiedSeats[seat]
        })
        show.markModified('occupiedSeats')
        await show.save()
        await Booking.findByIdAndDelete(booking._id)
      }
    })
  }
)
// inngest function to send confirmation email
const sendBookingConfirmationEmail = inngest.createFunction(
  { id: 'send-booking-confirmation-email' },
  { event: 'app/show.booked' },
  async ({ event, step }) => {
    const { bookingId } = event.data

    const booking = await Booking.findById(bookingId)
      .populate({
        path: 'show',
        populate: {
          path: 'movie',
          model: 'movie',
        },
      })
      .populate('user')
    const showDateTime = new Date(booking.show.showDateTime)

    const formattedDate = showDateTime.toLocaleDateString('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const formattedTime = showDateTime.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2 style="margin-bottom: 6px;">${booking.user.name},</h2>

      <p>Your booking for <strong style="color:#F84565">${booking.show.movie.title}</strong> is confirmed.</p>

      <p>
        <strong>Date:</strong> ${formattedDate}<br/>
        <strong>Time:</strong> ${formattedTime}
      </p>

      <p>Enjoy the show! 🍿</p>

      <p style="margin-top: 18px; font-size: 13px; color:#666;">
        Thanks for booking with us!<br/>
        — Ticketly  Team
      </p>
    </div>
  `
    await sendEmail({
      to: booking.user.email,
      subject: `Payment confirmation:"${booking.show.movie.title}" booked!`,
      body: html,
    })
  }
)
export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  releaseSeatsAndDeleteBooking,
  sendBookingConfirmationEmail,
]

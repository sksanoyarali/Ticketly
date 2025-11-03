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
    console.log(bookingId)

    const booking = await Booking.findById(bookingId)
      .populate({
        path: 'show',
        populate: {
          path: 'movie',
          model: 'movie',
        },
      })
      .populate('user')
    console.log(booking)

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
       <h2 style='margin-bottom: 6px;">${booking.user.name},</h2>

    <p>Your booking for <strong style="color:#F84565;">${booking.show.movie.title}</strong> is confirmed.</p>

    <p>
      <strong>Date:</strong> ${formattedDate}<br/>
      <strong>Time:</strong> ${formattedTime}
    </p>

    <p>Enjoy the show! 🍿</p>

    <p style="margin-top: 18px; font-size: 13px; color: #666;">
      Thanks for booking with us!<br/>
      — Ticketly Team
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
// inngest function to send remailder email
const sendShowReminders = inngest.createFunction(
  { id: 'send-show-remainder' },
  { cron: '0 */8 * * *' }, //every 8 hours
  async ({ step }) => {
    const now = new Date()
    const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000)

    const windowStart = new Date(in8Hours.getTime() - 10 * 60 * 1000)
    const remailderTasks = await step.run(
      'prepare-remainder-tasks',
      async () => {
        const shows = await Show.find({
          showDateTime: { $gte: windowStart, $lte: in8Hours },
        }).populate('movie')

        const tasks = []
        for (const show of shows) {
          if (!show.movie || !show.occupiedSeats) {
            continue
          }
          const userIds = [...new Set(Object.values(show.occupiedSeats))]
          if (userIds.length === 0) {
            continue
          }
          const users = await User.find({ _id: { $in: userIds } }).select(
            'name email'
          )
          for (const user of users) {
            tasks.push({
              userEmail: user.email,
              userName: user.name,
              movieTitle: show.movie.title,
              showTime: show.showDateTime,
            })
          }
        }
        return tasks
      }
    )
    if (remailderTasks === 0) {
      return { sent: 0, message: 'No remailders to send' }
    }
    // send remailder email
    const html = `<div style="font-family: Arial, sans-serif; padding: 20px;">
  <h2>Hello ${task.userName},</h2>
  <p>This is a quick reminder that your movie:</p>
  <h3 style="color:#F84565;">${task.movieTitle}</h3>
  <p>
    is scheduled for <strong>${new Date(task.showTime).toLocaleDateString(
      'en-US',
      { timeZone: 'Asia/Kolkata' }
    )}</strong>
    at <strong>${new Date(task.showTime).toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
    })}</strong>.
  </p>
  <p>It starts in approximately <strong>8 hours</strong> — make sure you're ready!</p>
  <br/>
  <p>Enjoy the show!<br/>QuickShow Team</p>
</div>`
    const results = await step.run('send-all-remailders', async () => {
      return await Promise.allSettled(
        remailderTasks.map((task) =>
          sendEmail({
            to: task.userEmail,
            subject: `Remainder :Your movie "${task.movieTitle}" starts soon`,
            body: html,
          })
        )
      )
    })
    const sent = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.length - sent
    return {
      sent,
      failed,
      message: `Sent ${sent} remailders,${failed} failed`,
    }
  }
)
const sendNewShowNotification = inngest.createFunction(
  { id: 'send-new-show-notification' },
  { event: 'app/show.added' },
  async ({ event }) => {
    const { movieTitle } = event.data

    const users = await User.find({})

    for (const user of users) {
      const userEmail = user.email
      const userName = user.name

      const subject = `🎞️ New Show Added :${movieTitle}`

      const body = `<div style="font-family: Arial, Helvetica, sans-serif; padding: 20px">
                  <h2>Hi ${userName}</h2>
                  <p>We Have just added a new show to our library</p>
                  <h3 style="color: #f84565">"${movieTitle}"</h3>
                  <p>Visit our website! to see more</p>
                  <br />
                  <p>
                    Thanks <br />
                    QuickShow Team
                  </p>
                </div>`
      await sendEmail({
        to: userEmail,
        subject: subject,
        body: body,
      })
    }
    return { message: 'Notification sent' }
  }
)
export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  releaseSeatsAndDeleteBooking,
  sendBookingConfirmationEmail,
  sendShowReminders,
  sendNewShowNotification,
]

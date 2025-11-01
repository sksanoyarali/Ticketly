import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema(
  {
    user: { type: String, required: true, ref: 'user' },
    show: { type: String, required: true, ref: 'show' },
    amount: { type: Number, required: true },
    bookedSeats: { type: Array, required: true },
    isPaid: { type: Boolean, default: false },
    paymentLink: { type: String },
  },
  { timestamps: true }
)

const Booking = mongoose.model('booking', bookingSchema)
export default Booking

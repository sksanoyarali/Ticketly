import mongoose from 'mongoose'
const connectDb = async () => {
  try {
    mongoose.connection.on('connected', () => {
      console.log('database connected successfully')
    })
    await mongoose.connect(`${process.env.MONGODB_URI}/ticketly`)
  } catch (error) {
    console.log(error.message)
  }
}
export default connectDb

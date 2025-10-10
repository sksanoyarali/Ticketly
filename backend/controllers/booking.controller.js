// function to check availability of selected seats for a show

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

import { clerkClient } from '@clerk/express'

const protectAdmin = async (req, res, next) => {
  try {
    const { userId } = req.auth()
    const user = await clerkClient.users.getUser(userId)
    if (user.privateMetadata.role != 'admin') {
      return res.status(403).json({
        success: false,
        message: 'not authorized',
      })
    }
    next()
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: 'not autorized',
    })
  }
}
export { protectAdmin }

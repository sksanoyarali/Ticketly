import 'dotenv/config'
import { clerkClient } from '@clerk/clerk-sdk-node'

// This code would run on your server, for example, in an API endpoint.
async function assignAdminRole(userId) {
  try {
    const user = await clerkClient.users.updateUser(userId, {
      privateMetadata: {
        role: 'admin',
      },
    })
    console.log(
      `Successfully updated user ${userId}. New role:`,
      user.privateMetadata.role
    )
    return user
  } catch (error) {
    console.error("Error updating user's private metadata:", error)
  }
}

// Example usage:
// You would get the userId from your application's logic.
const userIdToMakeAdmin = 'user_33voxWj2wXcReo8ftsT6bnL1Gd3'
assignAdminRole(userIdToMakeAdmin)

import db from '../conn.js';

export async function findOrCreateUser(profile) {
  try {
    const usersCollection = db.collection('users');

    const email = profile.email;
    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      // Optionally update user details
      await usersCollection.updateOne(
        { email },
        {
          $set: {
            name: profile.name,
            picture: profile.picture,
            updatedAt: new Date(),
          },
        }
      );

      console.log('Existing user logged in:', existingUser);
      return existingUser; // Return the existing user
    } else {
      const newUser = {
        email,
        name: profile.name,
        googleId: profile.googleId,
        picture: profile.picture,
        createdAt: new Date(),
      };

      const result = await usersCollection.insertOne(newUser);
      const createdUser = { ...newUser, _id: result.insertedId };

      console.log('New user created:', createdUser);
      return createdUser; // Return the new user
    }
  } catch (error) {
    console.error('Error in findOrCreateUser:', error);
    throw error;
  }
}

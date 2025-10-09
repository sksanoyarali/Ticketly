import axios from 'axios'
const getNowPlayingMovies = async (req, res) => {
  try {
    const { data } = await axios.get(
      'https://api.themoviedb.org/3/movie/now_playing',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
        },
      }
    )
    const movies = data.results
    return res.status(200).json({
      success: true,
      movies: movies,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
export { getNowPlayingMovies }

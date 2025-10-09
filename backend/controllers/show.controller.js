import axios from 'axios'
import Movie from '../models/movie.model.js'
import Show from '../models/show.model.js'
// api to get now playing movies
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
const addShow = async (req, res) => {
  try {
    const { movieId, showsInput, showPrice } = req.body

    let movie = await Movie.findById(movieId)
    if (!movie) {
      // fetch the movie details and credit from TMDB api
      const [movieDetailResponse, movieCreditresponse] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
          headers: {
            Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
          },
        }),
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
          headers: {
            Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
          },
        }),
      ])
      const movieApidata = movieDetailResponse.data
      const movieCreditData = movieCreditresponse.data

      const movieDetails = {
        _id: movieId,
        title: movieApidata.title,
        overview: movieApidata.overview,
        poster_path: movieApidata.poster_path,
        backdrop_path: movieApidata.backdrop_path,
        genres: movieApidata.genres,
        casts: movieCreditData.cast,
        release_date: movieApidata.release_date,
        original_language: movieApidata.original_language,
        tagline: movieApidata.tagline || '',
        vote_average: movieApidata.vote_average,
        runtime: movieApidata.runtime,
      }
      movie = await Movie.create(movieDetails)
    }
    const showsToCreate = []
    showsInput.forEach((show) => {
      const showDate = show.date
      show.time.forEach((time) => {
        const dateTimeString = `${showDate}T${time}`
        showsToCreate.push({
          movie: movieId,
          showDateTime: new Date(dateTimeString),
          showPrice: showPrice,
          occupiedSeats: {},
        })
      })
    })

    if (showsToCreate.length > 0) {
      await Show.insertMany(showsToCreate)
    }
    return res.status(201).json({
      success: true,
      message: 'Show added successfully',
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
export { getNowPlayingMovies, addShow }

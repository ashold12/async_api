const express = require('express')
const axios = require('axios')

const app = express()
const port = 8080
app.use(express.json())

//having undefined sort and and direction parameters is acceptable
const sorts = ['id', 'author', 'authorId', 'likes', 'popularity', 'reads', 'tags', undefined];
const directions = ['asc', 'desc', undefined];

app.get('/posts/:tags/:sortBy?/:direction?', async (req, res) => {
  let { tags, sortBy, direction } = req.params
  if (!sorts.includes(sortBy) || !directions.includes(direction)) return res.status(400).send
  //sanitize input
  //converting to set removes duplicates to avoid duplicate API calls
  //splicing the end of the array will ensure user only able to search by 9 tags
  tags.includes(',') ? tags = tags.split(',') : tags = [tags]
  tags.splice(9, tags.length)
  if (tags.length > 1) tags = Array.from(new Set(tags))

  //promise all each request for a given tag and await the complete posts list
  let posts = await Promise.all(tags.map(tag => axios.get(`http://hatchways.io/api/assessment/blog/posts?tag=${tag}`)))

  //remove data from data from request body
  posts = posts.map(post => post.data.posts)

  //spread arrays to better manage the lists
  posts = [].concat.apply([], posts)
  console.log(`Pre sanitized length: ${posts.length}`)
  //remove duplicates, track seen id
  //shift posts from queue to minimize space complexity with duplicates
  //don't splice here because re-indexing is too heavy
  let tempPostStorage = {}

  while (posts.length) {
    let post = posts.shift()
    tempPostStorage[post.id] = post
  }
  //turn map back into array duplicaes are now removed
  posts = Object.values(tempPostStorage)
  console.log(`sanitized length: ${posts.length} type: ${typeof posts}`)

  //sort according to fields
  if (sortBy) {
    if (direction === 'desc') posts = posts.sort((a, b) => (b[sortBy] > a[sortBy]) ? 1 : -1);
    else posts = posts.sort((a, b) => (b[sortBy] < a[sortBy]) ? 1 : -1);
  }

  res.status(200).send(posts)
})

app.get('/', (req, res) => {
  res.status(200).send('hello')
})







app.listen(port, () => {
  console.log(`app is listening on ${port}`)
});